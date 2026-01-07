import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Check if parallel execution is enabled via environment variable
const USE_PARALLEL = import.meta.env.VITE_PARALLEL === "true" || import.meta.env.VITE_PARALLEL === true;

// Exported so callers can know how many backend
// analysis steps are run, for progress mapping.
// Note: cam-single is excluded from initial analysis and triggered on-demand
export const LEASE_ANALYSIS_STEPS = [
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

    if (USE_PARALLEL) {
      // Run all analysis steps in parallel for faster results
      const promises = LEASE_ANALYSIS_STEPS.map(async (step) => {
        const res = await axios.post(`${BASE_URL}${step.endpoint}`, formData);
        return { key: step.key, data: res.data };
      });

      const results = await Promise.all(promises);
      
      // Report completion - all steps done (parallel execution means progress jumps)
      if (onStepChange) {
        onStepChange(totalSteps - 1, totalSteps);
      }
      
      // Combine all results into leaseDetails
      results.forEach(({ key, data }) => {
        leaseDetails[key] = data;
      });
    } else {
      // Run analysis steps sequentially (original behavior)
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
    }

    return leaseDetails;
  };

  const runCamAnalysis = async ({ formData }) => {
    const res = await axios.post(`${BASE_URL}/api/debug/cam-single`, formData);
    return { "cam-single": res.data };
  };

  return { runLeaseAnalysis, runCamAnalysis, totalSteps };
};
