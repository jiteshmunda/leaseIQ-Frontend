import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { FiEdit, FiFileText, FiChevronRight, FiClock, FiArrowRight, FiX, FiCheck, FiExternalLink } from "react-icons/fi";
import { openPdfWithCitation, canNavigateToCitation, getCitationDisplayText } from "../service/citationUtils";
import { showError } from "../service/toast";

const getFieldCitation = (field) => {
  if (!field || typeof field !== "object") return "";
  if (typeof field.citation === "string") return field.citation;
  if (field.citation && typeof field.citation === "object") {
    if (typeof field.citation.value === "string") return field.citation.value;
  }
  return "";
};

const hasAmendments = (field) =>
  !!(
    field &&
    typeof field === "object" &&
    Array.isArray(field.amendments) &&
    field.amendments.length > 0
  );

const ProvisionsTab = ({
  miscProvisions,
  formatProvisionTitle,
  onEditCategory,
  leaseDetails,
  onUpdateLeaseDetails,
  filename, // eslint-disable-line no-unused-vars
  documentId,
}) => {
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [openAccordions, setOpenAccordions] = useState(new Set());
  const textareaRef = useRef(null);

  const provisionFields = useMemo(
    () =>
      [
        "synopsis",
        "keyParameters",
        "narrative",
        "definition",
        "billingTimeline",
        "formulas",
        "capitalRules",
      ],
    []
  );

  const cloneLeaseDetails = (details) => {
    if (!details) return {};
    try {
      return typeof structuredClone === "function"
        ? structuredClone(details)
        : JSON.parse(JSON.stringify(details));
    } catch {
      return JSON.parse(JSON.stringify(details));
    }
  };

  const safeJsonParse = (value, fallback) => {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    if (!trimmed || trimmed === "undefined" || trimmed === "null") return fallback;
    try {
      return JSON.parse(trimmed);
    } catch {
      return fallback;
    }
  };

  const normalizeMisc = (misc) => {
    if (!misc) return {};
    if (typeof misc === "string") return safeJsonParse(misc, {});
    if (typeof misc === "object") {
      if (typeof misc.content === "string") return safeJsonParse(misc.content, {});
      return misc;
    }
    return {};
  };

  const beginEdit = (categoryKey, fieldKey, currentValue, categoryTitle) => {
    setEditing({ categoryKey, fieldKey, segmentIndex: null, categoryTitle });
    setEditText(typeof currentValue === "string" ? currentValue : String(currentValue ?? ""));
  };

  const beginEditSegment = (categoryKey, fieldKey, segmentIndex, segmentValue, categoryTitle) => {
    setEditing({ categoryKey, fieldKey, segmentIndex, categoryTitle });
    setEditText(typeof segmentValue === "string" ? segmentValue : String(segmentValue ?? ""));
  };

  // Focus textarea when editing starts
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end of text
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  // Keyboard handler for edit mode
  const handleKeyDown = useCallback((e) => {
    if (!editing) return;
    
    // Escape to cancel
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
    
    // Ctrl/Cmd + Enter to save
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isSaving) {
        saveEdit();
      }
    }
  }, [editing, isSaving]);

  const cancelEdit = () => {
    setEditing(null);
    setEditText("");
    setIsSaving(false);
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (typeof onUpdateLeaseDetails !== "function") {
      cancelEdit();
      return;
    }

    setIsSaving(true);
    try {
      const updated = cloneLeaseDetails(leaseDetails);
      updated.misc = normalizeMisc(updated.misc);
      updated.misc.otherLeaseProvisions = updated.misc.otherLeaseProvisions ?? {};
      updated.misc.otherLeaseProvisions[editing.categoryKey] =
        updated.misc.otherLeaseProvisions[editing.categoryKey] ?? {};
      updated.misc.otherLeaseProvisions[editing.categoryKey][editing.fieldKey] =
        updated.misc.otherLeaseProvisions[editing.categoryKey][editing.fieldKey] ?? {};

      const existingValue = updated.misc.otherLeaseProvisions[editing.categoryKey][editing.fieldKey].value;

      if (typeof editing.segmentIndex === "number" && typeof existingValue === "string") {
        const segments = existingValue
          .split(/\n\s*\n+/)
          .map((s) => s.trim())
          .filter(Boolean);

        if (editing.segmentIndex >= 0 && editing.segmentIndex < segments.length) {
          segments[editing.segmentIndex] = editText.trim();
          updated.misc.otherLeaseProvisions[editing.categoryKey][editing.fieldKey].value =
            segments.filter(Boolean).join("\n\n");
        } else {
          updated.misc.otherLeaseProvisions[editing.categoryKey][editing.fieldKey].value = editText;
        }
      } else {
        updated.misc.otherLeaseProvisions[editing.categoryKey][editing.fieldKey].value = editText;
      }

      await onUpdateLeaseDetails(updated);
      cancelEdit();
    } finally {
      setIsSaving(false);
    }
  };

  const normalizeValue = (val) => {
    if (typeof val === "string") return val;

    if (typeof val === "object" && val !== null) {
      return (
        <ul className="nested-provision">
          {Object.entries(val).map(([k, v]) => (
            <li key={k}>
              <strong>{formatProvisionTitle(k)}:</strong>{" "}
              {String(v)}
            </li>
          ))}
        </ul>
      );
    }

    return String(val);
  };

  const splitProvisionText = (text) =>
    String(text ?? "")
      .split(/\n\s*\n+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const renderAmendmentValue = (val) => {
    if (val == null) return null;

    if (typeof val === "string") {
      const trimmed = val.trim();
      if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        try {
          const parsed = JSON.parse(trimmed);
          if (typeof parsed === "object" && parsed !== null) {
            return normalizeValue(parsed);
          }
        } catch {
          // fall through to plain text
        }
      }
      return trimmed;
    }

    if (typeof val === "object") {
      return normalizeValue(val);
    }

    return String(val);
  };

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isAccordionOpen = (key) => openAccordions.has(key);

  // Enhanced amendment rendering with timeline visualization
  const renderAmendmentsTimeline = (field) => {
    if (!hasAmendments(field)) return null;

    const amendments = field.amendments;

    return (
      <div className="provision-amendments">
        <details className="provision-amendments-details">
          <summary className="provision-amendments-summary">
            <FiClock className="provision-amendments-icon" />
            <span className="provision-amendments-text">Amendment History</span>
            <span className="provision-amendments-count">{amendments.length}</span>
          </summary>
          <div className="provision-amendments-timeline">
            {amendments.map((am, idx) => (
              <div key={idx} className="provision-amendment-card">
                <div className="provision-amendment-header">
                  {am?.amendment_type && (
                    <span className="provision-amendment-type">{am.amendment_type}</span>
                  )}
                  {am?.effective_date && (
                    <span className="provision-amendment-date">
                      <FiClock size={12} />
                      {am.effective_date}
                    </span>
                  )}
                </div>
                
                {(am?.previous_value || am?.new_value) && (
                  <div className="provision-amendment-comparison">
                    {am?.previous_value && (
                      <div className="provision-amendment-value provision-amendment-previous">
                        <span className="provision-amendment-label">Previous</span>
                        <div className="provision-amendment-content">
                          {renderAmendmentValue(am.previous_value)}
                        </div>
                      </div>
                    )}
                    {am?.previous_value && am?.new_value && (
                      <div className="provision-amendment-arrow">
                        <FiArrowRight />
                      </div>
                    )}
                    {am?.new_value && (
                      <div className="provision-amendment-value provision-amendment-new">
                        <span className="provision-amendment-label">New</span>
                        <div className="provision-amendment-content">
                          {renderAmendmentValue(am.new_value)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {am?.description && (
                  <p className="provision-amendment-description">{am.description}</p>
                )}

                {am?.amendment_citation && (
                  <div className="provision-citation-tag small">
                    <FiFileText className="provision-citation-icon" />
                    <span className="provision-citation-text">{am.amendment_citation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      </div>
    );
  };

  // Handle citation click to open PDF viewer
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

  // Enhanced citation tag component - now clickable
  const renderCitationTag = (citation, field) => {
    if (!citation) return null;
    
    // Get the full citation object if available (for structured citations)
    const citationObj = field?.citation || citation;
    const displayText = getCitationDisplayText(citationObj) || citation;
    const isNavigable = documentId && canNavigateToCitation(citationObj);
    
    if (isNavigable) {
      return (
        <button
          type="button"
          className="provision-citation-tag provision-citation-clickable"
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
      <div className="provision-citation-tag">
        <FiFileText className="provision-citation-icon" />
        <span className="provision-citation-text">{displayText}</span>
      </div>
    );
  };

  return (
    <div className="provisions">
      <div className="provisions-card">
        <h3 className="provisions-title">Key Lease Provisions</h3>

        {miscProvisions &&
          Object.entries(miscProvisions).map(([key, value]) => {
          const items = provisionFields
            .map((fieldKey) => {
              const field = value?.[fieldKey];
              const raw = field?.value;
              if (raw === undefined || raw === null || raw === "") return null;

              const citation = getFieldCitation(field);

              if (typeof raw === "string") {
                const segments = splitProvisionText(raw);
                if (segments.length <= 1) {
                  return {
                    id: `${key}:${fieldKey}`,
                    categoryKey: key,
                    fieldKey,
                    raw,
                    display: normalizeValue(raw),
                    citation,
                    canEdit: true,
                    segmentIndex: null,
                    field,
                  };
                }

                return segments.map((segment, idx) => ({
                  id: `${key}:${fieldKey}:${idx}`,
                  categoryKey: key,
                  fieldKey,
                  raw: segment,
                  display: segment,
                  citation,
                  canEdit: true,
                  segmentIndex: idx,
                  field,
                }));
              }

              return {
                id: `${key}:${fieldKey}`,
                categoryKey: key,
                fieldKey,
                raw,
                display: normalizeValue(raw),
                citation,
                canEdit: false,
                segmentIndex: null,
                field,
              };
            })
            .flat()
            .filter(Boolean);

          const title = formatProvisionTitle(key);
          const isOpen = isAccordionOpen(key);

          return (
            <section className={`card provision-card provision-accordion ${isOpen ? 'open' : ''}`} key={key}>
              <div 
                className="provision-header provision-accordion-header"
                onClick={() => toggleAccordion(key)}
              >
                <div className="provision-accordion-title">
                  <FiChevronRight className="accordion-icon" />
                  <h4>{title}</h4>
                </div>

                <div className="provision-actions" onClick={(e) => e.stopPropagation()}>
                  <FiEdit
                    className="icon edit"
                    onClick={() => onEditCategory(key)}
                  />
                </div>
              </div>

              <div 
                className={`provision-accordion-content ${isOpen ? 'open' : ''}`}
              >
                <div className="provision-items-container">
                  {items.length ? (
                    items.map((item) => {
                      const isEditingThis =
                        editing?.categoryKey === item.categoryKey &&
                        editing?.fieldKey === item.fieldKey &&
                        (editing?.segmentIndex ?? null) === (item.segmentIndex ?? null);

                      return (
                        <div className="provision-content-block" key={item.id}>
                          {isEditingThis ? (
                            <div className="provision-edit-container">
                              <div className="provision-edit-header">
                                <div className="provision-edit-header-left">
                                  <FiEdit className="provision-edit-header-icon" />
                                  <span className="provision-edit-header-title">
                                    Editing: {editing?.categoryTitle || title}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="provision-edit-close"
                                  onClick={cancelEdit}
                                  disabled={isSaving}
                                  title="Cancel (Esc)"
                                >
                                  <FiX size={16} />
                                </button>
                              </div>
                              <textarea
                                ref={textareaRef}
                                id="provision-edit-field"
                                name="provision-edit-field"
                                className="provision-edit-textarea"
                                rows={8}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isSaving}
                                placeholder="Enter provision details..."
                              />
                              <div className="provision-edit-footer">
                                <div className="provision-edit-hints">
                                  <span className="provision-edit-hint">
                                    <kbd>Esc</kbd> to cancel
                                  </span>
                                  <span className="provision-edit-hint">
                                    <kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</kbd>+<kbd>Enter</kbd> to save
                                  </span>
                                </div>
                                <div className="provision-edit-meta">
                                  <span className="provision-edit-char-count">
                                    {editText.length} characters
                                  </span>
                                </div>
                              </div>
                              <div className="provision-edit-actions">
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={cancelEdit}
                                  disabled={isSaving}
                                >
                                  <FiX size={14} />
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={saveEdit}
                                  disabled={isSaving}
                                >
                                  <FiCheck size={14} />
                                  {isSaving ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="provision-text-content">
                                <div className="provision-description">{item.display}</div>
                                {item.canEdit && (
                                  <button
                                    type="button"
                                    className="provision-edit-btn"
                                    onClick={() => {
                                      if (typeof item.segmentIndex === "number") {
                                        beginEditSegment(
                                          item.categoryKey,
                                          item.fieldKey,
                                          item.segmentIndex,
                                          item.raw,
                                          title
                                        );
                                      } else {
                                        beginEdit(item.categoryKey, item.fieldKey, item.raw, title);
                                      }
                                    }}
                                  >
                                    <FiEdit size={14} />
                                  </button>
                                )}
                              </div>
                              {item.citation && renderCitationTag(item.citation, item.field)}
                              {renderAmendmentsTimeline(item.field)}
                            </>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="provision-empty-state">
                      <p>No provisions documented for this category.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default ProvisionsTab;
