import { BrowserRouter, Routes, Route } from "react-router-dom";
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



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/analysis-success" element={<AnalysisSuccess />} />
        <Route path="/lease-details" element={<LeaseDetails />} />
        <Route path="/units" element={<Unit />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tenant/:tenantName" element={<TenantDashboard />} />
        <Route path="/quick-lease-analysis"element={<QuickLeaseAnalysisCard />}/>
        <Route  path="/quick-analysis-info"  element={<QuickAnalysisInfo />}/>
        <Route path="/ai-lease-assistant" element={<AiLeaseAssistant />} />
        <Route path="/build-portfolio" element={<BuildPortfolo />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
