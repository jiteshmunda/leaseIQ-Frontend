import React, { useState } from "react";
import { Form, Button, Row, Col, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Building2, ArrowLeft } from "lucide-react";
import axios from "axios";
import { encryptPassword } from "../service/encryption";
import { showError, showSuccess } from "../service/toast";
import { validatePassword } from "../service/validation";
import "../styles/signup.css";
import AnimatedBackground from "../components/AnimatedBackground";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const isValidFullName = (value) => {
    const name = value.trim();
    if (!name) return false;
    return /^[\p{L}]+(?: [\p{L}]+)*$/u.test(name);
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    org_option: "", // individual, create_new, join_existing
    org_name: "",
  });

  const handleTypeSelect = (type) => {
    // Switching flows should not keep old validation messages/fields.
    setErrors({});
    setFormData((prev) => ({
      ...prev,
      org_option: type,
      // Avoid carrying org values between create/join/individual flows
      org_name: "",
      username: "",
    }));
    setShowPassword(false);
    setShowConfirmPassword(false);
    setStep(2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      const cleaned = value
        .replace(/[^\p{L} ]+/gu, "")
        .replace(/\s{2,}/g, " ");
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    else if (!isValidFullName(formData.name)) newErrors.name = "Name must contain only letters and spaces";
    if (!formData.email.match(/^\S+@\S+\.\S+$/)) newErrors.email = "Invalid email format";

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    // org_name is required for both Create and Join organization options
    if (formData.org_option !== "individual" && !formData.org_name.trim())
      newErrors.org_name = "Organization Name is required";

    // username is required for create_new per your JSON sample
    if (formData.org_option !== "join_existing" && !formData.username.trim())
      newErrors.username = "Username is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      const isIndividual = formData.org_option === "individual";
      const passwordPayload = await encryptPassword(formData.password);

      if (isIndividual) {
        const payload = {
          name: formData.name,
          email: formData.email,
          username: formData.username,
          password: passwordPayload,
        };
        await axios.post(`${BASE_URL}/api/auth/signup`, payload);
      } else {
        // Structure payload based on your JSON requirements
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          org_option: formData.org_option,
          org_name: formData.org_name,
        };

        // Add username only if creating a new org
        if (formData.org_option === "create_new") {
          payload.username = formData.username;
        }

        await axios.post(`${BASE_URL}/api/auth/org-signup`, payload);
      }

      const successMsg = formData.org_option === "join_existing"
        ? "Request sent! Please wait for admin approval."
        : "Signup successful! You can now log in.";

      showSuccess(successMsg);
      navigate("/");
    } catch (err) {
      showError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const PageHeader = () => (
    <div className="signup-header">
      <h1 className="logo">LeaseIQ</h1>
      <p className="subtitle">AI-Powered Lease Management Platform</p>
    </div>
  );

  if (step === 1) {
    return (
      <>
        <AnimatedBackground />
        <div className="signup-page">
          <PageHeader />
          <div className="signup-card extended-layout">
            <h2 className="title">Create Account</h2>
            <p className="description text-muted">Select your account type to get started</p>
            <Row className="g-4">
              <Col md={6}>
                <div className="account-type-box" onClick={() => handleTypeSelect("individual")}>
                  <div className="type-icon-wrapper individual-bg">
                    <User size={24} color="#6366f1" />
                  </div>
                  <h3>Individual Account</h3>
                  <p className="small text-muted">Perfect for independent professionals managing their own portfolio.</p>
                  <ul className="feature-list">
                    <li>• Personal workspace</li>
                    {/*<li>• 10 abstracts/month</li>
                  <li>• Starting at $99/month</li>*/}
                  </ul>
                </div>
              </Col>
              <Col md={6}>
                <div className="account-type-box" onClick={() => handleTypeSelect("create_new")}>
                  <div className="type-icon-wrapper org-bg">
                    <Building2 size={24} color="#a855f7" />
                  </div>
                  <h3>Create Organization</h3>
                  <p className="small text-muted">Set up a team workspace with centralized billing and user management.</p>
                  <ul className="feature-list">
                    <li>• Team collaboration</li>
                    {/*<li>• 10 abstracts/user/month</li>
                  <li>• Starting at $79/user/month</li>*/}
                  </ul>
                </div>
              </Col>
            </Row>
            <div className="selection-footer text-center mt-5">
              <p className="mb-2 text-muted small">Already have an organization?</p>
              <button className="join-org-btn" onClick={() => handleTypeSelect("join_existing")}>
                Join Existing Organization
              </button>
              <div className="mt-4">
                <span className="back-link-text" onClick={() => navigate("/")}>Back to Login</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <div className="signup-page">
        <PageHeader />
        <div className="signup-card">
          <div
            className="back-nav mb-3"
            onClick={() => {
              setErrors({});
              setShowPassword(false);
              setShowConfirmPassword(false);
              setStep(1);
            }}
            style={{ cursor: "pointer" }}
          >
            <span className="text-primary small d-flex align-items-center">
              <ArrowLeft size={16} className="me-1" /> Change account type
            </span>
          </div>
          <h2 className="title text-capitalize">{formData.org_option.replace('_', ' ')} Account</h2>
          <p className="text-muted small mb-4">Enter your details to continue</p>

          <Form onSubmit={handleSignup}>
            <Form.Group className="mb-2">
              <Form.Label className="small fw-bold">Full Name</Form.Label>
              <Form.Control name="name" value={formData.name} placeholder="Enter Full Name" onChange={handleChange} isInvalid={!!errors.name} disabled={loading} />
              <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-bold">Email</Form.Label>
              <Form.Control name="email" type="email" placeholder="Enter Email" onChange={handleChange} isInvalid={!!errors.email} disabled={loading} />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>

            {/* Username only shown for Create Org or Individual as per your JSON samples */}
            {formData.org_option !== "join_existing" && (
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold">Username</Form.Label>
                <Form.Control name="username" placeholder="Enter Username" onChange={handleChange} isInvalid={!!errors.username} disabled={loading} />
                <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
              </Form.Group>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-bold">Password</Form.Label>
                  <InputGroup hasValidation>
                    <Form.Control name="password" type={showPassword ? "text" : "password"} placeholder="Password" onChange={handleChange} isInvalid={!!errors.password} disabled={loading} />
                    <InputGroup.Text onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer" }}>
                      {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                    </InputGroup.Text>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid" style={{ display: errors.password ? 'block' : 'none' }}>{errors.password}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-bold">Confirm Password</Form.Label>
                  <InputGroup hasValidation>
                    <Form.Control name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" onChange={handleChange} isInvalid={!!errors.confirmPassword} disabled={loading} />
                    <InputGroup.Text onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ cursor: "pointer" }}>
                      {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                    </InputGroup.Text>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid" style={{ display: errors.confirmPassword ? 'block' : 'none' }}>{errors.confirmPassword}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {/* Org Name used for BOTH Create and Join options */}
            {formData.org_option !== "individual" && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Organization Name</Form.Label>
                <Form.Control name="org_name" placeholder="Enter Organization Name" onChange={handleChange} isInvalid={!!errors.org_name} disabled={loading} />
                <Form.Control.Feedback type="invalid">{errors.org_name}</Form.Control.Feedback>
              </Form.Group>
            )}

            <Button className="login-btn mt-2" type="submit" disabled={loading}>
              {loading ? "Creating..." : formData.org_option === "join_existing" ? "Join Organization" : "Sign Up"}
            </Button>
            <div className="text-center mt-3">
              <p className="small">Already have an account? <span className="text-primary sign-up" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Login</span></p>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
}

export default Signup;