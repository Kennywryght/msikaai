// mobile/src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastContainer';

// ============================================================
// ICONS
// ============================================================
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

// ============================================================
// MAIN COMPONENT
// ============================================================
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
      // The redirect URL tells Supabase where to send the user after they
      // click the email link. This URL MUST be whitelisted in
      // Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.
      const redirectTo = `${window.location.origin}/update-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo,
      });

      if (error) throw error;

      // IMPORTANT: We always show the "check your inbox" screen, whether
      // or not the email exists. This prevents account enumeration — an
      // attacker cannot use this endpoint to discover registered emails.
      setSent(true);
    } catch (err) {
      console.error('Password reset error:', err);
      // Even on error, we do NOT leak whether the email exists.
      // Only surface real infrastructure errors (rate limit, network).
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

  // ============================================================
  // RENDER — success state
  // ============================================================
  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-brand">
            <div className="brand-mark success-mark">
              <Icon name="check" size={26} color="#10B981" strokeWidth={2.5} />
            </div>
            <h1 className="brand-name">Check your inbox</h1>
            <p className="brand-tagline">
              If an account exists for <strong>{email.trim()}</strong>, we've
              sent a link to reset your password.
            </p>
          </div>

          <div className="auth-card">
            <div className="info-block">
              <Icon name="info" size={16} color="#1E40AF" strokeWidth={1.75} />
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

  // ============================================================
  // RENDER — request form
  // ============================================================
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <div className="brand-mark">K</div>
          <h1 className="brand-name">
            Ku<span className="brand-name-accent">msika</span>
          </h1>
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
                  <Icon name="mail" size={16} color="#94a3b8" />
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
          <Icon name="arrowLeft" size={14} color="#94a3b8" strokeWidth={2} />
          Back to sign in
        </Link>
      </div>

      <style jsx>{styles}</style>
    </div>
  );
};

// ============================================================
// SHARED STYLES — matches Login.jsx visual language
// ============================================================
const styles = `
  .auth-page {
    min-height: 100vh;
    min-height: 100dvh;
    width: 100%;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0f172a;
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

  .brand-mark {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: #1e293b;
    color: #f59e0b;
    font-family: Georgia, serif;
    font-weight: 700;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 14px;
    box-shadow: 0 4px 16px rgba(30, 41, 59, 0.18);
  }

  .success-mark {
    background: rgba(16, 185, 129, 0.1);
    box-shadow: none;
  }

  .brand-name {
    font-family: Georgia, serif;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 6px;
    color: #1e293b;
  }

  .brand-name-accent {
    color: #f59e0b;
  }

  .brand-tagline {
    font-size: 13px;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
  }

  .auth-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  }

  .error {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 10px 12px;
    margin-bottom: 16px;
    font-size: 13px;
    color: #991b1b;
  }

  .error-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ef4444;
    flex-shrink: 0;
  }

  .error-msg { flex: 1; line-height: 1.4; }

  .error-x {
    background: none;
    border: none;
    color: #991b1b;
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
    color: #1e293b;
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
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    font-size: 14px;
    color: #0f172a;
    background: #ffffff;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .input::placeholder { color: #94a3b8; }

  .input:focus {
    border-color: #1e293b;
    box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.08);
  }

  .input:disabled {
    background: #f8fafc;
    cursor: not-allowed;
    opacity: 0.7;
  }

  .submit {
    width: 100%;
    height: 46px;
    margin-top: 4px;
    background: #1e293b;
    border: none;
    border-radius: 10px;
    color: #ffffff;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.15s, transform 0.1s;
  }

  .submit:hover:not(:disabled) { background: #0f172a; }
  .submit:active:not(:disabled) { transform: scale(0.99); }
  .submit:disabled { opacity: 0.6; cursor: not-allowed; }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
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
    color: #64748b;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .resend-btn:hover { color: #1e293b; }

  .back-link {
    margin-top: 20px;
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: #94a3b8;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.15s;
  }

  .back-link:hover { color: #475569; }

  .info-block {
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 10px;
    margin-bottom: 20px;
  }

  .info-title {
    font-size: 13px;
    font-weight: 600;
    color: #1e40af;
    margin: 0 0 2px;
  }

  .info-body {
    font-size: 12px;
    color: #1e40af;
    line-height: 1.45;
    margin: 0;
  }
`;

export default ForgotPassword;