import React, { useState } from "react";
import api from "../service/api.js";
import { showError, showSuccess } from "../service/toast";
import { encryptPassword } from "../service/encryption";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PasswordSettings = () => {
    const navigate = useNavigate();

    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showError("Passwords do not match");
            return;
        }
        try {
            setLoading(true);
            const encryptedOld = await encryptPassword(passwordData.oldPassword);
            const encryptedNew = await encryptPassword(passwordData.newPassword);

            await api.patch("/api/auth/change-password", {
                current_password: encryptedOld,
                new_password: encryptedNew
            });
            showSuccess("Password updated successfully. Please log in again.");
            setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });

            // After a successful password change, force re-authentication.
            setTimeout(() => {
                sessionStorage.clear();
                navigate("/");
            }, 1200);
        } catch (err) {
            showError(err.response?.data?.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="content-section">
            <h1>Security Settings</h1>
            <div className="settings-card">
                <form onSubmit={handleUpdatePassword}>
                    <div className="form-group">
                        <label>Current Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showOldPassword ? "text" : "password"}
                                className="form-control-custom"
                                value={passwordData.oldPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                className="password-visibility-toggle"
                                onClick={() => !loading && setShowOldPassword((v) => !v)}
                                disabled={loading}
                                aria-label={showOldPassword ? "Hide current password" : "Show current password"}
                            >
                                {showOldPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>New Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                className="form-control-custom"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                className="password-visibility-toggle"
                                onClick={() => !loading && setShowNewPassword((v) => !v)}
                                disabled={loading}
                                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                            >
                                {showNewPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="form-control-custom"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                className="password-visibility-toggle"
                                onClick={() => !loading && setShowConfirmPassword((v) => !v)}
                                disabled={loading}
                                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            >
                                {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn-save" disabled={loading}>
                        {loading ? "Changing..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PasswordSettings;
