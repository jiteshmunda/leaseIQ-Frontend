import React from "react";
import "../styles/analysisSuccess.css";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, LayoutDashboard, FileText, ArrowRight, User, Boxes } from "lucide-react";
import FloatingSignOut from "../components/FloatingSingout";
import AnimatedBackground from "../components/AnimatedBackground";

const AnalysisSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const leaseId = location.state?.leaseId;
  const tenantName = location.state?.tenantName || "New Tenant";
  const unitNumber = location.state?.unitNumber || "N/A";

  return (
    <>
      <AnimatedBackground />
      <div className="success-page">
        <FloatingSignOut />

        <div className="success-content-wrapper">
          <div className="success-card">
            <div className="success-icon-container">
              <div className="success-icon-bg">
                <CheckCircle2 size={42} className="check-icon-main" />
              </div>
              <div className="glow-effect" />
            </div>

            <div className="text-content">
              <h4>Analysis Complete!</h4>
              <p className="success-subtitle">
                The lease for <strong>{tenantName}</strong> has been successfully processed and added to your portfolio.
              </p>
            </div>

            <div className="insight-container">
              <div className="insight-card-compact">
                <div className="insight-icon-sm purple">
                  <User size={18} />
                </div>
                <div className="insight-info">
                  <span className="insight-value">{tenantName}</span>
                  <span className="insight-label">Tenant Name</span>
                </div>
              </div>

              <div className="insight-card-compact">
                <div className="insight-icon-sm blue">
                  <Boxes size={18} />
                </div>
                <div className="insight-info">
                  <span className="insight-value">{unitNumber}</span>
                  <span className="insight-label">Unit Number</span>
                </div>
              </div>
            </div>

            <div className="action-grid">
              <button
                className="action-card primary-action"
                disabled={!leaseId}
                onClick={() => navigate(`/lease-details/${leaseId}`)}
              >
                <div className="action-icon-box">
                  <FileText size={24} />
                </div>
                <div className="action-text">
                  <span>View Details</span>
                  <small>Review Abstraction</small>
                </div>
                <ArrowRight size={18} className="arrow-hover" />
              </button>

              <button
                className="action-card secondary-action btn-outline-primary"
                onClick={() => navigate("/dashboard")}
              >
                <div className="action-icon-box">
                  <LayoutDashboard size={24} />
                </div>
                <div className="action-text">
                  <span>Dashboard</span>
                  <small>Portfolio overview</small>
                </div>
                <ArrowRight size={18} className="arrow-hover" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalysisSuccess;
