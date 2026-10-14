// mobile/src/pages/VerifyEmail.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { trustAPI } from '../services/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
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

const RESEND_COOLDOWN_S = 60;

// Supabase puts link errors in the query or the hash: ?error_description=…
const readLinkError = () => {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const desc = params.get('error_description') || hash.get('error_description');
  return desc ? desc.replace(/\+/g, ' ') : null;
};

/**
 * /verify-email — reached after sign-up ("check your inbox") and from the
 * confirmation link in that email. Public, because the link may be opened
 * on a device where the user isn't signed in.
 */
const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success } = useToast();
  const { user, isAuthenticated, isAnonymous } = useAuth();

  const signedIn = isAuthenticated && !isAnonymous && !!user?.email;
  const confirmed = signedIn && !!(user.email_confirmed_at || user.confirmed_at);
  const justRegistered = !!location.state?.justRegistered;

  const [email, setEmail] = useState(location.state?.email || (signedIn ? user.email : ''));
  const [linkError] = useState(readLinkError);
  const [cooldown, setCooldown] = useState(justRegistered ? RESEND_COOLDOWN_S : 0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [trustSynced, setTrustSynced] = useState(false);
  const synced = useRef(false);

  useEffect(() => {
    if (signedIn && !email) setEmail(user.email);
  }, [signedIn, user?.email]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Once confirmed, record it on the trust profile (+ points) — once.
  useEffect(() => {
    if (!confirmed || synced.current) return;
    synced.current = true;
    trustAPI.submitEmail(user.email)
      .then((res) => { if (res?.data?.verified) setTrustSynced(true); })
      .catch(() => { /* trust sync is a bonus; confirmation already worked */ });
  }, [confirmed]);

  const handleResend = async (e) => {
    e?.preventDefault();
    setError(null);
    setNotice(null);
    const target = email.trim().toLowerCase();
    if (!isValidEmail(target)) {
      setError('Please enter a valid email address');
      return;
    }
    setSending(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: target,
        options: { emailRedirectTo: `${window.location.origin}/verify-email` },
      });
      if (resendError) throw resendError;
      setNotice(`We sent a new confirmation link to ${target}.`);
      success('Confirmation email sent 📧');
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      const msg = String(err?.message || '');
      setError(/rate|seconds|too many/i.test(msg)
        ? 'Please wait a minute before asking for another email.'
        : msg || 'Could not send the email. Please try again.');
    } finally {
      setSending(false);
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
        {confirmed ? (
            <div className="done-card">
              <div className="done-icon">
                <Icon name="check" size={40} color="#16A34A" strokeWidth={2.5} />
              </div>
              <h2 className="done-title">Email confirmed</h2>
              <p className="done-desc">
                <strong>{user.email}</strong> is verified.
                {trustSynced ? ' +3 trust points were added to your profile.' : ''}
              </p>
              <button className="submit" onClick={() => navigate(user?.onboarding_completed ? '/landing' : '/role-selection')}>
                Continue
              </button>
              <button className="link-btn" onClick={() => navigate('/trust')}>View Trust Profile</button>
            </div>
        ) : (
        <>
        <div className="hero">
          <div className="hero-icon-wrap">
            <Icon name="mail" size={28} color="#0EA5E9" strokeWidth={1.9} />
          </div>
          <p className="hero-text">
            {linkError ? (
              <>That link didn&apos;t work ({linkError}). It may have expired — send yourself a new one below.</>
            ) : email ? (
              <>We sent a confirmation link to <strong>{email}</strong>. Open it on this phone to activate your account.</>
            ) : (
              <>Enter the email you signed up with and we&apos;ll send you a confirmation link.</>
            )}
          </p>
        </div>

        <form onSubmit={handleResend} className="form">
          <label className="label" htmlFor="verify-email-input">Email address</label>
          <input
            id="verify-email-input"
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sending || signedIn}
            autoComplete="email"
          />
          {error && <p className="error" role="alert">{error}</p>}
          {notice && <p className="notice" role="status">{notice}</p>}
          <button type="submit" className="submit" disabled={sending || cooldown > 0 || !email.trim()}>
            {sending ? 'Sending…' : cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend confirmation email'}
          </button>
        </form>

        <div className="info-card">
          <Icon name="info" size={16} color="#1E40AF" strokeWidth={1.9} />
          <span>
            Can&apos;t find it? Check your Spam or Promotions folder. The link expires after 24 hours.
            {!signedIn && (
              <> Already confirmed? <Link to="/login">Sign in</Link>.</>
            )}
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
          top: var(--app-nav-height, 68px);
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
        .notice {
          font-size: 12.5px;
          color: var(--color-success, #15803D);
          margin: 4px 0 0;
          font-weight: 600;
        }
        .link-btn {
          display: block;
          margin: 12px auto 0;
          background: none;
          border: none;
          color: var(--color-primary);
          font: inherit;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          min-height: 40px;
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