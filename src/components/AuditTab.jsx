import { useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import "../styles/tab.css";

const AuditTab = ({ risks = [] }) => {
  const [expandedIndexes, setExpandedIndexes] = useState([]);

  const totalItems = Array.isArray(risks) ? risks.length : 0;

  const toggleIndex = (index) => {
    setExpandedIndexes((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="audit">
      <div className="audit-card">
        <h3 className="audit-title">
          {totalItems > 0
            ? `Found ${totalItems} potential issues requiring attention`
            : "No audit issues detected for this lease"}
        </h3>

        {totalItems === 0 ? (
          <div className="audit-empty">Audit analysis has not reported any risks.</div>
        ) : (
          <ul className="audit-list">
            {risks.map((risk, index) => {
              const isExpanded = expandedIndexes.includes(index);

              const pages = (() => {
                if (
                  Array.isArray(risk.page_reference) &&
                  risk.page_reference.length
                ) {
                  return risk.page_reference;
                }

                if (
                  Array.isArray(risk.page_references) &&
                  risk.page_references.length
                ) {
                  return risk.page_references;
                }

                if (risk.page_number != null) {
                  return [risk.page_number];
                }

                return null;
              })();

              return (
                <li
                  className={`audit-item ${isExpanded ? "expanded" : ""}`}
                  key={index}
                >
                  <button
                    type="button"
                    className="audit-header"
                    onClick={() => toggleIndex(index)}
                  >
                    <div className="audit-left">
                      <FiChevronRight
                        className={`audit-chevron ${
                          isExpanded ? "rotate" : ""
                        }`}
                      />
                      <span>{risk.category || "Uncategorized Risk"}</span>
                    </div>

                    <div className="audit-right">
                      {pages && pages.length > 0 && (
                        <span className="audit-pill audit-pill-page">
                          Page {pages.join(", ")}
                        </span>
                      )}

                      { (risk.certainty || risk.certainty_level) && (
                        <span
                          className={`audit-pill audit-pill-certainty ${String(
                            risk.certainty || risk.certainty_level
                          ).toLowerCase()}`}
                        >
                          {risk.certainty || risk.certainty_level}
                        </span>
                      )}

                      <span className="count">1 item</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="audit-details">
                      {risk.issue_description && (
                        <div className="audit-subsection">
                          <h4>Issue</h4>
                          <p>{risk.issue_description}</p>
                        </div>
                      )}

                      {risk.affected_clause && (
                        <div className="audit-subsection">
                          <h4>Affected Clause</h4>
                          <p>{risk.affected_clause}</p>
                        </div>
                      )}

                      {risk.recommended_action && (
                        <div className="audit-subsection">
                          <h4>Recommended Action</h4>
                          <p>{risk.recommended_action}</p>
                        </div>
                      )}

                      {risk.citation && (
                        <div className="audit-subsection">
                          <h4>Citation</h4>
                          <p>{risk.citation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AuditTab;
