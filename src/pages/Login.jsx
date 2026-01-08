import React, { useState } from "react";
import { Form, Button, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "../styles/login.css";
import axios from "axios";
import { showError, showSuccess } from "../service/toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    /* org_name: "", */ // Disabled state field
  });

  // Updated validation: removed org_name requirement
  const isFormValid = 
    (formData.username.trim() || formData.email.trim()) && 
    formData.password.trim() /* && 
    formData.org_name.trim() */;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const res = await axios.post(
        `${BASE_URL}/api/auth/login`,
        {
          email: formData.email,
          username: formData.username,
          password: formData.password,
          /* org_name: formData.org_name */ // Disabled in API payload
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );

      // Save essential data to sessionStorage for the Landing page to use
      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("userId", res.data.user.id);
      sessionStorage.setItem("username", res.data.user.username); // Added to show in UI
      sessionStorage.setItem("role", res.data.user.role); // Added for admin logic

      showSuccess("Login successful!");
      navigate("/landing");
    } catch (err) {
      showError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-header">
        <h1 className="logo">LeaseIQ</h1>
        <p className="subtitle">AI-Powered Lease Management Platform</p>
      </div>

      <div className="login-card">
        <h2 className="title text-center">Sign In</h2>

        <Form onSubmit={handleLogin}>
          {/* Username/Email Field */}
          <Form.Group className="mb-3">
            <Form.Label>Username/Email</Form.Label>
            <Form.Control
              type="text"
              name="username"
              placeholder="Enter your username or email"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />
          </Form.Group>

          {/* Password Field */}
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
              <InputGroup.Text
                style={{ cursor: "pointer" }}
                onClick={() => !loading && setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>

          {/* Organization Name Field - Commented Out */}
          {/* <Form.Group className="mb-4">
            <Form.Label>Organization Name</Form.Label>
            <Form.Control
              type="text"
              name="org_name"
              placeholder="Enter your organization name"
              value={formData.org_name}
              onChange={handleChange}
              disabled={loading}
            />
          </Form.Group> 
          */}

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
      </div>

      <div className="login-footer">
        <p>
          Need help? Contact <span>support@leaseabstract.com</span>
        </p>
      </div>
    </div>
  );
};

export default Login;