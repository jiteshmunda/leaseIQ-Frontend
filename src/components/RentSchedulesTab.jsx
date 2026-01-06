import { FiChevronDown } from "react-icons/fi";
import "../styles/RentSchedulesTab.css";

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

    return (
      <>
        <div>{value}</div>
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
            <div className="latefee-card">
              <label>Calculation Type</label>
              <p>{getFieldValue(chargeSchedules?.lateFee?.calculationType) || "N/A"}</p>
              {getFieldCitation(chargeSchedules?.lateFee?.calculationType) ? (
                <span className="citation">
                  Citation : {getFieldCitation(chargeSchedules?.lateFee?.calculationType)}
                </span>
              ) : null}
            </div>

            <div className="latefee-card">
              <label>Grace Days</label>
              <p>{getFieldValue(chargeSchedules?.lateFee?.graceDays) || "N/A"}</p>
              {getFieldCitation(chargeSchedules?.lateFee?.graceDays) ? (
                <span className="citation">
                  Citation : {getFieldCitation(chargeSchedules?.lateFee?.graceDays)}
                </span>
              ) : null}
            </div>

            <div className="latefee-card">
              <label>Percent</label>
              <p>{getFieldValue(chargeSchedules?.lateFee?.percent) || "N/A"}</p>
              {getFieldCitation(chargeSchedules?.lateFee?.percent) ? (
                <span className="citation">
                  Citation : {getFieldCitation(chargeSchedules?.lateFee?.percent)}
                </span>
              ) : null}
            </div>

            <div className="latefee-card">
              <label>Second Fee Calculation Type</label>
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
            </div>

            <div className="latefee-card">
              <label>Second Fee Grace</label>
              <p>
                {getFieldValue(chargeSchedules?.lateFee?.secondFeeGrace) ||
                  "N/A"}
              </p>
              {getFieldCitation(chargeSchedules?.lateFee?.secondFeeGrace) ? (
                <span className="citation">
                  Citation : {getFieldCitation(chargeSchedules?.lateFee?.secondFeeGrace)}
                </span>
              ) : null}
            </div>

            <div className="latefee-card">
              <label>Second Fee Percent</label>
              <p>
                {getFieldValue(chargeSchedules?.lateFee?.secondFeePercent) ||
                  "N/A"}
              </p>
              {getFieldCitation(chargeSchedules?.lateFee?.secondFeePercent) ? (
                <span className="citation">
                  Citation : {getFieldCitation(chargeSchedules?.lateFee?.secondFeePercent)}
                </span>
              ) : null}
            </div>

            <div className="latefee-card">
              <label>Per Day Fee</label>
              <p>{getFieldValue(chargeSchedules?.lateFee?.perDayFee) || "N/A"}</p>
              {getFieldCitation(chargeSchedules?.lateFee?.perDayFee) ? (
                <span className="citation">
                  Citation : {getFieldCitation(chargeSchedules?.lateFee?.perDayFee)}
                </span>
              ) : null}
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

                return (
                  <tr key={index}>
                    <td>{renderField(item.period) || "-"}</td>
                    <td>{renderField(item.dateFrom) || "-"}</td>
                    <td>{renderField(item.dateTo) || "-"}</td>
                    <td>{renderField(item.monthlyAmount) || "-"}</td>
                    <td>{renderField(item.annualAmount) || "-"}</td>
                    <td>{renderField(item.areaRentable) || "-"}</td>
                    <td>{renderField(item.amountPerArea) || "-"}</td>
                  </tr>
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
