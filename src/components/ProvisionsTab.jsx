import { useMemo, useState } from "react";
import { FiEdit, FiTrash2, FiChevronRight } from "react-icons/fi";

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
  filename,
}) => {
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [openAccordions, setOpenAccordions] = useState(new Set());

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
      // Some payloads wrap misc as { content: "{...}" }
      if (typeof misc.content === "string") return safeJsonParse(misc.content, {});
      return misc;
    }
    return {};
  };

  const beginEdit = (categoryKey, fieldKey, currentValue) => {
    setEditing({ categoryKey, fieldKey, segmentIndex: null });
    setEditText(typeof currentValue === "string" ? currentValue : String(currentValue ?? ""));
  };

  const beginEditSegment = (categoryKey, fieldKey, segmentIndex, segmentValue) => {
    setEditing({ categoryKey, fieldKey, segmentIndex });
    setEditText(typeof segmentValue === "string" ? segmentValue : String(segmentValue ?? ""));
  };

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
          // Fallback: overwrite whole field
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

  const formatAmendmentsLabel = (name) => {
    if (typeof name !== "string") return "";
    return name.replace(/\.[^.]+$/i, "").trim();
  };

  const renderAmendmentsAccordion = (field) => {
    if (!hasAmendments(field)) return null;

    const label = formatAmendmentsLabel(filename) || "Amendments";

    return (
      <div className="amendments-block">
        <details className="amendments-details">
          <summary className="amendments-summary">
            <span className="amendments-label">{label}</span>
          </summary>
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
                    {renderAmendmentValue(am.previous_value)}
                  </div>
                )}
                {am?.new_value && (
                  <div>
                    <strong>New: </strong>
                    {renderAmendmentValue(am.new_value)}
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
        </details>
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
                  <p>{title}</p>
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
                <ul className="provision-list">
                {items.length ? (
                  items.map((item) => {
                  const isEditingThis =
                    editing?.categoryKey === item.categoryKey &&
                    editing?.fieldKey === item.fieldKey &&
                    (editing?.segmentIndex ?? null) === (item.segmentIndex ?? null);

                  return (
                    <li className="provision-item" key={item.id}>
                      {isEditingThis ? (
                        <div style={{ width: "100%" }}>
                          <textarea
                            className="form-control"
                            rows={3}
                            style={{ height: "auto", minHeight: 90, resize: "vertical" }}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            disabled={isSaving}
                          />
                          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={cancelEdit}
                              disabled={isSaving}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm "
                              onClick={saveEdit}
                              disabled={isSaving}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {item.display}
                          {item.citation ? (
                            <span className="citation">Citation : {item.citation}</span>
                          ) : null}
                          {renderAmendmentsAccordion(item.field)}
                          <span className="item-actions">
                            {item.canEdit && (
                              <FiEdit
                                className="icon edit"
                                onClick={() => {
                                  if (typeof item.segmentIndex === "number") {
                                    beginEditSegment(
                                      item.categoryKey,
                                      item.fieldKey,
                                      item.segmentIndex,
                                      item.raw
                                    );
                                  } else {
                                    beginEdit(item.categoryKey, item.fieldKey, item.raw);
                                  }
                                }}
                              />
                            )}
                          </span>
                        </>
                      )}
                    </li>
                  );
                })
                ) : (
                  <li className="provision-item">
                    <em className="muted">No items yet.</em>
                  </li>
                )}
              </ul>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default ProvisionsTab;
