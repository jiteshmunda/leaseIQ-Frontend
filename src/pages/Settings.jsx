import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowLeft, KeyRound, UserCircle, Menu, X, ChevronLeft, ChevronRight, Users } from "lucide-react";
import api from "../service/api.js";
import UsernameSettings from "../components/UsernameSettings";
import PasswordSettings from "../components/PasswordSettings";
import ApprovalsSettings from "../components/ApprovalsSettings";
import OrganizationUsers from "../components/OrganizationUsers";
import "../styles/settings.css";
import FloatingSignOut from "../components/FloatingSingout.jsx";
import PaymentMethodSettings from "../components/PaymentMethodSettings";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";

const Settings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("profile");
    const [pendingCount, setPendingCount] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [subscriptionId, setSubscriptionId] = useState(null);
const [subLoading, setSubLoading] = useState(true);



    // User Data
    const role = sessionStorage.getItem("role");
    const userId = sessionStorage.getItem("userId");
    const username = sessionStorage.getItem("username") || "";
    const canViewPaymentMethod = role === "individual" || role === "org_admin";

    useEffect(() => {
  api.get("/api/subscriptions/status")
    .then((res) => {
      console.log("SUBSCRIPTION STATUS:", res.data);

      if (res.data?.hasSubscription && res.data.subscription?._id) {
        setSubscriptionId(res.data.subscription._id);
      } else {
        setSubscriptionId(null);
      }
    })
    .catch((err) => {
      console.error("SUBSCRIPTION FETCH ERROR:", err);
      setSubscriptionId(null);
    })
    .finally(() => setSubLoading(false));
}, []);



    useEffect(() => {
        if (role === "org_admin") {
            api.get("/api/users/pending").then(res => {
                setPendingCount(res.data.data?.length || 0);
            }).catch(console.error);
        }
    }, [role]);

    const renderContent = () => {
        switch (activeTab) {
            case "profile":
                return <UsernameSettings initialUsername={username} userId={userId} />;
            case "security":
                return <PasswordSettings userId={userId} />;
            case "approvals":
                return <ApprovalsSettings />;
            case "users":
                return <OrganizationUsers />;
                case "payment":
  if (!canViewPaymentMethod) {
    return <p>You are not authorized to view payment details.</p>;
  }

  if (subLoading) return <p>Loading subscription...</p>;
  if (!subscriptionId) return <p>No active subscription found.</p>;

  return <PaymentMethodSettings subscriptionId={subscriptionId} />;


            default:
                return null;
        }
    };

    return (
        <>
            <FloatingSignOut />
            <div className={`settings-page ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}>
                {/* Mobile Header */}
                <header className="mobile-settings-header">
                    <button className="hamburger-btn" onClick={() => setIsMobileOpen(!isMobileOpen)}>
                        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <h2>LeaseIQ</h2>
                </header>

                <div className={`settings-sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}>
                    {/* Desktop Collapse Toggle */}
                    <button className="desktop-collapse-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>

                    <div className="sidebar-animation-bg">
                        <ul className="sidebar-circles">
                            <li></li>
                            <li></li>
                            <li></li>
                            <li></li>
                            <li></li>
                        </ul>
                    </div>

                    <div className="sidebar-header">
                        <h2>{isCollapsed ? "LQ" : "LeaseIQ"}</h2>
                    </div>

                    <div className="sidebar-nav">
                        <div
                            className={`sidebar-item ${activeTab === "profile" ? "active" : ""}`}
                            onClick={() => { setActiveTab("profile"); setIsMobileOpen(false); }}
                            title={isCollapsed ? "Profile Settings" : ""}
                        >
                            <UserCircle size={20} />
                            {!isCollapsed && <span>Profile Settings</span>}
                        </div>

                        <div
                            className={`sidebar-item ${activeTab === "security" ? "active" : ""}`}
                            onClick={() => { setActiveTab("security"); setIsMobileOpen(false); }}
                            title={isCollapsed ? "Security & Privacy" : ""}
                        >
                            <KeyRound size={20} />
                            {!isCollapsed && <span>Security & Privacy</span>}
                        </div>

                        {role === "org_admin" && (
                            <div
                                className={`sidebar-item ${activeTab === "approvals" ? "active" : ""}`}
                                onClick={() => { setActiveTab("approvals"); setIsMobileOpen(false); }}
                                title={isCollapsed ? "Pending Approvals" : ""}
                            >
                                <Bell size={20} />
                                {!isCollapsed && <span>Pending Approvals</span>}
                                {!isCollapsed && pendingCount > 0 && <span className="mini-badge">{pendingCount}</span>}
                            </div>
                        )}

                        {role === "org_admin" && (
                            <div
                                className={`sidebar-item ${activeTab === "users" ? "active" : ""}`}
                                onClick={() => { setActiveTab("users"); setIsMobileOpen(false); }}
                                title={isCollapsed ? "Organization Users" : ""}
                            >
                                <Users size={20} />
                                {!isCollapsed && <span>Organization Users</span>}
                            </div>
                        )}

                        {canViewPaymentMethod && (
  <div
    className={`sidebar-item ${activeTab === "payment" ? "active" : ""}`}
    onClick={() => {
      setActiveTab("payment");
      setIsMobileOpen(false);
    }}
    title={isCollapsed ? "Payment Method" : ""}
  >
    <CreditCard size={20} />
    {!isCollapsed && <span>Payment Method</span>}
  </div>
)}



                        <div style={{ margin: "20px 0", height: "1px", background: "rgba(255,255,255,0.1)" }}></div>

                        <div
                            className="sidebar-item"
                            onClick={() => navigate("/landing")}
                            title={isCollapsed ? "Return to Home" : ""}
                        >
                            <ArrowLeft size={20} />
                            {!isCollapsed && <span>Return to Home</span>}
                        </div>
                    </div>

                    {/* {!isCollapsed && (
                    <div className="sidebar-footer">
                        <p>© 2024 LeaseIQ Platform v1.0</p>
                        <p>Secure Enterprise Account</p>
                    </div>
                )} */}
                </div>

                {/* Backdrop for mobile */}
                {isMobileOpen && <div className="sidebar-backdrop" onClick={() => setIsMobileOpen(false)}></div>}

                <main className="settings-content">
                    {renderContent()}
                </main>
            </div>
        </>
    );
};

export default Settings;
