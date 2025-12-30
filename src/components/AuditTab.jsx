import { useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import "../styles/tab.css";

const AuditTab = ({ audit, risks = [] }) => {
  const [expandedIndexes, setExpandedIndexes] = useState([]);

  const isPlainObject = (value) => {
    if (value == null) return false;
    if (typeof value !== "object") return false;
    if (Array.isArray(value)) return false;
    return true;
  };

  const isPrimitive = (value) => {
    const t = typeof value;
    return value == null || t === "string" || t === "number" || t === "boolean";
  };

  const labelizeKey = (key) =>
    String(key ?? "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const resolveAuditObject = (value) => {
    if (Array.isArray(value)) return { risk_register: value };
    if (!isPlainObject(value)) return null;

    // Some backends nest under "audit".
    if (isPlainObject(value.audit)) return value.audit;
    return value;
  };

  const auditObject = resolveAuditObject(audit);

  const resolveRisks = () => {
    if (Array.isArray(risks) && risks.length) return risks;
    if (!auditObject) return [];

    const candidates = [
      auditObject.risk_register,
      auditObject.risks,
      auditObject.identified_risks,
      auditObject.audit_checklist,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate;
    }

    return [];
  };

  const resolvedRisks = resolveRisks();

  const totalItems = Array.isArray(resolvedRisks) ? resolvedRisks.length : 0;

  const toggleIndex = (index) => {
    setExpandedIndexes((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const renderValue = (value, depth = 0) => {
    if (value == null) return <span>-</span>;

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return <span>{String(value)}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return <span>-</span>;

      const allPrimitives = value.every((v) => isPrimitive(v));
      if (allPrimitives) {
        return (
          <ul className="audit-sublist">
            {value.map((v, idx) => (
              <li key={idx}>{String(v)}</li>
            ))}
          </ul>
        );
      }

      return (
        <ul className="audit-sublist">
          {value.map((v, idx) => (
            <li key={idx}>{renderValue(v, depth + 1)}</li>
          ))}
        </ul>
      );
    }

    if (isPlainObject(value)) {
      const entries = Object.entries(value).filter(([, v]) => v != null && v !== "");
      if (entries.length === 0) return <span>-</span>;
      if (depth >= 2) return <span>{JSON.stringify(value)}</span>;

      return (
        <ul className="audit-sublist">
          {entries.map(([k, v]) => (
            <li key={k}>
              <strong>{labelizeKey(k)}:</strong> {renderValue(v, depth + 1)}
            </li>
          ))}
        </ul>
      );
    }

    return <span>{String(value)}</span>;
  };

  const resolvePages = (risk) => {
    if (!risk) return null;

    const candidates = [
      risk.page_numbers,
      risk.page_reference,
      risk.page_references,
      risk.pages,
      risk.pageNumbers,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate) && candidate.length) return candidate;
    }

    if (risk.page_number != null) return [risk.page_number];
    if (risk.pageNumber != null) return [risk.pageNumber];

    return null;
  };

  const resolveCertainty = (risk) =>
    risk?.certainty ?? risk?.certainty_level ?? risk?.certaintyLevel ?? null;

  const getRiskTitle = (risk) =>
    risk?.category || risk?.title || risk?.type || "Uncategorized Risk";

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
            {resolvedRisks.map((risk, index) => {
              const isExpanded = expandedIndexes.includes(index);

              const pages = resolvePages(risk);
              const certainty = resolveCertainty(risk);
              const certaintyClass = certainty ? String(certainty).toLowerCase() : "";

              const excludedDetailKeys = new Set([
                "category",
                "title",
                "type",
                "issue_description",
                "affected_clause",
                "recommended_action",
                "citation",
                "page_numbers",
                "page_reference",
                "page_references",
                "page_number",
                "pages",
                "pageNumbers",
                "pageNumber",
                "certainty",
                "certainty_level",
                "certaintyLevel",
              ]);

              const extraDetails = isPlainObject(risk)
                ? Object.fromEntries(
                    Object.entries(risk).filter(
                      ([k, v]) => !excludedDetailKeys.has(k) && v != null && v !== ""
                    )
                  )
                : null;

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
                      <span>{getRiskTitle(risk)}</span>
                    </div>

                    <div className="audit-right">
                      {pages && pages.length > 0 && (
                        <span className="audit-pill audit-pill-page">
                          Page {pages.join(", ")}
                        </span>
                      )}

                      {certainty && (
                        <span
                          className={`audit-pill audit-pill-certainty ${certaintyClass}`}
                        >
                          {String(certainty)}
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

                      {extraDetails && Object.keys(extraDetails).length > 0 && (
                        <div className="audit-subsection">
                          <h4>Other Details</h4>
                          {renderValue(extraDetails)}
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
