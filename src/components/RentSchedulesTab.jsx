import React from "react";
import { FiChevronDown } from "react-icons/fi";
import "../styles/RentSchedulesTab.css";
import FieldWithTooltip from "./Fieldwithamendments";
const hasAmendments = (field) =>
  !!(
    field &&
    typeof field === "object" &&
    Array.isArray(field.amendments) &&
    field.amendments.length > 0
  );

const renderAmendments = (field, label = "Amendments") => {
  if (!field || !Array.isArray(field.amendments) || !field.amendments.length) {
    return null;
  }

  return (
    <div className="amendments-block">
      <span className="amendments-label">{label}</span>
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
                <strong>Citation: </strong>
                {am.amendment_citation}
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

const RentSchedulesTab = ({ chargeSchedules, getFieldValue }) => {
  const getFieldCitation = (field) => {
    if (!field || typeof field !== "object") return "";
    if (typeof field.citation === "string") return field.citation;
    if (field.citation && typeof field.citation === "object") {
      if (typeof field.citation.value === "string") return field.citation.value;
    }
    return "";
  };

  const renderField = (field, fallback = "-") => {
    const value = getFieldValue?.(field) || fallback;
    const citation = getFieldCitation(field);
    const hasAmends = hasAmendments(field);

    return (
      <>
        {hasAmends ? (
          <FieldWithTooltip value={value} amendments={field.amendments} />
        ) : (
          <div>{value}</div>
        )}
        {citation ? <span className="citation">Citation : {citation}</span> : null}
      </>
    );
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
              className={`latefee-card ${
                hasAmendments(chargeSchedules?.lateFee?.calculationType)
                  ? "has-amendments"
                  : ""
              }`}
            >
              <label>
                <FieldWithTooltip
                  value="Calculation Type"
                  amendments={chargeSchedules?.lateFee?.calculationType?.amendments}
                />
              </label>
              <p>{getFieldValue(chargeSchedules?.lateFee?.calculationType) || "N/A"}</p>
              {getFieldCitation(chargeSchedules?.lateFee?.calculationType) ? (
                <span className="citation">
                  Citation : {getFieldCitation(chargeSchedules?.lateFee?.calculationType)}
                </span>
              ) : null}
              {renderAmendments(chargeSchedules?.lateFee?.calculationType)}
            </div>

            <div
              className={`latefee-card ${
                hasAmendments(chargeSchedules?.lateFee?.graceDays)
                  ? "has-amendments"
                  : ""
              }`}
            >
              <label>
                <FieldWithTooltip
                  value="Grace Days"
                  amendments={chargeSchedules?.lateFee?.graceDays?.amendments}
                />
              </label>
              <p>{getFieldValue(chargeSchedules?.lateFee?.graceDays) || "N/A"}</p>
              {getFieldCitation(chargeSchedules?.lateFee?.graceDays) ? (
                <span className="citation">
                  Citation : {getFieldCitation(chargeSchedules?.lateFee?.graceDays)}
                </span>
              ) : null}
              {renderAmendments(chargeSchedules?.lateFee?.graceDays)}
            </div>

            <div
              className={`latefee-card ${
                hasAmendments(chargeSchedules?.lateFee?.percent)
                  ? "has-amendments"
                  : ""
              }`}
            >
              <label>
                <FieldWithTooltip
                  value="Percent"
                  amendments={chargeSchedules?.lateFee?.percent?.amendments}
                />
              </label>
              <p>{getFieldValue(chargeSchedules?.lateFee?.percent) || "N/A"}</p>
              {getFieldCitation(chargeSchedules?.lateFee?.percent) ? (
                <span className="citation">
                  Citation : {getFieldCitation(chargeSchedules?.lateFee?.percent)}
                </span>
              ) : null}
              {renderAmendments(chargeSchedules?.lateFee?.percent)}
            </div>

            <div
              className={`latefee-card ${
                hasAmendments(chargeSchedules?.lateFee?.secondFeeCalculationType)
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
                />
              </label>
              <p>
                {getFieldValue(
                  chargeSchedules?.lateFee?.secondFeeCalculationType
                ) || "N/A"}
              </p>
              {getFieldCitation(chargeSchedules?.lateFee?.secondFeeCalculationType) ? (
                <span className="citation">
                  Citation : {getFieldCitation(chargeSchedules?.lateFee?.secondFeeCalculationType)}
                </span>
              ) : null}
              {renderAmendments(chargeSchedules?.lateFee?.secondFeeCalculationType)}
            </div>

            <div
              className={`latefee-card ${
                hasAmendments(chargeSchedules?.lateFee?.secondFeeGrace)
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
                />
              </label>
              <p>
                {getFieldValue(chargeSchedules?.lateFee?.secondFeeGrace) ||
                  "N/A"}
              </p>
              {getFieldCitation(chargeSchedules?.lateFee?.secondFeeGrace) ? (
                <span className="citation">
                  Citation : {getFieldCitation(chargeSchedules?.lateFee?.secondFeeGrace)}
                </span>
              ) : null}
              {renderAmendments(chargeSchedules?.lateFee?.secondFeeGrace)}
            </div>

            <div
              className={`latefee-card ${
                hasAmendments(chargeSchedules?.lateFee?.secondFeePercent)
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
                />
              </label>
              <p>
                {getFieldValue(chargeSchedules?.lateFee?.secondFeePercent) ||
                  "N/A"}
              </p>
              {getFieldCitation(chargeSchedules?.lateFee?.secondFeePercent) ? (
                <span className="citation">
                  Citation : {getFieldCitation(chargeSchedules?.lateFee?.secondFeePercent)}
                </span>
              ) : null}
              {renderAmendments(chargeSchedules?.lateFee?.secondFeePercent)}
            </div>

            <div
              className={`latefee-card ${
                hasAmendments(chargeSchedules?.lateFee?.perDayFee)
                  ? "has-amendments"
                  : ""
              }`}
            >
              <label>
                <FieldWithTooltip
                  value="Per Day Fee"
                  amendments={chargeSchedules?.lateFee?.perDayFee?.amendments}
                />
              </label>
              <p>{getFieldValue(chargeSchedules?.lateFee?.perDayFee) || "N/A"}</p>
              {getFieldCitation(chargeSchedules?.lateFee?.perDayFee) ? (
                <span className="citation">
                  Citation : {getFieldCitation(chargeSchedules?.lateFee?.perDayFee)}
                </span>
              ) : null}
              {renderAmendments(chargeSchedules?.lateFee?.perDayFee)}
            </div>
          </div>
        </div>
      </details>

      {/* BASE RENT TABLE — NOT IN ACCORDION */}
      <section className="card base-rent-card">
        <h3 className="card-title">Base Rent Schedule</h3>

        <table className="rent-table">
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
                      <td>{renderField(item.period) || "-"}</td>
                      <td>{renderField(item.dateFrom) || "-"}</td>
                      <td>{renderField(item.dateTo) || "-"}</td>
                      <td>{renderField(item.monthlyAmount) || "-"}</td>
                      <td>{renderField(item.annualAmount) || "-"}</td>
                      <td>{renderField(item.areaRentable) || "-"}</td>
                      <td>{renderField(item.amountPerArea) || "-"}</td>
                    </tr>
                    {rowHasAmendments && (
                      <tr className="amendments-row">
                        <td colSpan={7}>
                          <details className="amendments-details">
                            <summary className="amendments-summary">
                              Amendments
                            </summary>
                            {renderAmendments(item, "Row Amendments")}
                            {renderAmendments(item?.period, "Period Amendments")}
                            {renderAmendments(item?.dateFrom, "Start Date Amendments")}
                            {renderAmendments(item?.dateTo, "End Date Amendments")}
                            {renderAmendments(item?.monthlyAmount, "Monthly Rent Amendments")}
                            {renderAmendments(item?.annualAmount, "Annual Rent Amendments")}
                            {renderAmendments(item?.areaRentable, "Area Rentable Amendments")}
                            {renderAmendments(item?.amountPerArea, "Amount Per Area Amendments")}
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
