import React, { useState } from "react";
import { Form, Button, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "../styles/login.css";
import AnimatedBackground from "../components/AnimatedBackground";
import axios from "axios";
import { showError, showSuccess } from "../service/toast";
import { encryptPassword } from "../service/encryption";
import ForgotPassword from "../components/ForgotPassword";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_KEY = import.meta.env.VITE_AUTH_KEY;

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [errors, setErrors] = useState({
    identifier: "",
    password: "",
  });
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  // Updated validation: removed org_name requirement
  const isFormValid =
    formData.identifier.trim() &&
    formData.password.trim();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors({
      ...errors,
      [e.target.name]: "",
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const identifier = formData.identifier.trim();
      const isEmail = /@/.test(identifier);

      const passwordPayload = await encryptPassword(formData.password);

      const res = await axios.post(
        `${BASE_URL}/api/auth/login`,
        {
          ...(isEmail ? { email: identifier } : { username: identifier }),
          password: passwordPayload,
          passwordEncrypted: Boolean(AUTH_KEY),
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );
      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("userId", res.data.user.id);
      sessionStorage.setItem("username", res.data.user.username);
      sessionStorage.setItem("role", res.data.user.role);

      showSuccess("Login successful!");
      navigate("/landing");
    } catch (err) {
      const data = err.response?.data;

      if (data?.field === "email_or_username") {
        setErrors({ identifier: data.message, password: "" });
      } else if (data?.field === "password") {
        setErrors({ identifier: "", password: data.message });
      } else {
        showError(data?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div className="login-page">
        <div className="login-header">
          <h1 className="logo">LeaseIQ</h1>
          <p className="subtitle">AI-Powered Lease Management Platform</p>
        </div>

        <div className="login-card">
          {!showForgotPassword ? (
            <>
              <h2 className="title text-center">Sign In</h2>

              <Form onSubmit={handleLogin}>
                {/* Username/Email Field */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Username/Email</Form.Label>
                  <Form.Control
                    type="text"
                    name="identifier"
                    placeholder="Enter your username or email"
                    value={formData.identifier}
                    onChange={handleChange}
                    disabled={loading}
                    isInvalid={!!errors.identifier}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.identifier}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Password Field */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Password</Form.Label>
                  <InputGroup hasValidation>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      isInvalid={!!errors.password}
                    />
                    <InputGroup.Text
                      style={{ cursor: "pointer" }}
                      onClick={() => !loading && setShowPassword(!showPassword)}
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </InputGroup.Text>
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </InputGroup>
                  <div className="text-end mt-1">
                    <span
                      className="text-primary"
                      style={{ cursor: "pointer", fontSize: "14px" }}
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot Password?
                    </span>
                  </div>
                </Form.Group>

                <Button
                  className="login-btn"
                  type="submit"
                  disabled={!isFormValid || loading}
                >
                  {loading ? "Signing In..." : "Login"}
                </Button>

                <div className="signup-link mt-3 text-center">
                  <p>
                    Don't have an account?{" "}
                    <span
                      className="text-primary sign-up"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate("/signup")}
                    >
                      Create New Account
                    </span>
                  </p>
                </div>
              </Form>
            </>
          ) : (
            <ForgotPassword onBack={() => setShowForgotPassword(false)} />
          )}
        </div>

        <div className="login-footer">
          <p>
            Need help? Contact <span>support@leaseabstract.com</span>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;