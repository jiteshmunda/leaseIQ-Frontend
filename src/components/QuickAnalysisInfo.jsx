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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument } from "pdf-lib";

import AiLeaseAssistant from "../components/AiLeaseAssistant";
import LeaseMainContent from "../components/LeaseMainContent";
import FloatingSignOut from "./FloatingSingout";
import AddToportfolio from "./AddToportfolio";
import { deleteLeaseFile, getLeaseFile } from "../service/leaseFileStore";
import "../styles/QuickAnalysisInfo.css";

const QuickAnalysisInfo = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Info");
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownloadReport = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const fileId = parsedLeaseData?.uploadedFile?.id;
      const storedFileData = await getLeaseFile(fileId);
      if (!storedFileData || !storedFileData.blob)
        throw new Error("File not found.");
      const originalPdfBytes = await storedFileData.blob.arrayBuffer();

      const summaryDoc = new jsPDF();
      let currentY = 20;

      // BRANDING & HEADER
      summaryDoc.setFontSize(24);
      summaryDoc.setTextColor(100, 43, 226);
      summaryDoc.text("Lease Analysis Summary", 14, currentY);
      currentY += 15;

      // 1. INFO TAB - BASIC INFO
      summaryDoc.setFontSize(16);
      summaryDoc.setTextColor(0);
      summaryDoc.text("Lease Overview", 14, currentY);

      const infoTable = [
        ["Lease", leaseDetails.lease || "N/A"],
        ["Property", leaseDetails.property || "N/A"],
        ["Address", leaseDetails.propertyAddress || "N/A"],
        ["Tenant", leaseDetails.leaseTo || "N/A"],
        ["Landlord", leaseDetails.leaseFrom || "N/A"],
        ["Rentable Area", leaseDetails.squareFeet || "N/A"],
      ];

      autoTable(summaryDoc, {
        startY: currentY + 5,
        body: infoTable,
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: "bold", width: 40 } },
      });
      currentY = summaryDoc.lastAutoTable.finalY + 15;

      // 2. SPACE TAB
      summaryDoc.setFontSize(16);
      summaryDoc.text("Space Details", 14, currentY);
      const spaceData = parsedLeaseData.space || {};
      const spaceTable = [
        ["Premises", spaceData.premises || "N/A"],
        ["Unit", spaceData.unit || "N/A"],
        ["Building", spaceData.building || "N/A"],
        ["Area (Rentable)", spaceData.areaRentable || "14,952 sq ft"],
        ["Area (Usable)", spaceData.areaUsable || "12,824 sq ft"],
      ];
      autoTable(summaryDoc, {
        startY: currentY + 5,
        body: spaceTable,
        theme: "grid",
        headStyles: { fillColor: [100, 43, 226] },
      });
      currentY = summaryDoc.lastAutoTable.finalY + 15;

      // 3. RENT SCHEDULES
      summaryDoc.addPage();
      currentY = 20;
      summaryDoc.setFontSize(16);
      summaryDoc.text("Rent & Late Fee Information", 14, currentY);
      const rentData = parsedLeaseData.rentSchedules || {};
      const rentTable = [
        ["Calculation Type", rentData.calcType || "N/A"],
        ["Grace Days", rentData.graceDays || "N/A"],
        ["Late Fee Percent", rentData.percent || "N/A"],
        ["Per Day Fee", rentData.perDayFee || "N/A"],
      ];
      autoTable(summaryDoc, {
        startY: currentY + 5,
        body: rentTable,
        theme: "striped",
        head: [["Metric", "Value"]],
      });
      currentY = summaryDoc.lastAutoTable.finalY + 15;

      // 4. AUDIT TAB
      summaryDoc.setFontSize(16);
      summaryDoc.text("Audit Findings", 14, currentY);
      const auditIssues = [
        ["Date Uncertainty", "High", "Page 1, 3, 5, 6, 7"],
        ["Missing Critical Field", "High", "Page 5, 9, 10"],
        ["Financial Ambiguity", "Medium", "Page 1, 2, 6, 7"],
        ["Operational Risk", "High", "Page 1, 2, 5, 6, 7"],
      ];
      autoTable(summaryDoc, {
        startY: currentY + 5,
        head: [["Issue Type", "Risk Level", "References"]],
        body: auditIssues,
        theme: "grid",
        headStyles: { fillColor: [220, 53, 69] },
      });
      currentY = summaryDoc.lastAutoTable.finalY + 15;

      // 5. CAM PROVISIONS
      summaryDoc.addPage();
      currentY = 20;
      summaryDoc.setFontSize(16);
      summaryDoc.text("CAM Provisions & Protections", 14, currentY);
      const camData = [
        ["Tenant Protections", "All deductible cap on building operating expenses..."],
        ["Tenant Expenses", "Insurance CAM includes only premiums for policies..."],
      ];
      autoTable(summaryDoc, {
        startY: currentY + 5,
        body: camData,
        styles: { overflow: "linebreak", cellWidth: "wrap" },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: "bold" },
          1: { cellWidth: 130 },
        },
      });

      const summaryPdfBytes = summaryDoc.output("arraybuffer");

      // MERGE PDFs
      const mergedPdf = await PDFDocument.create();
      const originalPdfDoc = await PDFDocument.load(originalPdfBytes);
      const summaryPdfDoc = await PDFDocument.load(summaryPdfBytes);

      const originalPages = await mergedPdf.copyPages(
        originalPdfDoc,
        originalPdfDoc.getPageIndices()
      );
      originalPages.forEach((p) => mergedPdf.addPage(p));

      const summaryPages = await mergedPdf.copyPages(
        summaryPdfDoc,
        summaryPdfDoc.getPageIndices()
      );
      summaryPages.forEach((p) => mergedPdf.addPage(p));

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Full_Report_${leaseDetails.lease || "Lease"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Error: " + e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <FloatingSignOut />
      <div className="quick-analysis-info">
        <div className="qai-fixed-header">
          <div className="qai-header-bar">
            <div className="qai-header-left">
              <h4>{parsedLeaseData.leaseName || "Lease Report"}</h4>
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

              {/* MessageSquare remains disabled as per teammate's change */}
              {/* <MessageSquare
                className="qai-header-icon"
                onClick={() => setShowAiAssistant(true)}
              /> */}

              <div
                style={{ cursor: isDownloading ? "wait" : "pointer", display: "inline-block" }}
                onClick={handleDownloadReport}
              >
                <Download
                  className={`qai-header-icon ${isDownloading ? "opacity-50" : ""}`}
                />
              </div>
              <X
                className="qai-header-icon"
                onClick={() => navigate("/landing")}
              />
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