import React, { useEffect, useState } from "react";
import api from "../service/api";
import "../styles/payment-method.css";

/* SVG icons (React components) */
// import MastercardIcon from "../assets/card-icons/mastercard.svg?react";
// import RupayIcon from "../assets/card-icons/rupay.svg?react";

/* PNG icons (normal images) */
import visaPng from "../assets/card-icons/visa.png";
import amexPng from "../assets/card-icons/amex.png";
import discoverPng from "../assets/card-icons/discover.png";
import dinersPng from "../assets/card-icons/dinersclub.png";
import MastercardIcon from "../assets/card-icons/mastercard.png";
import RupayIcon from "../assets/card-icons/rupay.png";

/* Brand configuration */
const BRAND_CONFIG = {
  visa: {
    type: "png",
    src: visaPng,
    gradient: "linear-gradient(135deg, #1A1F71, #0B0F3B)",
  },
  mastercard: {
    type: "png",
    src: MastercardIcon,
    gradient: "linear-gradient(135deg, #EB001B, #F79E1B)",
  },
  amex: {
    type: "png",
    src: amexPng,
    gradient: "linear-gradient(135deg, #2E77BB, #1E3A8A)",
  },
  discover: {
    type: "png",
    src: discoverPng,
    gradient: "linear-gradient(135deg, #FF6000, #111827)",
  },
  rupay: {
    type: "png",
    Icon: RupayIcon,
    gradient: "linear-gradient(135deg, #0F3CC9, #16A34A)",
  },
  diners: {
    type: "png",
    src: dinersPng,
    gradient: "linear-gradient(135deg, #0061A8, #0F172A)",
  },
};

const DEFAULT_BRAND = {
  gradient: "linear-gradient(135deg, #111827, #374151)",
};

const PaymentMethodSettings = ({ subscriptionId }) => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!subscriptionId) return;

    api
      .get(`/api/subscriptions/${subscriptionId}/payment-method`)
      .then((res) => setPayment(res.data.paymentDetails))
      .catch(() => setError("Unable to fetch payment method"))
      .finally(() => setLoading(false));
  }, [subscriptionId]);

  if (loading) return <p>Loading payment method...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!payment) return <p>No payment method found.</p>;

  const brandKey = payment.brand?.toLowerCase();
  const brand = BRAND_CONFIG[brandKey] || DEFAULT_BRAND;
  const isKnownBrand = Boolean(BRAND_CONFIG[brandKey]);

  return (
    <div className="payment-wrapper">
      <h2 className="payment-method-title">Payment Method</h2>
      <p className="payment-subtitle">
        This card will be used for your subscription billing.
      </p>

      <div className="credit-card" style={{ background: brand?.gradient }}>
        <div className="card-top">
          <span className="card-label">Active Card</span>

          {isKnownBrand && brand?.src && (
            <img
              src={brand.src}
              alt={payment.brand}
              className={`card-brand-icon png-icon brand-${brandKey}`}
            />
          )}

          {!isKnownBrand && (
            <div className="card-brand-text">
              {payment.brand?.toUpperCase() || "CARD"}
            </div>
          )}
        </div>

        <div className="card-number">•••• •••• •••• {payment.last4}</div>

        <div className="card-footer">
          <div className="card-expiry">
            <span className="label">Expiry</span>
            <span>
              {payment.expMonth}/{payment.expYear}
            </span>
          </div>

          <div className="card-brand-name">{payment.brand.toUpperCase()}</div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSettings;
