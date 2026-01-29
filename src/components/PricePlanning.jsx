import React, { useState, useEffect, useRef, memo } from 'react';
import { Check, BadgeCheck, Sparkles } from 'lucide-react';
import api from '../service/api.js';
import '../styles/pricePlanning.css';



const getPlanAmount = (plan, cycle) => {
  const amount = plan?.pricing?.[cycle]?.amount;
  return Number.isFinite(Number(amount)) ? Number(amount) : 0;
};

const getPlanSavingsPercent = (plan) => {
  const monthly = getPlanAmount(plan, 'monthly');
  const yearly = getPlanAmount(plan, 'yearly');
  const monthlyCostInYearly = yearly / 12;

  if (!monthly) return 0;
  return Math.max(0, Math.round(((monthly - monthlyCostInYearly) / monthly) * 100));
};

const CountUp = ({ end, duration = 600 }) => {
  const [count, setCount] = useState(end);
  const prevEndRef = useRef(end);
  const startTimeRef = useRef(null);
  const rafIdRef = useRef(null);

  useEffect(() => {
    if (prevEndRef.current === end) return;

    const start = prevEndRef.current;
    const diff = end - start;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);
      const easing = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);

      setCount(Math.floor(start + diff * easing));

      if (percentage < 1) {
        rafIdRef.current = requestAnimationFrame(animate);
      } else {
        startTimeRef.current = null;
        prevEndRef.current = end;
      }
    };

    rafIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      startTimeRef.current = null;
    };
  }, [end, duration]);

  return <span>{new Intl.NumberFormat('en-US').format(count)}</span>;
};

const BillingToggle = memo(({ cycle, setCycle }) => (
  <div className="billing-toggle-wrapper">
    <div
      className={`toggle-option ${cycle === 'monthly' ? 'active' : ''}`}
      onClick={() => setCycle('monthly')}
    >
      Monthly
    </div>
    <div
      className={`toggle-option ${cycle === 'yearly' ? 'active' : ''}`}
      onClick={() => setCycle('yearly')}
    >
      Yearly
    </div>
    <div
      className="toggle-slider-bg"
      style={{
        width: '100px',
        transform: cycle === 'monthly' ? 'translateX(0)' : 'translateX(100px)',
      }}
    />
  </div>
));

const FeatureItem = memo(({ text }) => (
  <div className="feature-item">
    <div className="icon-check-wrapper">
      <Check size={12} />
    </div>
    <span>{text.replace(/_/g, ' ')}</span>
  </div>
));

// --- Main Component ---

const PricePlanning = ({ role, onPlanSelected }) => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchPlan = async () => {
      try {
        const userRole = sessionStorage.getItem('role');
        const type = ['org_admin', 'user'].includes(userRole) ? 'organization' : 'individual';

        const { data: { data } } = await api.get('/api/plans/public', {
          params: { type },
          signal: controller.signal
        });

        if (isMounted) setPlans(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error('Pricing Fetch Error:', err);
          if (isMounted) setPlans([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPlan();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [role]);

  if (loading || plans.length === 0) return null;

  return (
    <div className="pricing-container">
      <BillingToggle cycle={billingCycle} setCycle={setBillingCycle} />

      <div className="pricing-cards-grid">
        {plans.map((plan, index) => {
          const currentPrice = getPlanAmount(plan, billingCycle);
          const currencySymbol = '$';
          const planSavings = getPlanSavingsPercent(plan);

          return (
            <div className="pricing-card-wrapper" key={plan?._id || plan?.name || index}>
              <div className="pricing-card">
                <div className="card-highlight" />

                {billingCycle === 'yearly' && planSavings > 0 && (
                  <div className="plan-savings-badge">
                    <Sparkles size={11} />
                    Save {planSavings}%
                  </div>
                )}

                <h3 className="plan-name">{plan.name}</h3>

                <div className="price-box">
                  <span className="price-currency">{currencySymbol}</span>
                  <span className="price-amount">
                    <CountUp end={currentPrice} />
                  </span>
                  <span className="price-period">
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>

                <div className="features-grid">
                  {(plan?.features || []).map((feature, idx) => (
                    <FeatureItem key={idx} text={feature} />
                  ))}
                  <FeatureItem text={`${plan.abstractLimitPerMonth} Abstract Limit / month`} />
                </div>

                <button
                  className="pricing-cta"
                  onClick={() => onPlanSelected(plan, billingCycle)}
                >
                  Buy Plan
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PricePlanning;
