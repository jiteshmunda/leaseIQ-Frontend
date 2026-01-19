import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import "../styles/notFound.css";
import AnimatedBackground from "../components/AnimatedBackground";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <>
            <AnimatedBackground />
            <div className="not-found-page">
                <div className="not-found-content">
                    <div className="not-found-header">
                        <span className="logo-text">LeaseIQ</span>
                        <h1>404</h1>
                    </div>
                    <div className="not-found-body">
                        <h2>Oops! Page Not Found</h2>
                        <p>
                            The page you are looking for might have been removed, had its name
                            changed, or is temporarily unavailable.
                        </p>
                        <button className="home-btn" onClick={() => navigate("/")}>
                            <LogOut size={20} className="logout-icon" />
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NotFound;
