// mobile/src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastContainer';
import Logo from '../components/Logo';

const Icon = ({ name, size = 18, color = 'currentColor', strokeWidth = 1.75 }) => {
  const icons = {
    mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    arrowRight: 'M5 12h14M12 5l7 7-7 7',
    check: 'M20 6L9 17l-5-5',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };
  const d = icons[name] || icons.mail;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/update-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo,
      });

      if (error) throw error;
      setSent(true);
    } catch (err) {
      console.error('Password reset error:', err);
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('rate limit')) {
        setErrorMsg('Too many attempts. Please wait a few minutes and try again.');
      } else if (msg.toLowerCase().includes('invalid email')) {
        setErrorMsg('Please enter a valid email address.');
      } else {
        setErrorMsg('Could not send the reset email right now. Please try again shortly.');
      }
      showToast('Could not send reset email', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-brand">
            <Logo variant="full" size={120} clickable={false} />
            <p className="brand-tagline">
              If an account exists for <strong>{email.trim()}</strong>, we've
              sent a link to reset your password.
            </p>
          </div>

          <div className="auth-card">
            <div className="info-block">
              <Icon name="info" size={16} color="var(--color-primary)" strokeWidth={1.75} />
              <div>
                <p className="info-title">Don't see it?</p>
                <p className="info-body">
                  Check your spam or junk folder. The link expires in 1 hour.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="submit"
              onClick={() => navigate('/login', { replace: true })}
            >
              <span>Back to sign in</span>
              <Icon name="arrowRight" size={16} color="currentColor" strokeWidth={2.25} />
            </button>

            <button
              type="button"
              className="resend-btn"
              onClick={() => {
                setSent(false);
                setErrorMsg('');
              }}
            >
              Didn't get it? Try again
            </button>
          </div>
        </div>

        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <Logo variant="full" size={120} clickable={false} />
          <p className="brand-tagline">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        <div className="auth-card">
          {errorMsg && (
            <div className="error" role="alert">
              <span className="error-dot" />
              <span className="error-msg">{errorMsg}</span>
              <button
                type="button"
                className="error-x"
                onClick={() => setErrorMsg('')}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="form" noValidate>
            <div className="field">
              <label className="label" htmlFor="email">
                Email
              </label>
              <div className="input-wrap">
                <span className="input-icon">
                  <Icon name="mail" size={16} color="var(--color-text-muted)" />
                </span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg('');
                  }}
                  className="input"
                  required
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className="submit" disabled={loading}>
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  <span>Send reset link</span>
                  <Icon name="arrowRight" size={16} color="currentColor" strokeWidth={2.25} />
                </>
              )}
            </button>
          </form>
        </div>

        <Link to="/login" className="back-link">
          <Icon name="arrowLeft" size={14} color="var(--color-text-muted)" strokeWidth={2} />
          Back to sign in
        </Link>
      </div>

      <style jsx>{styles}</style>
    </div>
  );
};

const styles = `
  .auth-page {
    min-height: 100vh;
    min-height: 100dvh;
    width: 100%;
    background: var(--color-bg);
    background-image: radial-gradient(var(--color-accent-tint) 1px, transparent 1px);
    background-size: 22px 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    font-family: var(--font-sans);
    color: var(--color-text);
    box-sizing: border-box;
  }

  .auth-container {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .auth-brand {
    text-align: center;
    margin-bottom: 24px;
  }

  .auth-brand :global(.kumsika-logo) {
    margin: 0 auto 14px;
  }

  .brand-tagline {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  .brand-tagline strong {
    color: var(--color-text);
    font-weight: 600;
  }

  .auth-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2xl);
    padding: 24px;
    box-shadow: var(--shadow-sm);
  }

  .error {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--color-error-bg);
    border: 1px solid var(--color-error);
    border-radius: var(--radius-lg);
    padding: 10px 12px;
    margin-bottom: 16px;
    font-size: 13px;
    color: var(--color-error);
  }

  .error-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-error);
    flex-shrink: 0;
  }

  .error-msg { flex: 1; line-height: 1.4; }

  .error-x {
    background: none;
    border: none;
    color: var(--color-error);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    padding: 0 4px;
  }

  .form { display: flex; flex-direction: column; gap: 16px; }

  .field { display: flex; flex-direction: column; gap: 6px; }

  .label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
  }

  .input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 12px;
    display: flex;
    align-items: center;
    pointer-events: none;
  }

  .input {
    width: 100%;
    height: 44px;
    padding: 0 12px 0 38px;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    font-size: 14px;
    color: var(--color-text);
    background: var(--color-surface);
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  .input::placeholder { color: var(--color-text-muted); }

  .input:focus {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-tint);
  }

  .input:disabled {
    background: var(--color-surface-alt);
    cursor: not-allowed;
    opacity: 0.7;
  }

  .submit {
    width: 100%;
    height: 46px;
    margin-top: 4px;
    background: var(--color-accent);
    border: none;
    border-radius: var(--radius-lg);
    color: var(--color-text-inverse);
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background var(--transition-fast), transform 0.1s, box-shadow var(--transition-fast);
    text-decoration: none;
    box-shadow: var(--shadow-accent);
  }

  .submit:hover:not(:disabled) {
    background: var(--color-accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(255, 92, 35, 0.32);
  }

  .submit:active:not(:disabled) { transform: scale(0.99); }
  .submit:disabled { opacity: 0.6; cursor: not-allowed; }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: var(--color-text-inverse);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .resend-btn {
    width: 100%;
    height: 40px;
    margin-top: 8px;
    background: none;
    border: none;
    color: var(--color-text-secondary);
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .resend-btn:hover { color: var(--color-text); }

  .back-link {
    margin-top: 20px;
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--color-text-muted);
    text-decoration: none;
    font-weight: 500;
    transition: color var(--transition-fast);
  }

  .back-link:hover { color: var(--color-text-secondary); }

  .info-block {
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    background: var(--color-info-bg);
    border: 1px solid var(--color-primary-tint);
    border-radius: var(--radius-lg);
    margin-bottom: 20px;
  }

  .info-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-primary);
    margin: 0 0 2px;
  }

  .info-body {
    font-size: 12px;
    color: var(--color-primary);
    line-height: 1.45;
    margin: 0;
    opacity: 0.85;
  }
`;

export default ForgotPassword;