import { useState } from "react";
import { FiChevronRight, FiEdit, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

const CamTab = ({ camData, loading, onEditRule }) => {
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedRules, setExpandedRules] = useState(new Set());

  // Loading state
  if (loading) {
    return (
      <div className="cam-tab">
        <div className="cam-loading-state">
          <div className="cam-spinner"></div>
          <p>Analyzing CAM provisions...</p>
          <p className="cam-loading-hint">This may take a few moments.</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!camData) {
    return (
      <div className="cam-tab">
        <div className="cam-no-data">
          <FiAlertCircle size={48} />
          <p>No CAM provisions available.</p>
          <p className="cam-no-data-hint">Click the CAM tab to analyze this document's CAM clauses.</p>
        </div>
      </div>
    );
  }

  // Toggle category expansion
  const toggleCategory = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Toggle rule expansion
  const toggleRule = (ruleId) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  // Get favorability badge color
  const getFavorabilityColor = (favorability) => {
    switch (favorability?.toLowerCase()) {
      case "favorable":
        return "#16a34a";
      case "unfavorable":
        return "#dc2626";
      case "neutral":
      default:
        return "#6b7280";
    }
  };

  // Get impact color
  const getImpactColor = (impact) => {
    switch (impact?.toLowerCase()) {
      case "high":
        return "#dc2626";
      case "medium":
        return "#ea580c";
      case "low":
        return "#16a34a";
      default:
        return "#6b7280";
    }
  };

  // Get risk color
  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case "high":
        return "#dc2626";
      case "medium":
        return "#ea580c";
      case "low":
        return "#16a34a";
      default:
        return "#6b7280";
    }
  };

  // Category display names
  const getCategoryDisplayName = (category) => {
    const categoryMap = {
      proportionateShare: "Proportionate Share",
      camExpenseCategories: "CAM Expense Categories",
      exclusions: "Exclusions",
      paymentTerms: "Payment Terms",
      capsLimitations: "Caps & Limitations",
      reconciliationProcedures: "Reconciliation Procedures",
      baseYearProvisions: "Base Year Provisions",
      grossUpProvisions: "Gross-Up Provisions",
      administrativeFees: "Administrative Fees",
      auditRights: "Audit Rights",
      noticeRequirements: "Notice Requirements",
      controllableVsNonControllable: "Controllable vs Non-Controllable",
      definitions: "Definitions",
      calculationMethods: "Calculation Methods",
    };
    return categoryMap[category] || category;
  };

  // Get category status based on rules favorability
  const getCategoryStatus = (rules) => {
    if (!rules || rules.length === 0) return "neutral";
    const favorabilities = rules.map((r) => r.favorability?.toLowerCase()).filter(Boolean);
    if (favorabilities.some((f) => f === "favorable")) {
      if (favorabilities.some((f) => f === "unfavorable")) {
        return "neutral";
      }
      return "favorable";
    }
    if (favorabilities.some((f) => f === "unfavorable")) {
      return "unfavorable";
    }
    return "neutral";
  };

  // Extract data from camData
  const summary = camData.cumulativeCamRulesSummary || {};
  const riskAssessment = summary.riskAssessment || {};
  const rulesByCategoryCount = summary.rulesByCategory || {};
  const allRules = camData.allExtractedRules || [];

  // Group rules by category
  const rulesByCategory = {};
  allRules.forEach((rule) => {
    const category = rule.ruleCategory;
    if (!rulesByCategory[category]) {
      rulesByCategory[category] = [];
    }
    rulesByCategory[category].push(rule);
  });

  // Calculate stats
  const overallRisk = riskAssessment.overallTenantRisk || "Unknown";
  const totalRules = summary.totalRulesExtracted || 0;
  const protections = riskAssessment.keyTenantProtections || [];
  const exposures = riskAssessment.keyTenantExposures || [];

  // Extract base year and controllable cap from rules
  const baseYearRule = allRules.find((r) => r.ruleCategory === "baseYearProvisions");
  const baseYear = baseYearRule?.exactLanguage?.match(/20\d{2}/)?.[0] || "N/A";
  const controllableCapRule = allRules.find((r) => r.ruleCategory === "capsLimitations");
  const controllableCap = controllableCapRule?.exactLanguage?.match(/(\d+)%/)?.[1] || "N/A";

  return (
    <div className="cam-tab">
      {/* Overview Section */}
      <div className="cam-overview-section">
        <h2 className="cam-section-title">Overview</h2>

        {/* Summary Cards */}
        <div className="cam-overview-cards">
          <div className="cam-stat-card cam-risk-card">
            <span className="cam-stat-label">Overall Risk</span>
            <span className="cam-stat-value" style={{ color: getRiskColor(overallRisk) }}>
              {overallRisk}
            </span>
          </div>

          <div className="cam-stat-card cam-rules-card">
            <span className="cam-stat-label">Total Rules</span>
            <span className="cam-stat-value">{totalRules}</span>
          </div>

          <div className="cam-stat-card cam-protections-card">
            <span className="cam-stat-label">Protections</span>
            <span className="cam-stat-value">{protections.length}</span>
          </div>

          <div className="cam-stat-card cam-exposures-card">
            <span className="cam-stat-label">Exposures</span>
            <span className="cam-stat-value">{exposures.length}</span>
          </div>
        </div>

        {/* Metadata Bar */}
        <div className="cam-metadata-bar">
          <div className="cam-metadata-item">
            <strong>Base Year:</strong> {baseYear}
          </div>
          <div className="cam-metadata-item">
            <strong>Controllable Cap:</strong> {controllableCap !== "N/A" ? `${controllableCap}% annually` : "N/A"}
          </div>
        </div>
      </div>

      {/* Rules Section */}
      <div className="cam-rules-section">
        <div className="cam-section-header">
          <h2 className="cam-section-title">Rules by Category</h2>
          <p className="cam-instruction">Click on any category to view detailed rules and provisions</p>
        </div>

        <div className="cam-categories">
          {Object.keys(rulesByCategoryCount).map((category) => {
            const rules = rulesByCategory[category] || [];
            const ruleCount = rulesByCategoryCount[category] || 0;
            const isExpanded = expandedCategories.has(category);
            const status = getCategoryStatus(rules);

            if (ruleCount === 0) return null;

            return (
              <div key={category} className="cam-category">
                <button
                  className={`cam-category-header ${isExpanded ? "expanded" : ""}`}
                  onClick={() => toggleCategory(category)}
                >
                  <span className={`cam-expand-icon ${isExpanded ? "expanded" : ""}`}>
                    <FiChevronRight />
                  </span>
                  <span className="cam-category-name">{getCategoryDisplayName(category)}</span>
                  <span className="cam-category-count">
                    ({ruleCount} {ruleCount === 1 ? "rule" : "rules"})
                  </span>
                  <span
                    className="cam-favorability-badge"
                    style={{ backgroundColor: getFavorabilityColor(status) }}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </button>

                {isExpanded && (
                  <div className="cam-category-rules">
                    {rules.map((rule) => {
                      const isRuleExpanded = expandedRules.has(rule.ruleId);
                      return (
                        <div key={rule.ruleId} className="cam-rule-item">
                          <div className="cam-rule-header">
                            <span className="cam-rule-id">{rule.ruleId}</span>
                            {rule.ruleStatus === "Updated" && (
                              <span className="cam-updated-badge">Updated</span>
                            )}
                            <button
                              className="cam-rule-expand-btn"
                              onClick={() => toggleRule(rule.ruleId)}
                            >
                              <span className={`cam-expand-icon small ${isRuleExpanded ? "expanded" : ""}`}>
                                <FiChevronRight />
                              </span>
                            </button>
                          </div>

                          <div className="cam-rule-summary">{rule.ruleSummary}</div>

                          {rule.locations && rule.locations.length > 0 && (
                            <div className="cam-rule-meta">
                              <span className="cam-meta-item">
                                📄 Page {rule.locations.map((l) => l.pageNumber).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                              </span>
                              <span className="cam-meta-item" style={{ color: getImpactColor(rule.impactSeverity) }}>
                                ⚡ {rule.impactSeverity || "Medium"} Impact
                              </span>
                              <span
                                className="cam-favorability-badge small"
                                style={{ backgroundColor: getFavorabilityColor(rule.favorability) }}
                              >
                                {rule.favorability || "Neutral"}
                              </span>
                            </div>
                          )}

                          {isRuleExpanded && (
                            <div className="cam-rule-details">
                              <div className="cam-detail-section">
                                <h4>Exact Language</h4>
                                <p className="cam-exact-language">{rule.exactLanguage}</p>
                              </div>

                              <div className="cam-detail-section">
                                <h4>Tenant Impact</h4>
                                <p className="cam-tenant-impact">{rule.tenantImpact}</p>
                              </div>

                              {rule.updateHistory && rule.updateHistory.length > 0 && (
                                <div className="cam-detail-section">
                                  <h4>Update History</h4>
                                  {rule.updateHistory.map((update, idx) => (
                                    <div key={idx} className="cam-update-item">
                                      <strong>Page {update.updatePage}:</strong> {update.updateSummary}
                                      {update.materialityOfChange && (
                                        <span className="cam-materiality">
                                          {" "}— {update.materialityOfChange}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {rule.crossReferences && rule.crossReferences.length > 0 && (
                                <div className="cam-detail-section">
                                  <h4>Cross References</h4>
                                  <div className="cam-cross-refs">
                                    {rule.crossReferences.map((ref, idx) => (
                                      <span key={idx} className="cam-cross-ref-tag">{ref}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Boxes */}
      <div className="cam-summary-boxes">
        {/* Key Tenant Protections */}
        <div className="cam-summary-box cam-protections-box">
          <div className="cam-box-header">
            <div className="cam-box-icon protections">
              <FiCheckCircle />
            </div>
            <h3>Key Tenant Protections</h3>
          </div>
          <ul className="cam-box-list">
            {protections.length > 0 ? (
              protections.map((protection, idx) => (
                <li key={idx}>{protection}</li>
              ))
            ) : (
              <li className="cam-no-items">No protections identified</li>
            )}
          </ul>
        </div>

        {/* Key Tenant Exposures */}
        <div className="cam-summary-box cam-exposures-box">
          <div className="cam-box-header">
            <div className="cam-box-icon exposures">
              <FiAlertCircle />
            </div>
            <h3>Key Tenant Exposures</h3>
          </div>
          <ul className="cam-box-list">
            {exposures.length > 0 ? (
              exposures.map((exposure, idx) => (
                <li key={idx}>{exposure}</li>
              ))
            ) : (
              <li className="cam-no-items">No exposures identified</li>
            )}
          </ul>
        </div>
      </div>

      {/* Missing Provisions Warning */}
      {camData.flagsAndObservations?.missingProvisions?.length > 0 && (
        <div className="cam-warnings-section">
          <h3 className="cam-warnings-title">Missing Provisions</h3>
          <div className="cam-warnings-list">
            {camData.flagsAndObservations.missingProvisions.map((provision, idx) => (
              <div key={idx} className="cam-warning-item">
                <span className="cam-warning-type">{provision.provisionType}</span>
                <span className={`cam-warning-significance ${provision.significance?.toLowerCase()}`}>
                  {provision.significance} Significance
                </span>
                <p className="cam-warning-risk">{provision.tenantRisk}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CamTab;
