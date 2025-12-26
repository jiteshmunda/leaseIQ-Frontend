import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const LEASE_ANALYSIS_STEPS = [
  { key: "cam-single", endpoint: "/api/debug/cam-single" },
  { key: "info", endpoint: "/api/debug/info" },
  { key: "space", endpoint: "/api/debug/space" },
  { key: "charge-schedules", endpoint: "/api/debug/charge-schedules" },
  { key: "misc", endpoint: "/api/debug/misc" },
];

export const useLeaseAnalyzer = () => {
  const runLeaseAnalysis = async ({ formData, onStepChange }) => {
    const leaseDetails = {};

    for (let i = 0; i < LEASE_ANALYSIS_STEPS.length; i++) {
      const step = LEASE_ANALYSIS_STEPS[i];

      onStepChange?.(i);


      const res = await axios.post(
        `${BASE_URL}${step.endpoint}`,
        formData
      );

      leaseDetails[step.key] = res.data;
    }

    return leaseDetails;
  };

  return { runLeaseAnalysis };
};
