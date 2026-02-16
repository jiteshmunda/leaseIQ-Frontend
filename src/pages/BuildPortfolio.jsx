import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../service/toast.js";
import api from "../service/api.js";

import FloatingSignOut from "../components/FloatingSingout.jsx";
import AddPropertyStep from "../components/AddProperty.jsx";
import AddUnitSuiteStep from "../components/AddUnitSuite.jsx";
import UploadLeaseStep from "../components/uploadLease.jsx";
import AnalyzingLease from "../components/AnalyzingLease.jsx";

import { useLeaseAnalyzer } from "../service/useLeaseAnalyzer.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BuildPortfolio = () => {
  const [step, setStep] = useState(1);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [propertyData, setPropertyData] = useState({});
  const [unitData, setUnitData] = useState({});
  const [loading, setLoading] = useState(false);

  const token = sessionStorage.getItem("token");
  const { runLeaseAnalysis, totalSteps: analyzerSteps } = useLeaseAnalyzer();
  const navigate = useNavigate();

  const handleSubmit = async ({ file, docType }) => {
    try {
      setLoading(true);
      setStep("analyzing");

      const analysisForm = new FormData();
      analysisForm.append("assets", file);

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

      const portfolioForm = new FormData();

      portfolioForm.append("property_name", propertyData.propertyName);
      portfolioForm.append("address", propertyData.address);
      portfolioForm.append("unit_number", unitData.unitNumber);
      portfolioForm.append("tenant_name", unitData.tenantName);
      portfolioForm.append("square_ft", unitData.squareFootage);
      portfolioForm.append("document_type", docType);

      // ✅ REQUIRED by backend
      portfolioForm.append(
        "lease_details",
        JSON.stringify(leaseDetails)
      );
      portfolioForm.append("assets", file);

      const res = await api.post(
        `${BASE_URL}/api/portfolio/`,
        portfolioForm,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const leaseId = res.data?.data?.lease_id;

      // Ensure UI shows 100% complete
      setAnalyzingStep(6);

      showSuccess("Portfolio created successfully!");

      // Delay navigation to let user see "Success" state
      setTimeout(() => {
        navigate("/analysis-success", {
          state: {
            leaseId,
            tenantName: unitData.tenantName,
            unitNumber: unitData.unitNumber
          }
        });
      }, 2000);
    } catch (err) {
      console.error(err);
      showError("Lease analysis failed");
      setStep(3);
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
      <FloatingSignOut />

      {step === 1 && (
        <AddPropertyStep
          data={propertyData}
          setData={setPropertyData}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <AddUnitSuiteStep
          data={unitData}
          setData={setUnitData}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <UploadLeaseStep
          onBack={() => setStep(2)}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}

      {step === "analyzing" && (
        <AnalyzingLease activeStep={analyzingStep} />
      )}
    </>
  );
};

export default BuildPortfolio;
