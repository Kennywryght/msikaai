// mobile/src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { supabase } from '../lib/supabase';

// ============================================================
// ICONS
// ============================================================
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

// Facebook F — brand blue
const FacebookF = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#1877F2"
      d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073c0 6.026 4.388 11.02 10.125 11.927v-8.438H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.092 24 18.099 24 12.073z"
    />
  </svg>
);

// ============================================================
// MAIN COMPONENT
// ============================================================
const Login = () => {
  const { login, register, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, success } = useToast();

  const [isLogin, setIsLogin] = useState(true);
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

  // ★ Where to return after auth (from ProtectedRoute's state.from)
  const returnTo = location.state?.from || '/landing';

  // ★ If already signed in, bounce to where the user wanted to go
  useEffect(() => {
    if (isAuthenticated) navigate(returnTo, { replace: true });
  }, [isAuthenticated, navigate, returnTo]);

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
          role: 'buyer',
        });
      }

      if (result.success) {
        success(isLogin ? 'Welcome back! 👋' : 'Account created! 🎉');
        sessionStorage.removeItem('redirectAfterLogin');

        const needsOnboarding = !result.user?.profile?.onboarding_completed;

        // ★ Onboarding takes priority — otherwise land on the return path
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
      // Preserve return path across the OAuth round-trip
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
            background: #f8fafc;
          }
          .boot-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e2e8f0;
            border-top-color: #f59e0b;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* ===== BRAND ===== */}
        <div className="auth-brand">
          <div className="brand-mark">K</div>
          <h1 className="brand-name">
            Ku<span className="brand-name-accent">msika</span>
          </h1>
          <p className="brand-tagline">
            {isLogin
              ? 'Sign in to continue to your marketplace'
              : 'Create your account to get started'}
          </p>
        </div>

        {/* ===== CARD ===== */}
        <div className="auth-card">
          {/* Return-to context hint (only when it's not the default) */}
          {returnTo && returnTo !== '/landing' && returnTo !== '/' && (
            <div className="return-banner">
              <Icon name="shield" size={13} color="#92400e" />
              <span>Sign in to continue where you left off</span>
            </div>
          )}

          {/* Error */}
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

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="form" noValidate>
            {!isLogin && (
              <div className="field">
                <label className="label" htmlFor="register-name">
                  Full name
                </label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <Icon name="user" size={16} color="#94a3b8" />
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
                  <Icon name="mail" size={16} color="#94a3b8" />
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
                  <Icon name="lock" size={16} color="#94a3b8" />
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
                    color="#94a3b8"
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
                  <span>{isLogin ? 'Sign in' : 'Create account'}</span>
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

          {/* Divider */}
          <div className="divider">
            <span className="divider-line" />
            <span className="divider-text">or</span>
            <span className="divider-line" />
          </div>

          {/* Facebook */}
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

        {/* ===== FOOTER ===== */}
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
          <Icon name="arrowLeft" size={14} color="#94a3b8" strokeWidth={2} />
          Back to marketplace
        </Link>
      </div>

      <style jsx>{`
        /* ============================================
           PAGE
           ============================================ */
        .auth-page {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            sans-serif;
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

        /* ============================================
           BRAND
           ============================================ */
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

        /* ============================================
           CARD
           ============================================ */
        .auth-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }

        /* ============================================
           RETURN BANNER
           ============================================ */
        .return-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          margin-bottom: 14px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
          font-size: 12px;
          color: #92400e;
          font-weight: 500;
        }

        /* ============================================
           ERROR
           ============================================ */
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

        .error-msg {
          flex: 1;
          line-height: 1.4;
        }

        .error-x {
          background: none;
          border: none;
          color: #991b1b;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          padding: 0 4px;
        }

        /* ============================================
           FORM
           ============================================ */
        .form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

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

        .input::placeholder {
          color: #94a3b8;
        }

        .input:hover:not(:disabled):not(:focus) {
          border-color: #94a3b8;
        }

        .input:focus {
          border-color: #1e293b;
          box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.08);
        }

        .input:disabled {
          background: #f8fafc;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .input-pw {
          padding-right: 42px;
        }

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
          border-radius: 6px;
          transition: background 0.15s;
        }

        .eye:hover {
          background: #f1f5f9;
        }

        /* ============================================
           ROW
           ============================================ */
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
          color: #475569;
          cursor: pointer;
          user-select: none;
        }

        .check {
          width: 16px;
          height: 16px;
          accent-color: #1e293b;
          cursor: pointer;
          margin: 0;
        }

        .link {
          font-size: 13px;
          color: #1e293b;
          font-weight: 600;
          text-decoration: none;
        }

        .link:hover {
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        /* ============================================
           SUBMIT
           ============================================ */
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

        .submit:hover:not(:disabled) {
          background: #0f172a;
        }

        .submit:active:not(:disabled) {
          transform: scale(0.99);
        }

        .submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .spinner-dark {
          border-color: rgba(15, 23, 42, 0.2);
          border-top-color: #0f172a;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ============================================
           DIVIDER
           ============================================ */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0 16px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .divider-text {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        /* ============================================
           SOCIAL
           ============================================ */
        .social-btn {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background: #ffffff;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.15s, border-color 0.15s;
        }

        .social-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .social-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .social-btn.facebook {
          border-color: #1877f2;
          color: #1877f2;
          background: #ffffff;
        }

        .social-btn.facebook:hover:not(:disabled) {
          background: #f0f6ff;
          border-color: #1877f2;
        }

        /* ============================================
           FOOTER
           ============================================ */
        .auth-footer {
          margin-top: 20px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
        }

        .footer-text {
          color: #64748b;
        }

        .footer-btn {
          background: none;
          border: none;
          padding: 0;
          color: #1e293b;
          font-weight: 700;
          font-family: inherit;
          font-size: 13px;
          cursor: pointer;
        }

        .footer-btn:hover {
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
          color: #94a3b8;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }

        .back-link:hover {
          color: #475569;
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 420px) {
          .auth-page {
            padding: 16px 12px;
          }
          .auth-brand {
            margin-bottom: 20px;
          }
          .brand-mark {
            width: 46px;
            height: 46px;
            font-size: 21px;
            border-radius: 12px;
          }
          .brand-name {
            font-size: 22px;
          }
          .auth-card {
            padding: 20px 18px;
            border-radius: 14px;
          }
          .form {
            gap: 14px;
          }
        }

        @media (max-width: 360px) {
          .auth-card {
            padding: 18px 16px;
          }
        }

        @media (max-height: 640px) {
          .auth-page {
            padding: 12px;
            align-items: flex-start;
          }
          .brand-tagline {
            display: none;
          }
          .auth-brand {
            margin-bottom: 14px;
          }
          .brand-mark {
            width: 42px;
            height: 42px;
            font-size: 19px;
            margin-bottom: 8px;
          }
          .back-link {
            margin-top: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .submit,
          .social-btn,
          .input,
          .eye {
            transition: none;
          }
          .submit:active:not(:disabled) {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;