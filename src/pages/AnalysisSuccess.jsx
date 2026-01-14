import "../styles/analysisSuccess.css";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiCheckCircle,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiHome,
} from "react-icons/fi";
import FloatingSignOut from "../components/FloatingSingout";
import Gif from "../assets/icon-with-3d-house-financial-bill-clock-coins.jpg";
import AnimatedBackground from "../components/AnimatedBackground";

const AnalysisSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const leaseId = location.state?.leaseId;

  return (
    <>
    <AnimatedBackground />
    <div className="success-page">
      <FloatingSignOut />

      <div className="success-card">
        <div className="success-icon">
          <FiCheckCircle size={28} />
        </div>

        <h2>Lease Analyzed Successfully!</h2>
        <img src={Gif} sizes="" alt="Lease analyzed" className="success-gif" />

        {/* <div className="stats-grid">
          <div className="stat-box blue">
            <FiCalendar className="stat-icon" />
            <h3>26</h3>
            <p>key dates found</p>
          </div>

          <div className="stat-box purple">
            <FiDollarSign className="stat-icon" />
            <h3>8</h3>
            <p>rent payment schedules found</p>
          </div>

          <div className="stat-box pink">
            <FiFileText className="stat-icon" />
            <h3>12</h3>
            <p>important terms found</p>
          </div>

          <div className="stat-box indigo">
            <FiHome className="stat-icon" />
            <h3>4</h3>
            <p>CAM provisions found</p>
          </div>
        </div> */}

        <div className="secondary-actions">
          <button
            className="btn-secondary"
            disabled={!leaseId}
            onClick={() => navigate(`/lease-details/${leaseId}`)}
          >
            View Lease Details
          </button>

          <button
            className="btn-secondary"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default AnalysisSuccess;
