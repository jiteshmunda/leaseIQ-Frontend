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

  const [activeTab, setActiveTab] = useState("Info");
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [pendingUploadFile, setPendingUploadFile] = useState(null);

  const uploadInputRef = useRef(null);

  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedDocId, setSelectedDocId] = useState(null);

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
        debugBody.append("assets", file); // PDF
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

        // Get the lease_details object from the response
        let rawDetails =
          debugRes?.data?.lease_details ||
          debugRes?.data?.data?.lease_details;

        // If not found, but data exists, use the whole data
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
  const handleLeaseDetailsUpdate = async (updatedLeaseDetails) => {
    try {
      await api.patch(
        `${BASE_URL}/api/leases/${leaseId}/details`,
        { lease_details: updatedLeaseDetails }
      );

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

  const selectedDoc = lease?.documents?.find((doc) => doc?._id === selectedDocId) || null;

  const selectedLeaseDetails = (() => {
    const docLeaseDetails =
      selectedDoc?.lease_details ||
      selectedDoc?.document_details ||
      selectedDoc?.details ||
      null;

    const docDetails = docLeaseDetails?.details || docLeaseDetails;

    return (
      docDetails ||
      lease?.lease_details?.details ||
      lease?.lease_details ||
      null
    );
  })();


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
          <button className="ai-btn" onClick={() => setShowAiAssistant(true)}>
            <FiMessageSquare /> AI Assistant
          </button>
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
          <LeaseMainContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            leaseMeta={lease}
            leaseDetails={selectedLeaseDetails}
            onUpdateLeaseDetails={handleLeaseDetailsUpdate}
          />

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
