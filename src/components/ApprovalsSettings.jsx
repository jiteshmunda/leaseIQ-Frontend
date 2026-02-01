import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import api from "../service/api.js";
import { showError, showSuccess } from "../service/toast";
import { Modal } from "react-bootstrap";

const ApprovalsSettings = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [confirmOrg, setConfirmOrg] = useState({ open: false, userId: null });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const res = await api.get("/api/users/pending");
            setPendingUsers(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch pending users", err);
        }
    };

    const handleReviewUser = async (uId, action) => {
        try {
            const res = await api.patch(`/api/users/${uId}/review`, { action });

            if (action === "approve" && res.data.requiresPayment) {
                setConfirmOrg({ open: true, userId: uId });
                return;
            }

            showSuccess(`User ${action}ed successfully`);
            setPendingUsers((prev) => prev.filter((u) => u._id !== uId));
        } catch (err) {
            showError(err.response?.data?.message || "Action failed");
        }
    };

    const handleConfirmOrgSubscription = async () => {
        let planId = sessionStorage.getItem("planId");
        let billingInterval = sessionStorage.getItem("billingInterval");

        if (!planId || !billingInterval) {
            try {
                setSubmitting(true);
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
            setSubmitting(false);
            return;
        }

        const uId = confirmOrg.userId;
        try {
            setSubmitting(true);
            await api.post("/api/subscriptions/organization/user", {
                planId,
                userId: uId,
                billingInterval
            });

            showSuccess("User approved and organization plan applied");
            setPendingUsers((prev) => prev.filter((u) => u._id !== uId));
            setConfirmOrg({ open: false, userId: null });
        } catch (err) {
            showError(err.response?.data?.message || "Failed to apply organization plan");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="content-section">
            <h1>Pending Approvals</h1>
            <div className="approvals-list">
                {pendingUsers.length === 0 ? (
                    <div className="settings-card text-center">
                        <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>No pending user requests at the moment.</p>
                    </div>
                ) : (
                    pendingUsers.map((user) => (
                        <div key={user._id} className="approval-item">
                            <div className="user-details">
                                <div className="avatar">
                                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                                </div>
                                <div className="user-info">
                                    <span className="name">{user.name}</span>
                                    <span className="email">{user.email}</span>
                                </div>
                            </div>
                            <div className="action-buttons">
                                <button className="btn-approve-action" onClick={() => handleReviewUser(user._id, "approve")} title="Approve">
                                    <Check size={18} />
                                </button>
                                <button className="btn-reject-action" onClick={() => handleReviewUser(user._id, "reject")} title="Reject">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal show={confirmOrg.open} onHide={() => setConfirmOrg({ open: false, userId: null })} centered className="logout-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Subscription</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Existing organisation plan will be applied for this user.
                </Modal.Body>
                <Modal.Footer>
                    <button className="btn btn-cancel" onClick={() => setConfirmOrg({ open: false, userId: null })} disabled={submitting}>
                        Cancel
                    </button>
                    <button className="btn btn-logout" onClick={handleConfirmOrgSubscription} disabled={submitting}>
                        {submitting ? "Processing..." : "OK"}
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ApprovalsSettings;
