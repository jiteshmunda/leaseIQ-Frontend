import React, { useState } from "react";
import { Form, Button, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import "../styles/login.css";
import AnimatedBackground from "../components/AnimatedBackground";
import axios from "axios";
import { showError, showSuccess } from "../service/toast";
import { encryptPassword } from "../service/encryption";
import { validatePassword } from "../service/validation";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_KEY = import.meta.env.VITE_AUTH_KEY;

const ForgotPassword = ({ onBack }) => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        otp: "",
        new_password: "",
        confirm_password: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!formData.email) {
            showError("Please enter your email");
            return;
        }

        try {
            setLoading(true);
            await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
                email: formData.email,
            });
            showSuccess("OTP sent to your email");
            setStep(2);
        } catch (err) {
            showError(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!formData.otp) {
            showError("Please enter the OTP");
            return;
        }

        try {
            setLoading(true);
            await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
                email: formData.email,
                otp: formData.otp,
            });
            showSuccess("OTP verified successfully");
            setStep(3);
        } catch (err) {
            showError(err.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!formData.new_password || !formData.confirm_password) {
            showError("Please fill in all password fields");
            return;
        }

        const passwordError = validatePassword(formData.new_password);
        if (passwordError) {
            showError(passwordError);
            return;
        }

        if (formData.new_password !== formData.confirm_password) {
            showError("Passwords do not match");
            return;
        }

        try {
            setLoading(true);
            const passwordPayload = await encryptPassword(formData.new_password);

            await axios.post(`${BASE_URL}/api/auth/reset-password`, {
                email: formData.email,
                otp: formData.otp,
                new_password: passwordPayload,
                passwordEncrypted: Boolean(AUTH_KEY),
            });

            showSuccess("Password reset successful. Please login again.");
            onBack();
        } catch (err) {
            showError(err.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="d-flex align-items-center mb-4">
                <button
                    className="btn btn-link p-0 me-3 text-dark"
                    onClick={() => step === 1 ? onBack() : setStep(step - 1)}
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 className="title mb-0">
                    {step === 1 && "Forgot Password"}
                    {step === 2 && "Verify OTP"}
                    {step === 3 && "Reset Password"}
                </h2>
            </div>

            <Form
                onSubmit={
                    step === 1
                        ? handleSendOtp
                        : step === 2
                            ? handleVerifyOtp
                            : handleResetPassword
                }
            >
                {/* Email Field */}
                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Email Address</Form.Label>
                    <Form.Control
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading || step > 1}
                        readOnly={step > 1}
                        required
                    />
                </Form.Group>

                {/* OTP Field - only shown in step 2 or 3 */}
                {step >= 2 && (
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">OTP</Form.Label>
                        <Form.Control
                            type="text"
                            name="otp"
                            placeholder="Enter 6-digit OTP"
                            value={formData.otp}
                            onChange={handleChange}
                            disabled={loading || step > 2}
                            readOnly={step > 2}
                            required
                        />
                    </Form.Group>
                )}

                {/* New Password Fields - only shown in step 3 */}
                {step === 3 && (
                    <>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">New Password</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type={showPassword ? "text" : "password"}
                                    name="new_password"
                                    placeholder="Enter new password"
                                    value={formData.new_password}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                />
                                <InputGroup.Text
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                </InputGroup.Text>
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">Confirm New Password</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirm_password"
                                    placeholder="Confirm new password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                />
                                <InputGroup.Text
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                </InputGroup.Text>
                            </InputGroup>
                        </Form.Group>
                    </>
                )}

                <Button className="login-btn" type="submit" disabled={loading}>
                    {loading
                        ? "Processing..."
                        : step === 1
                            ? "Send OTP"
                            : step === 2
                                ? "Verify OTP"
                                : "Change Password"}
                </Button>
            </Form>
        </div>
    );
};


export default ForgotPassword;
