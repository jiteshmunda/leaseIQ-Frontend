import React, { useState } from "react";
import api from "../service/api.js";
import { showError, showSuccess } from "../service/toast";
import { encryptPassword } from "../service/encryption";
import { Eye, EyeOff } from "lucide-react";

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
            showError(err.response?.data?.message || "Failed to update username");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="content-section">
            <h1>Profile Settings</h1>

            <div className="settings-card">
                <form onSubmit={handleUpdateUsername}>
                    {/* Display Name */}
                    <div className="form-group">
                        <label>User Name</label>
                        <input
                            type="text"
                            className="form-control-custom"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Enter new username"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div className="password-input-wrapper">
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
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="btn-save"
                        disabled={loading || newName === username}
                    >
                        {loading ? "Updating..." : "Save Changes"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UsernameSettings;
