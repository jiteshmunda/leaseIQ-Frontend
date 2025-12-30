import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  DollarSign,
  FileText,
  Home,
  MessageSquare,
  Download,
  X,
} from "lucide-react";
import AiLeaseAssistant from "../components/AiLeaseAssistant";
import "../styles/QuickAnalysisInfo.css";
import LeaseMainContent from "../components/LeaseMainContent";


const QuickAnalysisInfo = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("Info");
     const [showAiAssistant, setShowAiAssistant] = useState(false);
 


  return (
    <>
    <div className="quick-analysis-info">

      {/* ================= FIXED HEADER ================= */}
      <div className="qai-fixed-header">

        {/* ===== PURPLE HEADER BAR ===== */}
        <div className="qai-header-bar">
          <div className="qai-header-left">
            <h4>Technology_Strategic_Analysis_2025-12-17</h4>
            <p>Analysis complete</p>
          </div>

          <div className="qai-header-right">
            <button
            className="btn btn-light btn-sm"
            onClick={() => navigate("/quick-lease-analysis")}
            >
            Analyze Another Lease
            </button>

            <MessageSquare
            className="qai-header-icon"
            onClick={() => setShowAiAssistant(true)}
            />

            <Download className="qai-header-icon" />
            <X className="qai-header-icon" onClick={() => navigate("/landing")} />
          </div>
        </div>

        {/* ===== SUMMARY CARDS ===== */}
        <div className="qai-summary">
          <div className="qai-summary-card">
            <Calendar className="qai-summary-icon blue" />
            <strong>26</strong>
            <p>key dates found</p>
          </div>

          <div className="qai-summary-card">
            <DollarSign className="qai-summary-icon purple" />
            <strong>8</strong>
            <p>rent schedules found</p>
          </div>

          <div className="qai-summary-card">
            <FileText className="qai-summary-icon pink" />
            <strong>12</strong>
            <p>important terms found</p>
          </div>

          <div className="qai-summary-card">
            <Home className="qai-summary-icon indigo" />
            <strong>4</strong>
            <p>CAM provisions found</p>
          </div>
        </div>

        </div> 
        <LeaseMainContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

    </div>
    <AiLeaseAssistant
      open={showAiAssistant}
      onClose={() => setShowAiAssistant(false)}
    />
    </>
  );
};

export default QuickAnalysisInfo;
