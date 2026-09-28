// mobile/src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

const Icon = ({ name, size = 18, color = 'currentColor', strokeWidth = 1.75 }) => {
  const icons = {
    mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
    lock: 'M12 2a4 4 0 00-4 4v4H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-2V6a4 4 0 00-4-4zM12 14v4M9 12h6',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
    eyeOff: 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22',
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    arrowRight: 'M5 12h14M12 5l7 7-7 7',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
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

const FacebookF = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#1877F2"
      d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073c0 6.026 4.388 11.02 10.125 11.927v-8.438H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.092 24 18.099 24 12.073z"
    />
  </svg>
);

const Login = () => {
  const {
    login,
    register,
    loading: authLoading,
    isVerified,
    isAnonymous,
    user,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, success } = useToast();

  const isVerifyFlow = location.state?.reason === 'verify';
  const incomingRole = location.state?.role || null;
  const selectedRole = incomingRole || user?.role || 'buyer';

  const [isLogin, setIsLogin] = useState(!isVerifyFlow && !incomingRole);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const returnTo = location.state?.from || '/landing';

  useEffect(() => {
    if (isVerified) navigate(returnTo, { replace: true });
  }, [isVerified, navigate, returnTo]);

  useEffect(() => {
    if (isAnonymous && !isVerifyFlow && !incomingRole) {
      setIsLogin(false);
    }
  }, [isAnonymous, isVerifyFlow, incomingRole]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    const remember = localStorage.getItem('rememberMe') === 'true';
    if (savedEmail && remember) {
      setFormData((p) => ({ ...p, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password, rememberMe);
      } else {
        result = await register({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: selectedRole,
        });
      }

      if (result.success) {
        success(isLogin ? 'Welcome back! 👋' : 'Account created! 🎉');
        sessionStorage.removeItem('redirectAfterLogin');

        const needsOnboarding = !result.user?.profile?.onboarding_completed;

        if (needsOnboarding) {
          navigate('/role-selection', {
            replace: true,
            state: { from: returnTo },
          });
        } else {
          navigate(returnTo, { replace: true });
        }
      } else {
        setErrorMsg(result.error || 'Invalid credentials. Please try again.');
        showToast(result.error, 'error');
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setErrorMsg('');
    setSocialLoading('facebook');

    try {
      if (returnTo && returnTo !== '/landing') {
        sessionStorage.setItem('redirectAfterLogin', returnTo);
      } else {
        sessionStorage.removeItem('redirectAfterLogin');
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/landing`,
          scopes: 'email public_profile',
        },
      });

      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      setErrorMsg(err.message || 'Facebook sign-in failed. Please try again.');
      showToast(err.message, 'error');
      setSocialLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="boot">
        <div className="boot-spinner" />
        <style jsx>{`
          .boot {
            height: 100vh;
            height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-bg);
          }
          .boot-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid var(--color-border);
            border-top-color: var(--color-accent);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const roleBadgeLabel =
    incomingRole === 'seller'
      ? '🏪 Seller'
      : incomingRole === 'provider'
      ? '🔧 Service Provider'
      : incomingRole === 'both'
      ? '⚡ Buyer & Seller'
      : null;

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <Logo variant="full" size={140} clickable={false} />
          <p className="brand-tagline">
            {isVerifyFlow
              ? 'Create your account to start posting'
              : isLogin
              ? 'Sign in to continue to your marketplace'
              : incomingRole
              ? `Sign up as a ${incomingRole === 'seller' ? 'seller' : 'service provider'}`
              : isAnonymous
              ? 'Create your account to start posting'
              : 'Create your account to get started'}
          </p>
        </div>

        <div className="auth-card">
          {roleBadgeLabel && !isLogin && (
            <div className="role-badge">
              Signing up as <strong>{roleBadgeLabel}</strong>
            </div>
          )}

          {isVerifyFlow && (
            <div className="return-banner verify-banner">
              <Icon name="shield" size={13} color="var(--color-primary)" />
              <span>Verify your account to continue</span>
            </div>
          )}

          {!isVerifyFlow &&
            !roleBadgeLabel &&
            returnTo &&
            returnTo !== '/landing' &&
            returnTo !== '/' && (
              <div className="return-banner">
                <Icon name="shield" size={13} color="var(--color-accent-hover)" />
                <span>Sign in to continue where you left off</span>
              </div>
            )}

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

          <form onSubmit={handleEmailSubmit} className="form" noValidate>
            {!isLogin && (
              <div className="field">
                <label className="label" htmlFor="register-name">
                  Full name
                </label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <Icon name="user" size={16} color="var(--color-text-muted)" />
                  </span>
                  <input
                    id="register-name"
                    type="text"
                    name="fullName"
                    placeholder="Kondwani Banda"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="input"
                    required
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

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
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  required
                  disabled={loading}
                  autoComplete="email"
                  autoFocus={isLogin}
                />
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="input-wrap">
                <span className="input-icon">
                  <Icon name="lock" size={16} color="var(--color-text-muted)" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={
                    isLogin ? 'Enter your password' : 'At least 6 characters'
                  }
                  value={formData.password}
                  onChange={handleChange}
                  className="input input-pw"
                  required
                  minLength={6}
                  disabled={loading}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon
                    name={showPassword ? 'eyeOff' : 'eye'}
                    size={16}
                    color="var(--color-text-muted)"
                  />
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="row">
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="check"
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="link">
                  Forgot password?
                </Link>
              </div>
            )}

            <button type="submit" className="submit" disabled={loading}>
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  <span>
                    {isLogin
                      ? 'Sign in'
                      : isAnonymous
                      ? 'Verify & continue'
                      : 'Create account'}
                  </span>
                  <Icon
                    name="arrowRight"
                    size={16}
                    color="currentColor"
                    strokeWidth={2.25}
                  />
                </>
              )}
            </button>
          </form>

          <div className="divider">
            <span className="divider-line" />
            <span className="divider-text">or</span>
            <span className="divider-line" />
          </div>

          <button
            type="button"
            className="social-btn facebook"
            onClick={handleFacebookLogin}
            disabled={loading || socialLoading === 'facebook'}
          >
            {socialLoading === 'facebook' ? (
              <span className="spinner spinner-dark" />
            ) : (
              <>
                <FacebookF size={18} />
                <span>Continue with Facebook</span>
              </>
            )}
          </button>
        </div>

        <div className="auth-footer">
          <span className="footer-text">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button
            type="button"
            className="footer-btn"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
              setFormData({ email: '', password: '', fullName: '' });
            }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>

        <Link to="/landing" className="back-link">
          <Icon name="arrowLeft" size={14} color="var(--color-text-muted)" strokeWidth={2} />
          Back to marketplace
        </Link>
      </div>

      <style jsx>{`
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

        .auth-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }

        .role-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          margin-bottom: 14px;
          background: var(--color-surface-alt);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 12px;
          color: var(--color-text-secondary);
        }

        .role-badge strong {
          color: var(--color-text);
          font-weight: 700;
        }

        .return-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          margin-bottom: 14px;
          background: var(--color-accent-soft);
          border: 1px solid var(--color-accent);
          border-radius: var(--radius-md);
          font-size: 12px;
          color: var(--color-accent-hover);
          font-weight: 500;
        }

        .verify-banner {
          background: var(--color-info-bg);
          border-color: var(--color-primary);
          color: var(--color-primary);
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

        .input::placeholder {
          color: var(--color-text-muted);
        }

        .input:hover:not(:disabled):not(:focus) {
          border-color: var(--color-text-muted);
        }

        .input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-tint);
        }

        .input:disabled {
          background: var(--color-surface-alt);
          cursor: not-allowed;
          opacity: 0.7;
        }

        .input-pw { padding-right: 42px; }

        .eye {
          position: absolute;
          right: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: background var(--transition-fast);
        }

        .eye:hover { background: var(--color-surface-alt); }

        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: -4px;
        }

        .check-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--color-text-secondary);
          cursor: pointer;
          user-select: none;
        }

        .check {
          width: 16px;
          height: 16px;
          accent-color: var(--color-accent);
          cursor: pointer;
          margin: 0;
        }

        .link {
          font-size: 13px;
          color: var(--color-accent);
          font-weight: 600;
          text-decoration: none;
        }

        .link:hover {
          color: var(--color-accent-hover);
          text-decoration: underline;
          text-underline-offset: 2px;
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

        .spinner-dark {
          border-color: rgba(10, 36, 114, 0.2);
          border-top-color: var(--color-primary);
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0 16px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--color-border);
        }

        .divider-text {
          font-size: 11px;
          color: var(--color-text-muted);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        .social-btn {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-lg);
          background: var(--color-surface);
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background var(--transition-fast), border-color var(--transition-fast);
        }

        .social-btn:hover:not(:disabled) {
          background: var(--color-surface-alt);
          border-color: var(--color-text-muted);
        }

        .social-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .social-btn.facebook {
          border-color: #1877f2;
          color: #1877f2;
          background: var(--color-surface);
        }

        .social-btn.facebook:hover:not(:disabled) {
          background: #f0f6ff;
          border-color: #1877f2;
        }

        .auth-footer {
          margin-top: 20px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
        }

        .footer-text { color: var(--color-text-secondary); }

        .footer-btn {
          background: none;
          border: none;
          padding: 0;
          color: var(--color-accent);
          font-weight: 700;
          font-family: inherit;
          font-size: 13px;
          cursor: pointer;
        }

        .footer-btn:hover {
          color: var(--color-accent-hover);
          text-decoration: underline;
          text-underline-offset: 2px;
        }

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

        @media (max-width: 420px) {
          .auth-page { padding: 16px 12px; }
          .auth-brand { margin-bottom: 20px; }
          .auth-card {
            padding: 20px 18px;
            border-radius: var(--radius-xl);
          }
          .form { gap: 14px; }
        }

        @media (max-width: 360px) {
          .auth-card { padding: 18px 16px; }
        }

        @media (max-height: 640px) {
          .auth-page {
            padding: 12px;
            align-items: flex-start;
          }
          .brand-tagline { display: none; }
          .auth-brand { margin-bottom: 14px; }
          .back-link { margin-top: 12px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .submit, .social-btn, .input, .eye { transition: none; }
          .submit:active:not(:disabled) { transform: none; }
          .submit:hover:not(:disabled) { transform: none; }
        }
      `}</style>
    </div>
  );
};

export default Login;