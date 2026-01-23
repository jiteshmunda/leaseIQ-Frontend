import React, { useState, useEffect, useRef, memo } from 'react';
import { Check, BadgeCheck } from 'lucide-react';
import api from '../service/api.js';
import '../styles/pricePlanning.css';

/**
 * PRODUCTION-READY PRICING COMPONENT
 * Features:
 * - Memoized sub-components for performance
 * - Decomposition for maintainability
 * - Optimized API lifecycle with cleanup
 * - Compact, high-end visual design
 */

// --- Sub-components ---

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

const BillingToggle = memo(({ cycle, setCycle, savings }) => (
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
      {cycle === 'yearly' && savings > 0 && (
        <span className="savings-label">-{savings}%</span>
      )}
    </div>
    <div
      className="toggle-slider-bg"
      style={{
        width: cycle === 'monthly' ? '88px' : '108px',
        transform: cycle === 'monthly' ? 'translateX(0)' : 'translateX(92px)',
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
        const planType = ['org_admin', 'user'].includes(userRole) ? 'organization' : 'individual';

        const { data: { data } } = await api.get('/api/plans/public', {
          params: { planType },
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

  const plan = plans[0];
  const currentPrice = plan?.pricing?.[billingCycle]?.price ?? 0;
  const monthlyCostInYearly = (plan?.pricing?.yearly?.price ?? 0) / 12;
  const savings = Math.round(
    (((plan?.pricing?.monthly?.price ?? 0) - monthlyCostInYearly) /
      (plan?.pricing?.monthly?.price || 1)) * 100
  );

  return (
    <div className="pricing-container">
      <BillingToggle cycle={billingCycle} setCycle={setBillingCycle} savings={savings} />

      <div className="pricing-card-wrapper">
        <div className="pricing-card">
          <div className="card-highlight" />

          <div className="plan-badge">
            <BadgeCheck size={14} />
            Most Popular
          </div>

          <h3 className="plan-name">{plan.name}</h3>

          <div className="price-box">
            <span className="price-currency">$</span>
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
            <FeatureItem text={`${plan.abstractLimit} Abstract Limit`} />
          </div>

          <button
            className="pricing-cta"
            onClick={() => onPlanSelected(plan, billingCycle)}
          >
            Buy Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricePlanning;
