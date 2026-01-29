import React, { useState } from 'react';
import { ShieldCheck, Check, ArrowLeft } from 'lucide-react';
import '../styles/payment.css';
import { useNavigate } from 'react-router-dom';
import { useStripe, useElements, CardElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import api from '../service/api';
import { showError } from '../service/toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);



const getPlanAmount = (plan, cycle) => {
    const amount = plan?.pricing?.[cycle]?.amount;
    return Number.isFinite(Number(amount)) ? Number(amount) : 0;
};

const CARD_ELEMENT_OPTIONS = {
    hidePostalCode: true,
    style: {
        base: {
            color: "#fff",
            fontFamily: "'Inter', sans-serif",
            fontSmoothing: "antialiased",
            fontSize: "16px",
            "::placeholder": {
                color: "rgba(255, 255, 255, 0.3)"
            }
        },
        invalid: {
            color: "#fa755a",
            iconColor: "#fa755a"
        }
    }
};

const PaymentForm = ({ plan, cycle, onBack }) => {
    const navigate = useNavigate();
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [cardName, setCardName] = useState('');

    const handlePayment = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }
        const nameRegex = /^[a-zA-Z]+( [a-zA-Z]+)*$/;
        if (!cardName.trim()) {
            showError("Cardholder name is required.");
            return;
        }
        if (!nameRegex.test(cardName.trim())) {
            showError("Please enter a valid cardholder name (only letters and single spaces allowed).");
            return;
        }

        setLoading(true);

        try {
            // 1. Create Payment Method via Stripe
            const cardElement = elements.getElement(CardElement);
            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: {
                    name: cardName,
                },
            });

            if (error) {
                showError(error.message);
                setLoading(false);
                return;
            }
            const userRole = sessionStorage.getItem('role');
            const role = ['org_admin', 'user'].includes(userRole) ? 'organization/user' : 'individual';
            // 2. Create Subscription on Backend with exact body format
            const response = await api.post(`/api/subscriptions/${role}`, {
                planId: plan._id,
                billingInterval: cycle === 'monthly' ? 'month' : 'year',
                paymentMethodId: paymentMethod.id,
                autoRenew: true
            });

            // 3. Handle the response
            // If the backend requires further action (SCA/3DS)
            if (response.data.client_secret && response.data.requiresAction) {
                const result = await stripe.confirmCardPayment(response.data.client_secret);
                if (result.error) {
                    showError(result.error.message);
                    navigate('/payment/failed', {
                        state: { type: 'not_deducted', message: result.error.message }
                    });
                } else {
                    navigate('/payment/success');
                }
            } else {
                // Assume success if no error thrown
                navigate('/payment/success');
            }
        } catch (err) {
            console.error("Payment error:", err);
            showError(err.response?.data?.message || err.message || "An error occurred during payment.");
            navigate('/payment/failed', { state: { type: 'not_deducted' } });
        } finally {
            setLoading(false);
        }
    };

    const currentPrice = getPlanAmount(plan, cycle);
    const currencySymbol = '$';

    return (
        <div className="payment-inline-wrapper">
            <button className="back-btn-inline" onClick={onBack}>
                <ArrowLeft size={18} /> Back to Pricing
            </button>

            <div className="payment-card">
                <div className="payment-summary">
                    <div className="summary-header">
                        <h2>Complete Payment</h2>
                        <p>You're one step away from unlocking premium features.</p>
                    </div>

                    <div className="plan-details-box">
                        <div className="plan-info-top">
                            <span className="plan-label">{plan.name}</span>
                            <div className="plan-price-display">
                                <span className="currency">{currencySymbol}</span>
                                <span className="amount">{currentPrice}</span>
                                <span className="period">/{cycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>
                        </div>

                        <div className="features-list-summary">
                            {plan.features?.map((f, i) => (
                                <div key={i} className="summary-feature">
                                    <Check size={14} />
                                    <span>{f.replace(/_/g, ' ')}</span>
                                </div>
                            ))}
                            <div className="summary-feature">
                                <Check size={14} />
                                <span>{plan.abstractLimitPerMonth} Abstract Limit / month</span>
                            </div>
                        </div>
                    </div>

                    {/* <div className="secure-badge-box">
                        <ShieldCheck size={20} />
                        <span>Secure SSL Encryption</span>
                    </div> */}
                </div>

                <form className="payment-form-side" onSubmit={handlePayment}>
                    <div className="form-group">
                        <label className='payment-title'>Cardholder Name</label>
                        <div className="input-wrapper">
                            <input
                                className="payment-input no-icon"
                                name="cardName"
                                placeholder="John Doe"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className='payment-title'>Card Details</label>
                        <div className="stripe-element-container">
                            <CardElement options={CARD_ELEMENT_OPTIONS} />
                        </div>
                    </div>

                    <button className="pay-button" disabled={loading || !stripe}>
                        {loading ? 'Processing...' : `Pay ${currencySymbol}${currentPrice}`}
                    </button>

                    <p className="payment-footer-note">
                        Payments are securely processed by Stripe. By clicking "Pay", you agree to our Terms of Service.
                    </p>
                </form>
            </div>
        </div>
    );
};

const Payment = (props) => {
    if (!props.plan) return null;
    return (
        <Elements stripe={stripePromise}>
            <PaymentForm {...props} />
        </Elements>
    );
};

export default Payment;
