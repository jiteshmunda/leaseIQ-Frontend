import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  DollarSign,
  FileText,
  Home,
  MessageSquare,
  X,
} from "lucide-react";

import AiLeaseAssistant from "../components/AiLeaseAssistant";
import LeaseMainContent from "../components/LeaseMainContent";
import FloatingSignOut from "./FloatingSingout";
import AddToportfolio from "./AddToportfolio";
import DownloadLeaseDetailsDocx from "./DownloadLeaseDetailsDocx";
import { deleteLeaseFile, getLeaseFile } from "../service/leaseFileStore";
import "../styles/QuickAnalysisInfo.css";
import RemainingAbstractsBadge from "./RemainingAbstractsBadge";

const QuickAnalysisInfo = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Info");
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  const leaseData = sessionStorage.getItem("quickLeaseAnalysis");
  const parsedLeaseData = leaseData ? JSON.parse(leaseData) : {};
  const [showAddToPortfolio, setShowAddToPortfolio] = useState(false);

  const [leaseDetails, setLeaseDetails] = useState(
    parsedLeaseData.leaseDetails || {}
  );

  const handleUpdateLeaseDetails = (updatedDetails) => {
    setLeaseDetails(updatedDetails);
    const quickLeaseAnalysis = JSON.parse(
      sessionStorage.getItem("quickLeaseAnalysis") || "{}"
    );
    quickLeaseAnalysis.leaseDetails = updatedDetails;
    sessionStorage.setItem(
      "quickLeaseAnalysis",
      JSON.stringify(quickLeaseAnalysis)
    );
  };

  const handleAnalyzeAnotherLease = async () => {
    try {
      const fileId = parsedLeaseData?.uploadedFile?.id;
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

  const getLeaseFileForCam = async () => {
    const fileId = parsedLeaseData?.uploadedFile?.id;
    if (!fileId) {
      throw new Error("File ID not found");
    }
    const storedFileData = await getLeaseFile(fileId);
    if (!storedFileData || !storedFileData.blob) {
      throw new Error("File not found");
    }
    // Convert blob to File object for FormData
    return new File([storedFileData.blob], storedFileData.name, {
      type: storedFileData.type || "application/pdf",
    });
  };

  return (
    <>
      <FloatingSignOut />
      <div className="quick-analysis-info">
        <div className="qai-fixed-header">
          <div className="qai-header-bar">
            {/* Animated Background Elements */}
            <div className="header-animation-bg">
              <ul className="header-circles">
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
              </ul>
            </div>

            <div className="qai-header-left">
              <h4>{parsedLeaseData.leaseName || "Lease Report"}</h4>
              <p>Analysis complete</p>
            </div>

            <div className="qai-header-right">
              <RemainingAbstractsBadge />
              <button
                className="add-btn btn btn-outline-light btn-sm"
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
                className="analyze-btn btn btn-outline-light btn-sm"
                onClick={handleAnalyzeAnotherLease}
              >
                Analyze Another Lease
              </button>

              {/* MessageSquare remains disabled as per teammate's change */}
              {/* <MessageSquare
                className="qai-header-icon"
                onClick={() => setShowAiAssistant(true)}
              /> */}

              <div className="qai-header-icons">
                <DownloadLeaseDetailsDocx
                  leaseDetails={leaseDetails}
                  selectedDocumentName={parsedLeaseData?.leaseName || leaseDetails?.lease || "Lease"}
                  disabled={!leaseDetails}
                  buttonClassName="qai-header-icon-button"
                  iconClassName="qai-header-icon qai-docx-icon"
                />
                <X
                  className="qai-header-icon"
                  onClick={() => navigate("/landing")}
                />
              </div>
            </div>
          </div>

          {/* QAI Summary cards remain disabled as per teammate's change */}
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
          getLeaseFile={getLeaseFileForCam}
          documentId={parsedLeaseData?.uploadedFile?.id}
        />
      </div>
      <AiLeaseAssistant
        open={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
        leaseId={parsedLeaseData?.leaseId || parsedLeaseData?.lease_id}
        organizationId={parsedLeaseData?.organization_id}
      />
    </>
  );
};

export default QuickAnalysisInfo;