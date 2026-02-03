import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

const RemainingAbstractsBadge = () => {
    const [count, setCount] = useState(() => sessionStorage.getItem("remainingAbstracts") || "0");

    useEffect(() => {
        const handleUpdate = (e) => {
            const remaining = e.detail?.remainingAbstractsThisMonth || e.detail?.remainingAbstracts;
            if (remaining !== undefined) {
                setCount(remaining);
            }
        };

        window.addEventListener("subscriptionUpdate", handleUpdate);

        // Also sync from sessionStorage periodically if needed, 
        // but the event should be enough as api.js handles it.

        return () => window.removeEventListener("subscriptionUpdate", handleUpdate);
    }, []);

    return (
        <div className="abstracts-pill-premium" title="Remaining Analysis This Month">
            <div className="pill-shimmer"></div>
            <Sparkles size={14} className="pill-icon" />
            <span className="pill-text">
                <span className="pill-count">{count}</span> <span className="pill-label-desktop">Abstracts</span>
            </span>
        </div>
    );
};

export default RemainingAbstractsBadge;
