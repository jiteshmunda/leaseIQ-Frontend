import axios from "axios";
import { showError } from "./toast";

let isLoggingOut = false;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

let lastSubCheck = 0;
const SUB_CHECK_INTERVAL = 30000; // 30 seconds cache to avoid overloading

const checkAbstractsAvailable = () => {
  const remaining = sessionStorage.getItem("remainingAbstracts");
  return remaining !== null && parseInt(remaining, 10) > 0;
};

const updateSubscriptionStorage = (data) => {
  const hasSubscription = data?.hasSubscription;
  const subscription = data?.subscription;

  if (hasSubscription !== undefined) {
    sessionStorage.setItem("hasSubscription", hasSubscription);
  }

  if (subscription) {
    const planId = subscription.planId;
    const billingInterval = subscription.billing?.interval;
    const remainingAbstracts = subscription.remainingAbstractsThisMonth;

    if (planId) sessionStorage.setItem("planId", planId);
    if (billingInterval) sessionStorage.setItem("billingInterval", billingInterval);
    if (remainingAbstracts !== undefined) {
      sessionStorage.setItem("remainingAbstracts", remainingAbstracts);
    }

    window.dispatchEvent(new CustomEvent("subscriptionUpdate", {
      detail: { hasSubscription, ...subscription }
    }));
  }
};

api.interceptors.request.use(async (config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Check abstract availability for restricted debug endpoints
  const restrictedEndpoints = [
    "/api/debug/info",
    "/api/debug/space",
    "/api/debug/charge-schedules",
    "/api/debug/misc",
    "/api/debug/audit",
    "/api/debug/executive-summary",
    "/api/debug/cam-single"
  ];

  const isRestrictedEndpoint = restrictedEndpoints.some(endpoint =>
    config.url.includes(endpoint)
  );

  if (isRestrictedEndpoint && !checkAbstractsAvailable()) {
    showError("Abstract limit reached. Please upgrade your plan to continue.");
    return Promise.reject(new Error("No abstracts remaining"));
  }

  if (
    config._skipSubCheck ||
    config.url.includes("/api/subscriptions/status") ||
    config.url.includes("/auth/") ||
    !token
  ) {
    return config;
  }

  try {
    const now = Date.now();
    if (now - lastSubCheck > SUB_CHECK_INTERVAL) {
      const res = await api.get("/api/subscriptions/status", { _skipSubCheck: true });
      lastSubCheck = now;

      updateSubscriptionStorage(res.data);

      if (!res.data.hasSubscription && window.location.pathname !== "/landing") {
        window.location.href = "/landing";
        return Promise.reject(new Error("Subscription required"));
      }
    }
  } catch (error) {
    console.error("Subscription check failed", error);
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config.url.includes("/api/subscriptions/status")) {
      updateSubscriptionStorage(response.data);
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    const token = sessionStorage.getItem("token");

    if (
      token &&
      (status === 401 || status === 403) &&
      !isLoggingOut
    ) {
      isLoggingOut = true;

      showError(message || "Session expired. Please log in again.");

      setTimeout(() => {
        sessionStorage.clear();
        window.location.href = "/";
      }, 1500);
    }

    return Promise.reject(error);
  }
);

export default api;
