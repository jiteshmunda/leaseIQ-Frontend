import React, { useState } from "react";
import api from "../service/api.js";
import { showError, showSuccess } from "../service/toast";
import { encryptPassword } from "../service/encryption";
import { Eye, EyeOff, User, Lock, Mail } from "lucide-react";

const UsernameSettings = ({ initialUsername }) => {
    const [username, setUsername] = useState(initialUsername);
    const [newName, setNewName] = useState(initialUsername);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleUpdateUsername = async (e) => {
        e.preventDefault();

        if (!newName.trim() || newName === username || !password.trim()) {
            showError("Please enter a new username and password");
            return;
        }

        try {
            setLoading(true);

            const encryptedPassword = await encryptPassword(password);

            await api.patch("/api/auth/change-username", {
                password: encryptedPassword,
                new_username: newName
            });

            sessionStorage.setItem("username", newName);
            setUsername(newName);
            setPassword("");
            setShowPassword(false);

            showSuccess("Username updated successfully");
            window.dispatchEvent(new Event("storage"));
        } catch (err) {
            // Global interceptor handles 401/403
            if (err.response?.status === 401 || err.response?.status === 403) {
                return;
            }
            showError(err.response?.data?.message || "Failed to update username");
        } finally {
            setLoading(false);
        }
    };

    const isUnchanged = newName === username;
    const hasPassword = password && password.length > 0;
    const showHighlight = hasPassword && isUnchanged;

    return (
        <div className="content-section">
            <div className="section-header">
                <h1>Change Username</h1>
                <p>Manage your account identity and public profile</p>
            </div>

            <div className="settings-card premium-card">
                <div className="profile-preview">
                    <div className="preview-avatar">
                        <User size={32} />
                    </div>
                    <div className="preview-info">
                        <h3>{username}</h3>
                        <span>Current Username</span>
                    </div>
                </div>

                <div className="card-divider"></div>

                <form onSubmit={handleUpdateUsername} className="settings-form">
                    {/* Display Name */}
                    <div className="form-group">
                        <label>New User Name</label>
                        <div className={`input-group-custom ${showHighlight ? "input-blink-warning" : ""}`} style={{ borderRadius: "12px" }}>
                            <div className="input-icon">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                className="form-control-custom"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Enter new username"
                                required
                                disabled={loading}
                                style={showHighlight ? { borderColor: "transparent" } : {}}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div className="password-input-wrapper">
                            <div className="input-icon">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-control-custom"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                className="password-visibility-toggle"
                                onClick={() => !loading && setShowPassword((v) => !v)}
                                disabled={loading}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                        <p className="form-help-text">Please verify your identity to change username</p>
                    </div>

                    {/* Submit */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn-save-premium"
                            disabled={loading || newName === username}
                        >
                            {loading ? "Updating..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UsernameSettings;
