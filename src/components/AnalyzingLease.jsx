import React from "react";
import { CheckCircle2, Loader2, Info } from "lucide-react";
import "../styles/analyzingLease.css";
import AnimatedBackground from "./AnimatedBackground";

const steps = [
  "Document uploaded",
  "Text extracted",
  "Building the lease portfolio...",
  "Identifying rent schedules...",
  "Finding provisions...",
  "Running audit checks...",
];

const AnalyzingLease = ({ activeStep = 0 }) => {
  const progress = Math.round(((activeStep + 1) / steps.length) * 100);

  return (
    <>
      <AnimatedBackground />
      <div className="analyzing-page">
        <div className="analyzing-card">
          <h4>Analyzing your lease...</h4>

          <p className="subtitle-analyzinglease">
            Analyzing your document for key insights
          </p>

          <div className="progress-container">
            <div className="progress-header">
              <span className="progress-label">Processing</span>
              <span className="progress-percent">{progress}%</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="steps-list">
            {steps.map((label, index) => {
              const isCompleted = index < activeStep;
              const isActive = index === activeStep;

              return (
                <div
                  className={`step-item ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                  key={index}
                >
                  <div className="step-icon-wrapper">
                    {isCompleted ? (
                      <CheckCircle2 className="step-check-icon" size={20} />
                    ) : isActive ? (
                      <Loader2 className="loader-spin" size={20} />
                    ) : (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e5e7eb' }} />
                    )}
                  </div>
                  <span className="step-text">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="footer-text">
            <Info size={14} /> ETA: 2–3 min
          </p>
        </div>
      </div>
    </>
  );
};

export default AnalyzingLease;
