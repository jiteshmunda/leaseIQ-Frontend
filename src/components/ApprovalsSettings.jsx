import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import api from "../service/api.js";
import { showError, showSuccess } from "../service/toast";

const ApprovalsSettings = () => {
    const [pendingUsers, setPendingUsers] = useState([]);

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
            await api.patch(`/api/users/${uId}/review`, { action });
            showSuccess(`User ${action}ed successfully`);
            setPendingUsers((prev) => prev.filter((u) => u._id !== uId));
        } catch (err) {
            showError(err.response?.data?.message || "Action failed");
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
        </div>
    );
};

export default ApprovalsSettings;
