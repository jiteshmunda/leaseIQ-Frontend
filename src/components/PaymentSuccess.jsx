import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import '../styles/payment-status.css';

const PaymentSuccess = () => {
    const navigate = useNavigate();

    return (
        <>
            <AnimatedBackground />

            <div className="payment-status-page themed">
                <div className="payment-status-card success">
                    <CheckCircle size={64} />

                    <h1>Payment Successful</h1>
                    <p>
                        Your payment has been processed successfully.
                        Premium features are now unlocked 🎉
                    </p>

                    <button
                        className="pay-button"
                        onClick={() => {
                            navigate("/landing");
                        }}
                    >
                        Continue to Dashboard
                    </button>
                </div>
            </div>
        </>
    );
};

export default PaymentSuccess;
