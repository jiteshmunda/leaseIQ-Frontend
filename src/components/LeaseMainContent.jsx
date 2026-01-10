import { useEffect, useRef, useState } from "react";
import InfoTab from "./InfoTab";
import SpaceTab from "./SpaceTab";
import RentSchedulesTab from "./RentSchedulesTab";
import ProvisionsTab from "./ProvisionsTab";
import AuditTab from "./AuditTab";
import CamTab from "./CamTab";
import { useLeaseAnalyzer } from "../service/useLeaseAnalyzer";
import { showError } from "../service/toast";

const TABS = ["Info", "Space", "Rent Schedules", "Provisions", "Audit", "CAM"];

const LeaseMainContent = ({
  activeTab,
  setActiveTab,
  leaseDetails,
  onUpdateLeaseDetails,
  getLeaseFile,
}) => {
  const scrollSectionRef = useRef(null);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [editCategoryKey, setEditCategoryKey] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [showEditCam, setShowEditCam] = useState(false);
  const [editCamRule, setEditCamRule] = useState(null);
  const [editCamForm, setEditCamForm] = useState({
    title: "",
    content: "",
    citationsText: "",
  });
  const [isUpdatingCamRule, setIsUpdatingCamRule] = useState(false);
  const [isLoadingCam, setIsLoadingCam] = useState(false);
  
  const { runCamAnalysis } = useLeaseAnalyzer();

  useEffect(() => {
    // The scroll container stays mounted across tab switches, so it keeps its scrollTop.
    // Reset to top on each tab change.
    const el = scrollSectionRef.current;
    if (el) el.scrollTop = 0;
  }, [activeTab]);

  if (!leaseDetails) {
    return (
      <div className="lease-content-loading">
        Loading document details…
      </div>
    );
  }

  if (typeof leaseDetails !== "object") {
    return null;
  }

  const leaseInfo = leaseDetails?.info?.leaseInformation;
  const spaceInfo = leaseDetails?.space?.space;

  const normalizeChargeSchedules = (raw = {}) => {
  const cs = raw?.["charge-schedules"] ?? {};
  const schedules = cs.chargeSchedules ?? {};

  return {
    baseRent: Array.isArray(schedules.baseRent)
      ? schedules.baseRent
      : [],
    // Preferred shape (per analyzer): charge-schedules.chargeSchedules.lateFee
    // Fallback for any older payloads: charge-schedules.lateFee
    lateFee: schedules.lateFee ?? cs.lateFee ?? {},
  };
};


  const chargeSchedules = normalizeChargeSchedules(leaseDetails);

  const miscProvisions = leaseDetails?.misc?.otherLeaseProvisions;
  const camSingle = leaseDetails?.["cam-single"]?.data;

  const rawAudit = leaseDetails?.audit;
  const auditObject =
    rawAudit && typeof rawAudit === "object" && rawAudit.audit && typeof rawAudit.audit === "object"
      ? rawAudit.audit
      : rawAudit;

  // Handle risk_register_sections specially - flatten nested issues arrays
  const auditSource = (() => {
    if (auditObject?.audit_checklist) return auditObject.audit_checklist;
    if (auditObject?.identified_risks) return auditObject.identified_risks;
    if (auditObject?.risk_register) return auditObject.risk_register;
    if (auditObject?.risks) return auditObject.risks;
    if (auditObject?.risk_register_sections) {
      // Flatten: each section has { section_name, issues: [...] }
      // Extract all issues and carry section_name as category fallback
      return auditObject.risk_register_sections.flatMap((section) =>
        (section.issues || []).map((issue) => ({
          ...issue,
          _section_name: section.section_name, // preserve section context
        }))
      );
    }
    return [];
  })();

  const auditRisks = Array.isArray(auditSource)
    ? auditSource.map((item) => {
        if (item.page_number == null) {
          const refs = Array.isArray(item.page_reference)
            ? item.page_reference
            : Array.isArray(item.page_references)
            ? item.page_references
            : null;

          if (refs && refs.length > 0) {
            return { ...item, page_number: refs[0] };
          }
        }

        return item;
      })
    : [];

  const normalizeCitationsText = (citations) => {
    if (Array.isArray(citations)) return citations.filter(Boolean).join(", ");
    if (citations == null) return "";
    return String(citations);
  };

  const parseCitationsText = (text) =>
    String(text ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  // CAM data is passed directly to CamTab component without transformation

  const getFieldValue = (field) => {
    if (!field || typeof field !== "object") return "";
    if (!("value" in field)) return "";
    const value = field.value;
    return value == null ? "" : String(value);
  };

  const formatDisplayValue = (value) => {
    if (value == null) return "";
    const valueType = typeof value;

    if (valueType === "string" || valueType === "number" || valueType === "boolean") {
      return String(value);
    }

    if (valueType === "object") {
      const parts = Object.values(value).filter((v) => v != null && v !== "");
      return parts.length ? parts.join(" • ") : "";
    }

    return "";
  };

  const premisesAndTerm = miscProvisions?.premisesAndTerm;

  const derivedSecurityDeposit = (() => {
    const raw = premisesAndTerm?.keyParameters?.value;
    const text = typeof raw === "string" ? raw : "";
    const match = text.match(/Advance Deposit:\s*([^;]+)/i);
    return match ? match[1].trim() : "";
  })();

  const formatProvisionTitle = (rawKey) => {
    if (!rawKey) return "";
    const custom = {
      premisesAndTerm: "Premises and Term",
      operatingExpenses: "Operating Expenses",
      repairsAndMaintenance: "Repairs and Maintenance",
      liabilityAndIndemnification: "Liability and Indemnification",
      landlordsRightOfEntry: "Landlord's Right of Entry",
      rightOfFirstRefusalOffer: "Right of First Refusal / Offer",
      expansionAndRelocation: "Expansion and Relocation",
    };

    if (custom[rawKey]) return custom[rawKey];

    return rawKey
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase());
  };


  const handleCamTabClick = async () => {
    // If CAM data already exists, just switch to the tab
    if (leaseDetails?.["cam-single"]) {
      setActiveTab("CAM");
      return;
    }

    // If no file retrieval function provided, show error
    if (!getLeaseFile || typeof getLeaseFile !== "function") {
      showError("Unable to load CAM analysis. File access not available.");
      return;
    }

    // Check if CAM analysis is already in progress
    if (isLoadingCam) {
      return;
    }

    setIsLoadingCam(true);
    setActiveTab("CAM");

    try {
      // Get the lease file
      const file = await getLeaseFile();
      if (!file) {
        throw new Error("Failed to retrieve lease file");
      }

      // Create FormData for the API call
      const formData = new FormData();
      formData.append("assets", file);

      // Run CAM analysis
      const camResult = await runCamAnalysis({ formData });

      // Update lease details with CAM data
      if (onUpdateLeaseDetails && typeof onUpdateLeaseDetails === "function") {
        const updated = cloneLeaseDetails(leaseDetails);
        updated["cam-single"] = camResult["cam-single"];
        await onUpdateLeaseDetails(updated);
      }
    } catch (error) {
      console.error("CAM analysis failed:", error);
      showError("Failed to analyze CAM provisions. Please try again.");
    } finally {
      setIsLoadingCam(false);
    }
  };

  const handleTabClick = (tab) => {
    if (tab === "CAM") {
      handleCamTabClick();
    } else {
      setActiveTab(tab);
    }
  };

  const handleEditCategory = (categoryName) => {
    setEditCategoryKey(categoryName);
    setEditCategoryName(formatProvisionTitle(categoryName));
    setShowEditCategory(true);
  };

  const handleOpenEditCamRule = (rule) => {
    setEditCamRule(rule);
    setEditCamForm({
      title: String(rule?.title ?? ""),
      content: String(rule?.content ?? ""),
      citationsText: normalizeCitationsText(rule?.citations),
    });
    setShowEditCam(true);
  };


  const handleUpdateCamRule = async () => {
    if (!editCamRule) return;

    // Only persist edits for the extracted CAM single block.
    if (editCamRule.key !== "cam-single" || typeof onUpdateLeaseDetails !== "function") {
      setShowEditCam(false);
      return;
    }

    setIsUpdatingCamRule(true);
    try {
      const updated = cloneLeaseDetails(leaseDetails);
      updated["cam-single"] = updated["cam-single"] ?? {};
      updated["cam-single"].data = updated["cam-single"].data ?? {};

      const nextTitle = editCamForm.title.trim();
      const nextContent = editCamForm.content;
      const nextCitations = parseCitationsText(editCamForm.citationsText);

      // Keep multiple known fields in sync so the UI and backend stay compatible.
      updated["cam-single"].data.sectionTitle = nextTitle;
      updated["cam-single"].data.title = nextTitle;
      updated["cam-single"].data.textContent = nextContent;
      updated["cam-single"].data.executionClause = nextContent;
      updated["cam-single"].data.citations = nextCitations;

      await onUpdateLeaseDetails(updated);
      setShowEditCam(false);
      setEditCamRule(null);
    } finally {
      setIsUpdatingCamRule(false);
    }
  };

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

  const toProvisionCategoryKey = (name) => {
    const cleaned = String(name ?? "")
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .trim();
    if (!cleaned) return "";

    const parts = cleaned.split(/\s+/).filter(Boolean);
    const [first, ...rest] = parts;
    const camel =
      first.toLowerCase() +
      rest
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join("");

    if (!camel) return "";
    return /^[a-zA-Z]/.test(camel)
      ? camel
      : `category${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
  };


  const handleUpdateCategory = async () => {
    if (!editCategoryKey || typeof onUpdateLeaseDetails !== "function") {
      setShowEditCategory(false);
      return;
    }

    const nextName = editCategoryName.trim();
    const nextKey = toProvisionCategoryKey(nextName);
    if (!nextKey) return;

    if (nextKey === editCategoryKey) {
      setShowEditCategory(false);
      return;
    }

    setIsUpdatingCategory(true);
    try {
      const updated = cloneLeaseDetails(leaseDetails);
      updated.misc = updated.misc ?? {};
      updated.misc.otherLeaseProvisions = updated.misc.otherLeaseProvisions ?? {};

      const provisions = updated.misc.otherLeaseProvisions;

      if (!provisions[editCategoryKey]) {
        setShowEditCategory(false);
        return;
      }

      if (provisions[nextKey]) {
        // Avoid overwriting an existing category.
        window.alert("A category with this name already exists.");
        return;
      }

      provisions[nextKey] = provisions[editCategoryKey];
      delete provisions[editCategoryKey];

      await onUpdateLeaseDetails(updated);
      setShowEditCategory(false);
      setEditCategoryKey(null);
    } finally {
      setIsUpdatingCategory(false);
    }
  };


  return (
     <>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => handleTabClick(tab)}
            disabled={tab === "CAM" && isLoadingCam && !leaseDetails?.["cam-single"]}
          >
            {tab}
          </button>
        ))}
      </div>

                {/* ===== SCROLLABLE SECTION ===== */}
                <div className="scroll-section" ref={scrollSectionRef}>
        {activeTab === "Info" && (
          <InfoTab
            leaseDetails={leaseDetails}
            leaseInfo={leaseInfo}
            chargeSchedules={chargeSchedules}
            miscProvisions={miscProvisions}
            premisesAndTerm={premisesAndTerm}
            derivedSecurityDeposit={derivedSecurityDeposit}
            getFieldValue={getFieldValue}
            formatDisplayValue={formatDisplayValue}
            onUpdateLeaseDetails={onUpdateLeaseDetails}
            filename={leaseDetails?.filename}
          />
        )}

        {activeTab === "Space" && (
          <SpaceTab
            spaceInfo={spaceInfo}
            getFieldValue={getFieldValue}
            filename={leaseDetails?.filename}
          />
        )}

        {activeTab === "Rent Schedules" && (
          <RentSchedulesTab
            chargeSchedules={chargeSchedules}
            getFieldValue={getFieldValue}
            filename={leaseDetails?.filename}
          />
        )}

        {activeTab === "Provisions" && (
          <ProvisionsTab
            miscProvisions={miscProvisions}
            formatProvisionTitle={formatProvisionTitle}
            onEditCategory={handleEditCategory}
            leaseDetails={leaseDetails}
            onUpdateLeaseDetails={onUpdateLeaseDetails}
            filename={leaseDetails?.filename}
          />
        )}

        {activeTab === "Audit" && <AuditTab audit={auditObject} risks={auditRisks} filename={leaseDetails?.filename} />}

        {activeTab === "CAM" && (
          <>
            {isLoadingCam ? (
              <div className="lease-content-loading">
                <p>Analyzing CAM provisions...</p>
                <p style={{ fontSize: "0.9em", color: "#666", marginTop: "8px" }}>
                  This process may take some time
                </p>
              </div>
            ) : (
              <CamTab
                camData={camSingle}
                loading={isLoadingCam}
                onEditRule={(rule) => {
                  handleOpenEditCamRule(rule);
                }}
              />
            )}
          </>
        )}

      </div>

{showEditCategory && (
  <div
    className="modal fade show"
    style={{ display: "block", backgroundColor: "rgba(0,0,0,.4)" }}
  >
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">

        {/* Header */}
        <div className="modal-header">
          <h5 className="modal-title">Edit Category</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowEditCategory(false)}
          />
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="mb-3">
            <label className="form-label">Category Name</label>
            <input
              type="text"
              className="form-control"
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowEditCategory(false)}
            disabled={isUpdatingCategory}
          >
            Cancel
          </button>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={handleUpdateCategory}
            disabled={isUpdatingCategory}
          >
            Update
          </button>
        </div>

      </div>
    </div>
  </div>
)}

{showEditCam && editCamRule && (
  <div
    className="modal fade show"
    style={{ display: "block", backgroundColor: "rgba(0,0,0,.4)" }}
  >
    <div className="modal-dialog modal-dialog-centered modal-lg cam-edit-modal">
      <div className="modal-content">

        <div className="modal-header">
          <h5 className="modal-title">Edit CAM Rule</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowEditCam(false)}
          />
        </div>

        <div className="modal-body">
          <div className="mb-3">
            <label className="form-label">Rule Title</label>
            <input
              type="text"
              className="form-control"
              value={editCamForm.title}
              onChange={(e) => setEditCamForm((s) => ({ ...s, title: e.target.value }))}
              disabled={isUpdatingCamRule}
            />
          </div>

          <div className="mb-3">
  <label className="form-label">Rule Content</label>
  <textarea
    className="form-control"
    value={editCamForm.content}
    style={{
      height: "auto",
      minHeight: 140,
      resize: "vertical",
      overflow: "auto",
    }}
    onInput={(e) => {
      e.target.style.height = "auto";
      e.target.style.height = e.target.scrollHeight + "px";
    }}
    ref={(el) => {
      if (el) {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      }
    }}
    onChange={(e) => setEditCamForm((s) => ({ ...s, content: e.target.value }))}
    disabled={isUpdatingCamRule}
  />
</div>


          <div className="mb-3">
            <label className="form-label">
              Citations (comma-separated)
            </label>
            <input
              type="text"
              className="form-control"
              value={editCamForm.citationsText}
              onChange={(e) => setEditCamForm((s) => ({ ...s, citationsText: e.target.value }))}
              disabled={isUpdatingCamRule}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowEditCam(false)}
            disabled={isUpdatingCamRule}
          >
            Cancel
          </button>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={handleUpdateCamRule}
            disabled={isUpdatingCamRule}
          >
            Update Rule
          </button>
        </div>

      </div>
    </div>
  </div>
)}




    </>

  );
};

export default LeaseMainContent;
