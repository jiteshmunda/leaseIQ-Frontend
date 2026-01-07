import { FiInfo } from "react-icons/fi";
import "../styles/fieldTooltip.css";

const FieldWithTooltip = ({ value, amendments = [], filename }) => {
  const hasAmendments = Array.isArray(amendments) && amendments.length > 0;
  const displayFilename =
    typeof filename === "string" && filename
      ? filename.replace(/\.[^.]+$/i, "")
      : filename != null
      ? String(filename)
      : "Amendments";

  return (
    <span className="field-wrapper">
      <span className="field-value">{value}</span>

      {hasAmendments && (
        <span className="tooltip-container">
          <FiInfo className="info-icon" />

          <div className="tooltip-box">
            <strong>{displayFilename}</strong>
            <ul>
              {amendments.map((a, i) => (
                <li key={i}>
                  {a.amendment_type && (
                    <div>
                      <b>Type:</b> {a.amendment_type}
                    </div>
                  )}
                  {a.previous_value && (
                    <div>
                      <b>Previous:</b> {a.previous_value}
                    </div>
                  )}
                  {a.new_value && (
                    <div>
                      <b>New:</b> {a.new_value}
                    </div>
                  )}
                  {a.amendment_citation && (
                    <div>
                      <b>Citation:</b> {a.amendment_citation}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </span>
      )}
    </span>
  );
};

export default FieldWithTooltip;
