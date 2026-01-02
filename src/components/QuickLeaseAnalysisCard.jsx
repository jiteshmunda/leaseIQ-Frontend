import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { showError } from "../service/toast";
import { useLeaseAnalyzer } from "../service/useLeaseAnalyzer";
import AnalyzingLease from "./AnalyzingLease";
import "../styles/quickLease.css";

const QuickLeaseAnalysisCard = () => {
  const navigate = useNavigate();
  const { runLeaseAnalysis } = useLeaseAnalyzer();

  const [uploadedFile, setUploadedFile] = useState(null);
  const [leaseName, setLeaseName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState(0);

  // Convert file to base64 for storage
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!uploadedFile || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      setAnalyzingStep(0);

      const analysisForm = new FormData();
      analysisForm.append("assets", uploadedFile);

      const leaseDetails = await runLeaseAnalysis({
        formData: analysisForm,
        onStepChange: setAnalyzingStep,
      });

      // Convert file to base64 and store
      const base64File = await fileToBase64(uploadedFile);
      
      // Store everything in sessionStorage
      sessionStorage.setItem(
        "quickLeaseAnalysis",
        JSON.stringify({
          leaseName: String(leaseName || "").trim() || uploadedFile.name,
          leaseDetails,
          uploadedFile: {
            name: uploadedFile.name,
            type: uploadedFile.type,
            size: uploadedFile.size,
            base64: base64File,
          },
        })
      );

      navigate("/quick-analysis-info", { state: { source: "quick" } });
    } catch (err) {
      console.error(err);
      showError("Lease analysis failed");
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return <AnalyzingLease activeStep={analyzingStep} />;
  }

  return (
    <div className="quick-lease-page">
      
      {/* Centered card */}
      <div className="quick-lease-wrapper">
        <div className="back-link" onClick={() => navigate("/landing")}>
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
        <div className="upload-card">
          <h2>Quick Lease Analysis</h2>
          <p className="subtitle-uploadlease">
            Upload your lease document to get started
          </p>

          {/* Upload Box */}
          <label className="upload-box">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              hidden
              onChange={(e) => setUploadedFile(e.target.files[0])}
            />

            <div className="upload-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 16V4M12 4L7 9M12 4L17 9"
                  stroke="#5A3DF0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 20H20"
                  stroke="#5A3DF0"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <p className="upload-title">
              {uploadedFile ? uploadedFile.name : "Click to upload or drag and drop"}
            </p>
            <p className="upload-sub">PDF up to 50MB</p>
          </label>

          {/* Lease name */}
          <div className="lease-name">
            <label>Give this lease a name (optional)</label>
            <input
              type="text"
              placeholder="e.g. Downtown Office Lease"
              value={leaseName}
              onChange={(e) => setLeaseName(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="button-row">
            <button
              className="btn-cancel"
              onClick={() => navigate("/landing")}
            >
              Cancel
            </button>

            <button
              className={`btn-upload ${uploadedFile ? "active" : ""}`}
              disabled={!uploadedFile}
              onClick={handleAnalyze}
            >
              Analyze Lease →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickLeaseAnalysisCard;