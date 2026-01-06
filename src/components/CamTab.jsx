import { FiChevronDown, FiChevronRight, FiEdit, FiTrash2 } from "react-icons/fi";

const CamTab = ({
  resolvedCamRules,
  openCam,
  onToggleCam,
  onEditRule,
}) => {
  const formatLabel = (key) =>
    String(key)
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase());

  const formatValue = (value) => {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  return (
    <div className="cam">
      {/* Overview */}
      <div className="cam-overview">
        <h3>Overview</h3>
        <p>Click on any category to view detailed lease language and analysis</p>
      </div>

      {/* Rules Card */}
      <div className="cam-card">
        <div className="cam-card-header">
          <h4>Rules</h4>
        </div>

        <ul className="cam-list">
          {resolvedCamRules.length ? (
            resolvedCamRules.map((rule) => (
              <li className="cam-item" key={rule.key}>
                <div className="cam-row" onClick={() => onToggleCam(rule.key)}>
                  <div className="cam-left">
                    {openCam === rule.key ? <FiChevronDown /> : <FiChevronRight />}
                    <span>{rule.title}</span>
                  </div>

                  <div className="cam-right">
                    <span className="count">{rule.count}</span>
                    <span className={`status ${rule.statusClass}`}>
                      {rule.status}
                    </span>

                    <FiEdit
                      className="icon edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRule(rule);
                      }}
                    />
                  </div>
                </div>

                {openCam === rule.key && (
                  <div className="cam-content">
                    {rule.content && <p style={{ whiteSpace: "pre-wrap" }}>{rule.content}</p>}

                    {(rule.data?.leaseReference?.section || (rule.citations && rule.citations.length > 0)) && (
                      <div className="cam-tags">
                        {rule.data?.leaseReference?.section && (
                          <span className="tag">{rule.data.leaseReference.section}</span>
                        )}
                        {rule.citations &&
                          rule.citations.length > 0 &&
                          rule.citations.map((c, i) => (
                            <span className="tag" key={i}>
                              {c}
                            </span>
                          ))}
                      </div>
                    )}

                    {rule.data && typeof rule.data === "object" && (
                      <div style={{ marginTop: 12 }}>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {Object.entries(rule.data)
                            .filter(([k]) => k !== "tables")
                            // Page is already shown as a pill via citations (e.g., "Page 39").
                            .filter(([k]) => k !== "pageNumber")
                            // Section is shown as a pill; avoid repeating it in JSON.
                            .filter(([k]) => k !== "leaseReference")
                            .filter(([, v]) => v != null && v !== "")
                            .map(([k, v]) => (
                              <li key={k}>
                                <strong>{formatLabel(k)}:</strong> {formatValue(v)}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))
          ) : (
            <li className="cam-item">
              <div className="cam-row" style={{ cursor: "default" }}>
                <div className="cam-left">
                  <span>No CAM rules available.</span>
                </div>
              </div>
            </li>
          )}
        </ul>
      </div>

      <div className="cam-summary">
        <div className="cam-summary-card green">
          <h4>Key Tenant Protections</h4>
          <ul>
            <li>
              All deductible cap on building operating expenses, with such
              caps/ceilings applied annually
            </li>
            <li>
              Initial assessment covers only actual CAM incurred during initial
              occupancy
            </li>
            <li>
              Detailed exclusions list protecting tenant from capital
              expenditure pass-throughs
            </li>
            <li>
              Rent discount/late-or-no payroll service credit if late or
              omitted landlord service
            </li>
            <li>
              Landlord shall not increase the estimate of operating expenses
              more than once per year
            </li>
            <li>
              Payments deemed additional rent but subject to direct credit if
              tenant occupies entire building
            </li>
            <li>
              Landlord must warrant and confirm each operating expenses item
              with supporting documentation and no "bundled" costs
            </li>
          </ul>
        </div>

        {/* RIGHT PANEL */}
        <div className="cam-summary-card orange">
          <h4>Key Tenant Expenses</h4>
          <ul>
            <li>
              Tenant in BUID in accordance with applicable management contract
              for management and CAM costs
            </li>
            <li>
              Insurance CAM includes only premiums for policies (not insurance
              CAM in excess of actual)
            </li>
            <li>
              Repair/service that is more accommodative to/requires tenant's
              lease or use
            </li>
            <li>
              Tenant's charge for use of leasebase-linked or CAM-eligible
              services
            </li>
            <li>
              Any HVAC or post-hours air-conditioning invoiced outside regular
              lease service hours or outside standard CAM rights
            </li>
            <li>
              If landlord or tenant abates the premises or gives access in case
              of early event or repairs/building costs tied to either premature
              occupancy or an insurance event
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CamTab;
