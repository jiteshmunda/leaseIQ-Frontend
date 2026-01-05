import React,{ useState } from "react";
import { Form, Button, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {Eye, EyeOff} from "lucide-react";
import "../styles/login.css";
import axios from "axios";
import { showError, showSuccess } from "../service/toast";
const BASE_URL = import.meta.env.VITE_API_BASE_URL

const Login = () => {
  // const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const[loading,setLoading]=useState(false);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });

  const isFormValid = (formData.username.trim() || formData.email.trim()) && formData.password.trim();

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
        password: formData.password
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    sessionStorage.setItem("token", res.data.token);
    sessionStorage.setItem("userId", res.data.user.id);
    showSuccess("Login successful!");
    navigate("/landing");
  } catch (err) {
    showError(err.response?.data?.message || "Login failed");
  }finally {
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

        {/* {error && <p className="error-message">{error}</p>} */}

        <Form onSubmit={handleLogin}>
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
      onClick={() => setShowPassword(!showPassword)}
      disabled={loading}
    >
      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
    </InputGroup.Text>
  </InputGroup>
</Form.Group>


          {/* <Form.Group className="mb-4">
            <Form.Label>Organization Name</Form.Label>
            <Form.Control
              type="text"
              name="organization"
              placeholder="Enter your organization name"
              value={formData.organization}
              onChange={handleChange}
            />
          </Form.Group> */}

          <Button className="login-btn" type="submit" disabled={!isFormValid || loading}>
            {loading ? "Signing In..." : "Sign In"}
          </Button>
          <div className="signup-link mt-3 text-center" >
            <p>
              Don't have an account?{" "}
              <span className="text-primary sign-up" onClick={() => navigate("/signup")}>Sign Up</span>
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
