import { useMemo, useState } from "react";
import { FiEdit } from "react-icons/fi";
import FieldWithTooltip from "./Fieldwithamendments";

const getFieldCitation = (field) => {
  if (!field || typeof field !== "object") return "";
  if (typeof field.citation === "string") return field.citation;
  if (field.citation && typeof field.citation === "object") {
    if (typeof field.citation.value === "string") return field.citation.value;
  }
  return "";
};

const hasAmendments = (field) =>
  !!(
    field &&
    typeof field === "object" &&
    Array.isArray(field.amendments) &&
    field.amendments.length > 0
  );

const formatAmendmentsLabel = (filename) => {
  if (typeof filename !== "string") return "Amendments";
  const trimmed = filename.trim();
  if (!trimmed) return "Amendments";
  return trimmed.replace(/\.[^.]+$/i, "");
};

const renderAmendments = (field, filename) => {
  if (!field || !Array.isArray(field.amendments) || !field.amendments.length) {
    return null;
  }

  return (
    <div className="amendments-block">
      <span className="amendments-label">{formatAmendmentsLabel(filename)}</span>
      <ul className="amendments-list">
        {field.amendments.map((am, idx) => (
          <li key={idx}>
            {am?.effective_date ? <strong>{am.effective_date}: </strong> : null}
            {am?.description || (
              <span>
                {am?.previous_value && (
                  <span>
                    Previous: {am.previous_value}{" "}
                  </span>
                )}
                {am?.new_value && <span>New: {am.new_value}</span>}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const InfoTab = ({
  leaseInfo,
  chargeSchedules,
  // miscProvisions,
  premisesAndTerm,
  derivedSecurityDeposit,
  getFieldValue,
  // formatDisplayValue,
  leaseDetails,
  onUpdateLeaseDetails,
  filename,
}) => {
  const renderInlineBold = (text) => {
    const source = String(text ?? "");
    if (!source.includes("**")) return source;

    const parts = [];
    const re = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = re.exec(source)) !== null) {
      const start = match.index;
      const end = re.lastIndex;
      const before = source.slice(lastIndex, start);
      if (before) parts.push(before);

      const boldText = match[1] ?? "";
      parts.push(
        <strong key={`b-${keyIndex++}`}>{boldText}</strong>
      );

      lastIndex = end;
    }

    const after = source.slice(lastIndex);
    if (after) parts.push(after);
    return parts;
  };

  const executiveSummaryRaw = useMemo(() => {
    const candidate =
      leaseDetails?.["executive-summary"]?.executiveSummary?.value ??
      leaseDetails?.["executive-summary"]?.executiveSummary ??
      leaseDetails?.executiveSummary?.value ??
      leaseDetails?.executiveSummary ??
      "";

    return typeof candidate === "string" ? candidate : String(candidate ?? "");
  }, [leaseDetails]);

  const executiveSummaryItems = useMemo(() => {
    const raw = String(executiveSummaryRaw ?? "");
    if (!raw.trim()) return [];

    return raw
      .split("\n")
      .map((line) => String(line ?? "").trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[-*]\s+/, ""));
  }, [executiveSummaryRaw]);

  // const keyDatesCount = useMemo(() => {
  //   const seen = new Set();

  //   const looksLikeDate = (s) => {
  //     const text = String(s ?? "").trim();
  //     if (!text) return false;
  //     // ISO-ish: 2025-12-30 or 2025-12-30T...
  //     if (/^\d{4}-\d{2}-\d{2}(?:[T\s].*)?$/.test(text)) return true;
  //     // Common US: 12/30/2025 or 12/30/25
  //     if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(text)) return true;
  //     return false;
  //   };

  //   const visit = (value) => {
  //     if (value == null) return;
  //     if (Array.isArray(value)) {
  //       value.forEach(visit);
  //       return;
  //     }
  //     if (typeof value === "object") {
  //       Object.values(value).forEach(visit);
  //       return;
  //     }
  //     if (typeof value === "string") {
  //       if (!looksLikeDate(value)) return;
  //       const d = new Date(value);
  //       if (Number.isNaN(d.getTime())) return;
  //       const day = d.toISOString().slice(0, 10);
  //       seen.add(day);
  //     }
  //   };

  //   visit(leaseDetails);
  //   return seen.size;
  // }, [leaseDetails]);

  // const obligationsCount = useMemo(() => {
  //   const audit = leaseDetails?.audit;
  //   const totalItems = audit?.totalItems ?? audit?.total_items ?? audit?.summary?.totalItems;
  //   if (typeof totalItems === "number" && Number.isFinite(totalItems)) {
  //     return totalItems;
  //   }
  //   const source = audit?.identified_risks || audit?.audit_checklist;
  //   return Array.isArray(source) ? source.length : 0;
  // }, [leaseDetails]);

  // const keyTermsCount = useMemo(() => {
  //   const info = leaseDetails?.info?.leaseInformation;
  //   if (!info || typeof info !== "object") return 0;

  //   const isNonEmpty = (v) => {
  //     if (v == null) return false;
  //     if (typeof v === "string") return v.trim().length > 0;
  //     if (typeof v === "number") return Number.isFinite(v);
  //     if (typeof v === "boolean") return true;
  //     if (typeof v === "object" && "value" in v) {
  //       const inner = v.value;
  //       if (inner == null) return false;
  //       return String(inner).trim().length > 0;
  //     }
  //     return false;
  //   };

  //   return Object.values(info).filter(isNonEmpty).length;
  // }, [leaseDetails]);

  // const overviewCards = useMemo(
  //   () => [
  //     {
  //       key: "liabilities",
  //       color: "red",
  //       label: "Liabilities",
  //       value: leaseDetails?.audit ? "Hidden" : "N/A",
  //     },
  //     {
  //       key: "keyDates",
  //       color: "blue",
  //       label: "Key Dates",
  //       value: keyDatesCount,
  //     },
  //     {
  //       key: "obligations",
  //       color: "green",
  //       label: "Obligations",
  //       value: obligationsCount,
  //     },
  //     {
  //       key: "keyTerms",
  //       color: "orange",
  //       label: "Key Terms",
  //       value: keyTermsCount,
  //     },
  //   ],
  //   [leaseDetails, keyDatesCount, obligationsCount, keyTermsCount]
  // );

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [executiveSummaryForm, setExecutiveSummaryForm] = useState("");
  const [infoForm, setInfoForm] = useState({
  lease: getFieldValue(leaseInfo?.lease) || "",
  propertyAddress: getFieldValue(leaseInfo?.property) || "",
  leaseFrom: getFieldValue(leaseInfo?.leaseFrom) || "",
  leaseTo: getFieldValue(leaseInfo?.leaseTo) || "",
  renewalOptions: getFieldValue(premisesAndTerm?.synopsis) || "",
  squareFeet:
    leaseDetails?.info?.leaseInformation?.squareFeet?.value
      ? String(leaseDetails.info.leaseInformation.squareFeet.value)
      : "",
  baseRent:
    chargeSchedules?.baseRent?.[0]?.monthlyAmount?.value
      ? String(chargeSchedules.baseRent[0].monthlyAmount.value)
      : "",
  securityDeposit:
    leaseDetails?.info?.leaseInformation?.securityDeposit?.value
      ? String(leaseDetails.info.leaseInformation.securityDeposit.value)
      : "",
});


  const startEditInfo = () => {
  setInfoForm({
    lease: getFieldValue(leaseInfo?.lease) || "",
    propertyAddress: getFieldValue(leaseInfo?.property) || "",
    leaseFrom: getFieldValue(leaseInfo?.leaseFrom) || "",
    leaseTo: getFieldValue(leaseInfo?.leaseTo) || "",
    renewalOptions: getFieldValue(leaseInfo?.renewalOptions) || "",
    squareFeet:
      leaseDetails?.info?.leaseInformation?.squareFeet?.value
        ? String(leaseDetails.info.leaseInformation.squareFeet.value)
        : "",
    baseRent:
      leaseDetails?.info?.leaseInformation?.baseRent?.value
        ? String(leaseDetails.info.leaseInformation.baseRent.value)
        : "",
    securityDeposit:
      leaseDetails?.info?.leaseInformation?.securityDeposit?.value
        ? String(leaseDetails.info.leaseInformation.securityDeposit.value)
        : "",
  });

  setIsEditingInfo(true);
};


  const handleChange = (field, value) => {
    setInfoForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveInfo = () => {
    if (!onUpdateLeaseDetails || !leaseDetails) {
      setIsEditingInfo(false);
      return;
    }

    const updatedLeaseDetails = {
      ...leaseDetails,
      info: {
        ...(leaseDetails?.info || {}),
        leaseInformation: {
          ...(leaseDetails?.info?.leaseInformation || {}),
          lease: {
            ...(leaseDetails?.info?.leaseInformation?.lease || {}),
            value: infoForm.lease.trim(),
          },
          property: {
            ...(leaseDetails?.info?.leaseInformation?.property || {}),
            value: infoForm.propertyAddress.trim(),
          },
          leaseFrom: {
            ...(leaseDetails?.info?.leaseInformation?.leaseFrom || {}),
            value: infoForm.leaseFrom.trim(),
          },
          leaseTo: {
            ...(leaseDetails?.info?.leaseInformation?.leaseTo || {}),
            value: infoForm.leaseTo.trim(),
          },
          squareFeet: {
            ...(leaseDetails?.info?.leaseInformation?.squareFeet || {}),
            value: infoForm.squareFeet.trim(),
          },
          securityDeposit: {
            ...(leaseDetails?.info?.leaseInformation?.securityDeposit || {}),
            value: infoForm.securityDeposit.trim(),
          },
        },
      },
      misc: {
        ...(leaseDetails?.misc || {}),
        otherLeaseProvisions: {
          ...(leaseDetails?.misc?.otherLeaseProvisions || {}),
          premisesAndTerm: {
            ...(leaseDetails?.misc?.otherLeaseProvisions?.premisesAndTerm || {}),
            synopsis: {
              ...(leaseDetails?.misc?.otherLeaseProvisions?.premisesAndTerm?.synopsis || {}),
              value: infoForm.renewalOptions.trim(),
            },
          },
        },
      },
      "charge-schedules": (() => {
        const root = { ...(leaseDetails?.["charge-schedules"] || {}) };
        const schedules = { ...(root.chargeSchedules || {}) };

        if (Array.isArray(schedules.baseRent) && schedules.baseRent[0]) {
          const baseRentArr = [...schedules.baseRent];
          const first = { ...(baseRentArr[0] || {}) };
          first.monthlyAmount = {
            ...(first.monthlyAmount || {}),
            value: infoForm.baseRent.trim(),
          };
          baseRentArr[0] = first;
          schedules.baseRent = baseRentArr;
        }

        return {
          ...root,
          chargeSchedules: schedules,
        };
      })(),
    };

    onUpdateLeaseDetails(updatedLeaseDetails);
    setIsEditingInfo(false);
  };

  // const startEditExecutiveSummary = () => {
  //   setExecutiveSummaryForm(executiveSummaryRaw || "");
  //   setIsEditingSummary(true);
  // };

  const handleSaveExecutiveSummary = () => {
    if (!onUpdateLeaseDetails || !leaseDetails) {
      setIsEditingSummary(false);
      return;
    }

    const updatedLeaseDetails = {
      ...leaseDetails,
      "executive-summary": (() => {
        const root = { ...(leaseDetails?.["executive-summary"] || {}) };
        const current = root.executiveSummary;

        if (current && typeof current === "object") {
          root.executiveSummary = {
            ...current,
            value: executiveSummaryForm,
          };
        } else {
          root.executiveSummary = { value: executiveSummaryForm };
        }

        return root;
      })(),
    };

    onUpdateLeaseDetails(updatedLeaseDetails);
    setIsEditingSummary(false);
  };

  const leaseInfoSource = leaseDetails?.info?.leaseInformation || leaseInfo || {};

  return (
    <>
      {/* Overview */}
      {/* <section className="overview">
        {overviewCards.map((card) => (
          <div key={card.key} className={`overview-card ${card.color}`}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </section> */}

      {/* Lease Info */}
      <section className="card">
        <div className="card-header">
          <h3>Lease Information</h3>
           <button
            type="button"
            className="edit-btn"
            onClick={startEditInfo}
          >
            <FiEdit /> {isEditingInfo ? "Editing" : "Edit"}
          </button> 
        </div>

        <div className="info-grid">
          <div
            className={`info-item ${
              hasAmendments(leaseInfoSource?.lease) ? "has-amendments" : ""
            }`}
          >
            <label>
              <FieldWithTooltip
                value="LEASE"
                amendments={leaseInfoSource?.lease?.amendments}
              />
            </label>
            {isEditingInfo ? (
              <input
                type="text"
                className="form-control"
                value={infoForm.lease}
                onChange={(e) => handleChange("lease", e.target.value)}
                placeholder="Enter lease type"
              />
            ) : (
              <p>{getFieldValue(leaseInfo?.lease) || "N/A"}</p>
            )}
            {getFieldCitation(leaseInfoSource?.lease) ? (
              <span className="citation">Citation : {getFieldCitation(leaseInfoSource?.lease)}</span>
            ) : null}
            {renderAmendments(leaseInfoSource?.lease, filename)}
          </div>
          <div
            className={`info-item ${
              hasAmendments(leaseInfoSource?.property) ? "has-amendments" : ""
            }`}
          >
            <label>
              <FieldWithTooltip
                value="PROPERTY"
                amendments={leaseInfoSource?.property?.amendments}
              />
            </label>
            {isEditingInfo ? (
              <input
                type="text"
                className="form-control"
                value={infoForm.propertyAddress}
                onChange={(e) => handleChange("propertyAddress", e.target.value)}
                placeholder="Enter property address"
              />
            ) : (
              <p>{getFieldValue(leaseInfo?.property) || "N/A"}</p>
            )}

            {getFieldCitation(leaseInfoSource?.property) ? (
              <span className="citation">Citation : {getFieldCitation(leaseInfoSource?.property)}</span>
            ) : null}
            {renderAmendments(leaseInfoSource?.property, filename)}

          </div>
          
          <div
            className={`info-item ${
              hasAmendments(leaseInfoSource?.leaseFrom) ? "has-amendments" : ""
            }`}
          >
            <label>
              <FieldWithTooltip
                value="LEASE FROM"
                amendments={leaseInfoSource?.leaseFrom?.amendments}
              />
            </label>
            {isEditingInfo ? (
              <input
                type="text"
                className="form-control"
                value={infoForm.leaseFrom}
                onChange={(e) => handleChange("leaseFrom", e.target.value)}
                placeholder="Enter lease start date"
              />
            ) : (
              <p>{getFieldValue(leaseInfo?.leaseFrom) || "N/A"}</p>
            )}
            {getFieldCitation(leaseInfoSource?.leaseFrom) ? (
              <span className="citation">Citation : {getFieldCitation(leaseInfoSource?.leaseFrom)}</span>
            ) : null}
            {renderAmendments(leaseInfoSource?.leaseFrom, filename)}
          </div>
          <div
            className={`info-item ${
              hasAmendments(leaseInfoSource?.leaseTo) ? "has-amendments" : ""
            }`}
          >
            <label>
              <FieldWithTooltip
                value="LEASE TO"
                amendments={leaseInfoSource?.leaseTo?.amendments}
              />
            </label>
            {isEditingInfo ? (
              <input
                type="text"
                className="form-control"
                value={infoForm.leaseTo}
                onChange={(e) => handleChange("leaseTo", e.target.value)}
                placeholder="Enter lease end date"
              />
            ) : (
              <p>{getFieldValue(leaseInfo?.leaseTo) || "N/A"}</p>
            )}
            {getFieldCitation(leaseInfoSource?.leaseTo) ? (
              <span className="citation">Citation : {getFieldCitation(leaseInfoSource?.leaseTo)}</span>
            ) : null}
            {renderAmendments(leaseInfoSource?.leaseTo, filename)}
          </div>
          <div
            className={`info-item ${
              hasAmendments(leaseInfoSource?.squareFeet) ? "has-amendments" : ""
            }`}
          >
            <label>
              <FieldWithTooltip
                value="SQUARE FEET"
                amendments={leaseInfoSource?.squareFeet?.amendments}
              />
            </label>
            {isEditingInfo ? (
              <input
                type="text"
                className="form-control"
                value={infoForm.squareFeet}
                onChange={(e) => handleChange("squareFeet", e.target.value)}
                placeholder="Enter square feet"
              />
            ) : (
              <p>
                {leaseDetails?.info?.leaseInformation?.squareFeet?.value
                  ? `${leaseDetails.info.leaseInformation.squareFeet.value} sqft`
                  : "N/A"}
              </p>
            )}
            {getFieldCitation(leaseInfoSource?.squareFeet) ? (
              <span className="citation">Citation : {getFieldCitation(leaseInfoSource?.squareFeet)}</span>
            ) : null}
            {renderAmendments(leaseInfoSource?.squareFeet, filename)}
          </div>
          <div
            className={`info-item ${
              hasAmendments(leaseInfoSource?.baseRent) ? "has-amendments" : ""
            }`}
          >
            <label>
              <FieldWithTooltip
                value="BASE RENT"
                amendments={leaseInfoSource?.baseRent?.amendments}
              />
            </label>
            {isEditingInfo ? (
              <input
                type="text"
                className="form-control"
                value={infoForm.baseRent}
                onChange={(e) => handleChange("baseRent", e.target.value)}
                placeholder="Enter base rent (per month)"
              />
            ) : (
              <p>{getFieldValue(leaseInfo?.baseRent) || "N/A"}</p>
            )}
            {getFieldCitation(leaseInfoSource?.baseRent) ? (
              <span className="citation">Citation : {getFieldCitation(leaseInfoSource?.baseRent)}</span>
            ) : null}
            {renderAmendments(leaseInfoSource?.baseRent, filename)}
          </div>
          <div
            className={`info-item ${
              hasAmendments(leaseInfoSource?.securityDeposit) ? "has-amendments" : ""
            }`}
          >
            <label>
              <FieldWithTooltip
                value="SECURITY DEPOSIT"
                amendments={leaseInfoSource?.securityDeposit?.amendments}
              />
            </label>
            {isEditingInfo ? (
              <input
                type="text"
                className="form-control"
                value={infoForm.securityDeposit}
                onChange={(e) =>
                  handleChange("securityDeposit", e.target.value)
                }
                placeholder="Enter security deposit"
              />
            ) : (
              <p>
                {leaseDetails?.info?.leaseInformation?.securityDeposit?.value ||
                  derivedSecurityDeposit || "N/A"}
              </p>
            )}
            {getFieldCitation(leaseInfoSource?.securityDeposit) ? (
              <span className="citation">Citation : {getFieldCitation(leaseInfoSource?.securityDeposit)}</span>
            ) : null}
            {renderAmendments(leaseInfoSource?.securityDeposit, filename)}
          </div>
          <div
            className={`info-item ${
              hasAmendments(leaseInfoSource?.renewalOptions) ? "has-amendments" : ""
            }`}
          >
            <label>
              <FieldWithTooltip
                value="RENEWAL OPTIONS"
                amendments={leaseInfoSource?.renewalOptions?.amendments}
              />
            </label>
            {isEditingInfo ? (
              <textarea
                className="form-control"
                rows={2}
                value={infoForm.renewalOptions}
                onChange={(e) =>
                  handleChange("renewalOptions", e.target.value)
                }
                placeholder="Enter renewal options"
              />
            ) : (
              <p>{getFieldValue(leaseInfo?.renewalOptions) || "N/A"}</p>
            )}
            {getFieldCitation(leaseInfoSource?.renewalOptions) ? (
              <span className="citation">Citation : {getFieldCitation(leaseInfoSource?.renewalOptions)}</span>
            ) : null}
            {renderAmendments(leaseInfoSource?.renewalOptions, filename)}
          </div>
        </div>

        {isEditingInfo && (
          <div className="mt-3 d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setIsEditingInfo(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={handleSaveInfo}
            >
              Save Changes
            </button>
          </div>
        )}
      </section>

      {/* Executive Summary */}
      {isEditingSummary || executiveSummaryItems.length > 0 ? (
        <section className="card">
          <div className="card-header">
            <h3>Executive Summary</h3>
            {/* <button
              type="button"
              className="edit-btn"
              onClick={startEditExecutiveSummary}
            > */}
              {/* <FiEdit /> {isEditingSummary ? "Editing" : "Edit"} */}
            {/* </button> */}
          </div>

          {isEditingSummary ? (
            <div className="mt-3">
              <textarea
                className="form-control"
                rows={10}
                value={executiveSummaryForm}
                onChange={(e) => setExecutiveSummaryForm(e.target.value)}
                placeholder="Enter executive summary (use one line per bullet)."
              />

              <div className="mt-3 d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setIsEditingSummary(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={handleSaveExecutiveSummary}
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <ul className="summary-list">
              {executiveSummaryItems.map((item, i) => (
                <li key={i}>{renderInlineBold(item)}</li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      
      {/* <section className="card">
        <div className="card-header">
          <h3>Executive Summary</h3>
          <button className="add-btn">
            <FiPlus /> Add Item
          </button>
        </div>

        <ul className="summary-list">
          {[
            premisesAndTerm?.synopsis?.value,
            premisesAndTerm?.keyParameters?.value,
            premisesAndTerm?.narrative?.value,
            miscProvisions?.operatingExpenses?.synopsis?.value,
            miscProvisions?.taxes?.synopsis?.value,
            miscProvisions?.repairsAndMaintenance?.synopsis?.value,
          ]
            .map((raw) => formatDisplayValue(raw))
            .filter((text) => text)
            .map((item, i) => (
              <li key={i} className="summary-item">
                <span className="summary-text">{item}</span>
                <span className="summary-actions">
                  <FiEdit />
                  <FiTrash2 />
                </span>
              </li>
            ))}
        </ul>
      </section> */}
    </>
  );
};

export default InfoTab;
