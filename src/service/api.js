import axios from "axios";
import { showError } from "./toast";

let isLoggingOut = false;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

let lastSubCheck = 0;
const SUB_CHECK_INTERVAL = 30000; // 30 seconds cache to avoid overloading

api.interceptors.request.use(async (config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

      const hasSubscription = res.data.hasSubscription;

      const role = sessionStorage.getItem("role");
      if (role === "org_admin") {
        const subscription = res.data.subscription;
        const planId = subscription?.planId;
        const billingInterval = subscription?.billing?.interval;

        if (planId) sessionStorage.setItem("planId", planId);
        if (billingInterval) sessionStorage.setItem("billingInterval", billingInterval);

        console.log("Subscription status updated for org_admin:", { planId, billingInterval });
      }

      if (!hasSubscription && window.location.pathname !== "/landing") {
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
  (response) => response,
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
