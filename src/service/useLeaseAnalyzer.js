import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Exported so callers can know how many backend
// analysis steps are run, for progress mapping.
export const LEASE_ANALYSIS_STEPS = [
  { key: "cam-single", endpoint: "/api/debug/cam-single" },
  { key: "info", endpoint: "/api/debug/info" },
  { key: "space", endpoint: "/api/debug/space" },
  { key: "charge-schedules", endpoint: "/api/debug/charge-schedules" },
  { key: "misc", endpoint: "/api/debug/misc" },
  {key: "audit", endpoint: "/api/debug/audit"},
  {key: "executive-summary",endpoint: "/api/debug/executive-summary"}
];

export const useLeaseAnalyzer = () => {
  const totalSteps = LEASE_ANALYSIS_STEPS.length;

  const runLeaseAnalysis = async ({ formData, onStepChange }) => {
    const leaseDetails = {};

    for (let i = 0; i < totalSteps; i++) {
      const step = LEASE_ANALYSIS_STEPS[i];

      // Report both the current index and total number of
      // analysis steps so callers can normalize progress.
      if (onStepChange) {
        onStepChange(i, totalSteps);
      }

      const res = await axios.post(`${BASE_URL}${step.endpoint}`, formData);

      leaseDetails[step.key] = res.data;
    }

    return leaseDetails;
  };

  return { runLeaseAnalysis, totalSteps };
};
