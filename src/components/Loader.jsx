import React from 'react';
import '../styles/loader.css';

// Central Loader for Landing Page
export const CentralLoader = () => {
    return (
        <div className="central-loader-container">
            <div className="central-loader">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-text">Loading...</div>
            </div>
        </div>
    );
};
