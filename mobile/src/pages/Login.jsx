// mobile/src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

const Icon = ({
  name,
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.75,
}) => {
  const icons = {
    mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
    lock: 'M12 2a4 4 0 00-4 4v4H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-2V6a4 4 0 00-4-4zM12 14v4M9 12h6',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
    eyeOff:
      'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22',
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    arrowRight: 'M5 12h14M12 5l7 7-7 7',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    check: 'M20 6L9 17l-5-5',
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
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
};

const FacebookF = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
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

  const [isLogin, setIsLogin] = useState(
    !isVerifyFlow && !incomingRole
  );
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
    if (isVerified) {
      navigate(returnTo, { replace: true });
    }
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
      setFormData((p) => ({
        ...p,
        email: savedEmail,
      }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setErrorMsg('');
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      let result;

      if (isLogin) {
        result = await login(
          formData.email,
          formData.password,
          rememberMe
        );
      } else {
        result = await register({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: selectedRole,
        });
      }

      if (result.success) {
        success(
          isLogin
            ? 'Welcome back! 👋'
            : 'Account created! 🎉'
        );

        sessionStorage.removeItem('redirectAfterLogin');

        const needsOnboarding =
          !result.user?.profile?.onboarding_completed;

        if (needsOnboarding) {
          navigate('/role-selection', {
            replace: true,
            state: {
              from: returnTo,
            },
          });
        } else {
          navigate(returnTo, {
            replace: true,
          });
        }
      } else {
        setErrorMsg(
          result.error ||
            'Invalid credentials. Please try again.'
        );

        showToast(result.error, 'error');
      }
    } catch (err) {
      setErrorMsg(
        'Something went wrong. Please try again.'
      );

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
        sessionStorage.setItem(
          'redirectAfterLogin',
          returnTo
        );
      } else {
        sessionStorage.removeItem(
          'redirectAfterLogin'
        );
      }

      const { data, error } =
        await supabase.auth.signInWithOAuth({
          provider: 'facebook',
          options: {
            redirectTo: `${window.location.origin}/landing`,
            scopes: 'email public_profile',
          },
        });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setErrorMsg(
        err.message ||
          'Facebook sign-in failed. Please try again.'
      );

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
            width: 100%;
            height: 100vh;
            height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-bg);
            overflow: hidden;
          }

          .boot-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid var(--color-border);
            border-top-color: var(--color-accent);
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

  const roleBadgeLabel =
    incomingRole === 'seller'
      ? 'Seller'
      : incomingRole === 'provider'
      ? 'Service Provider'
      : incomingRole === 'both'
      ? 'Buyer & Seller'
      : null;

  const roleBadgeEmoji =
    incomingRole === 'seller'
      ? '🏪'
      : incomingRole === 'provider'
      ? '🔧'
      : incomingRole === 'both'
      ? '⚡'
      : null;

  const formTitle = isLogin
    ? 'Welcome back'
    : 'Create your account';

  const formSubtitle = isLogin
    ? 'Sign in to continue to your marketplace.'
    : isVerifyFlow || isAnonymous
    ? 'Create an account to start posting your listing.'
    : incomingRole
    ? `Set up your ${
        incomingRole === 'seller'
          ? 'seller'
          : 'service provider'
      } account.`
    : 'Join the marketplace in under a minute.';

  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-col">
          <div className="form-shell">
            <header className="auth-brand">
              <Logo
                variant="full"
                size={120}
                clickable={false}
              />
            </header>

            <div className="card-head">
              <h1 className="card-title">
                {formTitle}
              </h1>

              <p className="card-subtitle">
                {formSubtitle}
              </p>
            </div>

            {roleBadgeLabel && !isLogin && (
              <div className="note">
                <strong>
                  {roleBadgeEmoji} Signing up as{' '}
                  {roleBadgeLabel}
                </strong>

                <span>
                  You can change this later in settings.
                </span>
              </div>
            )}

            {isVerifyFlow && (
              <div className="note">
                <strong>
                  Verify your account
                </strong>

                <span>
                  Create an account to continue posting.
                </span>
              </div>
            )}

            {!isVerifyFlow &&
              !roleBadgeLabel &&
              returnTo &&
              returnTo !== '/landing' &&
              returnTo !== '/' && (
                <div className="note">
                  <strong>
                    Continue where you left off
                  </strong>

                  <span>
                    Sign in to access your saved session.
                  </span>
                </div>
              )}

            {errorMsg && (
              <div
                className="error"
                role="alert"
              >
                <span className="error-msg">
                  {errorMsg}
                </span>

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

            <form
              onSubmit={handleEmailSubmit}
              className="form"
              noValidate
            >
              {!isLogin && (
                <div className="field">
                  <label
                    className="label"
                    htmlFor="register-name"
                  >
                    Full name
                  </label>

                  <div className="input-wrap">
                    <span className="input-icon">
                      <Icon
                        name="user"
                        size={19}
                      />
                    </span>

                    <input
                      id="register-name"
                      type="text"
                      name="fullName"
                      placeholder="Kondwani Banda"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="input input-with-icon"
                      required
                      disabled={loading}
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div className="field">
                <label
                  className="label"
                  htmlFor="email"
                >
                  Email
                </label>

                <div className="input-wrap">
                  <span className="input-icon">
                    <Icon
                      name="mail"
                      size={19}
                    />
                  </span>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="input input-with-icon"
                    required
                    disabled={loading}
                    autoComplete="email"
                    autoFocus={isLogin}
                  />
                </div>
              </div>

              <div className="field">
                <div className="label-row">
                  <label
                    className="label"
                    htmlFor="password"
                  >
                    Password
                  </label>

                  {isLogin && (
                    <Link
                      to="/forgot-password"
                      className="link"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>

                <div className="input-wrap">
                  <span className="input-icon">
                    <Icon
                      name="lock"
                      size={19}
                    />
                  </span>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    name="password"
                    placeholder={
                      isLogin
                        ? 'Enter your password'
                        : 'At least 6 characters'
                    }
                    value={formData.password}
                    onChange={handleChange}
                    className="input input-with-icon input-pw"
                    required
                    minLength={6}
                    disabled={loading}
                    autoComplete={
                      isLogin
                        ? 'current-password'
                        : 'new-password'
                    }
                  />

                  <button
                    type="button"
                    className="eye"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    <Icon
                      name={
                        showPassword
                          ? 'eyeOff'
                          : 'eye'
                      }
                      size={20}
                    />
                  </button>
                </div>
              </div>

              {isLogin && (
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(
                        e.target.checked
                      )
                    }
                    className="check"
                  />

                  <span>
                    Keep me signed in
                  </span>
                </label>
              )}

              <button
                type="submit"
                className="submit"
                disabled={loading}
              >
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
                      size={19}
                      strokeWidth={2}
                    />
                  </>
                )}
              </button>
            </form>

            <div className="divider">
              <span className="divider-line" />
              <span className="divider-text">
                or
              </span>
              <span className="divider-line" />
            </div>

            <button
              type="button"
              className="social-btn"
              onClick={handleFacebookLogin}
              disabled={
                loading ||
                socialLoading === 'facebook'
              }
            >
              {socialLoading === 'facebook' ? (
                <span className="spinner spinner-dark" />
              ) : (
                <>
                  <span className="fb-icon">
                    <FacebookF size={19} />
                  </span>

                  <span>
                    Continue with Facebook
                  </span>
                </>
              )}
            </button>

            <p className="switch">
              <span>
                {isLogin
                  ? "Don't have an account?"
                  : 'Already have an account?'}
              </span>

              <button
                type="button"
                className="switch-btn"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMsg('');

                  setFormData({
                    email: '',
                    password: '',
                    fullName: '',
                  });
                }}
              >
                {isLogin
                  ? 'Create one'
                  : 'Sign in'}
              </button>
            </p>

            <Link
              to="/landing"
              className="back-link"
            >
              <Icon
                name="arrowLeft"
                size={15}
                strokeWidth={2}
              />

              <span>
                Back to marketplace
              </span>
            </Link>
          </div>
        </div>
      </main>

      <aside
        className="statement"
        aria-hidden="true"
      >
        <div className="statement-glow statement-glow-one" />
        <div className="statement-glow statement-glow-two" />

        <div className="statement-inner">
          <div className="statement-top">
            <span className="made-badge">
              <span className="made-dot" />
              Made for Malawi
            </span>
          </div>

          <div className="statement-content">
            <p className="statement-eyebrow">
              KUMSIKA MARKETPLACE
            </p>

            <h2 className="statement-title">
              Discover.
              <br />
              Trade.
              <br />
              Connect.
            </h2>

            <p className="statement-sub">
              Buy, sell and discover services
              from people and businesses across
              Malawi — all in one place.
            </p>

            <div className="statement-points">
              <div className="statement-point">
                <span className="point-icon">
                  <Icon
                    name="check"
                    size={14}
                    strokeWidth={2.4}
                  />
                </span>

                <span>
                  Trusted sellers &amp; providers
                </span>
              </div>

              <div className="statement-point">
                <span className="point-icon">
                  <Icon
                    name="check"
                    size={14}
                    strokeWidth={2.4}
                  />
                </span>

                <span>
                  Secure in-app conversations
                </span>
              </div>

              <div className="statement-point">
                <span className="point-icon">
                  <Icon
                    name="check"
                    size={14}
                    strokeWidth={2.4}
                  />
                </span>

                <span>
                  Free to list your products
                </span>
              </div>
            </div>
          </div>

          <div className="statement-foot">
            <div className="flag-stripe">
              <i />
              <i />
              <i />
            </div>

            <span>
              © {new Date().getFullYear()} Kumsika
              · Made in Malawi
            </span>
          </div>
        </div>
      </aside>

      <style jsx>{`
        :global(html),
        :global(body),
        :global(#root) {
          width: 100%;
          height: 100%;
          margin: 0;
          overflow: hidden;
        }

        .auth-page {
          width: 100%;
          height: 100vh;
          height: 100dvh;
          min-height: 100dvh;
          display: flex;
          overflow: hidden;
          background: #f5f7fb;
          font-family: var(--font-sans);
          color: var(--color-text);
          box-sizing: border-box;
        }

        /* ================= FORM AREA ================= */
        .auth-main {
          width: 100%;
          height: 100%;
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .auth-col {
          width: 100%;
          max-width: 500px;
          max-height: calc(100dvh - 48px);
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .form-shell {
          width: 100%;
          max-height: calc(100dvh - 48px);
          box-sizing: border-box;
          padding: 36px 40px;
          background: #ffffff;
          border: 1px solid #e7ebf2;
          border-radius: 26px;
          box-shadow:
            0 24px 60px rgba(15, 23, 42, 0.08),
            0 5px 18px rgba(15, 23, 42, 0.04);
          overflow: hidden;
        }

        /* ================= BRAND / HEADING ================= */
        .auth-brand {
          margin-bottom: 22px;
          display: flex;
          align-items: center;
        }

        .card-head {
          margin-bottom: 22px;
        }

        .card-title {
          margin: 0 0 8px;
          font-size: 32px;
          line-height: 1.12;
          font-weight: 800;
          letter-spacing: -0.035em;
          color: var(--color-text);
        }

        .card-subtitle {
          margin: 0;
          font-size: 14.5px;
          line-height: 1.5;
          color: var(--color-text-secondary);
        }

        /* ================= NOTES ================= */
        .note {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 16px;
          padding: 9px 0 9px 12px;
          border-left: 2px solid var(--color-accent);
          font-size: 12.5px;
          line-height: 1.45;
        }

        .note strong {
          font-weight: 700;
          color: var(--color-text);
        }

        .note span {
          color: var(--color-text-secondary);
        }

        /* ================= ERROR ================= */
        .error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 16px;
          padding: 11px 13px;
          border-radius: 12px;
          background: var(--color-error-bg);
          color: var(--color-error);
          font-size: 13px;
          line-height: 1.4;
        }

        .error-msg {
          flex: 1;
          min-width: 0;
        }

        .error-x {
          flex-shrink: 0;
          background: none;
          border: none;
          padding: 0 4px;
          font-size: 20px;
          line-height: 1;
          color: var(--color-error);
          cursor: pointer;
        }

        /* ================= FORM ================= */
        .form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .label {
          font-size: 13.5px;
          line-height: 1.2;
          font-weight: 700;
          color: var(--color-text);
        }

        .link {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-decoration: none;
        }

        .link:hover {
          color: var(--color-accent);
        }

        /* ================= INPUTS ================= */
        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .input {
          width: 100%;
          height: 52px;
          min-height: 52px;
          padding: 0 16px;
          border: 1px solid #dfe4ec;
          border-radius: 12px;
          background: #f8f9fc;
          color: var(--color-text);
          font-family: inherit;
          font-size: 15px;
          outline: none;
          box-sizing: border-box;
          transition:
            border-color 160ms ease,
            background 160ms ease,
            box-shadow 160ms ease;
        }

        .input::placeholder {
          color: #a5adba;
          font-size: 14.5px;
        }

        .input:hover:not(:disabled) {
          border-color: #cbd2dd;
        }

        .input:focus {
          background: #ffffff;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(10, 36, 114, 0.08);
        }

        .input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .input-with-icon {
          padding-left: 48px;
        }

        .input-pw {
          padding-right: 52px;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8d97a7;
          pointer-events: none;
        }

        .eye {
          position: absolute;
          right: 6px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          border-radius: 10px;
          color: #8d97a7;
          cursor: pointer;
        }

        .eye:hover {
          color: var(--color-text);
          background: #f1f3f7;
        }

        /* ================= REMEMBER ME ================= */
        .check-label {
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 20px;
          font-size: 13px;
          color: var(--color-text-secondary);
          cursor: pointer;
          user-select: none;
        }

        .check {
          width: 17px;
          height: 17px;
          margin: 0;
          accent-color: var(--color-accent);
          cursor: pointer;
        }

        /* ================= SUBMIT ================= */
        .submit {
          width: 100%;
          height: 54px;
          min-height: 54px;
          margin-top: 3px;
          border: none;
          border-radius: 12px;
          background: var(--color-accent);
          color: var(--color-text-inverse);
          font-family: inherit;
          font-size: 15.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition:
            transform 160ms ease,
            background 160ms ease,
            box-shadow 160ms ease;
        }

        .submit:hover:not(:disabled) {
          background: var(--color-accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 9px 22px rgba(10, 36, 114, 0.2);
        }

        .submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ================= SPINNERS ================= */
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .spinner-dark {
          border-color: var(--color-border);
          border-top-color: var(--color-text);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ================= DIVIDER ================= */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 18px 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #e5e9ef;
        }

        .divider-text {
          font-size: 11.5px;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
        }

        /* ================= SOCIAL ================= */
        .social-btn {
          width: 100%;
          height: 50px;
          min-height: 50px;
          border: 1px solid #dfe4ec;
          border-radius: 12px;
          background: #ffffff;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition:
            background 160ms ease,
            border-color 160ms ease;
        }

        .social-btn:hover:not(:disabled) {
          background: #f8f9fc;
          border-color: #cdd4df;
        }

        .social-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .fb-icon {
          display: inline-flex;
          color: #1877f2;
        }

        /* ================= SWITCH ================= */
        .switch {
          margin: 18px 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
          font-size: 13.5px;
          line-height: 1.4;
          color: var(--color-text-secondary);
        }

        .switch-btn {
          padding: 0;
          border: none;
          background: none;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 700;
          color: var(--color-accent);
          cursor: pointer;
        }

        .switch-btn:hover {
          color: var(--color-accent-hover);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* ================= BACK LINK ================= */
        .back-link {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 500;
          color: var(--color-text-muted);
          text-decoration: none;
        }

        .back-link:hover {
          color: var(--color-text-secondary);
        }

        /* ================= MARKETING PANEL ================= */
        .statement {
          position: relative;
          flex: 1;
          height: 100vh;
          height: 100dvh;
          min-height: 0;
          overflow: hidden;
          display: none;
          background:
            radial-gradient(
              circle at 80% 20%,
              rgba(44, 83, 180, 0.32),
              transparent 34%
            ),
            #0a2472;
        }

        .statement-inner {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
          max-width: 650px;
          padding: 54px 60px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .statement-top {
          display: flex;
          align-items: center;
        }

        .made-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
          color: rgba(255, 255, 255, 0.85);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .made-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #55c76a;
          box-shadow: 0 0 0 4px rgba(85, 199, 106, 0.12);
        }

        .statement-content {
          margin-top: auto;
          margin-bottom: auto;
          padding-top: 8vh;
          padding-bottom: 5vh;
        }

        .statement-eyebrow {
          margin: 0 0 18px;
          color: rgba(255, 255, 255, 0.48);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
        }

        .statement-title {
          margin: 0 0 20px;
          font-size: clamp(46px, 4.4vw, 70px);
          line-height: 0.98;
          font-weight: 800;
          letter-spacing: -0.055em;
          color: #ffffff;
        }

        .statement-sub {
          max-width: 450px;
          margin: 0 0 28px;
          font-size: 16px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.67);
        }

        .statement-points {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .statement-point {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
        }

        .point-icon {
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .statement-foot {
          display: flex;
          align-items: center;
          gap: 9px;
          color: rgba(255, 255, 255, 0.38);
          font-size: 11px;
        }

        .flag-stripe {
          width: 19px;
          height: 12px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 2px;
        }

        .flag-stripe i {
          flex: 1;
          display: block;
        }

        .flag-stripe i:nth-child(1) {
          background: #000000;
        }

        .flag-stripe i:nth-child(2) {
          background: #ce1126;
        }

        .flag-stripe i:nth-child(3) {
          background: #339e35;
        }

        .statement-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .statement-glow-one {
          width: 380px;
          height: 380px;
          top: -170px;
          right: -100px;
          background: rgba(255, 255, 255, 0.035);
        }

        .statement-glow-two {
          width: 280px;
          height: 280px;
          bottom: -160px;
          left: -100px;
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        /* ================= DESKTOP ================= */
        @media (min-width: 1024px) {
          .auth-main {
            flex: 0 0 55%;
            width: 55%;
            height: 100dvh;
            padding: 28px 48px;
          }

          .auth-col {
            max-width: 500px;
            max-height: calc(100dvh - 56px);
          }

          .form-shell {
            max-height: calc(100dvh - 56px);
          }

          .statement {
            display: flex;
          }
        }

        /* ================= LARGE DESKTOP ================= */
        @media (min-width: 1440px) {
          .auth-main {
            padding-left: 70px;
            padding-right: 70px;
          }

          .statement-inner {
            padding: 64px 78px;
          }

          .statement-title {
            font-size: 68px;
          }
        }

        /* ================= SHORT DESKTOP / LAPTOP ================= */
        @media (min-width: 1024px) and (max-height: 820px) {
          .auth-main {
            padding: 18px 40px;
          }

          .auth-col {
            max-height: calc(100dvh - 36px);
          }

          .form-shell {
            max-height: calc(100dvh - 36px);
            padding: 26px 30px;
            border-radius: 22px;
          }

          .auth-brand {
            margin-bottom: 14px;
          }

          .card-head {
            margin-bottom: 16px;
          }

          .card-title {
            font-size: 28px;
          }

          .card-subtitle {
            font-size: 13.5px;
          }

          .form {
            gap: 12px;
          }

          .field {
            gap: 5px;
          }

          .input {
            height: 46px;
            min-height: 46px;
            font-size: 14.5px;
          }

          .input-with-icon {
            padding-left: 44px;
          }

          .input-icon {
            left: 14px;
          }

          .submit {
            height: 48px;
            min-height: 48px;
            font-size: 15px;
          }

          .divider {
            margin: 12px 0;
          }

          .social-btn {
            height: 46px;
            min-height: 46px;
            font-size: 13.5px;
          }

          .switch {
            margin-top: 12px;
            font-size: 13px;
          }

          .switch-btn {
            font-size: 13px;
          }

          .back-link {
            margin-top: 10px;
          }

          .statement-inner {
            padding-top: 35px;
            padding-bottom: 35px;
          }

          .statement-content {
            padding-top: 3vh;
            padding-bottom: 3vh;
          }

          .statement-title {
            font-size: clamp(40px, 4vw, 56px);
            margin-bottom: 14px;
          }

          .statement-sub {
            margin-bottom: 20px;
            font-size: 14px;
          }

          .statement-points {
            gap: 9px;
          }
        }

        /* ================= MOBILE / TABLET ================= */
        @media (max-width: 1023px) {
          .auth-main {
            padding: 20px;
          }

          .auth-col {
            max-width: 500px;
            max-height: calc(100dvh - 40px);
          }

          .form-shell {
            max-height: calc(100dvh - 40px);
            padding: 30px 26px;
            border-radius: 22px;
          }
        }

        /* ================= SMALL MOBILE ================= */
        @media (max-width: 480px) {
          .auth-main {
            padding: 14px;
          }

          .auth-col {
            max-height: calc(100dvh - 28px);
          }

          .form-shell {
            max-height: calc(100dvh - 28px);
            padding: 24px 22px;
            border-radius: 20px;
          }

          .auth-brand {
            margin-bottom: 16px;
          }

          .card-head {
            margin-bottom: 18px;
          }

          .card-title {
            font-size: 27px;
          }

          .card-subtitle {
            font-size: 14px;
          }

          .form {
            gap: 13px;
          }

          .field {
            gap: 6px;
          }

          .input {
            height: 48px;
            min-height: 48px;
            font-size: 15px;
          }

          .input-with-icon {
            padding-left: 46px;
          }

          .input-icon {
            left: 15px;
          }

          .submit {
            height: 50px;
            min-height: 50px;
            font-size: 15px;
          }

          .divider {
            margin: 15px 0;
          }

          .social-btn {
            height: 48px;
            min-height: 48px;
            font-size: 13.5px;
          }

          .switch {
            margin-top: 15px;
            font-size: 13px;
          }

          .switch-btn {
            font-size: 13px;
          }

          .back-link {
            margin-top: 12px;
          }
        }

        /* ================= SHORT PHONES ================= */
        @media (max-width: 480px) and (max-height: 780px) {
          .auth-main {
            padding: 10px;
          }

          .auth-col {
            max-height: calc(100dvh - 20px);
          }

          .form-shell {
            max-height: calc(100dvh - 20px);
            padding: 20px 18px;
            border-radius: 18px;
          }

          .auth-brand {
            margin-bottom: 11px;
          }

          .card-head {
            margin-bottom: 12px;
          }

          .card-title {
            font-size: 24px;
          }

          .card-subtitle {
            font-size: 13px;
            line-height: 1.4;
          }

          .note {
            margin-bottom: 10px;
            padding-top: 6px;
            padding-bottom: 6px;
            font-size: 12px;
          }

          .error {
            margin-bottom: 10px;
            padding: 8px 11px;
            font-size: 12px;
          }

          .form {
            gap: 10px;
          }

          .field {
            gap: 4px;
          }

          .label {
            font-size: 12.5px;
          }

          .link {
            font-size: 12px;
          }

          .input {
            height: 44px;
            min-height: 44px;
            font-size: 14px;
          }

          .input-with-icon {
            padding-left: 42px;
          }

          .input-pw {
            padding-right: 48px;
          }

          .input-icon {
            left: 13px;
          }

          .eye {
            width: 36px;
            height: 36px;
          }

          .check-label {
            font-size: 12.5px;
          }

          .check {
            width: 16px;
            height: 16px;
          }

          .submit {
            height: 46px;
            min-height: 46px;
            font-size: 14.5px;
          }

          .divider {
            margin: 11px 0;
          }

          .divider-text {
            font-size: 10.5px;
          }

          .social-btn {
            height: 44px;
            min-height: 44px;
            font-size: 13px;
          }

          .switch {
            margin-top: 11px;
            font-size: 12.5px;
          }

          .switch-btn {
            font-size: 12.5px;
          }

          .back-link {
            margin-top: 9px;
            font-size: 12px;
          }
        }

        /* ================= VERY SHORT PHONES ================= */
        @media (max-width: 480px) and (max-height: 700px) {
          .auth-main {
            padding: 6px 8px;
          }

          .auth-col {
            max-height: calc(100dvh - 12px);
          }

          .form-shell {
            max-height: calc(100dvh - 12px);
            padding: 16px 16px;
            border-radius: 16px;
          }

          .auth-brand {
            margin-bottom: 8px;
          }

          .card-head {
            margin-bottom: 10px;
          }

          .card-title {
            font-size: 22px;
          }

          .card-subtitle {
            font-size: 12px;
          }

          .note {
            margin-bottom: 8px;
            font-size: 11px;
            line-height: 1.35;
          }

          .form {
            gap: 8px;
          }

          .field {
            gap: 3px;
          }

          .label {
            font-size: 12px;
          }

          .input {
            height: 42px;
            min-height: 42px;
            font-size: 13.5px;
          }

          .input-with-icon {
            padding-left: 40px;
          }

          .submit {
            height: 44px;
            min-height: 44px;
            font-size: 14px;
          }

          .divider {
            margin: 8px 0;
          }

          .social-btn {
            height: 42px;
            min-height: 42px;
            font-size: 13px;
          }

          .switch {
            margin-top: 8px;
          }

          .back-link {
            margin-top: 6px;
          }
        }

        /* ================= ACCESSIBILITY ================= */
        .submit:focus-visible,
        .social-btn:focus-visible,
        .switch-btn:focus-visible,
        .eye:focus-visible,
        .link:focus-visible,
        .back-link:focus-visible,
        .check:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .input,
          .submit,
          .social-btn {
            transition: none;
          }

          .spinner,
          .boot-spinner {
            animation-duration: 1.5s;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;