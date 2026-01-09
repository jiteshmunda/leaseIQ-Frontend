import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import { FiDownload } from "react-icons/fi";
import { showError } from "../service/toast";

const clamp = (value, maxLen = 5000) => {
  const text = String(value ?? "");
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "…";
};

const toSafeFilename = (raw) =>
  String(raw ?? "lease-details")
    .trim()
    .replace(/\.[^.]+$/i, "")
    .replace(/[^a-z0-9-_]+/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "lease-details";

const getFieldValue = (field) => {
  if (!field || typeof field !== "object") return "";
  if (!("value" in field)) return "";
  const value = field.value;
  return value == null ? "" : String(value);
};

const getFieldCitation = (field) => {
  if (!field || typeof field !== "object") return "";
  if (typeof field.citation === "string") return field.citation;
  if (field.citation && typeof field.citation === "object") {
    if (typeof field.citation.value === "string") return field.citation.value;
  }
  return "";
};

const formatAny = (value) => {
  if (value == null) return "";
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return String(value);

  if (t === "object") {
    if (Array.isArray(value)) {
      return value
        .filter((v) => v != null && String(v).trim() !== "")
        .map((v) => formatAny(v))
        .join(", ");
    }

    // Common analyzer field wrapper
    if ("value" in value) {
      const v = value.value;
      return v == null ? "" : String(v);
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const normalizeChargeSchedules = (raw = {}) => {
  const cs = raw?.["charge-schedules"] ?? {};
  const schedules = cs.chargeSchedules ?? {};

  return {
    baseRent: Array.isArray(schedules.baseRent) ? schedules.baseRent : [],
    lateFee: schedules.lateFee ?? cs.lateFee ?? {},
  };
};

const safeParseJson = (value) => {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  const first = text[0];
  if (first !== "{" && first !== "[") return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const resolveAuditObject = (leaseDetails) => {
  const rawAudit = leaseDetails?.audit;
  if (!rawAudit) return null;

  const parsed = safeParseJson(rawAudit);
  const resolved = parsed ?? rawAudit;

  if (typeof resolved !== "object" || resolved == null) return resolved;

  return resolved && typeof resolved === "object" && resolved.audit && typeof resolved.audit === "object"
    ? resolved.audit
    : resolved;
};

const resolveAuditRisks = (auditObject) => {
  if (auditObject == null) return [];

  // Handle stringified JSON or direct array payloads.
  const parsed = safeParseJson(auditObject);
  const root = parsed ?? auditObject;

  const pickArray = (value) => {
    if (!value) return null;
    const parsedValue = safeParseJson(value);
    const resolved = parsedValue ?? value;
    return Array.isArray(resolved) ? resolved : null;
  };

  const normalizeEntry = (item) => {
    if (item && typeof item === "object") {
      if (item.page_number == null) {
        const refs = Array.isArray(item.page_reference)
          ? item.page_reference
          : Array.isArray(item.page_references)
          ? item.page_references
          : null;

        if (refs && refs.length > 0) {
          return { ...item, page_number: refs[0] };
        }
      }
      return item;
    }
    return item;
  };

  // If the audit payload itself is already an array, treat it as the risk list.
  if (Array.isArray(root)) return root.map(normalizeEntry);

  // If it's a primitive (string/number/etc), we cannot reliably extract risks.
  if (typeof root !== "object" || root == null) return [];

  // Known shapes from the analyzer/backend.
  const knownCandidates = [
    root.audit_checklist,
    root.identified_risks,
    root.risk_register,
    root.risks,
    root.risk_register_sections,
  ];

  for (const candidate of knownCandidates) {
    const arr = pickArray(candidate);
    if (arr) return arr.map(normalizeEntry);
  }

  // Fallback: scan the object for an array that looks like risks.
  // Limit to keep performance predictable.
  const values = Object.values(root);
  for (const v of values) {
    const arr = pickArray(v);
    if (arr && arr.length) {
      const sample = arr.slice(0, 5);
      const looksLikeRisk = sample.some((entry) => {
        if (!entry || typeof entry !== "object") return false;
        return (
          "issue_type" in entry ||
          "risk_type" in entry ||
          "risk_level" in entry ||
          "severity" in entry ||
          "page_number" in entry ||
          "description" in entry
        );
      });

      if (looksLikeRisk) {
        return arr.map(normalizeEntry);
      }
    }
  }

  return [];
};

const toTitleCaseKey = (rawKey) =>
  String(rawKey ?? "")
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

const DownloadLeaseDetailsPdf = ({
  leaseDetails,
  selectedDocumentName,
  disabled,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const fileStem = useMemo(() => {
    const candidate =
      selectedDocumentName ||
      leaseDetails?.filename ||
      leaseDetails?.info?.leaseInformation?.lease?.value ||
      "lease-details";
    return toSafeFilename(candidate);
  }, [leaseDetails, selectedDocumentName]);

  const handleDownload = async () => {
    if (!leaseDetails || typeof leaseDetails !== "object") {
      showError("No document details available to download.");
      return;
    }

    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const marginX = 40;
      const marginY = 40;
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - marginX * 2;

      let y = marginY;

      const ensureSpace = (minSpace = 14) => {
        if (y + minSpace > pageHeight - marginY) {
          doc.addPage();
          y = marginY;
        }
      };

      const writeWrapped = (
        text,
        {
          fontSize = 10,
          lineHeight = 13,
          indent = 0,
          spacingAfter = 0,
          maxLen = 10000,
        } = {}
      ) => {
        const raw = clamp(text, maxLen).trim();
        if (!raw) return;

        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(raw, Math.max(20, contentWidth - indent));
        for (const line of lines) {
          ensureSpace(lineHeight);
          doc.text(String(line), marginX + indent, y);
          y += lineHeight;
        }

        if (spacingAfter) {
          ensureSpace(spacingAfter);
          y += spacingAfter;
        }
      };

      const writeHeading = (text) => {
        ensureSpace(22);
        doc.setFontSize(13);
        doc.setFont(undefined, "bold");
        doc.text(String(text), marginX, y);
        doc.setFont(undefined, "normal");
        y += 18;
      };

      const writeSubheading = (text) => {
        ensureSpace(18);
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text(String(text), marginX, y);
        doc.setFont(undefined, "normal");
        y += 14;
      };

      const writeBullet = (text, { fontSize = 10, lineHeight = 13 } = {}) => {
        const prefix = "• ";
        const raw = clamp(text, 10000).trim();
        if (!raw) return;

        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(prefix + raw, contentWidth);
        for (let i = 0; i < lines.length; i += 1) {
          ensureSpace(lineHeight);
          doc.text(String(lines[i]), marginX, y);
          y += lineHeight;
        }
      };

      const writeLabelValue = (label, value, citation) => {
        const valueText = String(formatAny(value ?? "")).trim();
        const citationText = String(citation ?? "").trim();
        if (!valueText) return;

        ensureSpace(16);
        doc.setFontSize(10);
        const labelText = `${String(label ?? "").trim()}: `;

        doc.setFont(undefined, "bold");
        const labelWidth = doc.getTextWidth(labelText);
        doc.text(labelText, marginX, y);
        doc.setFont(undefined, "normal");

        const available = Math.max(30, contentWidth - labelWidth);
        const lines = doc.splitTextToSize(clamp(valueText, 10000), available);
        if (lines.length > 0) {
          doc.text(String(lines[0]), marginX + labelWidth, y);
          y += 13;
          for (const line of lines.slice(1)) {
            ensureSpace(13);
            doc.text(String(line), marginX + 12, y);
            y += 13;
          }
        } else {
          y += 13;
        }

        if (citationText) {
          writeWrapped(`Citation: ${citationText}`, {
            fontSize: 9,
            lineHeight: 12,
            indent: 12,
            spacingAfter: 2,
            maxLen: 1500,
          });
        } else {
          ensureSpace(4);
          y += 2;
        }
      };

      // Allow a single details object or an array of details objects.
      const detailsList = Array.isArray(leaseDetails) ? leaseDetails : [leaseDetails];

      for (let docIndex = 0; docIndex < detailsList.length; docIndex += 1) {
        const details = detailsList[docIndex];
        if (!details || typeof details !== "object") continue;

        if (docIndex > 0) {
          doc.addPage();
          y = marginY;
        }

        doc.setFontSize(18);
        doc.setFont(undefined, "bold");
        doc.text("Lease Details Report", marginX, y);
        doc.setFont(undefined, "normal");
        y += 20;

        const subtitleParts = [];
        if (selectedDocumentName) subtitleParts.push(`Document: ${selectedDocumentName}`);
        if (detailsList.length > 1) subtitleParts.push(`Part: ${docIndex + 1} of ${detailsList.length}`);
        subtitleParts.push(`Generated: ${new Date().toLocaleString()}`);
        writeWrapped(subtitleParts.join("   |   "), { fontSize: 10, lineHeight: 12, spacingAfter: 10 });

        // ===== INFO =====
        writeHeading("Lease Overview");
        const leaseInfo = details?.info?.leaseInformation ?? {};
        const chargeSchedules = normalizeChargeSchedules(details);
        const premisesAndTerm = details?.misc?.otherLeaseProvisions?.premisesAndTerm;
        writeLabelValue("Lease", leaseInfo?.lease, getFieldCitation(leaseInfo?.lease));
        writeLabelValue("Property", leaseInfo?.property, getFieldCitation(leaseInfo?.property));
        writeLabelValue("Address", leaseInfo?.propertyAddress, getFieldCitation(leaseInfo?.propertyAddress));
        writeLabelValue("Tenant", leaseInfo?.leaseTo, getFieldCitation(leaseInfo?.leaseTo));
        writeLabelValue("Landlord", leaseInfo?.leaseFrom, getFieldCitation(leaseInfo?.leaseFrom));
        writeLabelValue("Rentable Area", leaseInfo?.squareFeet, getFieldCitation(leaseInfo?.squareFeet));
        writeLabelValue(
          "Base Rent (first schedule)",
          chargeSchedules?.baseRent?.[0]?.monthlyAmount,
          getFieldCitation(chargeSchedules?.baseRent?.[0]?.monthlyAmount)
        );
        writeLabelValue("Security Deposit", leaseInfo?.securityDeposit, getFieldCitation(leaseInfo?.securityDeposit));
        writeLabelValue("Premises & Term (synopsis)", premisesAndTerm?.synopsis, getFieldCitation(premisesAndTerm?.synopsis));

        // ===== SPACE =====
        const spaceInfo = details?.space?.space;
        if (spaceInfo && typeof spaceInfo === "object") {
          writeHeading("Space");
          const entries = Object.entries(spaceInfo)
            .filter(([, v]) => String(formatAny(v ?? "")).trim() !== "")
            .slice(0, 80);

          if (entries.length === 0) {
            writeWrapped("No space details found.", { spacingAfter: 6 });
          } else {
            for (const [k, v] of entries) {
              writeLabelValue(toTitleCaseKey(k), v);
            }
          }
        }

        // ===== RENT SCHEDULES =====
        writeHeading("Rent Schedules");
        const lateFee = chargeSchedules?.lateFee ?? {};
        const lateFeeAny = lateFee && typeof lateFee === "object" ? lateFee : {};

        const lateFeeHasData =
          String(getFieldValue(lateFeeAny?.calculationType) || formatAny(lateFeeAny?.calculationType)).trim() ||
          String(getFieldValue(lateFeeAny?.graceDays) || formatAny(lateFeeAny?.graceDays)).trim() ||
          String(getFieldValue(lateFeeAny?.percent) || formatAny(lateFeeAny?.percent)).trim() ||
          String(getFieldValue(lateFeeAny?.perDayFee) || formatAny(lateFeeAny?.perDayFee)).trim();

        if (lateFeeHasData) {
          writeSubheading("Late Fee");
          writeLabelValue(
            "Calculation Type",
            getFieldValue(lateFeeAny?.calculationType) || lateFeeAny?.calculationType,
            getFieldCitation(lateFeeAny?.calculationType)
          );
          writeLabelValue(
            "Grace Days",
            getFieldValue(lateFeeAny?.graceDays) || lateFeeAny?.graceDays,
            getFieldCitation(lateFeeAny?.graceDays)
          );
          writeLabelValue(
            "Percent",
            getFieldValue(lateFeeAny?.percent) || lateFeeAny?.percent,
            getFieldCitation(lateFeeAny?.percent)
          );
          writeLabelValue(
            "Per Day Fee",
            getFieldValue(lateFeeAny?.perDayFee) || lateFeeAny?.perDayFee,
            getFieldCitation(lateFeeAny?.perDayFee)
          );
        }

        const baseRent = chargeSchedules?.baseRent ?? [];
        if (Array.isArray(baseRent) && baseRent.length) {
          writeSubheading("Base Rent Schedules");
          for (const row of baseRent.slice(0, 250)) {
            const start = String(formatAny(row?.startDate)).trim();
            const end = String(formatAny(row?.endDate)).trim();
            const monthly = String(formatAny(row?.monthlyAmount)).trim();
            const annual = String(formatAny(row?.annualAmount)).trim();
            const parts = [
              start ? `Start: ${start}` : null,
              end ? `End: ${end}` : null,
              monthly ? `Monthly: ${monthly}` : null,
              annual ? `Annual: ${annual}` : null,
            ].filter(Boolean);

            if (parts.length) writeBullet(parts.join("  |  "));
          }
          ensureSpace(6);
          y += 6;
        } else {
          writeWrapped("No rent schedules found.", { spacingAfter: 6 });
        }

        // ===== PROVISIONS =====
        const otherLeaseProvisions = details?.misc?.otherLeaseProvisions;
        if (otherLeaseProvisions && typeof otherLeaseProvisions === "object") {
          const categoryEntries = Object.entries(otherLeaseProvisions)
            .filter(([k]) => k !== "premisesAndTerm")
            .filter(([, v]) => v && typeof v === "object");

          if (categoryEntries.length) {
            writeHeading("Provisions");

            for (const [categoryKey, categoryVal] of categoryEntries.slice(0, 50)) {
              ensureSpace(20);
              writeSubheading(toTitleCaseKey(categoryKey));

              const fields = Object.entries(categoryVal)
                .filter(([, v]) => v != null)
                .slice(0, 80);

              if (fields.length === 0) {
                writeWrapped("No details found.", { spacingAfter: 6 });
                continue;
              }

              for (const [fieldKey, fieldVal] of fields) {
                const valueText =
                  typeof fieldVal === "object" && fieldVal !== null && "value" in fieldVal
                    ? fieldVal.value
                    : fieldVal;
                writeLabelValue(toTitleCaseKey(fieldKey), valueText, getFieldCitation(fieldVal));
              }

              ensureSpace(8);
              y += 6;
            }
          }
        }

        // ===== AUDIT =====
        const auditObject = resolveAuditObject(details);
        if (auditObject) {
          writeHeading("Audit");
          const risks = resolveAuditRisks(auditObject);
          if (!risks.length) {
            writeWrapped("No audit risks found in this document.", { spacingAfter: 6 });
          } else {
            for (const r of risks.slice(0, 250)) {
              const issue = r?.issue_type || r?.risk_type || r?.title || r?.name || "Issue";
              const level = r?.risk_level || r?.severity || r?.priority || "";
              const page = r?.page_number ?? r?.page ?? "";
              const desc = r?.description || r?.summary || r?.risk_description || "";

              const header = [
                String(issue).trim() ? String(issue).trim() : null,
                String(level).trim() ? `Level: ${String(level).trim()}` : null,
                String(page).trim() ? `Page: ${String(page).trim()}` : null,
              ]
                .filter(Boolean)
                .join("  |  ");

              writeBullet(header);
              if (String(desc ?? "").trim()) {
                writeWrapped(String(desc), { indent: 14, fontSize: 9.5, lineHeight: 12, spacingAfter: 2, maxLen: 5000 });
              }
            }
            ensureSpace(6);
            y += 6;
          }
        }

        // ===== CAM =====
        const camSingle = details?.["cam-single"]?.data;
        if (camSingle && typeof camSingle === "object") {
          writeHeading("CAM");
          const title = camSingle.sectionTitle || camSingle.title || "CAM Clause";
          const content = camSingle.textContent || camSingle.executionClause || "";
          const citations = Array.isArray(camSingle.citations)
            ? camSingle.citations.filter(Boolean)
            : camSingle.citations
            ? [String(camSingle.citations)]
            : [];

          writeLabelValue("Title", title);
          if (String(content ?? "").trim()) {
            writeSubheading("Clause Text");
            writeWrapped(String(content), { fontSize: 10, lineHeight: 13, spacingAfter: 6, maxLen: 15000 });
          }
          if (citations.length) {
            writeLabelValue("Citations", citations.join(", "));
          }
        }
      }

      doc.save(`${fileStem}_analysis.pdf`);
    } catch (e) {
      console.error("Failed to generate PDF", e);
      showError(e?.message || "Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      className="ai-btn"
      onClick={handleDownload}
      disabled={disabled || isGenerating}
      title={isGenerating ? "Preparing PDF..." : "Download details as PDF"}
      aria-label="Download details as PDF"
    >
      <FiDownload />
    </button>
  );
};

export default DownloadLeaseDetailsPdf;
