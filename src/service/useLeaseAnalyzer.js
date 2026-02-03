import api from "./api";

const USE_PARALLEL = import.meta.env.VITE_PARALLEL === "true" || import.meta.env.VITE_PARALLEL === true;

export const LEASE_ANALYSIS_STEPS = [
  { key: "info", endpoint: "/api/debug/info" },
  { key: "space", endpoint: "/api/debug/space" },
  { key: "charge-schedules", endpoint: "/api/debug/charge-schedules" },
  { key: "misc", endpoint: "/api/debug/misc" },
  { key: "audit", endpoint: "/api/debug/audit" },
  { key: "executive-summary", endpoint: "/api/debug/executive-summary" }
];

export const useLeaseAnalyzer = () => {
  const totalSteps = LEASE_ANALYSIS_STEPS.length;

  const checkAbstractsRemaining = () => {
    const remaining = sessionStorage.getItem("remainingAbstracts");
    return remaining !== null && parseInt(remaining, 10) > 0;
  };

  const triggerProcessAbstract = async (event) => {
    try {
      await api.post("/api/subscriptions/process-abstract", { event });
    } catch (error) {
      console.error("Failed to trigger process-abstract:", error);
      throw error;
    }
  };

  const runLeaseAnalysis = async ({ formData, onStepChange }) => {
    // Check if abstracts are available before starting analysis
    if (!checkAbstractsRemaining()) {
      throw new Error("No abstracts remaining. Please upgrade your plan.");
    }

    const leaseDetails = {};

    // Trigger process-abstract before analysis
    await triggerProcessAbstract("abstract triggered");

    if (USE_PARALLEL) {
      // Run all analysis steps in parallel for faster results
      const promises = LEASE_ANALYSIS_STEPS.map(async (step) => {
        const res = await api.post(step.endpoint, formData);
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
      for (let i = 0; i < totalSteps; i++) {
        const step = LEASE_ANALYSIS_STEPS[i];
        if (onStepChange) {
          onStepChange(i, totalSteps);
        }

        const res = await api.post(step.endpoint, formData);

        leaseDetails[step.key] = res.data;
      }
    }

    return leaseDetails;
  };

  const runCamAnalysis = async ({ formData }) => {
    // Check if abstracts are available before starting analysis
    if (!checkAbstractsRemaining()) {
      throw new Error("No abstracts remaining. Please upgrade your plan.");
    }

    await triggerProcessAbstract("cam triggered");

    const res = await api.post("/api/debug/cam-single", formData);
    return { "cam-single": res.data };
  };

  return { runLeaseAnalysis, runCamAnalysis, totalSteps };
};
