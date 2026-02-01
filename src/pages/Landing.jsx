import React, { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/landing.css";
import FloatingSignOut from "../components/FloatingSingout";
import api from "../service/api.js";
import { User, Check, X, Bell, ChevronDown, Settings, Shield, UserCircle, LogOut, KeyRound } from "lucide-react";
import { showError, showSuccess } from "../service/toast";
import { Modal } from "react-bootstrap";
import AnimatedBackground from "../components/AnimatedBackground";
import PricePlanning from "../components/PricePlanning";

const Payment = lazy(() => import("../components/Payment"));

const Landing = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [confirmOrg, setConfirmOrg] = useState({ open: false, userId: null });
  const [submittingOrg, setSubmittingOrg] = useState(false);

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
        setHasPurchased(sessionStorage.getItem("hasPurchased") === "true");

        try {
          await api.post("/api/leases/update-periods");
        } catch (err) {
          console.error("Failed to update lease periods", err);
        }
        if (role === "org_admin") {
          const pendingRes = await api.get("/api/users/pending");
          if (cancelled) return;
          setPendingUsers(pendingRes.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
        setHasPurchased(sessionStorage.getItem("hasPurchased") === "true");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const handleReview = async (userId, action) => {
    try {
      // PATCH review action: approve or reject
      const res = await api.patch(`/api/users/${userId}/review`, { action });

      if (action === "approve" && res.data.requiresPayment) {
        setConfirmOrg({ open: true, userId });
        return;
      }

      showSuccess(`User ${action}ed successfully`);
      // Update local state using _id from the MongoDB response
      setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      showError(err.response?.data?.message || "Action failed");
    }
  };

  const handleConfirmOrgSubscription = async () => {
    let planId = sessionStorage.getItem("planId");
    let billingInterval = sessionStorage.getItem("billingInterval");

    if (!planId || !billingInterval) {
      try {
        setSubmittingOrg(true);
        const res = await api.get("/api/subscriptions/status", { _skipSubCheck: true });
        const subscription = res.data.subscription;
        planId = subscription?.planId;
        billingInterval = subscription?.billing?.interval;

        if (planId) sessionStorage.setItem("planId", planId);
        if (billingInterval) sessionStorage.setItem("billingInterval", billingInterval);
      } catch (err) {
        console.error("Failed to fetch fallback subscription status", err);
      }
    }

    if (!planId || !billingInterval) {
      showError("Organization plan details not found. Please ensure your organization has an active plan.");
      setSubmittingOrg(false);
      return;
    }

    const userId = confirmOrg.userId;
    try {
      setSubmittingOrg(true);
      await api.post("/api/subscriptions/organization/user", {
        planId,
        userId,
        billingInterval
      });

      showSuccess("User approved and organization plan applied");
      setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
      setConfirmOrg({ open: false, userId: null });
    } catch (err) {
      showError(err.response?.data?.message || "Failed to apply organization plan");
    } finally {
      setSubmittingOrg(false);
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

  const [hasPurchased, setHasPurchased] = useState(
    sessionStorage.getItem("hasPurchased") === "true"
  );

  // ... (existing helper logic)

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState('monthly');

  const handlePlanSelection = (plan, cycle) => {
    setSelectedPlan(plan);
    setSelectedCycle(cycle);
  };



  return (
    <>
      <AnimatedBackground />
      <div className="landing-page">
        <FloatingSignOut />

        {/* Top Right User Profile with Unread Style Logic */}
        <div className="user-profile-nav clickable" onClick={() => setShowProfileMenu(!showProfileMenu)}>
          <div className="user-info-badge">
            <div className="user-icon-wrapper">
              <UserCircle size={20} />
              {hasPending && <span className="notification-dot"></span>}
            </div>
            <span className={`display-username ${hasPending ? "unread-text" : ""}`}>
              {username}
            </span>
            <ChevronDown size={14} className={showProfileMenu ? "rotate" : ""} />
          </div>

          {showProfileMenu && (
            <div className="profile-dropdown-menu">
              <div
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(false);
                }}
              >
                <UserCircle size={16} />
                <span>Landing</span>
              </div>
              <div
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/settings");
                  setShowProfileMenu(false);
                }}
              >
                <Settings size={16} />
                <span>Info</span>
              </div>
            </div>
          )}
        </div>

        <div className="landing-header">
          <h1>Welcome to LeaseIQ</h1>
          <p>Choose how you'd like to get started</p>
        </div>

        {/* Show pricing until a plan is selected */}
        {!hasPurchased ? (
          <div className="pricing-section-wrapper" style={{
            marginTop: '0.5rem',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1
          }}>
            {selectedPlan ? (
              <Suspense fallback={<div className="payment-loading">Loading Payment Securely...</div>}>
                <Payment
                  plan={selectedPlan}
                  cycle={selectedCycle}
                  onBack={() => setSelectedPlan(null)}
                  onSuccess={() => {
                    setHasPurchased(true);
                    setSelectedPlan(null);
                  }}
                />
              </Suspense>
            ) : (
              <PricePlanning role={role} onPlanSelected={handlePlanSelection} />
            )}
          </div>
        ) : (
          <div className="landing-cards" style={{ cursor: "pointer" }}>
            <div className="landing-card" onClick={() => navigate(portfolioRoute)}>
              <div className="icon-box blue">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                  xmlns="http://www.w3.org/2000/svg">

                  <path className="box" d="M3 21V3H21V21H3Z"
                    stroke="#5A3DF0" strokeWidth="2" />

                  <path className="bar1" d="M7 17V13H11V17H7Z"
                    stroke="#5A3DF0" strokeWidth="2" />

                  <path className="bar2" d="M13 17V7H17V17H13Z"
                    stroke="#5A3DF0" strokeWidth="2" />
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

                  <path className="bolt"
                    pathLength="1"
                    d="M13 2L3 14H11L9 22L21 10H13V2Z"
                    stroke="#8A2BE2"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
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
        )}

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
        <Modal show={confirmOrg.open} onHide={() => setConfirmOrg({ open: false, userId: null })} centered className="logout-modal">
          <Modal.Header closeButton>
            <Modal.Title>Confirm Subscription</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Existing organisation plan will be applied for this user.
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-cancel" onClick={() => setConfirmOrg({ open: false, userId: null })} disabled={submittingOrg}>
              Cancel
            </button>
            <button className="btn btn-logout" onClick={handleConfirmOrgSubscription} disabled={submittingOrg}>
              {submittingOrg ? "Processing..." : "OK"}
            </button>
          </Modal.Footer>
        </Modal>
      </div >
    </>
  );
};

export default Landing;