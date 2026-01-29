import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import PublicRoute from "./components/PublicRoute";
import PrivateRoute from "./components/PrivateRoute";

// Lazy load pages
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LeaseDetails = lazy(() => import("./pages/LeaseDetails"));
const AnalysisSuccess = lazy(() => import("./pages/AnalysisSuccess"));
const BuildPortfolio = lazy(() => import("./pages/BuildPortfolio"));
const PDFViewer = lazy(() => import("./pages/PDFViewer"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Settings = lazy(() => import("./pages/Settings"));

// Components
const TenantDashboard = lazy(() => import("./components/TenantDashboard"));
const QuickLeaseAnalysisCard = lazy(() => import("./components/QuickLeaseAnalysisCard"));
const QuickAnalysisInfo = lazy(() => import("./components/QuickAnalysisInfo"));
const AiLeaseAssistant = lazy(() => import("./components/AiLeaseAssistant"));
const PaymentSuccess = lazy(() => import("./components/PaymentSuccess"));
const PaymentFailed = lazy(() => import("./components/PaymentFailed"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failed" element={<PaymentFailed />} />
          <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/landing" element={<PrivateRoute><Landing /></PrivateRoute>} />
          <Route path="/analysis-success" element={<PrivateRoute><AnalysisSuccess /></PrivateRoute>} />
          <Route path="/lease-details/:leaseId" element={<PrivateRoute><LeaseDetails /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/tenant/:tenantId" element={<PrivateRoute><TenantDashboard /></PrivateRoute>} />
          <Route path="/quick-lease-analysis" element={<PrivateRoute><QuickLeaseAnalysisCard /></PrivateRoute>} />
          <Route path="/quick-analysis-info" element={<PrivateRoute><QuickAnalysisInfo /></PrivateRoute>} />
          <Route path="/ai-lease-assistant" element={<PrivateRoute><AiLeaseAssistant /></PrivateRoute>} />
          <Route path="/build-portfolio" element={<PrivateRoute><BuildPortfolio /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/pdf-viewer" element={<PDFViewer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </BrowserRouter>
  );
}

export default App;
