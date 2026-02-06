import React from 'react';
import { Users, Plus } from 'lucide-react';
import '../styles/noTenantAnimation.css';

const NoTenantAnimation = () => {
    return (
        <div className="no-tenant-container">
            <div className="no-tenant-animation">
                {/* Animated floating circles in background */}
                <div className="floating-circles">
                    <div className="circle circle-1"></div>
                    <div className="circle circle-2"></div>
                    <div className="circle circle-3"></div>
                </div>

                {/* Main icon with pulse animation */}
                <div className="no-tenant-icon-wrapper">
                    <div className="pulse-ring"></div>
                    <div className="pulse-ring delay-1"></div>
                    <div className="no-tenant-icon">
                        <Users size={48} />
                    </div>
                </div>

                {/* Content */}
                <div className="no-tenant-content">
                    <h3 className="no-tenant-title">No Tenants Found</h3>
                    <p className="no-tenant-description">
                        Get started by adding your first tenant to begin managing your portfolio
                    </p>

                </div>
            </div>
        </div>
    );
};

export default NoTenantAnimation;
