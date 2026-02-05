import React from 'react';
import { FileText, Upload } from 'lucide-react';
import '../styles/noDocumentAnimation.css';

const NoDocumentAnimation = () => {
    return (
        <div className="no-document-container">
            <div className="no-document-animation">
                {/* Animated floating circles in background */}
                <div className="floating-circles">
                    <div className="circle circle-1"></div>
                    <div className="circle circle-2"></div>
                    <div className="circle circle-3"></div>
                </div>

                {/* Main icon with pulse animation */}
                <div className="no-document-icon-wrapper">
                    <div className="pulse-ring"></div>
                    <div className="pulse-ring delay-1"></div>
                    <div className="no-document-icon">
                        <FileText size={48} />
                    </div>
                </div>

                {/* Content */}
                <div className="no-document-content">
                    <h3 className="no-document-title">No Documents Found</h3>
                    <p className="no-document-description">
                        Get started by uploading your first lease document to begin abstraction
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NoDocumentAnimation;
