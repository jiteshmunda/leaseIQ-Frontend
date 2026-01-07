import { useState, useEffect,useCallback, useRef } from "react";
import api from "../service/api.js";
import {
  FiArrowLeft,
  FiMessageSquare,
  FiDownload,
  FiUpload,
  FiFileText,
  FiEye,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import AiLeaseAssistant from "../components/AiLeaseAssistant";
import LeaseMainContent from "../components/LeaseMainContent";
import "../styles/leaseDetails.css";
import FloatingSignOut from "../components/FloatingSingout";
import { showSuccess, showError } from "../service/toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const LeaseDetails = () => {
  const navigate = useNavigate();
  const { leaseId } = useParams();
  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");
  const [documentDetails, setDocumentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Info");
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [pendingUploadFile, setPendingUploadFile] = useState(null);

  const uploadInputRef = useRef(null);

  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedDocId, setSelectedDocId] = useState(null);
  const [currentVersionId, setCurrentVersionId] = useState(null);

  const openDocumentUrl = async (documentId) => {
    if (!documentId) return;

    try {
      const res = await api.get(`${BASE_URL}/api/leases/document/${documentId}`);
        const url = res?.data?.url || res?.data?.data?.url;
      window.open(url, "_blank", "noopener,noreferrer");
    if (!url) {
      throw new Error("Missing URL in response");
    } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }  catch (error) {
    const msg =
      error?.response?.data?.message ||
      "Failed to open document";
    showError(msg);
  }
};
const fetchDocumentDetails = useCallback(
  async (docId) => {
    if (!docId) {
      setDocumentDetails(null);
      return;
    }

    setDetailsLoading(true);
    try {
      const res = await api.get(
        `${BASE_URL}/api/leases/${leaseId}/details/${docId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const payload =
        res?.data?.data ||
        res?.data?.lease_details ||
        res?.data;

      // Preserve version metadata (if present) alongside the
      // actual extracted lease details.
      setCurrentVersionId(payload?.version ?? null);
      setDocumentDetails(payload?.details ?? payload);

    } catch (err) {
      showError("Failed to load document details", err);
      setDocumentDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  },
  [leaseId, token]
);


    const fetchLease = useCallback(async () => {
      const res = await api.get(
        `${BASE_URL}/api/leases/${leaseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.data?.lease_details) {
        console.log('Fetched lease_details:', res.data.data.lease_details);
      } else {
        console.log('Fetched lease_details: not found in response', res.data?.data);
      }
      setLease(res.data.data);
    }, [leaseId, token]);

  useEffect(() => {
    const run = async () => {
      try {
        await fetchLease();
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [fetchLease]);

  useEffect(() => {
  if (selectedDocId) {
    fetchDocumentDetails(selectedDocId);
  }
}, [selectedDocId, fetchDocumentDetails]);


  useEffect(() => {
    const docs = lease?.documents ?? [];
    if (!Array.isArray(docs) || docs.length === 0) {
      setSelectedDocId(null);
      return;
    }

    setSelectedDocId((current) => {
      if (current && docs.some((d) => d?._id === current)) return current;

      const mainDoc = docs.find((d) =>
        String(d?.document_type ?? "")
          .toLowerCase()
          .includes("main")
      );

      return (mainDoc?._id || docs[0]?._id) ?? null;
    });
  }, [lease?.documents]);
  
  useEffect(() => {
  if (!selectedDocId) {
    setDocumentDetails(null);
    setCurrentVersionId(null);
    return;
  }

  setDetailsLoading(true);
  setDocumentDetails(null); // 🔴 CLEAR OLD DATA

  api
    .get(`${BASE_URL}/api/leases/${leaseId}/details/${selectedDocId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      const payload = res?.data?.data || res?.data;
      setCurrentVersionId(payload?.version ?? null);
      setDocumentDetails(payload?.details ?? payload.details); // ✅ details for UI
    })
    .catch(() => {
      setDocumentDetails(null);
    })
    .finally(() => setDetailsLoading(false));
}, [leaseId, selectedDocId, token]);

  const closeUploadModal = () => {
    if (isUploadingDocument) return;
    setShowUploadModal(false);
    if (uploadInputRef.current) uploadInputRef.current.value = "";
    setPendingUploadFile(null);
  };


  const uploadLeaseDocument = async (file) => {
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      showError("Please upload a PDF file only");
      return;
    }

    setIsUploadingDocument(true);

    try {


      let derivedLeaseDetails;
      try {
        const debugBody = new FormData();
        debugBody.append("assets", file);
        const debugRes = await api.post(
          `${BASE_URL}/api/debug/amendments`,
          debugBody,
          {
            headers: {
              "x-user-id": userId,
              "x-lease-id": leaseId,
            },
          }
        );
        let rawDetails =
          debugRes?.data?.lease_details ||
          debugRes?.data?.data?.lease_details;
        if (!rawDetails && debugRes?.data) {
          rawDetails = debugRes.data;
        }

        if (!rawDetails) {
          throw new Error("Invalid amendment response");
        }

        derivedLeaseDetails = rawDetails;
      } catch (err) {
        console.error("Failed to analyze amendment document", err);
        showError("Failed to analyze amendment document");
        setIsUploadingDocument(false);
        return;
      }

      const body = new FormData();
      body.append("assets", file);
      body.append("document_type", "amendment");
      body.append("lease_details", JSON.stringify(derivedLeaseDetails));

      await api.post(
        `${BASE_URL}/api/leases/${leaseId}/documentsupdate`,
        body
      );

      showSuccess("Document uploaded successfully");
      closeUploadModal();
      await fetchLease();

    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        "Failed to upload document";
      showError(msg);
    } finally {
      setIsUploadingDocument(false);
    }
  };
  const getLeaseFileForCam = async () => {
    if (!selectedDocId) {
      throw new Error("No document selected");
    }

    try {
      // Get document URL from backend
      const res = await api.get(`${BASE_URL}/api/leases/document/${selectedDocId}`);
      const url = res?.data?.url || res?.data?.data?.url;
      
      if (!url) {
        throw new Error("Document URL not found");
      }

      // Fetch the file from the URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch document");
      }

      const blob = await response.blob();
      
      // Get document name from lease documents
      const doc = lease?.documents?.find((d) => d._id === selectedDocId);
      const fileName = doc?.document_name || "lease-document.pdf";

      // Convert blob to File object for FormData
      return new File([blob], fileName, {
        type: blob.type || "application/pdf",
      });
    } catch (error) {
      console.error("Failed to get lease file:", error);
      throw new Error("Failed to retrieve lease document");
    }
  };

  const handleLeaseDetailsUpdate = async (updatedLeaseDetails) => {
    try {
      const patchUrl = currentVersionId
        ? `${BASE_URL}/api/leases/${leaseId}/details/version/${currentVersionId}`
        : `${BASE_URL}/api/leases/${leaseId}/details`;

      await api.patch(patchUrl, { lease_details: updatedLeaseDetails });

      setLease((prev) =>
        prev
          ? {
              ...prev,
              lease_details: {
                ...(prev.lease_details || {}),
                details: updatedLeaseDetails,
              },
            }
          : prev
      );

          // Keep the currently viewed document details in sync so
          // the UI reflects the latest edits immediately.
          setDocumentDetails(updatedLeaseDetails);

      showSuccess("Lease details updated successfully");
    } catch {
      showError("Failed to update lease details");
    }
  };


  if (loading) {
    return (
      <div className="lease-page">
        <h2>Loading lease...</h2>
      </div>
    );
  }


  return (
    <div className="lease-page">
      <FloatingSignOut />

      <header className="lease-header">
        <div className="header-left">
          <FiArrowLeft
            className="header-back"
            onClick={() =>
              navigate(`/tenant/${lease?.tenant?._id}`, {
                state: { tenantName: lease?.tenant?.tenant_name },
              })
            }
          />
          <div className="header-text">
            <h1>{lease?.tenant?.tenant_name} - Lease Abstraction</h1>
            <p>
              {lease?.property?.property_name} · {lease?.unit?.unit_number}
            </p>
          </div>
        </div>

        <div className="header-right">
          {/* <button className="ai-btn" onClick={() => setShowAiAssistant(true)}>
            <FiMessageSquare /> AI Assistant
          </button> */}
          <button className="ai-btn">
            <FiDownload />
          </button>
        </div>
      </header>

      <div className="lease-body">
        <aside className="lease-sidebar">
          <h4>{lease?.tenant?.tenant_name}</h4>
          <span className="muted">Document Library</span>

          <div
            className="upload-box"
            onClick={() => setShowUploadModal(true)}
          >
            <FiUpload />
            <p>Drop PDF here or click to upload</p>
          </div>

          <div className="doc-list">
            {lease?.documents?.map((doc) => (
              <div
                key={doc._id}
                className={`doc-item ${doc._id === selectedDocId ? "active" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedDocId(doc._id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedDocId(doc._id);
                  }
                }}
              >
                <div className="doc-row">
                  <div className="doc-name">{doc.document_name}</div>

                  <button
                    type="button"
                    className="doc-action"
                    title="View document"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDocumentUrl(doc._id);
                    }}
                  >
                    <FiEye size={10} className="eye-btn"/>
                  </button>
                </div>
                <span>
                  {doc.document_type} ·{" "}
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </aside>

        <main className="lease-content">
  {detailsLoading || !documentDetails ? (
    <div className="lease-content-loading">
      Loading document details…
    </div>
  ) : (
    <LeaseMainContent
  key={selectedDocId}               // 🔑 force remount
  leaseMeta={null}                  // ❌ block old fallback bugs
  leaseDetails={documentDetails}    // ✅ ONLY document API
  activeTab={activeTab}
  setActiveTab={setActiveTab}
  onUpdateLeaseDetails={handleLeaseDetailsUpdate}
  getLeaseFile={getLeaseFileForCam}
/>
  )}


          <AiLeaseAssistant
            open={showAiAssistant}
            onClose={() => setShowAiAssistant(false)}
          />
        </main>
      </div>

      {showUploadModal && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,.4)" }}
        >
          <div className="modal-dialog modal-dialog-centered upload-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Upload Amendment</h5>
                <button
                  className="btn-close"
                  onClick={closeUploadModal}
                  disabled={isUploadingDocument}
                />
              </div>

              <div className="modal-body">
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".pdf"
                  hidden
                  disabled={isUploadingDocument}
                  onChange={(e) => setPendingUploadFile(e.target.files?.[0] ?? null)}
                />

                <div
                  className="upload-dropzone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    setPendingUploadFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                >
                  <FiUpload size={22} />
                  <p>
                    {isUploadingDocument
                      ? "Uploading document..."
                      : pendingUploadFile
                      ? `Selected: ${pendingUploadFile.name}`
                      : "Drag and drop PDF here"}
                  </p>

                  <button
                    className="btn btn-primary btn-sm"
                    disabled={isUploadingDocument}
                    onClick={() => uploadInputRef.current?.click()}
                  >
                    Browse File
                  </button>

                  <button
                    className="btn btn-outline-primary btn-sm"
                    style={{ marginLeft: 8 }}
                    disabled={isUploadingDocument || !pendingUploadFile}
                    onClick={() => uploadLeaseDocument(pendingUploadFile)}
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaseDetails;
