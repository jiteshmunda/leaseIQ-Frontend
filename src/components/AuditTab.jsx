import { useState } from "react";
import { FiChevronRight, FiFileText, FiAlertTriangle, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

const AuditTab = ({ audit, risks = [] }) => {
  const [expandedIndexes, setExpandedIndexes] = useState([]);

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

  // Resolve page citations from various possible keys
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
      // Handle string page references (e.g., "2-3")
      if (typeof c === "string" && c.trim()) return [c];
    }

    if (risk.page_number != null) return [risk.page_number];
    if (risk.pageNumber != null) return [risk.pageNumber];
    return null;
  };

  // Resolve citation text (section, clause, etc.)
  const resolveCitation = (risk) => {
    const citationKeys = ["citation", "clause", "affected_clause", "section", "reference", "lease_section", "article"];
    for (const key of citationKeys) {
      if (risk[key] && typeof risk[key] === "string") {
        return risk[key];
      }
    }
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
    risk?._section_name ||
    "Uncategorized Risk";

  // Get description from various possible keys
  const getDescription = (risk) => {
    const descKeys = ["description", "issue_description", "details", "summary", "overview", "explanation", "risk_description", "finding", "issue"];
    for (const key of descKeys) {
      if (risk[key] && typeof risk[key] === "string") {
        return risk[key];
      }
    }
    return null;
  };

  // Get recommendation
  const getRecommendation = (risk) => {
    const recKeys = ["recommendation", "recommendations", "recommended_action", "suggested_action", "action", "mitigation", "remediation"];
    for (const key of recKeys) {
      const val = risk[key];
      if (val && typeof val === "string") {
        return val;
      }
      if (Array.isArray(val) && val.length > 0) {
        return val;
      }
    }
    return null;
  };

  // Get impact
  const getImpact = (risk) => {
    const impactKeys = ["impact", "consequence", "financial_impact", "effect"];
    for (const key of impactKeys) {
      if (risk[key] && typeof risk[key] === "string") {
        return risk[key];
      }
    }
    return null;
  };

  // Render citation tag (similar to provisions)
  const renderCitationTag = (pages, citation) => {
    if (!pages && !citation) return null;

    const parts = [];
    if (citation) parts.push(citation);
    if (pages) parts.push(`Page ${pages.join(", ")}`);

    return (
      <div className="audit-citation-tag">
        <FiFileText className="audit-citation-icon" />
        <span className="audit-citation-text">{parts.join(" • ")}</span>
      </div>
    );
  };

  // Get severity stats for summary
  const getSeverityStats = () => {
    const stats = { high: 0, medium: 0, low: 0 };
    resolvedRisks.forEach(risk => {
      const certainty = String(resolveCertainty(risk) || "").toLowerCase();
      if (certainty === "high") stats.high++;
      else if (certainty === "medium") stats.medium++;
      else if (certainty === "low") stats.low++;
    });
    return stats;
  };

  const severityStats = getSeverityStats();

  // Tooltip descriptions for severity levels
  const severityTooltips = {
    high: "Critical issues requiring immediate attention. These may have significant financial or legal implications and should be addressed before signing.",
    medium: "Important concerns that should be reviewed. While not immediately critical, these issues could lead to complications if left unaddressed.",
    low: "Minor observations worth noting. These are unlikely to cause significant problems but may be useful for negotiation or future reference.",
  };

  return (
    <div className="audit">
      <div className="audit-card">
        <div className="audit-card-header">
          <h3 className="audit-title">
            {totalItems > 0
              ? `Found ${totalItems} potential issues requiring attention`
              : "No audit issues detected"}
          </h3>
          {totalItems > 0 && (
            <div className="audit-summary-stats">
              {severityStats.high > 0 && (
                <span 
                  className="audit-stat audit-stat-high" 
                  title={severityTooltips.high}
                >
                  <FiAlertCircle size={14} />
                  {severityStats.high} High
                </span>
              )}
              {severityStats.medium > 0 && (
                <span 
                  className="audit-stat audit-stat-medium" 
                  title={severityTooltips.medium}
                >
                  <FiAlertTriangle size={14} />
                  {severityStats.medium} Medium
                </span>
              )}
              {severityStats.low > 0 && (
                <span 
                  className="audit-stat audit-stat-low" 
                  title={severityTooltips.low}
                >
                  <FiCheckCircle size={14} />
                  {severityStats.low} Low
                </span>
              )}
            </div>
          )}
        </div>

        {totalItems === 0 ? (
          <div className="audit-empty">
            <FiCheckCircle className="audit-empty-icon" />
            <p>Audit analysis has not reported any risks.</p>
            <span className="audit-empty-hint">This lease appears to be in good standing.</span>
          </div>
        ) : (
          <ul className="audit-list">
            {resolvedRisks.map((risk, index) => {
              const isExpanded = expandedIndexes.includes(index);
              const pages = resolvePages(risk);
              const citation = resolveCitation(risk);
              const certainty = resolveCertainty(risk);
              const certaintyClass = certainty
                ? String(certainty).toLowerCase()
                : "";
              const description = getDescription(risk);
              const recommendation = getRecommendation(risk);
              const impact = getImpact(risk);

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
                      <span className="audit-item-title">{getRiskTitle(risk)}</span>
                    </div>

                    <div className="audit-right">
                      {certainty && (
                        <span
                          className={`audit-pill audit-pill-certainty ${certaintyClass}`}
                          title={severityTooltips[certaintyClass] || ""}
                        >
                          {String(certainty)}
                        </span>
                      )}
                    </div>
                  </button>

                  <div className={`audit-details ${isExpanded ? 'open' : ''}`}>
                    <div className="audit-content-blocks">
                      {/* Description Block */}
                      {description && (
                        <div className="audit-content-block">
                          <p className="audit-block-description">{description}</p>
                          {renderCitationTag(pages, citation)}
                        </div>
                      )}

                      {/* If no description but we have other content */}
                      {!description && (pages || citation) && (
                        <div className="audit-content-block audit-content-block-minimal">
                          {renderCitationTag(pages, citation)}
                        </div>
                      )}

                      {/* Recommendation Block */}
                      {recommendation && (
                        <div className="audit-content-block audit-content-block-recommendation">
                          <span className="audit-block-label">Recommendation</span>
                          {Array.isArray(recommendation) ? (
                            <ul className="audit-block-list">
                              {recommendation.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="audit-block-text">{recommendation}</p>
                          )}
                        </div>
                      )}

                      {/* Impact Block */}
                      {impact && (
                        <div className="audit-content-block audit-content-block-impact">
                          <span className="audit-block-label">Impact</span>
                          <p className="audit-block-text">{impact}</p>
                        </div>
                      )}

                      {/* Empty state */}
                      {!description && !recommendation && !impact && !pages && !citation && (
                        <div className="audit-empty-details">
                          <p>No additional details available.</p>
                        </div>
                      )}
                    </div>
                  </div>
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
