import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/landing.css";
import FloatingSignOut from "../components/FloatingSingout";
import api from "../service/api.js";
import { User, Check, X, Bell, ChevronDown } from "lucide-react";
import { showError, showSuccess } from "../service/toast";
import AnimatedBackground from "../components/AnimatedBackground";

const Landing = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Retrieve user data directly from sessionStorage
  const username = sessionStorage.getItem("username");
  const role = sessionStorage.getItem("role");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/tenants");
        if (cancelled) return;
        setTenants(res.data.data || []);
        try {
          await api.post("/api/leases/update-periods");
        } catch (err) {
          // Don't block landing if this background update fails
          console.error("Failed to update lease periods", err);
        }

        // Fetch pending requests if role is org_admin
        if (role === "org_admin") {
          const pendingRes = await api.get("/api/users/pending");
          if (cancelled) return;
          // Accessing the data array from the response
          setPendingUsers(pendingRes.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const handleReview = async (userId, action) => {
    try {
      // PATCH review action: approve or reject
      await api.patch(`/api/users/${userId}/review`, { action });
      showSuccess(`User ${action}ed successfully`);
      // Update local state using _id from the MongoDB response
      setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      showError(err.response?.data?.message || "Action failed");
    }
  };

  const hasPending = pendingUsers.length > 0;
  const portfolioTitle = (() => {
    const isEmpty = tenants.length === 0;

    if (role === "org_admin" || role === "user") {
      return isEmpty ? "Build Organization Portfolio" : "Manage Organization Portfolio";
    }
    return isEmpty ? "Build My Portfolio" : "Go to Portfolio";
  })();
  const portfolioRoute = tenants.length === 0 ? "/build-portfolio" : "/dashboard";
  const portfolionavigation = tenants.length === 0 ? "Set up Portfolio" : "View Portfolio";

  return (
    <>
      <AnimatedBackground />
      <div className="landing-page">
        <FloatingSignOut />

        {/* Top Right User Profile with Unread Style Logic */}
        <div
          className={`user-profile-nav ${role === "org_admin" ? "clickable" : ""} ${hasPending ? "has-unread" : ""}`}
          onClick={() => role === "org_admin" && setShowAdminPanel(!showAdminPanel)}
        >
          <div className="user-info-badge">
            <div className="user-icon-wrapper">
              <User size={18} />
              {hasPending && <span className="notification-dot"></span>}
            </div>
            <span className={`display-username ${hasPending ? "unread-text" : ""}`}>
              {username}
            </span>
            {role === "org_admin" && <ChevronDown size={14} className={showAdminPanel ? "rotate" : ""} />}
          </div>
        </div>

        <div className="landing-header">
          <h1>Welcome to LeaseIQ</h1>
          <p>Choose how you'd like to get started</p>
        </div>

        {/* Cards */}
        <div className="landing-cards" style={{ cursor: "pointer" }}>
          <div className="landing-card" onClick={() => navigate(portfolioRoute)}>
            <div className="icon-box blue">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                xmlns="http://www.w3.org/2000/svg">

                <path class="box" d="M3 21V3H21V21H3Z"
                  stroke="#5A3DF0" stroke-width="2" />

                <path class="bar1" d="M7 17V13H11V17H7Z"
                  stroke="#5A3DF0" stroke-width="2" />

                <path class="bar2" d="M13 17V7H17V17H13Z"
                  stroke="#5A3DF0" stroke-width="2" />
              </svg>

            </div>
            <h3>{portfolioTitle}</h3>
            <p>I want to organize my properties and track multiple leases</p>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate(portfolioRoute); }}>
              {portfolionavigation} →
            </a>
          </div>

          <div className="landing-card" onClick={() => navigate("/quick-lease-analysis")}>
            <div className="icon-box purple">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                xmlns="http://www.w3.org/2000/svg">

                <path class="bolt"
                  d="M13 2L3 14H11L9 22L21 10H13V2Z"
                  stroke="#8A2BE2"
                  stroke-width="2"
                  fill="none" />
              </svg>

            </div>
            <h3>Quick Lease Analysis</h3>
            <p>I just need to analyze one lease document right now</p>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/quick-lease-analysis"); }}>
              Upload Lease →
            </a>
          </div>
        </div>

        {/* Dropdown Admin Approval Section */}
        {role === "org_admin" && showAdminPanel && (
          <div className="admin-review-panel dropdown-panel">
            <div className="panel-header">
              <Bell size={20} />
              <h4>Notifications</h4>
              {pendingUsers.length > 0 && <span className="notification-count">{pendingUsers.length}</span>}
            </div>
            <div className="request-list">
              {pendingUsers.length === 0 ? (
                <div className="no-requests-toast">
                  <p>No new notifications</p>
                </div>
              ) : (
                pendingUsers.map((user) => (
                  <div key={user._id} className="request-toast">
                    <div className="toast-content">
                      <div className="notification-avatar">
                        {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                      </div>
                      <div className="request-info">
                        <span className="req-name">{user.name}</span>
                        <span className="req-email">{user.email}</span>
                      </div>
                    </div>
                    <div className="request-btns">
                      <button className="btn-approve" onClick={() => handleReview(user._id, "approve")} title="Approve">
                        <Check size={14} />
                      </button>
                      <button className="btn-reject" onClick={() => handleReview(user._id, "reject")} title="Reject">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="landing-footer">Need help? Contact support@leaseiq.com</div>
      </div>
    </>
  );
};

export default Landing;