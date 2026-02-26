import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { showError, showSuccess } from "../service/toast";
import { useLeaseAnalyzer } from "../service/useLeaseAnalyzer";
import { saveLeaseFile } from "../service/leaseFileStore";
import AnalyzingLease from "./AnalyzingLease";
import "../styles/quickLease.css";
import AnimatedBackground from "./AnimatedBackground";
import DragDropUpload from "./DragDropUpload";

const QuickLeaseAnalysisCard = () => {
  const navigate = useNavigate();
  const { runLeaseAnalysis, totalSteps: analyzerSteps } = useLeaseAnalyzer();

  const [uploadedFile, setUploadedFile] = useState(null);
  const [leaseName, setLeaseName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState(0);

  const handleAnalyze = async () => {
    if (!uploadedFile || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      setAnalyzingStep(0);

      const analysisForm = new FormData();
      analysisForm.append("assets", uploadedFile);

      const leaseDetails = await runLeaseAnalysis({
        formData: analysisForm,
        onStepChange: (currentIndex, total) => {
          const totalAnalyzer = total || analyzerSteps || 1;
          const uiSteps = 6; // number of steps in AnalyzingLease

          const fraction = (currentIndex + 1) / totalAnalyzer;
          const uiIndex = Math.min(
            uiSteps - 1,
            Math.max(0, Math.floor(fraction * uiSteps) - 1)
          );

          setAnalyzingStep(uiIndex);
        },
      });

      // Store the raw file in IndexedDB (avoid putting large blobs in sessionStorage)
      const storedFile = await saveLeaseFile(uploadedFile);

      // Store analysis + file reference in sessionStorage
      sessionStorage.setItem(
        "quickLeaseAnalysis",
        JSON.stringify({
          leaseName: String(leaseName || "").trim() || uploadedFile.name,
          leaseDetails,
          uploadedFile: {
            id: storedFile.id,
            name: storedFile.name,
            type: storedFile.type,
            size: storedFile.size,
            lastModified: storedFile.lastModified,
          },
        })
      );

      // Ensure UI shows 100% complete
      setAnalyzingStep(6);

      showSuccess("Analysis complete!");

      setTimeout(() => {
        navigate("/quick-analysis-info", { state: { source: "quick" } });
      }, 2000);
    } catch (err) {
      console.error(err);
      showError(err?.message || "Lease analysis failed");
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return <AnalyzingLease activeStep={analyzingStep} />;
  }

  return (
    <>
      <AnimatedBackground />
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
            <DragDropUpload
              onFileSelect={(file) => setUploadedFile(file)}
              currentFile={uploadedFile}
              label={uploadedFile ? uploadedFile.name : "Click to upload or drag and drop"}
              subLabel="PDF up to 50MB"
              accept=".pdf,.doc,.docx"
            />

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
    </>
  );
};

export default QuickLeaseAnalysisCard;