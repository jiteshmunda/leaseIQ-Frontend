import { useState } from "react";
import {
  FiChevronRight,
  FiFileText,
  FiAlertTriangle,
  FiCheckCircle,
  FiAlertCircle,
  FiExternalLink,
  FiSquare,
  FiCheckSquare,
  FiEdit2,
  FiMessageSquare,
} from "react-icons/fi";
import {
  openPdfWithCitation,
  canNavigateToCitation,
  getCitationDisplayText,
} from "../service/citationUtils";
import { showError } from "../service/toast";

const AuditTab = ({ audit, risks = [], auditSourceKey, documentId, onUpdateLeaseDetails, leaseDetails }) => {
  const [expandedIds, setExpandedIds] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [comments, setComments] = useState({});
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [activeCommentItem, setActiveCommentItem] = useState(null);
  const [commentText, setCommentText] = useState("");

  const isPlainObject = (value) =>
    value != null &&
    typeof value === "object" &&
    !Array.isArray(value);

  const resolveAuditObject = (value) => {
    if (Array.isArray(value)) return { audit_checklist: value };
    if (!isPlainObject(value)) return null;
    if (isPlainObject(value.audit)) return value.audit;
    return value;
  };

  const auditObject = resolveAuditObject(audit);

  const detectArraysWithKeys = (obj) => {
    if (!isPlainObject(obj)) return [];
    return Object.entries(obj)
      .filter(([, value]) =>
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((item) => isPlainObject(item))
      )
      .map(([key, value]) => ({ key, items: value }));
  };

  const getDisplayItems = () => {
    if (Array.isArray(risks) && risks.length) {
      const sourceKey = auditSourceKey || "risks";

      return risks.map((risk, idx) => {
        // risk_register_sections is flattened in LeaseMainContent; preserve nested coordinates.
        const sourceMeta =
          sourceKey === "risk_register_sections" &&
          risk &&
          risk._audit_section_index != null &&
          risk._audit_issue_index != null
            ? {
              sectionIndex: risk._audit_section_index,
              issueIndex: risk._audit_issue_index,
            }
            : null;

        return {
          id: `${sourceKey}:${idx}`,
          sourceKey,
          sourceIndex: idx,
          sourceMeta,
          risk,
        };
      });
    }

    if (!auditObject) return [];

    // Prefer audit_checklist if present, otherwise fall back to any array-of-objects.
    if (Array.isArray(auditObject.audit_checklist) && auditObject.audit_checklist.length) {
      return auditObject.audit_checklist.map((risk, idx) => ({
        id: `audit_checklist:${idx}`,
        sourceKey: "audit_checklist",
        sourceIndex: idx,
        risk,
      }));
    }

    const arrays = detectArraysWithKeys(auditObject);
    return arrays.flatMap(({ key, items }) =>
      items.map((risk, idx) => ({
        id: `${key}:${idx}`,
        sourceKey: key,
        sourceIndex: idx,
        risk,
      }))
    );
  };

  const displayItems = getDisplayItems();
  const totalItems = displayItems.length;

  const getItemChecked = (item) => {
    const local = checkedItems[item.id];
    if (typeof local === "boolean") return local;
    return Boolean(item?.risk?.checked);
  };

  const getItemComment = (item) => {
    const local = comments[item.id];
    if (typeof local === "string") return local;
    return item?.risk?.user_comment ?? "";
  };

  const toggleId = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const toggleCheckbox = (item, e) => {
    e.stopPropagation();

    const isChecked = !getItemChecked(item);

    // Optimistic update
    setCheckedItems(prev => ({
      ...prev,
      [item.id]: isChecked
    }));

    // Update backend
    updateAuditItem(
      item.sourceKey,
      item.sourceIndex,
      item.sourceMeta,
      isChecked,
      getItemComment(item)
    );
  };

  const completedCount = displayItems.filter((item) => getItemChecked(item)).length;
  const completionPercentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const filteredRisks = showCompletedOnly
    ? displayItems.filter((item) => getItemChecked(item))
    : displayItems;

  const handleAddComment = (item) => {
    setActiveCommentItem(item);
    setCommentText(getItemComment(item));
    setShowCommentModal(true);
  };

  const handleSaveComment = () => {
    if (activeCommentItem) {
      const newComment = commentText.trim();

      setComments(prev => ({
        ...prev,
        [activeCommentItem.id]: newComment
      }));

      // Update backend
      updateAuditItem(
        activeCommentItem.sourceKey,
        activeCommentItem.sourceIndex,
        activeCommentItem.sourceMeta,
        getItemChecked(activeCommentItem),
        newComment
      );
    }
    setShowCommentModal(false);
    setCommentText("");
    setActiveCommentItem(null);
  };

  // API call to update audit item
  const resolveAuditRootFromLeaseDetails = (details) => {
    if (!details) return null;
    const maybeAudit = details.audit;
    if (Array.isArray(maybeAudit)) return { audit_checklist: maybeAudit };
    if (!isPlainObject(maybeAudit)) return null;
    if (isPlainObject(maybeAudit.audit)) return maybeAudit.audit;
    return maybeAudit;
  };

  const updateAuditItem = async (sourceKey, sourceIndex, sourceMeta, checked, comment) => {

    if (!onUpdateLeaseDetails || !leaseDetails) {
      console.warn('Missing onUpdateLeaseDetails or leaseDetails');
      return;
    }

    try {
      // Clone the entire leaseDetails structure
      const updatedDetails = JSON.parse(JSON.stringify(leaseDetails));

      const auditRoot = resolveAuditRootFromLeaseDetails(updatedDetails);

      // Nested source: risk_register_sections[sectionIndex].issues[issueIndex]
      if (
        sourceKey === "risk_register_sections" &&
        sourceMeta &&
        auditRoot &&
        Array.isArray(auditRoot.risk_register_sections)
      ) {
        const { sectionIndex, issueIndex } = sourceMeta;
        const section = auditRoot.risk_register_sections?.[sectionIndex];
        const issue = section?.issues?.[issueIndex];

        if (section && Array.isArray(section.issues) && issue) {
          section.issues[issueIndex] = {
            ...issue,
            checked,
            user_comment: comment,
          };
          await onUpdateLeaseDetails(updatedDetails);
          return;
        }
      }

      const hasSourceArray =
        auditRoot &&
        Array.isArray(auditRoot[sourceKey]) &&
        auditRoot[sourceKey]?.[sourceIndex] != null;

      const hasChecklistArray =
        auditRoot &&
        Array.isArray(auditRoot.audit_checklist) &&
        auditRoot.audit_checklist?.[sourceIndex] != null;

      if (hasSourceArray) {
        auditRoot[sourceKey][sourceIndex] = {
          ...auditRoot[sourceKey][sourceIndex],
          checked,
          user_comment: comment,
        };
        await onUpdateLeaseDetails(updatedDetails);
        return;
      }

      // Backward compatible fallback
      if (hasChecklistArray) {
        auditRoot.audit_checklist[sourceIndex] = {
          ...auditRoot.audit_checklist[sourceIndex],
          checked,
          user_comment: comment,
        };
        await onUpdateLeaseDetails(updatedDetails);
        return;
      }

      console.error('Audit item not found for update:', { sourceKey, sourceIndex });
      console.error('auditRoot keys:', auditRoot ? Object.keys(auditRoot) : null);
    } catch (error) {
      console.error("Failed to update audit item:", error);
      // Optionally show error to user
    }
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

  const handleCitationClick = async (citationObj) => {
    if (!documentId) {
      showError("Document not available for citation navigation");
      return;
    }

    try {
      await openPdfWithCitation(documentId, citationObj);
    } catch (err) {
      console.error("Failed to open citation:", err);
      showError("Failed to open PDF. Please try again.");
    }
  };

  // Render citation tag (same UI/behavior as other tabs)
  const renderCitationTag = (pages, citation) => {
    if (!pages && !citation) return null;

    const parts = [];
    if (citation) parts.push(citation);
    if (pages) parts.push(`Page ${pages.join(", ")}`);

    // Use a single citation payload so citationUtils can parse it.
    // If it contains "Page X", citationUtils can navigate.
    const citationPayload = parts.join(" • ");
    const displayText = getCitationDisplayText(citationPayload) || citationPayload;
    const isNavigable = documentId && canNavigateToCitation(citationPayload);

    if (isNavigable) {
      return (
        <button
          type="button"
          className="provision-citation-tag provision-citation-clickable"
          onClick={() => handleCitationClick(citationPayload)}
          title="Click to view in PDF"
        >
          <FiFileText className="provision-citation-icon" />
          <span className="provision-citation-text">{displayText}</span>
          <FiExternalLink className="provision-citation-link-icon" size={12} />
        </button>
      );
    }

    return (
      <div className="provision-citation-tag">
        <FiFileText className="provision-citation-icon" />
        <span className="provision-citation-text">{displayText}</span>
      </div>
    );
  };

  // Get severity stats for summary
  const getSeverityStats = () => {
    const stats = { high: 0, medium: 0, low: 0 };
    displayItems.forEach(({ risk }) => {
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
          <div className="audit-header-top">
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

          {totalItems > 0 && (
            <div className="audit-progress-section">
              <div className="audit-progress-info">
                <span className="audit-progress-text">
                  {completedCount} of {totalItems} completed
                </span>
                <span className="audit-progress-percentage">
                  {completionPercentage}%
                </span>
              </div>
              <div className="audit-progress-bar">
                <div
                  className="audit-progress-fill"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <button
                type="button"
                className={`audit-filter-toggle ${showCompletedOnly ? 'active' : ''}`}
                onClick={() => setShowCompletedOnly(!showCompletedOnly)}
              >
                <FiCheckSquare size={14} />
                {showCompletedOnly ? 'Show All' : 'Show Completed Only'}
              </button>
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
            {filteredRisks.map((item) => {
              const { risk } = item;
              const isExpanded = expandedIds.includes(item.id);
              const isChecked = getItemChecked(item);
              const commentValue = getItemComment(item);
              const hasComment = Boolean(commentValue);
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
                  key={item.id}
                  className={`audit-item ${isExpanded ? "expanded" : ""} ${isChecked ? "checked" : ""}`}
                >
                  <div
                    className="audit-header"
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleId(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleId(item.id);
                      }
                    }}
                  >
                    <div className="audit-left">
                      {/* Checkbox */}
                      <div
                        className="audit-checkbox-wrapper"
                        onClick={(e) => toggleCheckbox(item, e)}
                      >
                        {isChecked ? (
                          <FiCheckSquare className="audit-checkbox checked" />
                        ) : (
                          <FiSquare className="audit-checkbox" />
                        )}
                      </div>

                      <FiChevronRight
                        className={`audit-chevron ${isExpanded ? "rotate" : ""
                          }`}
                      />
                      <span className="audit-item-title">{getRiskTitle(risk)}</span>

                      {/* Comment badge */}
                      {hasComment && (
                        <span
                          className="audit-comment-badge"
                          title={commentValue}
                          role="img"
                          aria-label="Has comment"
                          tabIndex={0}
                        >
                          <FiMessageSquare size={12} fill="currentColor" aria-hidden="true" />
                        </span>
                      )}
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

                      {/* Comment button */}
                      {isChecked && (
                        <button
                          type="button"
                          className="audit-comment-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddComment(item);
                          }}
                          title={hasComment ? "Edit comment" : "Add comment"}
                        >
                          {hasComment ? <FiEdit2 size={14} /> : <FiMessageSquare size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

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

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="comment-modal-overlay" onClick={() => setShowCommentModal(false)}>
          <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="comment-modal-header">
              <h4>Add Comment</h4>
              <button
                type="button"
                className="comment-modal-close"
                onClick={() => setShowCommentModal(false)}
              >
                ×
              </button>
            </div>
            <div className="comment-modal-body">
              <textarea
                className="comment-modal-textarea"
                placeholder="Add your notes or comments here..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                autoFocus
                rows={5}
              />
            </div>
            <div className="comment-modal-footer">
              <button
                type="button"
                className="comment-modal-btn comment-modal-btn-cancel"
                onClick={() => setShowCommentModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="comment-modal-btn comment-modal-btn-save"
                onClick={handleSaveComment}
              >
                Save Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default AuditTab;
