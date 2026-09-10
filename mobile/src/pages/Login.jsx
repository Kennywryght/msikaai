// mobile/src/pages/Login.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { supabase } from '../lib/supabase';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
    lock: "M12 2a4 4 0 00-4 4v4H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-2V6a4 4 0 00-4-4zM12 14v4M9 12h6",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
    eyeOff: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22",
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    google: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z",
    facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
    check: "M20 6L9 17l-5-5",
  };

  const d = icons[name] || icons.store;
  
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
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const Login = () => {
  const { login, register, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, success, error } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [activeMethod, setActiveMethod] = useState('email');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    otp: '',
  });

  const from = location.state?.from?.pathname || 
               sessionStorage.getItem('redirectAfterLogin') || 
               '/landing';

  const timerRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/landing', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    const remember = localStorage.getItem('rememberMe') === 'true';
    if (savedEmail && remember) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (otpTimer > 0) {
      timerRef.current = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [otpTimer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleEmailLogin = async (e) => {
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
          phone: formData.phone,
          role: 'buyer',
        });
      }
      
      if (result.success) {
        success(isLogin ? 'Welcome back! 👋' : 'Account created! 🎉');
        sessionStorage.removeItem('redirectAfterLogin');
        const needsOnboarding = !result.user?.profile?.onboarding_completed;
        navigate(needsOnboarding ? '/onboarding' : '/landing', { replace: true });
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

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/landing`,
        },
      });
      
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setErrorMsg(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      setErrorMsg('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formData.phone,
        options: {
          shouldCreateUser: true,
        },
      });
      
      if (error) throw error;
      
      setOtpSent(true);
      setOtpTimer(60);
      success('OTP sent to your phone! 📱');
    } catch (err) {
      setErrorMsg(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length < 4) {
      setErrorMsg('Please enter the OTP code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formData.phone,
        token: formData.otp,
        type: 'sms',
      });
      
      if (error) throw error;
      
      success('Welcome! 🎉');
      navigate('/landing', { replace: true });
    } catch (err) {
      setErrorMsg(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #F8FAFC;
          }
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #E2E8F0;
            border-top-color: #F59E0B;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="logo-section">
          <div className="logo-icon">
            <Icon name="store" size={28} color="#1E293B" strokeWidth={2.5} />
          </div>
          <h1 className="brand-name">
            <span className="brand-dark">Ku</span>
            <span className="brand-gold">msika</span>
          </h1>
          <p className="brand-tagline">Malawi's Smart Marketplace</p>
        </div>

        {/* Header */}
        <div className="header">
          <h2 className="title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="subtitle">
            {isLogin ? 'Sign in to continue' : 'Join the community today'}
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{errorMsg}</span>
            <button className="error-close" onClick={() => setErrorMsg('')}>×</button>
          </div>
        )}

        {/* Method Tabs - Login only */}
        {isLogin && (
          <div className="method-tabs">
            <button
              className={`method-tab ${activeMethod === 'email' ? 'active' : ''}`}
              onClick={() => { setActiveMethod('email'); setOtpSent(false); }}
            >
              <Icon name="mail" size={16} color={activeMethod === 'email' ? '#FFFFFF' : '#64748B'} strokeWidth={1.75} />
              Email
            </button>
            <button
              className={`method-tab ${activeMethod === 'phone' ? 'active' : ''}`}
              onClick={() => { setActiveMethod('phone'); setOtpSent(false); }}
            >
              <Icon name="phone" size={16} color={activeMethod === 'phone' ? '#FFFFFF' : '#64748B'} strokeWidth={1.75} />
              Phone
            </button>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="login-form">
          {isLogin ? (
            activeMethod === 'email' ? (
              <div className="form-group">
                <label className="label">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Icon name="mail" size={18} color="#94A3B8" strokeWidth={1.75} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="label">Phone Number</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Icon name="phone" size={18} color="#94A3B8" strokeWidth={1.75} />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+265 999 000 000"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                    required
                    disabled={loading || otpSent}
                  />
                  {!otpSent ? (
                    <button
                      type="button"
                      className="otp-btn"
                      onClick={handleSendOTP}
                      disabled={loading || !formData.phone}
                    >
                      Send OTP
                    </button>
                  ) : (
                    <span className="otp-timer">{otpTimer}s</span>
                  )}
                </div>
              </div>
            )
          ) : (
            <>
              <div className="form-group">
                <label className="label">Full Name</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Icon name="user" size={18} color="#94A3B8" strokeWidth={1.75} />
                  </span>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="e.g. Kondwani Banda"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="input-field"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Icon name="mail" size={18} color="#94A3B8" strokeWidth={1.75} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}

          {(isLogin && activeMethod === 'email') || !isLogin ? (
            <div className="form-group">
              <label className="label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Icon name="lock" size={18} color="#94A3B8" strokeWidth={1.75} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field password-input"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} color="#94A3B8" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ) : null}

          {isLogin && activeMethod === 'phone' && otpSent && (
            <div className="form-group">
              <label className="label">Enter OTP Code</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter 6-digit code"
                  value={formData.otp}
                  onChange={handleChange}
                  className="input-field"
                  maxLength="6"
                  autoFocus
                />
                <button
                  type="button"
                  className="otp-btn verify-btn"
                  onClick={handleVerifyOTP}
                  disabled={loading || !formData.otp}
                >
                  Verify
                </button>
              </div>
              <p className="otp-resend">
                Didn't receive code?{' '}
                <button
                  type="button"
                  className="otp-resend-link"
                  onClick={handleSendOTP}
                  disabled={otpTimer > 0}
                >
                  {otpTimer > 0 ? `Wait ${otpTimer}s` : 'Resend'}
                </button>
              </p>
            </div>
          )}

          {isLogin && activeMethod === 'email' && (
            <div className="remember-row">
              <label className="remember-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="remember-check"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>
          )}

          {(isLogin && activeMethod === 'email') || !isLogin ? (
            <button
              type="submit"
              className={`submit-btn ${loading ? 'disabled' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className="btn-spinner" />
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          ) : null}
        </form>

        {/* Social Login - Login only */}
        {isLogin && (
          <>
            <div className="divider">
              <span className="divider-line" />
              <span className="divider-text">or continue with</span>
              <span className="divider-line" />
            </div>

            <div className="social-buttons">
              <button
                type="button"
                className="social-btn"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
              >
                <Icon name="google" size={20} color="#EA4335" strokeWidth={2} />
                Google
              </button>
              <button
                type="button"
                className="social-btn"
                onClick={() => handleSocialLogin('facebook')}
                disabled={loading}
              >
                <Icon name="facebook" size={20} color="#1877F2" strokeWidth={2} />
                Facebook
              </button>
            </div>
          </>
        )}

        {/* Toggle Login/Register */}
        <div className="toggle-row">
          <button
            type="button"
            className="toggle-btn"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
              setOtpSent(false);
            }}
          >
            {isLogin ? (
              <>Don't have an account? <span className="toggle-link">Sign Up</span></>
            ) : (
              <>Already have an account? <span className="toggle-link">Sign In</span></>
            )}
          </button>
        </div>
      </div>

      <Link to="/" className="back-link">
        <Icon name="arrowLeft" size={16} color="#94A3B8" strokeWidth={1.75} />
        Back to Marketplace
      </Link>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #F8FAFC;
          padding: 24px 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* ===== CARD ===== */
        .login-card {
          width: 100%;
          max-width: 400px;
          background: #FFFFFF;
          padding: 32px 24px;
          border-radius: 16px;
          border: 1px solid #F1F5F9;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.02);
        }

        /* ===== LOGO ===== */
        .logo-section {
          text-align: center;
          margin-bottom: 24px;
        }

        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #F59E0B, #D97706);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.2);
        }

        .brand-name {
          font-size: 22px;
          font-weight: 800;
          margin: 0;
          font-family: 'Georgia', serif;
        }

        .brand-dark {
          color: #1E293B;
        }

        .brand-gold {
          color: #F59E0B;
        }

        .brand-tagline {
          font-size: 11px;
          color: #94A3B8;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin: 2px 0 0;
        }

        /* ===== HEADER ===== */
        .header {
          text-align: center;
          margin-bottom: 20px;
        }

        .title {
          font-size: 20px;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
        }

        .subtitle {
          font-size: 13px;
          color: #94A3B8;
          margin: 2px 0 0;
        }

        /* ===== ERROR ===== */
        .error-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #FEF2F2;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #FECACA;
          margin-bottom: 16px;
        }

        .error-icon {
          font-size: 14px;
        }

        .error-text {
          flex: 1;
          font-size: 13px;
          color: #991B1B;
        }

        .error-close {
          background: none;
          border: none;
          font-size: 18px;
          color: #991B1B;
          cursor: pointer;
          padding: 0 4px;
        }

        /* ===== METHOD TABS ===== */
        .method-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 20px;
          background: #F1F5F9;
          border-radius: 10px;
          padding: 4px;
        }

        .method-tab {
          flex: 1;
          padding: 8px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .method-tab.active {
          background: #1E293B;
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(30, 41, 59, 0.12);
        }

        /* ===== FORM ===== */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .label {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        .input-wrapper {
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

        .input-field {
          width: 100%;
          padding: 10px 14px 10px 40px;
          border: 2px solid #E2E8F0;
          border-radius: 10px;
          font-size: 14px;
          color: #1E293B;
          outline: none;
          box-sizing: border-box;
          background: #FFFFFF;
          font-family: inherit;
          transition: all 0.2s;
        }

        .input-field:focus {
          border-color: #F59E0B;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.08);
        }

        .input-field::placeholder {
          color: #94A3B8;
        }

        .input-field:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .password-input {
          padding-right: 42px;
        }

        .eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .otp-btn {
          position: absolute;
          right: 4px;
          padding: 6px 14px;
          background: #1E293B;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #FFFFFF;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .otp-btn:hover:not(:disabled) {
          background: #F59E0B;
        }

        .otp-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .otp-timer {
          position: absolute;
          right: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #94A3B8;
        }

        .otp-resend {
          font-size: 12px;
          color: #94A3B8;
          margin: 4px 0 0;
        }

        .otp-resend-link {
          background: none;
          border: none;
          color: #F59E0B;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        .otp-resend-link:disabled {
          color: #94A3B8;
          cursor: not-allowed;
        }

        .verify-btn {
          background: #10B981;
        }

        .verify-btn:hover:not(:disabled) {
          background: #059669;
        }

        /* ===== REMEMBER ===== */
        .remember-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .remember-label {
          font-size: 13px;
          color: #64748B;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .remember-check {
          width: 16px;
          height: 16px;
          accent-color: #F59E0B;
          cursor: pointer;
        }

        .forgot-link {
          font-size: 13px;
          color: #F59E0B;
          text-decoration: none;
          font-weight: 500;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        /* ===== SUBMIT ===== */
        .submit-btn {
          width: 100%;
          padding: 12px;
          background: #1E293B;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          color: #FFFFFF;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
        }

        .submit-btn:hover:not(.disabled) {
          background: #F59E0B;
          transform: scale(0.98);
        }

        .submit-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ===== DIVIDER ===== */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #E2E8F0;
        }

        .divider-text {
          font-size: 11px;
          color: #94A3B8;
          font-weight: 500;
          white-space: nowrap;
        }

        /* ===== SOCIAL ===== */
        .social-buttons {
          display: flex;
          gap: 10px;
          margin-top: 12px;
        }

        .social-btn {
          flex: 1;
          padding: 10px;
          border: 2px solid #E2E8F0;
          border-radius: 10px;
          background: #FFFFFF;
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .social-btn:hover:not(:disabled) {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .social-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ===== TOGGLE ===== */
        .toggle-row {
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid #E2E8F0;
          text-align: center;
        }

        .toggle-btn {
          background: none;
          border: none;
          font-size: 13px;
          color: #64748B;
          cursor: pointer;
          font-family: inherit;
          font-weight: 500;
        }

        .toggle-link {
          color: #F59E0B;
          font-weight: 700;
        }

        /* ===== BACK LINK ===== */
        .back-link {
          margin-top: 16px;
          color: #94A3B8;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #64748B;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .login-card {
            padding: 24px 16px;
          }
          .brand-name {
            font-size: 20px;
          }
          .social-buttons {
            flex-direction: column;
          }
          .method-tab {
            font-size: 12px;
            padding: 6px 10px;
          }
        }

        @media (max-width: 380px) {
          .login-card {
            padding: 20px 14px;
          }
          .title {
            font-size: 18px;
          }
          .input-field {
            font-size: 13px;
            padding: 8px 12px 8px 36px;
          }
          .submit-btn {
            font-size: 14px;
            padding: 10px;
            min-height: 44px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;