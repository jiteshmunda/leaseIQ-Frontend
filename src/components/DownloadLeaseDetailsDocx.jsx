import { useMemo, useState } from "react";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableCellBorders,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import { FiDownload } from "react-icons/fi";
import { showError } from "../service/toast";

const toSafeFilename = (raw) =>
  String(raw ?? "lease-document")
    .trim()
    .replace(/\.[^.]+$/i, "")
    .replace(/[^a-z0-9-_]+/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "lease-document";

const formatLabel = (key) =>
  String(key ?? "")
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

const formatTextValue = (value) => {
  if (value == null || value === "") return "N/A";

  let stringValue = value;
  if (typeof value !== "string") {
    if (typeof value === "number") stringValue = value.toString();
    else if (typeof value === "boolean") stringValue = value ? "true" : "false";
    else if (typeof value === "object") {
      if (Array.isArray(value)) {
        const parts = value
          .map((v) => formatTextValue(v))
          .map((v) => String(v).trim())
          .filter((v) => v && v !== "N/A");
        stringValue = parts.length ? parts.join(", ") : "N/A";
      } else if (value && typeof value === "object" && "value" in value) {
        // Analyzer field wrapper
        stringValue = value.value == null ? "N/A" : String(value.value);
      } else {
        // Prefer a readable join over JSON for small objects.
        const parts = Object.values(value)
          .map((v) => {
            if (v == null) return "";
            if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
            if (v && typeof v === "object" && "value" in v) return v.value == null ? "" : String(v.value);
            return "";
          })
          .map((v) => v.trim())
          .filter(Boolean);

        if (parts.length) {
          stringValue = parts.join(" • ");
        } else {
          try {
            stringValue = JSON.stringify(value);
          } catch {
            stringValue = String(value);
          }
        }
      }
    } else {
      stringValue = String(value);
    }
  }

  return String(stringValue)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

const resolveExecutiveSummaryText = (leaseDetails) => {
  if (!leaseDetails || typeof leaseDetails !== "object") return "";

  const unwrap = (value) => {
    if (!value || typeof value !== "object") return value;
    if (value.details && typeof value.details === "object") return value.details;
    if (value.lease_details && typeof value.lease_details === "object") {
      const inner = value.lease_details;
      if (inner.details && typeof inner.details === "object") return inner.details;
    }
    return value;
  };

  const root = unwrap(leaseDetails);
  const alt = unwrap(leaseDetails?.details);

  const candidate =
    root?.["executive-summary"]?.executiveSummary?.value ??
    root?.["executive-summary"]?.executiveSummary ??
    root?.executiveSummary?.value ??
    root?.executiveSummary ??
    root?.executive_summary ??
    root?.["executive_summary"] ??
    // Some payloads may nest summary under details
    alt?.["executive-summary"]?.executiveSummary?.value ??
    alt?.["executive-summary"]?.executiveSummary ??
    alt?.executiveSummary?.value ??
    alt?.executiveSummary ??
    "";

  if (typeof candidate === "string") return candidate;
  if (candidate && typeof candidate === "object" && "value" in candidate) {
    return candidate.value == null ? "" : String(candidate.value);
  }

  return candidate == null ? "" : String(candidate);
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
  return resolved.audit && typeof resolved.audit === "object" ? resolved.audit : resolved;
};

const resolveAuditRisks = (auditObject) => {
  if (auditObject == null) return [];

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

  if (Array.isArray(root)) return root.map(normalizeEntry);
  if (typeof root !== "object" || root == null) return [];

  const knownCandidates = [
    root.audit_checklist,
    root.audit_items,
    root.identified_risks,
    root.risk_register,
    root.risks,
    root.risk_register_sections,
  ];

  for (const candidate of knownCandidates) {
    const arr = pickArray(candidate);
    if (arr) return arr.map(normalizeEntry);
  }

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
          "description" in entry ||
          "issue_description" in entry
        );
      });

      if (looksLikeRisk) return arr.map(normalizeEntry);
    }
  }

  return [];
};

const createCardCell = (content, widthPercentage = 33.33) =>
  new TableCell({
    children: content,
    width: { size: widthPercentage, type: WidthType.PERCENTAGE },
    borders: new TableCellBorders({
      top: { style: BorderStyle.SINGLE, size: 4, color: "E9ECEF" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "E9ECEF" },
      left: { style: BorderStyle.SINGLE, size: 12, color: "4472C4" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "E9ECEF" },
    }),
    margins: {
      top: 200,
      bottom: 200,
      left: 200,
      right: 200,
    },
  });

const createCardContent = (label, value, citation = null, amendments = []) => {
  const paragraphs = [];

  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: `${String(label).toUpperCase()}:`, bold: true })],
      spacing: { after: 120 },
    })
  );

  paragraphs.push(
    new Paragraph({
      text: formatTextValue(value),
      spacing: { after: 100 },
    })
  );

  if (citation) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Citation: ${formatTextValue(citation)}`,
            italics: true,
            size: 20,
          }),
        ],
        spacing: { after: 80 },
      })
    );
  }

  if (Array.isArray(amendments) && amendments.length > 0) {
    amendments.forEach((amendment, index) => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Amendment ${index + 1}: ${formatTextValue(amendment)}`,
              italics: true,
              size: 20,
            }),
          ],
          spacing: { after: 80 },
        })
      );
    });
  }

  return paragraphs;
};

const normalizeChargeSchedules = (raw = {}) => {
  const cs = raw?.["charge-schedules"] ?? raw?.chargeSchedules ?? raw?.chargeSchedules?.chargeSchedules ?? {};
  const schedules = cs.chargeSchedules ?? cs;

  return {
    baseRent: Array.isArray(schedules.baseRent) ? schedules.baseRent : [],
    lateFee: schedules.lateFee ?? cs.lateFee ?? {},
  };
};

const toFieldValue = (field) => {
  if (field && typeof field === "object" && "value" in field) return field.value;
  return field;
};

const unwrapLeaseDetails = (value) => {
  if (!value || typeof value !== "object") return value;
  if (value.details && typeof value.details === "object") return value.details;
  if (value.lease_details && typeof value.lease_details === "object") {
    const inner = value.lease_details;
    if (inner.details && typeof inner.details === "object") return inner.details;
  }
  return value;
};

const DownloadLeaseDetailsDocx = ({
  leaseDetails,
  selectedDocumentName,
  disabled,
  buttonClassName,
  iconClassName,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const fileStem = useMemo(() => {
    const candidate =
      selectedDocumentName ||
      leaseDetails?.filename ||
      leaseDetails?.info?.leaseInformation?.lease?.value ||
      "lease-document";
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
      const timestamp = new Date().toLocaleString();
      const fileName = selectedDocumentName || fileStem;

      const rawList = Array.isArray(leaseDetails) ? leaseDetails : [leaseDetails];
      const detailsList = rawList
        .map(unwrapLeaseDetails)
        .filter((d) => d && typeof d === "object");

      const children = [];

      // Title page (first document only)
      children.push(
        new Paragraph({
          text: "LEASE ANALYSIS REPORT",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Generated: ${timestamp}`, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Document: ${formatTextValue(fileName)}` })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        })
      );

      // Executive Summary (if present on first doc)
      const firstDetails = detailsList.find((d) => d && typeof d === "object");
      const cleaned = formatTextValue(resolveExecutiveSummaryText(firstDetails));
      if (cleaned && cleaned !== "N/A") {
        const summaryParagraphs = cleaned.split("\n").filter((p) => p.trim());

        children.push(
          new Paragraph({
            text: "Executive Summary",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        );

        summaryParagraphs.forEach((para) => {
          children.push(
            new Paragraph({
              text: para,
              spacing: { after: 120 },
            })
          );
        });
      }

      // Per-document sections
      detailsList.forEach((analysisData, index) => {
        if (!analysisData || typeof analysisData !== "object") return;

        if (detailsList.length > 1) {
          children.push(
            new Paragraph({
              text: `Document Part ${index + 1} of ${detailsList.length}`,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
              alignment: AlignmentType.CENTER,
            })
          );
        }

        // Lease Information - Card Grid Layout
        const leaseInfo = analysisData?.leaseInformation || analysisData?.info?.leaseInformation;
        if (leaseInfo && typeof leaseInfo === "object") {
          children.push(
            new Paragraph({
              text: "Lease Information",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
              alignment: AlignmentType.CENTER,
            })
          );

          const validEntries = Object.entries(leaseInfo).filter(([, v]) => v && toFieldValue(v) != null && toFieldValue(v) !== "");

          for (let i = 0; i < validEntries.length; i += 3) {
            const rowEntries = validEntries.slice(i, i + 3);
            const cells = rowEntries.map(([key, value]) => {
              const val = toFieldValue(value);
              const citation = value?.citation;
              const amendments = value?.amendments;
              return createCardCell(createCardContent(formatLabel(key), val, citation, amendments), 33.33);
            });

            while (cells.length < 3) {
              cells.push(createCardCell([new Paragraph({ text: "" })], 33.33));
            }

            children.push(
              new Table({
                rows: [new TableRow({ children: cells })],
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
              new Paragraph({ text: "", spacing: { after: 150 } })
            );
          }
        }

        // Space Information - Card Grid Layout
        const spaceDataRaw = analysisData?.space;
        const spaceData = spaceDataRaw?.space || spaceDataRaw;
        if (spaceData && typeof spaceData === "object") {
          children.push(
            new Paragraph({
              text: "Space Information",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
              alignment: AlignmentType.CENTER,
            })
          );

          const validEntries = Object.entries(spaceData).filter(([, v]) => v && toFieldValue(v) != null && toFieldValue(v) !== "");

          for (let i = 0; i < validEntries.length; i += 3) {
            const rowEntries = validEntries.slice(i, i + 3);
            const cells = rowEntries.map(([key, value]) => {
              const val = toFieldValue(value);
              const citation = value?.citation;
              const amendments = value?.amendments;
              return createCardCell(createCardContent(formatLabel(key), val, citation, amendments), 33.33);
            });

            while (cells.length < 3) {
              cells.push(createCardCell([new Paragraph({ text: "" })], 33.33));
            }

            children.push(
              new Table({
                rows: [new TableRow({ children: cells })],
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
              new Paragraph({ text: "", spacing: { after: 150 } })
            );
          }
        }

        // Charge Schedules
        const { baseRent, lateFee } = normalizeChargeSchedules(analysisData);
        if ((Array.isArray(baseRent) && baseRent.length) || (lateFee && typeof lateFee === "object")) {
          children.push(
            new Paragraph({
              text: "Charge Schedules",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            })
          );

          // Base Rent Entries - Table Format (as per your format)
          if (Array.isArray(baseRent) && baseRent.length > 0) {
            children.push(
              new Paragraph({
                text: "Base Rent Entries",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 },
              })
            );

            const headerCell = (text, widthPct) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text, bold: true })],
                  }),
                ],
                width: { size: widthPct, type: WidthType.PERCENTAGE },
              });

            const dataCell = (text) =>
              new TableCell({
                children: [new Paragraph({ text: formatTextValue(text) })],
              });

            const tableRows = [
              new TableRow({
                children: [
                  headerCell("Entry", 5),
                  headerCell("Description", 15),
                  headerCell("Date From", 10),
                  headerCell("Date To", 10),
                  headerCell("Monthly Amount", 12),
                  headerCell("Annual Amount", 12),
                  headerCell("Area Rentable", 10),
                  headerCell("Amount Per Area", 12),
                  headerCell("Management Fees", 14),
                ],
              }),
            ];

            const getEntryField = (entry, field) => {
              const v = entry?.[field];
              return toFieldValue(v);
            };

            baseRent.forEach((entry, idx) => {
              tableRows.push(
                new TableRow({
                  children: [
                    dataCell(String(idx + 1)),
                    dataCell(getEntryField(entry, "description")),
                    dataCell(getEntryField(entry, "dateFrom") ?? getEntryField(entry, "startDate")),
                    dataCell(getEntryField(entry, "dateTo") ?? getEntryField(entry, "endDate")),
                    dataCell(getEntryField(entry, "monthlyAmount")),
                    dataCell(getEntryField(entry, "annualAmount")),
                    dataCell(getEntryField(entry, "areaRentable")),
                    dataCell(getEntryField(entry, "amountPerArea")),
                    dataCell(getEntryField(entry, "managementFees")),
                  ],
                })
              );
            });

            children.push(
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
              new Paragraph({ text: "", spacing: { after: 200 } })
            );
          }

          // Late Fee Information - Card Grid Layout
          if (lateFee && typeof lateFee === "object") {
            children.push(
              new Paragraph({
                text: "Late Fee Information",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 },
                alignment: AlignmentType.CENTER,
              })
            );

            const lateFeeFields = [
              "calculationType",
              "graceDays",
              "percent",
              "secondFeeCalculationType",
              "secondFeeGrace",
              "secondFeePercent",
              "perDayFee",
            ];

            const validLateFeeEntries = lateFeeFields
              .map((field) => ({ key: field, value: lateFee?.[field] }))
              .filter(({ value }) => value && toFieldValue(value) != null && toFieldValue(value) !== "");

            for (let i = 0; i < validLateFeeEntries.length; i += 3) {
              const rowEntries = validLateFeeEntries.slice(i, i + 3);
              const cells = rowEntries.map(({ key, value }) => {
                const val = toFieldValue(value);
                const citation = value?.citation;
                return createCardCell(createCardContent(formatLabel(key), val, citation), 33.33);
              });

              while (cells.length < 3) {
                cells.push(createCardCell([new Paragraph({ text: "" })], 33.33));
              }

              children.push(
                new Table({
                  rows: [new TableRow({ children: cells })],
                  width: { size: 100, type: WidthType.PERCENTAGE },
                }),
                new Paragraph({ text: "", spacing: { after: 150 } })
              );
            }
          }
        }

        // Miscellaneous Information (ONLY misc.otherLeaseProvisions)
        const miscData =
          analysisData?.misc?.otherLeaseProvisions ||
          // Back-compat fallback if the payload ever comes flattened.
          analysisData?.otherLeaseProvisions;

        if (miscData && typeof miscData === "object") {
          children.push(
            new Paragraph({
              text: "Miscellaneous Information",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            })
          );

          Object.entries(miscData).forEach(([sectionKey, sectionData]) => {
            if (!sectionData || typeof sectionData !== "object") return;

            children.push(
              new Paragraph({
                text: formatLabel(sectionKey),
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 150 },
              })
            );

            Object.entries(sectionData).forEach(([key, value]) => {
              if (!value) return;

              const val = toFieldValue(value);
              if (val == null || val === "") return;

              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: "• ", bold: true }),
                    new TextRun({ text: `${formatLabel(key)}: `, bold: true }),
                    new TextRun({ text: formatTextValue(val) }),
                  ],
                  spacing: { after: 80 },
                })
              );

              if (value?.citation) {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `    Citation: ${formatTextValue(value.citation)}`,
                        italics: true,
                        size: 20,
                      }),
                    ],
                    spacing: { after: 60 },
                    indent: { left: 400 },
                  })
                );
              }

              if (Array.isArray(value?.amendments) && value.amendments.length > 0) {
                value.amendments.forEach((amendment, aIndex) => {
                  children.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `    Amendment ${aIndex + 1}: ${formatTextValue(amendment)}`,
                          italics: true,
                          size: 20,
                        }),
                      ],
                      spacing: { after: 60 },
                      indent: { left: 400 },
                    })
                  );
                });
              }
            });
          });
        }

        // Audit Section (safe handling for dynamic shapes)
        const auditObject = resolveAuditObject(analysisData);
        const auditRisks = resolveAuditRisks(auditObject);
        if (auditRisks.length > 0) {
          children.push(
            new Paragraph({
              text: "Lease Audit Checklist",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              text: `Found ${auditRisks.length} potential issues requiring attention`,
              spacing: { after: 200 },
            })
          );

          auditRisks.forEach((item, rIndex) => {
            const category =
              item?.category ||
              item?.issue_type ||
              item?.risk_type ||
              item?.title ||
              item?.name ||
              `Issue ${rIndex + 1}`;

            const issueDescription =
              item?.issue_description || item?.description || item?.summary || item?.risk_description;
            const affectedClause = item?.affected_clause;
            const pageRefs =
              Array.isArray(item?.page_references)
                ? item.page_references
                : Array.isArray(item?.page_reference)
                ? item.page_reference
                : item?.page_number != null
                ? [item.page_number]
                : item?.page != null
                ? [item.page]
                : [];
            const recommendedAction = item?.recommended_action;

            children.push(
              new Paragraph({
                text: formatTextValue(category),
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 },
              })
            );

            if (issueDescription) {
              children.push(
                new Paragraph({
                  children: [new TextRun({ text: "Issue Description: ", bold: true })],
                  spacing: { after: 60 },
                }),
                new Paragraph({
                  text: formatTextValue(issueDescription),
                  spacing: { after: 100 },
                  indent: { left: 200 },
                })
              );
            }

            if (affectedClause) {
              children.push(
                new Paragraph({
                  children: [new TextRun({ text: "Affected Clause: ", bold: true })],
                  spacing: { after: 60 },
                }),
                new Paragraph({
                  text: formatTextValue(affectedClause),
                  spacing: { after: 100 },
                  indent: { left: 200 },
                })
              );
            }

            if (Array.isArray(pageRefs) && pageRefs.length > 0) {
              children.push(
                new Paragraph({
                  children: [new TextRun({ text: "Page References: ", bold: true })],
                  spacing: { after: 60 },
                }),
                new Paragraph({
                  text: pageRefs.map((p) => `Page ${p}`).join(", "),
                  spacing: { after: 100 },
                  indent: { left: 200 },
                })
              );
            }

            if (recommendedAction) {
              children.push(
                new Paragraph({
                  children: [new TextRun({ text: "Recommended Action: ", bold: true })],
                  spacing: { after: 60 },
                }),
                new Paragraph({
                  text: formatTextValue(recommendedAction),
                  spacing: { after: 150 },
                  indent: { left: 200 },
                })
              );
            }
          });
        }

        // CAM Section (append after Audit)
        const camSingleRaw = analysisData?.["cam-single"];
        const camSingle = camSingleRaw && typeof camSingleRaw === "object" ? (camSingleRaw.data ?? camSingleRaw) : null;
        if (camSingle && typeof camSingle === "object") {
          const title = camSingle.sectionTitle || camSingle.title || "CAM Clause";
          const clauseText = camSingle.textContent || camSingle.executionClause || camSingle.content || camSingle.text || "";
          const citations = Array.isArray(camSingle.citations)
            ? camSingle.citations.filter(Boolean)
            : camSingle.citations
            ? [String(camSingle.citations)]
            : [];
          const pageNumber = camSingle.pageNumber || camSingle.page_number;
          if (pageNumber && !citations.some((c) => String(c).includes(String(pageNumber)))) {
            citations.push(`Page ${pageNumber}`);
          }

          const pushLabelValue = (label, value) => {
            const text = formatTextValue(value);
            if (!text || text === "N/A") return;
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${label}: `, bold: true }),
                  new TextRun({ text }),
                ],
                spacing: { after: 120 },
              })
            );
          };

          children.push(
            new Paragraph({
              text: "CAM",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            })
          );

          pushLabelValue("Title", title);

          const cleanedClause = String(formatTextValue(clauseText) ?? "").trim();
          if (cleanedClause && cleanedClause !== "N/A") {
            children.push(
              new Paragraph({
                text: "Clause Text",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 120 },
              })
            );

            cleanedClause
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
              .forEach((line) => {
                children.push(
                  new Paragraph({
                    text: line,
                    spacing: { after: 100 },
                  })
                );
              });
          }

          if (citations.length) {
            pushLabelValue("Citations", citations.join(", "));
          }
        }
      });

      children.push(
        new Paragraph({
          text: "End of Report",
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
        })
      );

      const doc = new Document({
        sections: [{ children }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${fileStem}-analysis-${new Date().toISOString().split("T")[0]}.docx`);
    } catch (e) {
      console.error("Failed to generate DOCX", e);
      showError(e?.message || "Failed to generate DOCX");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      className={buttonClassName || "ai-btn"}
      onClick={handleDownload}
      disabled={disabled || isGenerating}
      title={isGenerating ? "Preparing DOCX..." : "Download details as DOCX"}
      aria-label="Download details as DOCX"
    >
      <FiDownload className={iconClassName} />
    </button>
  );
};

export default DownloadLeaseDetailsDocx;
