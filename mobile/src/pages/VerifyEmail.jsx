// mobile/src/pages/VerifyEmail.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trustAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';

const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75 }) => {
  const icons = {
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
    check: 'M20 6L9 17l-5-5',
    clock: 'M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };
  const d = icons[name] || icons.mail;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { success } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await trustAPI.submitEmail(email.trim());
      const data = res?.data || {};
      if (data.success) {
        setSubmitted(true);
        success('Email submitted for review');
      } else {
        setError(data.error || 'Failed to submit');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
        </button>
        <h1 className="title">Verify Email</h1>
      </div>

      <div className="content">
        {submitted ? (
          <div className="done-card">
            <div className="done-icon">
              <Icon name="clock" size={40} color="#F59E0B" strokeWidth={2.5} />
            </div>
            <h2 className="done-title">Submitted for Review</h2>
            <p className="done-desc">
              Your email verification is now pending admin approval. You'll see the
              status update on your Trust Profile within 24–48 hours.
            </p>
            <button className="submit" onClick={() => navigate('/trust')}>
              Back to Trust Profile
            </button>
          </div>
        ) : (
          <>
            <div className="hero">
              <div className="hero-icon-wrap">
                <Icon name="mail" size={28} color="#0EA5E9" strokeWidth={1.9} />
              </div>
              <p className="hero-text">
                Confirming your email earns you <strong>+3 trust points</strong>.
                Admin reviews submissions within 24–48 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="form">
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                disabled={loading}
              />
              {error && <p className="error">{error}</p>}
              <button type="submit" className="submit" disabled={loading || !email.trim()}>
                {loading ? 'Submitting…' : 'Submit for review'}
              </button>
            </form>

            <div className="info-card">
              <Icon name="info" size={16} color="#1E40AF" strokeWidth={1.9} />
              <span>
                Email verification is manual for now. Automated confirmation flows
                arrive in a later phase.
              </span>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: var(--color-bg);
          font-family: var(--font-sans);
          color: var(--color-text);
          padding-bottom: 40px;
        }
        .header {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.94);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--color-border);
        }
        .back-btn {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text);
          flex-shrink: 0;
        }
        .back-btn:hover { background: var(--color-surface-alt); }
        .title {
          font-family: var(--font-serif);
          font-size: 22px;
          font-weight: 600;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .content {
          max-width: 520px;
          margin: 0 auto;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .hero {
          display: flex;
          gap: 14px;
          padding: 16px;
          background: #E0F2FE;
          border: 1px solid #7DD3FC;
          border-radius: var(--radius-2xl);
        }
        .hero-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .hero-text {
          font-size: 13.5px;
          color: #075985;
          margin: 0;
          line-height: 1.5;
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
          padding: 20px;
        }
        .label {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--color-text-secondary);
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .input {
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-alt);
          padding: 14px 12px;
          font-size: 15px;
          color: var(--color-text);
          outline: none;
          font-family: inherit;
          font-weight: 500;
        }
        .input:focus {
          border-color: var(--color-primary);
          background: var(--color-surface);
        }
        .error {
          font-size: 12.5px;
          color: var(--color-error);
          margin: 4px 0 0;
          font-weight: 600;
        }
        .submit {
          margin-top: 8px;
          padding: 14px;
          background: var(--color-primary);
          color: #FFFFFF;
          border: none;
          border-radius: var(--radius-xl);
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .submit:hover:not(:disabled) { background: #1E40AF; }
        .submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .info-card {
          display: flex;
          gap: 10px;
          padding: 14px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: var(--radius-xl);
          font-size: 12.5px;
          color: #1E3A8A;
          line-height: 1.5;
          align-items: flex-start;
        }
        .done-card {
          text-align: center;
          padding: 40px 20px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .done-icon {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: #FEF3C7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        .done-title {
          font-family: var(--font-serif);
          font-size: 22px;
          font-weight: 700;
          margin: 0;
          color: var(--color-text);
        }
        .done-desc {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;