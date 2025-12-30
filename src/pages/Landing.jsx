import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/landing.css";
import FloatingSignOut from "../components/FloatingSingout";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;


const Landing = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const [tenants, setTenants] = useState([]);

  const fetchTenants = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/tenants`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setTenants(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch tenants", err);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      await fetchTenants();
    });
    return () => {
      cancelled = true;
    };
  }, [fetchTenants]);

  const portfolioTitle = tenants.length === 0 ? "Build My Portfolio" : "Go to Portfolio";
  const portfolioRoute = tenants.length === 0 ? "/build-portfolio" : "/dashboard";
  const portfolionavigation = tenants.length === 0 ? "Set up Portfolio" : "View Portfolio";
  return (
    <div className="landing-page">
      <FloatingSignOut />
      <div className="landing-header">
        <h1>Welcome to LeaseIQ</h1>
        <p>Choose how you'd like to get started</p>
      </div>

      {/* Cards */}
      <div className="landing-cards"
          style={{ cursor: "pointer" }}>
        {/* Left Card */}
        <div className="landing-card">
          <div className="icon-box blue">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 21V3H21V21H3Z"
                stroke="#5A3DF0"
                strokeWidth="2"
                fill="none"
              />
              <path d="M7 17V13H11V17H7Z" stroke="#5A3DF0" strokeWidth="2" />
              <path d="M13 17V7H17V17H13Z" stroke="#5A3DF0" strokeWidth="2" />
            </svg>
          </div>

          <h3>{portfolioTitle}</h3>
          <p>I want to organize my properties and track multiple leases</p>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(portfolioRoute);
            }}
          >
            {portfolionavigation} →
          </a>

        </div>

        {/* Right Card */}
        <div className="landing-card">
          <div className="icon-box purple">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13 2L3 14H11L9 22L21 10H13L13 2Z"
                stroke="#8A2BE2"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>

          <h3>Quick Lease Analysis</h3>
          <p>I just need to analyze one lease document right now</p>

          <a
  href="#"
  onClick={(e) => {
    e.preventDefault();
    navigate("/quick-lease-analysis");
  }}
>
  Upload Lease →
</a>

        </div>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        Need help? Contact support@leaseiq.com
      </div>
    </div>
  );
};

export default Landing;
