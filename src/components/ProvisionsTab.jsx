import { useMemo, useState } from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";

const ProvisionsTab = ({
  miscProvisions,
  formatProvisionTitle,
  onEditCategory,
  leaseDetails,
  onUpdateLeaseDetails,
}) => {
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
      updated.misc = updated.misc ?? {};
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

  return (
    <div className="provisions">
      {/* Header */}
       <div className="provisions-header">
        <h3>Key Lease Provisions</h3>
      </div>

      {miscProvisions &&
        Object.entries(miscProvisions).map(([key, value]) => {
          const items = provisionFields
            .map((fieldKey) => {
              const field = value?.[fieldKey];
              const raw = field?.value;
              if (raw === undefined || raw === null || raw === "") return null;

              if (typeof raw === "string") {
                const segments = splitProvisionText(raw);
                if (segments.length <= 1) {
                  return {
                    id: `${key}:${fieldKey}`,
                    categoryKey: key,
                    fieldKey,
                    raw,
                    display: normalizeValue(raw),
                    canEdit: true,
                    segmentIndex: null,
                  };
                }

                return segments.map((segment, idx) => ({
                  id: `${key}:${fieldKey}:${idx}`,
                  categoryKey: key,
                  fieldKey,
                  raw: segment,
                  display: segment,
                  canEdit: true,
                  segmentIndex: idx,
                }));
              }

              return {
                id: `${key}:${fieldKey}`,
                categoryKey: key,
                fieldKey,
                raw,
                display: normalizeValue(raw),
                canEdit: false,
                segmentIndex: null,
              };
            })
            .flat()
            .filter(Boolean);

          const title = formatProvisionTitle(key);

          return (
            <section className="card provision-card" key={key}>
              <div className="provision-header">
                <h4>{title}</h4>

                <div className="provision-actions">
                  <FiEdit
                    className="icon edit"
                    onClick={() => onEditCategory(key)}
                  />
                </div>
              </div>

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
                              className="btn btn-info btn-sm "
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
            </section>
          );
        })}
    </div>
  );
};

export default ProvisionsTab;
