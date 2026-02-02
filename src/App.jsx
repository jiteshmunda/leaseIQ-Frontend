import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import PublicRoute from "./components/PublicRoute";
import PrivateRoute from "./components/PrivateRoute";

// Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import LeaseDetails from "./pages/LeaseDetails";
import AnalysisSuccess from "./pages/AnalysisSuccess";
import BuildPortfolio from "./pages/BuildPortfolio";
import PDFViewer from "./pages/PDFViewer";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

// Components
import TenantDashboard from "./components/TenantDashboard";
import QuickLeaseAnalysisCard from "./components/QuickLeaseAnalysisCard";
import QuickAnalysisInfo from "./components/QuickAnalysisInfo";
import AiLeaseAssistant from "./components/AiLeaseAssistant";
import PaymentSuccess from "./components/PaymentSuccess";
import PaymentFailed from "./components/PaymentFailed";

function App() {
  return (
    <BrowserRouter>
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
