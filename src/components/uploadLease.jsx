import { useState } from "react";
import "../styles/uploadLease.css";
import { useNavigate } from "react-router-dom";
import { showError, showSuccess } from "../service/toast";
import AnimatedBackground from "./AnimatedBackground";
import DragDropUpload from "./DragDropUpload";

const UploadLeaseStep = ({ onBack, onSubmit, loading }) => {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("main lease");
  const navigate = useNavigate();

  const isFormValid = file && docType;

  const handleUpload = () => {
    if (!file) {
      showError("Please upload a PDF file");
      return;
    }

    if (file.type !== "application/pdf") {
      showError("Only PDF files are allowed");
      return;
    }

    showSuccess("Lease document uploaded successfully!");

    onSubmit({
      file,
      docType,
    });
  };

  return (
    <>
      <AnimatedBackground />
      <div className="upload-lease-page">
        <div className="upload-wrapper">

          <div className="back-link" onClick={onBack}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="back-icon"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Back</span>
          </div>

          <div className="upload-lease-card">
            <div className="step-text">Step 3 of 3</div>

            <h2>Upload Lease (only PDF)</h2>

            <DragDropUpload
              onFileSelect={(file) => setFile(file)}
              currentFile={file}
              label={file ? file.name : "Click to upload or drag and drop"}
              subLabel="PDF up to 50MB"
            />

            <div className="doc-type">
              <p className="doc-label">Document Type</p>

              <label className="radio-row">
                <input
                  type="radio"
                  checked={docType === "main lease"}
                  onChange={() => setDocType("main lease")}
                />
                Original Lease Agreement
              </label>

              {/* <label className="radio-row">
              <input
                type="radio"
                checked={docType === "amendment"}
                onChange={() => setDocType("amendment")}
              />
              Amendment to existing lease
            </label> */}
            </div>

            <div className="button-row">
              <button
                className="btn-cancel"
                onClick={() => navigate("/landing")}
              >
                Cancel
              </button>

              <button
                className={`btn-upload ${isFormValid ? "active" : ""}`}
                disabled={!isFormValid || loading}
                onClick={handleUpload}
              >
                {loading ? "Uploading..." : "Upload & Process →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UploadLeaseStep;
