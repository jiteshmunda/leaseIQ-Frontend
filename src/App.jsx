import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import AnalysisSuccess from "./pages/AnalysisSuccess";
import LeaseDetails from "./pages/LeaseDetails";
import Unit from "./pages/Unit";
import Dashboard from "./pages/Dashboard";
import TenantDashboard from "./components/TenantDashboard";
import QuickLeaseAnalysisCard from "./components/QuickLeaseAnalysisCard";
import QuickAnalysisInfo from "./components/QuickAnalysisInfo";
import AiLeaseAssistant from "./components/AiLeaseAssistant";
import BuildPortfolo from "./pages/BuildPortfolio";
import Signup from "./pages/Signup";
import PDFViewer from "./pages/PDFViewer";
import NotFound from "./pages/NotFound";

import PublicRoute from "./components/PublicRoute";
import PrivateRoute from "./components/PrivateRoute";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/landing" element={<PrivateRoute><Landing /></PrivateRoute>} />
        <Route path="/analysis-success" element={<PrivateRoute><AnalysisSuccess /></PrivateRoute>} />
        <Route path="/lease-details/:leaseId" element={<PrivateRoute><LeaseDetails /></PrivateRoute>} />
        <Route path="/units" element={<PrivateRoute><Unit /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/tenant/:tenantId" element={<PrivateRoute><TenantDashboard /></PrivateRoute>} />
        <Route path="/quick-lease-analysis" element={<PrivateRoute><QuickLeaseAnalysisCard /></PrivateRoute>} />
        <Route path="/quick-analysis-info" element={<PrivateRoute><QuickAnalysisInfo /></PrivateRoute>} />
        <Route path="/ai-lease-assistant" element={<PrivateRoute><AiLeaseAssistant /></PrivateRoute>} />
        <Route path="/build-portfolio" element={<PrivateRoute><BuildPortfolo /></PrivateRoute>} />
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
