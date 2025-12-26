import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
  const { runLeaseAnalysis } = useLeaseAnalyzer();
  const navigate = useNavigate();

  const handleSubmit = async ({ file, docType }) => {
  try {
    setLoading(true);
    setStep("analyzing");

    const analysisForm = new FormData();
    analysisForm.append("assets", file);

    const leaseDetails = await runLeaseAnalysis({
      formData: analysisForm,
      onStepChange: setAnalyzingStep,
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

    await axios.post(
      `${BASE_URL}/api/portfolio/`,
      portfolioForm,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    navigate("/analysis-success");
  } catch (err) {
    console.error(err);
    alert("Lease analysis failed");
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
