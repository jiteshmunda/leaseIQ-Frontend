import React, { useState } from 'react';
import { CreditCard, Lock, ShieldCheck, Check, Calendar, ArrowLeft } from 'lucide-react';
import { showSuccess } from '../service/toast';
import '../styles/payment.css';
import { useNavigate } from 'react-router-dom';

const Payment = ({ plan, cycle, onBack, onSuccess }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        cardName: '',
        cardNumber: '',
        expiry: '',
        cvc: ''
    });

    if (!plan) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePayment = (e) => {
    e.preventDefault();
    setLoading(true);

        // Simulate payment processing
    setTimeout(() => {
        setLoading(false);

        const result = Math.random();

        if (result > 0.6) {
            // SUCCESS
            navigate('/payment/success');
        } else if (result > 0.3) {
            // FAILED BUT AMOUNT DEDUCTED
            navigate('/payment/failed', {
                state: { type: 'deducted' }
            });
        } else {
            // FAILED, NO DEDUCTION
            navigate('/payment/failed', {
                state: { type: 'not_deducted' }
            });
        }
    }, 2000);
};

    const currentPrice = plan.pricing?.[cycle]?.price ?? 0;

    return (
        <div className="payment-inline-wrapper">
            <button className="back-btn-inline" onClick={onBack}>
                <ArrowLeft size={18} /> Back to Pricing
            </button>

            <div className="payment-card">
                {/* Left side: Summary */}
                <div className="payment-summary">
                    <div className="summary-header">
                        <h2>Complete Payment</h2>
                        <p>You're one step away from unlocking premium features.</p>
                    </div>

                    <div className="plan-details-box">
                        <div className="plan-info-top">
                            <span className="plan-label">{plan.name}</span>
                            <div className="plan-price-display">
                                <span className="currency">$</span>
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
                                <span>{plan.abstractLimit} Abstract Limit</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: Form */}
                <form className="payment-form-side" onSubmit={handlePayment}>
                    <div className="form-group">
                        <label className='payment-title'>Cardholder Name</label>
                        <div className="input-wrapper">
                            <CreditCard size={18} />
                            <input
                                className="payment-input"
                                name="cardName"
                                placeholder="John Doe"
                                value={formData.cardName}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className='payment-title'>Card Number</label>
                        <div className="input-wrapper">
                            <CreditCard size={18} />
                            <input
                                className="payment-input"
                                name="cardNumber"
                                placeholder="0000 0000 0000 0000"
                                maxLength="19"
                                value={formData.cardNumber}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className='payment-title'>Expiry Date</label>
                            <div className="input-wrapper">
                                <Calendar size={18} />
                                <input
                                    className="payment-input"
                                    name="expiry"
                                    placeholder="MM/YY"
                                    maxLength="5"
                                    value={formData.expiry}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className='payment-title'>CVC</label>
                            <div className="input-wrapper">
                                <Lock size={18} />
                                <input
                                    className="payment-input"
                                    name="cvc"
                                    type="password"
                                    placeholder="***"
                                    maxLength="4"
                                    value={formData.cvc}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button className="pay-button" disabled={loading}>
                        {loading ? 'Processing...' : `Pay $${currentPrice}`}
                    </button>

                    <p className="payment-footer-note">
                        Payments are secure and encrypted. By clicking "Pay", you agree to our Terms of Service.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Payment;
