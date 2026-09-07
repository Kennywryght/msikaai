// mobile/src/pages/Login.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '../lib/supabase';

// ============================================================
// PREMIUM FEATHER ICONS
// ============================================================
const Icon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.75 }) => (
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
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  lock: "M12 2a4 4 0 00-4 4v4H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-2V6a4 4 0 00-4-4zM12 14v4M9 12h6",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeOff: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  google: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z",
  facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
};

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

  // ============================================================
  // REDIRECT IF ALREADY AUTHENTICATED
  // ============================================================
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/landing', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // ============================================================
  // LOAD SAVED EMAIL
  // ============================================================
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    const remember = localStorage.getItem('rememberMe') === 'true';
    if (savedEmail && remember) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  // ============================================================
  // OTP TIMER
  // ============================================================
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

  // ============================================================
  // EMAIL LOGIN
  // ============================================================
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

  // ============================================================
  // SOCIAL LOGIN
  // ============================================================
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

  // ============================================================
  // PHONE OTP
  // ============================================================
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
    return <LoadingSpinner fullScreen message="Checking your session..." />;
  }

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#F8FAFC',
      padding: '24px 16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    card: {
      width: '100%',
      maxWidth: '420px',
      background: '#FFFFFF',
      padding: '32px 24px',
      borderRadius: '20px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 20px 60px rgba(30,41,59,0.06)',
    },
    logoContainer: {
      textAlign: 'center',
      marginBottom: '24px',
    },
    logoWrapper: {
      width: '56px',
      height: '56px',
      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 10px auto',
      boxShadow: '0 4px 20px rgba(245,158,11,0.25)',
    },
    brandName: {
      fontSize: '24px',
      fontWeight: '800',
      color: '#1E293B',
      margin: 0,
      fontFamily: '"Fraunces", Georgia, serif',
    },
    brandAccent: {
      color: '#F59E0B',
    },
    brandTagline: {
      fontSize: '11px',
      color: '#94A3B8',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    header: {
      textAlign: 'center',
      marginBottom: '20px',
    },
    title: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1E293B',
      margin: 0,
    },
    subtitle: {
      fontSize: '13px',
      color: '#94A3B8',
      margin: '2px 0 0',
    },
    errorAlert: {
      backgroundColor: '#FEF2F2',
      padding: '10px 14px',
      borderRadius: '10px',
      border: '1px solid #FECACA',
      marginBottom: '16px',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    errorText: {
      flex: 1,
      color: '#991B1B',
    },
    errorClose: {
      background: 'none',
      border: 'none',
      color: '#991B1B',
      fontSize: '18px',
      cursor: 'pointer',
      padding: '4px',
    },
    methodTabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '20px',
      background: '#F1F5F9',
      borderRadius: '12px',
      padding: '4px',
    },
    methodTab: {
      flex: 1,
      padding: '8px 12px',
      borderRadius: '8px',
      border: 'none',
      background: 'transparent',
      fontSize: '13px',
      fontWeight: '600',
      color: '#64748B',
      cursor: 'pointer',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      transition: 'all 0.2s ease',
    },
    methodTabActive: {
      background: '#1E293B',
      color: '#FFFFFF',
      boxShadow: '0 2px 8px rgba(30,41,59,0.15)',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    label: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#475569',
    },
    inputWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    },
    inputIcon: {
      position: 'absolute',
      left: '12px',
      display: 'flex',
      alignItems: 'center',
      pointerEvents: 'none',
      color: '#94A3B8',
    },
    input: {
      width: '100%',
      padding: '10px 14px 10px 40px',
      border: '2px solid #E2E8F0',
      borderRadius: '10px',
      fontSize: '14px',
      color: '#1E293B',
      outline: 'none',
      boxSizing: 'border-box',
      backgroundColor: '#FFFFFF',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      fontFamily: 'inherit',
    },
    eyeButton: {
      position: 'absolute',
      right: '12px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#94A3B8',
      padding: '4px',
    },
    otpButton: {
      position: 'absolute',
      right: '4px',
      padding: '6px 14px',
      background: '#1E293B',
      border: 'none',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: '600',
      color: '#FFFFFF',
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
    },
    otpTimer: {
      position: 'absolute',
      right: '12px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#94A3B8',
    },
    otpResend: {
      fontSize: '12px',
      color: '#94A3B8',
      marginTop: '4px',
    },
    otpResendLink: {
      background: 'none',
      border: 'none',
      color: '#F59E0B',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    rememberContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rememberLabel: {
      fontSize: '13px',
      color: '#64748B',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
    },
    rememberCheckbox: {
      width: '16px',
      height: '16px',
      accentColor: '#F59E0B',
      cursor: 'pointer',
    },
    forgotLink: {
      fontSize: '13px',
      color: '#F59E0B',
      textDecoration: 'none',
      fontWeight: '500',
    },
    submitButton: {
      width: '100%',
      padding: '12px',
      background: '#1E293B',
      border: 'none',
      borderRadius: '10px',
      fontSize: '15px',
      fontWeight: '700',
      color: '#FFFFFF',
      cursor: 'pointer',
      fontFamily: 'inherit',
      boxShadow: '0 2px 12px rgba(30,41,59,0.15)',
      transition: 'all 0.2s ease',
      marginTop: '4px',
    },
    submitButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginTop: '20px',
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: '#E2E8F0',
    },
    dividerText: {
      fontSize: '11px',
      color: '#94A3B8',
      fontWeight: '500',
      whiteSpace: 'nowrap',
    },
    socialButtons: {
      display: 'flex',
      gap: '12px',
      marginTop: '12px',
    },
    socialButton: {
      flex: 1,
      padding: '10px',
      border: '2px solid #E2E8F0',
      borderRadius: '10px',
      background: '#FFFFFF',
      fontSize: '13px',
      fontWeight: '600',
      color: '#1E293B',
      cursor: 'pointer',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
    },
    toggleContainer: {
      marginTop: '16px',
      textAlign: 'center',
      paddingTop: '14px',
      borderTop: '1px solid #E2E8F0',
    },
    toggleButton: {
      background: 'none',
      border: 'none',
      color: '#64748B',
      fontSize: '13px',
      cursor: 'pointer',
      fontWeight: '500',
      fontFamily: 'inherit',
    },
    toggleLink: {
      color: '#F59E0B',
      fontWeight: '700',
    },
    backLink: {
      marginTop: '16px',
      color: '#94A3B8',
      textDecoration: 'none',
      fontSize: '13px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'color 0.2s',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logoWrapper}>
            <Icon d={ICONS.store} size={28} color="#1E293B" strokeWidth={2.5} />
          </div>
          <h1 style={styles.brandName}>
            Kum<span style={styles.brandAccent}>sika</span>
          </h1>
          <p style={styles.brandTagline}>Malawi's Smart Marketplace</p>
        </div>

        <div style={styles.header}>
          <h2 style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={styles.subtitle}>
            {isLogin ? 'Sign in to continue' : 'Join the community today'}
          </p>
        </div>

        {errorMsg && (
          <div style={styles.errorAlert}>
            <span>⚠️</span>
            <span style={styles.errorText}>{errorMsg}</span>
            <button style={styles.errorClose} onClick={() => setErrorMsg('')}>×</button>
          </div>
        )}

        {isLogin && (
          <div style={styles.methodTabs}>
            <button
              style={{ ...styles.methodTab, ...(activeMethod === 'email' ? styles.methodTabActive : {}) }}
              onClick={() => { setActiveMethod('email'); setOtpSent(false); }}
            >
              <Icon d={ICONS.mail} size={16} color={activeMethod === 'email' ? '#FFFFFF' : '#64748B'} strokeWidth={1.75} />
              Email
            </button>
            <button
              style={{ ...styles.methodTab, ...(activeMethod === 'phone' ? styles.methodTabActive : {}) }}
              onClick={() => { setActiveMethod('phone'); setOtpSent(false); }}
            >
              <Icon d={ICONS.phone} size={16} color={activeMethod === 'phone' ? '#FFFFFF' : '#64748B'} strokeWidth={1.75} />
              Phone
            </button>
          </div>
        )}

        <form onSubmit={handleEmailLogin} style={styles.form}>
          {isLogin ? (
            activeMethod === 'email' ? (
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>
                    <Icon d={ICONS.mail} size={18} color="#94A3B8" strokeWidth={1.75} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>
                    <Icon d={ICONS.phone} size={18} color="#94A3B8" strokeWidth={1.75} />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+265 999 000 000"
                    value={formData.phone}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    disabled={loading || otpSent}
                  />
                  {!otpSent ? (
                    <button
                      type="button"
                      style={styles.otpButton}
                      onClick={handleSendOTP}
                      disabled={loading || !formData.phone}
                    >
                      Send OTP
                    </button>
                  ) : (
                    <span style={styles.otpTimer}>{otpTimer}s</span>
                  )}
                </div>
              </div>
            )
          ) : (
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>
                    <Icon d={ICONS.user} size={18} color="#94A3B8" strokeWidth={1.75} />
                  </span>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="e.g. Kondwani Banda"
                    value={formData.fullName}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>
                    <Icon d={ICONS.mail} size={18} color="#94A3B8" strokeWidth={1.75} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}

          {(isLogin && activeMethod === 'email') || !isLogin ? (
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  <Icon d={ICONS.lock} size={18} color="#94A3B8" strokeWidth={1.75} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ ...styles.input, paddingRight: '42px' }}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Icon d={showPassword ? ICONS.eyeOff : ICONS.eye} size={18} color="#94A3B8" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ) : null}

          {isLogin && activeMethod === 'phone' && otpSent && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Enter OTP Code</label>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter 6-digit code"
                  value={formData.otp}
                  onChange={handleChange}
                  style={styles.input}
                  maxLength="6"
                  autoFocus
                />
                <button
                  type="button"
                  style={styles.otpButton}
                  onClick={handleVerifyOTP}
                  disabled={loading || !formData.otp}
                >
                  Verify
                </button>
              </div>
              <p style={styles.otpResend}>
                Didn't receive code?{' '}
                <button
                  type="button"
                  style={styles.otpResendLink}
                  onClick={handleSendOTP}
                  disabled={otpTimer > 0}
                >
                  {otpTimer > 0 ? `Wait ${otpTimer}s` : 'Resend'}
                </button>
              </p>
            </div>
          )}

          {isLogin && activeMethod === 'email' && (
            <div style={styles.rememberContainer}>
              <label style={styles.rememberLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={styles.rememberCheckbox}
                />
                Remember me
              </label>
              <Link to="/forgot-password" style={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>
          )}

          {(isLogin && activeMethod === 'email') || !isLogin ? (
            <button
              type="submit"
              style={{ ...styles.submitButton, ...(loading ? styles.submitButtonDisabled : {}) }}
              disabled={loading}
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          ) : null}
        </form>

        {isLogin && (
          <>
            <div style={styles.divider}>
              <span style={styles.dividerLine}></span>
              <span style={styles.dividerText}>or continue with</span>
              <span style={styles.dividerLine}></span>
            </div>

            <div style={styles.socialButtons}>
              <button
                type="button"
                style={styles.socialButton}
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
              >
                <Icon d={ICONS.google} size={20} color="#EA4335" strokeWidth={2} />
                Google
              </button>
              <button
                type="button"
                style={styles.socialButton}
                onClick={() => handleSocialLogin('facebook')}
                disabled={loading}
              >
                <Icon d={ICONS.facebook} size={20} color="#1877F2" strokeWidth={2} />
                Facebook
              </button>
            </div>
          </>
        )}

        <div style={styles.toggleContainer}>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
              setOtpSent(false);
            }}
            style={styles.toggleButton}
          >
            {isLogin ? (
              <>Don't have an account? <span style={styles.toggleLink}>Sign Up</span></>
            ) : (
              <>Already have an account? <span style={styles.toggleLink}>Sign In</span></>
            )}
          </button>
        </div>
      </div>

      <Link to="/" style={styles.backLink}>
        <Icon d={ICONS.arrowLeft} size={16} color="#94A3B8" strokeWidth={1.75} />
        Back to Marketplace
      </Link>
    </div>
  );
};

export default Login;