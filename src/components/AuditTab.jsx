import { useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import "../styles/tab.css";

const AuditTab = ({ audit, risks = [] }) => {
  const [expandedIndexes, setExpandedIndexes] = useState([]);

  /* ─────────────────────────
     BASIC TYPE HELPERS
  ───────────────────────── */
  const isPlainObject = (value) =>
    value != null &&
    typeof value === "object" &&
    !Array.isArray(value);

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

  /* ─────────────────────────
     RESOLVE AUDIT ROOT
     (supports nested audit.audit)
  ───────────────────────── */
  const resolveAuditObject = (value) => {
    if (Array.isArray(value)) return { audit_items: value };
    if (!isPlainObject(value)) return null;
    if (isPlainObject(value.audit)) return value.audit;
    return value;
  };

  const auditObject = resolveAuditObject(audit);

  const detectArrayOfObjects = (obj) => {
    if (!isPlainObject(obj)) return [];
    return Object.values(obj).filter(
      (value) =>
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((item) => isPlainObject(item))
    );
  };

 
  const resolvedRisks = (() => {
    if (Array.isArray(risks) && risks.length) return risks;
    if (!auditObject) return [];
    return detectArrayOfObjects(auditObject).flat();
  })();

  const totalItems = resolvedRisks.length;

  const toggleIndex = (index) => {
    setExpandedIndexes((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const renderValue = (value, depth = 0) => {
    if (value == null) return <span>-</span>;

    if (isPrimitive(value)) {
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
      const entries = Object.entries(value).filter(
        ([, v]) => v != null && v !== ""
      );
      if (entries.length === 0) return <span>-</span>;
      if (depth >= 2) return <span>{JSON.stringify(value)}</span>;

      return (
        <ul className="audit-sublist">
          {entries.map(([k, v]) => (
            <li key={k}>
              <strong>{labelizeKey(k)}:</strong>{" "}
              {renderValue(v, depth + 1)}
            </li>
          ))}
        </ul>
      );
    }

    return <span>{String(value)}</span>;
  };

  const resolvePages = (risk) => {
    const candidates = [
      risk.page_numbers,
      risk.page_reference,
      risk.page_references,
      risk.pages,
      risk.pageNumbers,
    ];

    for (const c of candidates) {
      if (Array.isArray(c) && c.length) return c;
    }

    if (risk.page_number != null) return [risk.page_number];
    if (risk.pageNumber != null) return [risk.pageNumber];
    return null;
  };

  const resolveCertainty = (risk) =>
    risk?.certainty ??
    risk?.certainty_level ??
    risk?.certaintyLevel ??
    risk?.severity ??
    null;

  const getRiskTitle = (risk) =>
    risk?.category ||
    risk?.title ||
    risk?.type ||
    "Uncategorized Risk";
const EXCLUDED_EXPANDED_KEYS = new Set([
  "category",
  "title",
  "type",

  "page_number",
  "page_numbers",
  "page_reference",
  "page_references",
  "pages",
  "pageNumber",
  "pageNumbers",

  "certainty",
  "certainty_level",
  "certaintyLevel",
  "severity",
]);

  return (
    <div className="audit">
      <div className="audit-card">
        <h3 className="audit-title">
          {totalItems > 0
            ? `Found ${totalItems} potential issues requiring attention`
            : "No audit issues detected for this lease"}
        </h3>

        {totalItems === 0 ? (
          <div className="audit-empty">
            Audit analysis has not reported any risks.
          </div>
        ) : (
          <ul className="audit-list">
            {resolvedRisks.map((risk, index) => {
              const isExpanded = expandedIndexes.includes(index);
              const pages = resolvePages(risk);
              const certainty = resolveCertainty(risk);
              const certaintyClass = certainty
                ? String(certainty).toLowerCase()
                : "";

              return (
                <li
                  key={index}
                  className={`audit-item ${isExpanded ? "expanded" : ""}`}
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
                      {pages && (
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
    {renderValue(
      Object.fromEntries(
        Object.entries(risk || {}).filter(
          ([key, value]) =>
            !EXCLUDED_EXPANDED_KEYS.has(key) &&
            value != null &&
            value !== ""
        )
      )
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
