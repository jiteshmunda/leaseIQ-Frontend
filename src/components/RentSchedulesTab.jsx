import React from "react";
import { FiChevronDown, FiExternalLink, FiFileText } from "react-icons/fi";
import "../styles/RentSchedulesTab.css";
import FieldWithTooltip from "./Fieldwithamendments";
import {
  canNavigateToCitation,
  getCitationDisplayText,
  openPdfWithCitation,
} from "../service/citationUtils";
import { showError } from "../service/toast";
const hasAmendments = (field) =>
  !!(
    field &&
    typeof field === "object" &&
    Array.isArray(field.amendments) &&
    field.amendments.length > 0
  );

const formatAmendmentsLabel = (filename, contextLabel) => {
  const base =
    typeof filename === "string" && filename.trim()
      ? filename.trim().replace(/\.[^.]+$/i, "")
      : "Amendments";

  const ctx = typeof contextLabel === "string" ? contextLabel.trim() : "";
  if (!ctx || ctx === "Amendments") return base;
  return `${base} — ${ctx}`;
};

const renderAmendments = (field, label, filename, renderCitationTag) => {
  if (!field || !Array.isArray(field.amendments) || !field.amendments.length) {
    return null;
  }

  return (
    <div className="amendments-block">
      <span className="amendments-label">{formatAmendmentsLabel(filename, label)}</span>
      <ul className="amendments-list">
        {field.amendments.map((am, idx) => (
          <li key={idx}>
            {am?.amendment_type && (
              <div>
                <strong>Type: </strong>
                {am.amendment_type}
              </div>
            )}
            {am?.effective_date && (
              <div>
                <strong>Effective Date: </strong>
                {am.effective_date}
              </div>
            )}
            {am?.previous_value && (
              <div>
                <strong>Previous: </strong>
                {am.previous_value}
              </div>
            )}
            {am?.new_value && (
              <div>
                <strong>New: </strong>
                {am.new_value}
              </div>
            )}
            {am?.amendment_citation && (
              <div>
                {renderCitationTag
                  ? renderCitationTag(am.amendment_citation, null, "small")
                  : (
                    <>
                      <strong>Citation: </strong>
                      {am.amendment_citation}
                    </>
                  )}
              </div>
            )}
            {am?.description && (
              <div>
                <strong>Description: </strong>
                {am.description}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const RentSchedulesTab = ({ chargeSchedules, getFieldValue, filename, documentId }) => {
  const getFieldCitation = (field) => {
    if (!field || typeof field !== "object") return "";
    if (typeof field.citation === "string") return field.citation;
    if (field.citation && typeof field.citation === "object") {
      if (typeof field.citation.value === "string") return field.citation.value;
    }
    return "";
  };

  const handleCitationClick = async (citation) => {
    if (!documentId) {
      showError("Document not available for citation navigation");
      return;
    }

    try {
      await openPdfWithCitation(documentId, citation);
    } catch (err) {
      console.error("Failed to open citation:", err);
      showError("Failed to open PDF. Please try again.");
    }
  };

  const renderCitationTag = (citation, field, size) => {
    if (!citation) return null;

    const citationObj = field?.citation || citation;
    const displayText = getCitationDisplayText(citationObj) || citation;
    const isNavigable = documentId && canNavigateToCitation(citationObj);

    const sizeClass = size === "small" ? " small" : "";

    if (isNavigable) {
      return (
        <button
          type="button"
          className={`provision-citation-tag provision-citation-clickable${sizeClass}`}
          onClick={() => handleCitationClick(citationObj)}
          title="Click to view in PDF"
        >
          <FiFileText className="provision-citation-icon" />
          <span className="provision-citation-text">{displayText}</span>
          <FiExternalLink className="provision-citation-link-icon" size={12} />
        </button>
      );
    }

    return (
      <div className={`provision-citation-tag${sizeClass}`}>
        <FiFileText className="provision-citation-icon" />
        <span className="provision-citation-text">{displayText}</span>
      </div>
    );
  };

  const renderField = (field, fallback = "-", showTooltip = true) => {
    const value = getFieldValue?.(field) || fallback;
    const citation = getFieldCitation(field);
    const hasAmends = hasAmendments(field);

    return (
      <div className="field-cell-container">
        {hasAmends && showTooltip ? (
          <FieldWithTooltip value={value} amendments={field.amendments} filename={filename} />
        ) : (
          <div>{value}</div>
        )}
        {citation ? renderCitationTag(citation, field, "small") : null}
      </div>
    );
  };

  const parseNumericValue = (val) => {
    if (typeof val === "number") return val;
    if (typeof val !== "string") return 0;
    // Remove currency symbols, commas, and whitespace
    const clean = val.replace(/[^0-9.-]+/g, "");
    return parseFloat(clean) || 0;
  };

  const formatCurrency = (val) => {
    if (isNaN(val)) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const renderAmountPerArea = (item) => {
    const existingVal = getFieldValue(item.amountPerArea);

    // If we have an explicit value, use it
    if (existingVal && existingVal !== "-" && existingVal !== "N/A") {
      return renderField(item.amountPerArea, "-", false);
    }

    // Otherwise calculate
    const annual = parseNumericValue(getFieldValue(item.annualAmount));
    const area = parseNumericValue(getFieldValue(item.areaRentable));

    if (annual > 0 && area > 0) {
      const calculated = annual / area;
      return (
        <div className="field-cell-container">
          <div>{formatCurrency(calculated)}</div>
          {/* Note: No citation for calculated values unless we want to link raw inputs? */}
        </div>
      );
    }

    // Fallback to existing renderField if calculation not possible
    return renderField(item.amountPerArea, "-", false);
  };

  return (
    <div className="rent-schedules">
      <h3 className="section-title">Charge Schedules</h3>

      {/* REAL ACCORDION */}
      <details className="accordion-card" open>
        <summary className="accordion-summary">
          <span className="accordion-left">
            <FiChevronDown className="accordion-icon" />
            Late Fee Information
          </span>
        </summary>

        <div className="accordion-body">
          <div className="latefee-grid">
            <div
              className={`latefee-card ${hasAmendments(chargeSchedules?.lateFee?.calculationType)
                ? "has-amendments"
                : ""
                }`}
            >
              <label>
                <FieldWithTooltip
                  value="Calculation Type"
                  amendments={chargeSchedules?.lateFee?.calculationType?.amendments}
                  filename={filename}
                />
              </label>
              <p>{getFieldValue(chargeSchedules?.lateFee?.calculationType) || "N/A"}</p>
              {getFieldCitation(chargeSchedules?.lateFee?.calculationType)
                ? renderCitationTag(
                  getFieldCitation(chargeSchedules?.lateFee?.calculationType),
                  chargeSchedules?.lateFee?.calculationType,
                  "small"
                )
                : null}
              {renderAmendments(
                chargeSchedules?.lateFee?.calculationType,
                undefined,
                filename,
                renderCitationTag
              )}
            </div>

            <div
              className={`latefee-card ${hasAmendments(chargeSchedules?.lateFee?.graceDays)
                ? "has-amendments"
                : ""
                }`}
            >
              <label>
                <FieldWithTooltip
                  value="Grace Days"
                  amendments={chargeSchedules?.lateFee?.graceDays?.amendments}
                  filename={filename}
                />
              </label>
              <p>{getFieldValue(chargeSchedules?.lateFee?.graceDays) || "N/A"}</p>
              {getFieldCitation(chargeSchedules?.lateFee?.graceDays)
                ? renderCitationTag(
                  getFieldCitation(chargeSchedules?.lateFee?.graceDays),
                  chargeSchedules?.lateFee?.graceDays,
                  "small"
                )
                : null}
              {renderAmendments(
                chargeSchedules?.lateFee?.graceDays,
                undefined,
                filename,
                renderCitationTag
              )}
            </div>

            <div
              className={`latefee-card ${hasAmendments(chargeSchedules?.lateFee?.percent)
                ? "has-amendments"
                : ""
                }`}
            >
              <label>
                <FieldWithTooltip
                  value="Percent"
                  amendments={chargeSchedules?.lateFee?.percent?.amendments}
                  filename={filename}
                />
              </label>
              <p>{getFieldValue(chargeSchedules?.lateFee?.percent) || "N/A"}</p>
              {getFieldCitation(chargeSchedules?.lateFee?.percent)
                ? renderCitationTag(
                  getFieldCitation(chargeSchedules?.lateFee?.percent),
                  chargeSchedules?.lateFee?.percent,
                  "small"
                )
                : null}
              {renderAmendments(
                chargeSchedules?.lateFee?.percent,
                undefined,
                filename,
                renderCitationTag
              )}
            </div>

            <div
              className={`latefee-card ${hasAmendments(chargeSchedules?.lateFee?.secondFeeCalculationType)
                ? "has-amendments"
                : ""
                }`}
            >
              <label>
                <FieldWithTooltip
                  value="Second Fee Calculation Type"
                  amendments={
                    chargeSchedules?.lateFee?.secondFeeCalculationType?.amendments
                  }
                  filename={filename}
                />
              </label>
              <p>
                {getFieldValue(
                  chargeSchedules?.lateFee?.secondFeeCalculationType
                ) || "N/A"}
              </p>
              {getFieldCitation(chargeSchedules?.lateFee?.secondFeeCalculationType)
                ? renderCitationTag(
                  getFieldCitation(chargeSchedules?.lateFee?.secondFeeCalculationType),
                  chargeSchedules?.lateFee?.secondFeeCalculationType,
                  "small"
                )
                : null}
              {renderAmendments(
                chargeSchedules?.lateFee?.secondFeeCalculationType,
                undefined,
                filename,
                renderCitationTag
              )}
            </div>

            <div
              className={`latefee-card ${hasAmendments(chargeSchedules?.lateFee?.secondFeeGrace)
                ? "has-amendments"
                : ""
                }`}
            >
              <label>
                <FieldWithTooltip
                  value="Second Fee Grace"
                  amendments={
                    chargeSchedules?.lateFee?.secondFeeGrace?.amendments
                  }
                  filename={filename}
                />
              </label>
              <p>
                {getFieldValue(chargeSchedules?.lateFee?.secondFeeGrace) ||
                  "N/A"}
              </p>
              {getFieldCitation(chargeSchedules?.lateFee?.secondFeeGrace)
                ? renderCitationTag(
                  getFieldCitation(chargeSchedules?.lateFee?.secondFeeGrace),
                  chargeSchedules?.lateFee?.secondFeeGrace,
                  "small"
                )
                : null}
              {renderAmendments(
                chargeSchedules?.lateFee?.secondFeeGrace,
                undefined,
                filename,
                renderCitationTag
              )}
            </div>

            <div
              className={`latefee-card ${hasAmendments(chargeSchedules?.lateFee?.secondFeePercent)
                ? "has-amendments"
                : ""
                }`}
            >
              <label>
                <FieldWithTooltip
                  value="Second Fee Percent"
                  amendments={
                    chargeSchedules?.lateFee?.secondFeePercent?.amendments
                  }
                  filename={filename}
                />
              </label>
              <p>
                {getFieldValue(chargeSchedules?.lateFee?.secondFeePercent) ||
                  "N/A"}
              </p>
              {getFieldCitation(chargeSchedules?.lateFee?.secondFeePercent)
                ? renderCitationTag(
                  getFieldCitation(chargeSchedules?.lateFee?.secondFeePercent),
                  chargeSchedules?.lateFee?.secondFeePercent,
                  "small"
                )
                : null}
              {renderAmendments(
                chargeSchedules?.lateFee?.secondFeePercent,
                undefined,
                filename,
                renderCitationTag
              )}
            </div>

            <div
              className={`latefee-card ${hasAmendments(chargeSchedules?.lateFee?.perDayFee)
                ? "has-amendments"
                : ""
                }`}
            >
              <label>
                <FieldWithTooltip
                  value="Per Day Fee"
                  amendments={chargeSchedules?.lateFee?.perDayFee?.amendments}
                  filename={filename}
                />
              </label>
              <p>{getFieldValue(chargeSchedules?.lateFee?.perDayFee) || "N/A"}</p>
              {getFieldCitation(chargeSchedules?.lateFee?.perDayFee)
                ? renderCitationTag(
                  getFieldCitation(chargeSchedules?.lateFee?.perDayFee),
                  chargeSchedules?.lateFee?.perDayFee,
                  "small"
                )
                : null}
              {renderAmendments(
                chargeSchedules?.lateFee?.perDayFee,
                undefined,
                filename,
                renderCitationTag
              )}
            </div>
          </div>
        </div>
      </details>

      {/* BASE RENT TABLE — NOT IN ACCORDION */}
      <section className="card base-rent-card">
        <h3 className="card-title">Base Rent Schedule</h3>

        <table className="rent-table table-responsive">
          <thead>
            <tr>
              <th>Period</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Monthly Rent</th>
              <th>Annual Rent</th>
              <th>Area Rentable</th>
              <th>Amount Per Area</th>
            </tr>
          </thead>
          <tbody>
            {chargeSchedules?.baseRent?.length ? (
              chargeSchedules.baseRent.map((item, index) => {
                const rowHasAmendments =
                  hasAmendments(item) ||
                  hasAmendments(item?.period) ||
                  hasAmendments(item?.dateFrom) ||
                  hasAmendments(item?.dateTo) ||
                  hasAmendments(item?.monthlyAmount) ||
                  hasAmendments(item?.annualAmount) ||
                  hasAmendments(item?.areaRentable) ||
                  hasAmendments(item?.amountPerArea);

                return (
                  <React.Fragment key={`base-rent-row-${index}`}>
                    <tr
                      className={rowHasAmendments ? "has-amendments-row" : ""}
                    >
                      <td>{renderField(item.period, "-", false)}</td>
                      <td>{renderField(item.dateFrom, "-", false)}</td>
                      <td>{renderField(item.dateTo, "-", false)}</td>
                      <td>{renderField(item.monthlyAmount, "-", false)}</td>
                      <td>{renderField(item.annualAmount, "-", false)}</td>
                      <td>{renderField(item.areaRentable, "-", false)}</td>
                      <td>{renderAmountPerArea(item)}</td>
                    </tr>
                    {rowHasAmendments && (
                      <tr className="amendments-row">
                        <td colSpan={7}>
                          <details className="amendments-details">
                            <summary className="amendments-summary">
                              Amendments
                            </summary>
                            {renderAmendments(item, undefined, filename, renderCitationTag)}
                            {renderAmendments(item?.period, undefined, filename, renderCitationTag)}
                            {renderAmendments(item?.dateFrom, undefined, filename, renderCitationTag)}
                            {renderAmendments(item?.dateTo, undefined, filename, renderCitationTag)}
                            {renderAmendments(item?.monthlyAmount, undefined, filename, renderCitationTag)}
                            {renderAmendments(item?.annualAmount, undefined, filename, renderCitationTag)}
                            {renderAmendments(item?.areaRentable, undefined, filename, renderCitationTag)}
                            {renderAmendments(item?.amountPerArea, undefined, filename, renderCitationTag)}
                          </details>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  No base rent schedule available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default RentSchedulesTab;
