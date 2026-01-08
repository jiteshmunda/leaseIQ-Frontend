//import { useLocation } from "react-router-dom";
import React from "react";
import "../styles/analyzingLease.css";

const steps = [
  "Document uploaded",
  "Text extracted",
  "Extracting key dates...",
  "Identifying rent schedules...",
  "Finding provisions...",
  "Running audit checks...",
];

const AnalyzingLease = ({ activeStep = 0 }) => {
  const progress = Math.round(((activeStep + 1) / steps.length) * 100);

  return (
    <div className="analyzing-page">
      <div className="analyzing-card">
        <h2>Analyzing your lease...</h2>

        <p className="subtitle-analyzinglease">
          Our AI is extracting key information from your document
        </p>

        <div className="progress-header">
          <span>Processing</span>
          <span className="progress-percent">{progress}%</span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="steps">
          {steps.map((label, index) => (
            <div className="step-row" key={index}>
              {index <= activeStep ? (
                <span className="step-check">✓</span>
              ) : (
                <span className="step-loader" />
              )}
              <span
                className={`step-text ${
                  index <= activeStep ? "done" : ""
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <p className="footer-text">
          This typically takes 2–3 minutes
        </p>
      </div>
    </div>
  );
};

export default AnalyzingLease;
