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
import FloatingSignOut from "./FloatingSingout";
import AddToportfolio from "./AddToportfolio";
import { deleteLeaseFile } from "../service/leaseFileStore";


const QuickAnalysisInfo = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("Info");
     const [showAiAssistant, setShowAiAssistant] = useState(false);
     const leaseData = sessionStorage.getItem("quickLeaseAnalysis");
     const [showAddToPortfolio, setShowAddToPortfolio] = useState(false);
     //const leaseDetails = leaseData ? JSON.parse(leaseData).leaseDetails : null;
    const [leaseDetails, setLeaseDetails] = useState(
  JSON.parse(sessionStorage.getItem("quickLeaseAnalysis") || "{}").leaseDetails || {}
);

const handleUpdateLeaseDetails = (updatedDetails) => {
  setLeaseDetails(updatedDetails);
  const quickLeaseAnalysis = JSON.parse(sessionStorage.getItem("quickLeaseAnalysis") || "{}");
  quickLeaseAnalysis.leaseDetails = updatedDetails;
  sessionStorage.setItem("quickLeaseAnalysis", JSON.stringify(quickLeaseAnalysis));
};

const handleAnalyzeAnotherLease = async () => {
  try {
    const stored = JSON.parse(sessionStorage.getItem("quickLeaseAnalysis") || "{}");
    const fileId = stored?.uploadedFile?.id;
    if (fileId) {
      await deleteLeaseFile(fileId);
    }
  } catch (e) {
    console.warn("Failed to cleanup stored lease file", e);
  } finally {
    sessionStorage.removeItem("quickLeaseAnalysis");
    navigate("/quick-lease-analysis");
  }
};

  return (
    <>
    <FloatingSignOut />
    <div className="quick-analysis-info">
      <div className="qai-fixed-header">
        <div className="qai-header-bar">
          <div className="qai-header-left">
            <h4>{leaseData ? JSON.parse(leaseData).leaseName : ""}</h4>
            <p>Analysis complete</p>
          </div>

          <div className="qai-header-right">
            <button
              className="btn btn-outline-light btn-sm"
              onClick={() => setShowAddToPortfolio(true)}
            >
              Add to Portfolio
            </button>

            <AddToportfolio
              show={showAddToPortfolio}
              onClose={() => setShowAddToPortfolio(false)}
              onSuccess={() => setShowAddToPortfolio(false)} 
            />
            <button
            className="btn btn-outline-light btn-sm"
            onClick={handleAnalyzeAnotherLease}
            >
            Analyze Another Lease
            </button>

            {/* <MessageSquare
            className="qai-header-icon"
            onClick={() => setShowAiAssistant(true)}
            /> */}

            <Download className="qai-header-icon" />
            <X className="qai-header-icon" onClick={() => navigate("/landing")} />
          </div>
        </div>
        {/* <div className="qai-summary">
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
        </div> */}

        </div> 
        <LeaseMainContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          leaseDetails={leaseDetails}
          onUpdateLeaseDetails={handleUpdateLeaseDetails}
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
