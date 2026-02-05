import React from 'react';
import { Building2, Plus } from 'lucide-react';
import { Button } from 'react-bootstrap';
import '../styles/noLeaseAnimation.css';

const NoLeaseAnimation = () => {
    return (
        <div className="no-lease-container">
            <div className="no-lease-animation">
                {/* Animated floating circles in background */}
                <div className="floating-circles">
                    <div className="circle circle-1"></div>
                    <div className="circle circle-2"></div>
                    <div className="circle circle-3"></div>
                </div>

                {/* Main icon with pulse animation */}
                <div className="no-lease-icon-wrapper">
                    <div className="pulse-ring"></div>
                    <div className="pulse-ring delay-1"></div>
                    <div className="no-lease-icon">
                        <Building2 size={48} />
                    </div>
                </div>

                {/* Content */}
                <div className="no-lease-content">
                    <h3 className="no-lease-title">No Units Found</h3>
                    <p className="no-lease-description">
                        Get started by adding your first unit to this tenant
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NoLeaseAnimation;
