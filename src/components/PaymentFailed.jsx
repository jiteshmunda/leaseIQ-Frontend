import { XCircle, AlertTriangle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import '../styles/payment-status.css';

const PaymentFailed = () => {
    const navigate = useNavigate();
    const { state } = useLocation();

    const deducted = state?.type === 'deducted';

    return (
        <>
            <AnimatedBackground />

            <div className="payment-status-page themed">
                <div className="payment-status-card failed">
                    {deducted ? (
                        <AlertTriangle size={64} />
                    ) : (
                        <XCircle size={64} />
                    )}

                    <h1>
                        {deducted ? 'Payment Failed' : 'Payment Failed'}
                    </h1>

                    <p>
                        {deducted
                            ? 'Your amount was deducted, but the payment could not be completed. Our support team will resolve this or issue a refund shortly.'
                            : 'Your payment could not be processed. No amount was deducted from your account.'}
                    </p>

                    <div className="status-actions">
                        {!deducted && (
                            <button
                                className="pay-button"
                                onClick={() => navigate(-1)}
                            >
                                Try Again
                            </button>
                        )}

                        <button
                            className="secondary-button"
                            onClick={() => navigate('/support')}
                        >
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentFailed;
