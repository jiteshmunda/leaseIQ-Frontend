import { FiChevronDown } from "react-icons/fi";

const RentSchedulesTab = ({ chargeSchedules, getFieldValue }) => {
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
              <p>
                {getFieldValue(chargeSchedules?.lateFee?.calculationType) ||
                  "N/A"}
              </p>
              {chargeSchedules?.lateFee?.calculationType?.citation && (
                <span className="citation">
                  Citation: {chargeSchedules.lateFee.calculationType.citation}
                </span>
              )}
            </div>

            <div className="latefee-card">
              <label>Grace Days</label>
              <p>{getFieldValue(chargeSchedules?.lateFee?.graceDays) || "N/A"}</p>
            </div>

            <div className="latefee-card">
              <label>Percent</label>
              <p>{getFieldValue(chargeSchedules?.lateFee?.percent) || "N/A"}</p>
              {chargeSchedules?.lateFee?.percent?.citation && (
                <span className="citation">
                  Citation: {chargeSchedules.lateFee.percent.citation}
                </span>
              )}
            </div>

            <div className="latefee-card">
              <label>Second Fee Calculation Type</label>
              <p>
                {getFieldValue(
                  chargeSchedules?.lateFee?.secondFeeCalculationType
                ) || "N/A"}
              </p>
            </div>

            <div className="latefee-card">
              <label>Second Fee Grace</label>
              <p>
                {getFieldValue(chargeSchedules?.lateFee?.secondFeeGrace) ||
                  "N/A"}
              </p>
            </div>

            <div className="latefee-card">
              <label>Second Fee Percent</label>
              <p>
                {getFieldValue(chargeSchedules?.lateFee?.secondFeePercent) ||
                  "N/A"}
              </p>
            </div>

            <div className="latefee-card">
              <label>Per Day Fee</label>
              <p>{getFieldValue(chargeSchedules?.lateFee?.perDayFee) || "N/A"}</p>
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
                    <td>{getFieldValue(item.period) || "-"}</td>
                    <td>{getFieldValue(item.dateFrom) || "-"}</td>
                    <td>{getFieldValue(item.dateTo) || "-"}</td>
                    <td>{getFieldValue(item.monthlyAmount) || "-"}</td>
                    <td>{getFieldValue(item.annualAmount) || "-"}</td>
                    <td>{getFieldValue(item.areaRentable) || "-"}</td>
                    <td>{getFieldValue(item.amountPerArea) || "-"}</td>
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
