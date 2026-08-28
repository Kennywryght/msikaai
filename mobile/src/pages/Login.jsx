// mobile/src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContainer';

// ==========================================
// PREMIUM FEATHER ICONS
// ==========================================
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
  check: "M20 6L9 17l-5-5",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
};

const Login = () => {
  const { login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, success, error } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });

  const from = location.state?.from?.pathname || 
               sessionStorage.getItem('redirectAfterLogin') || 
               '/dashboard';

  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      let result;

      if (isLogin) {
        result = await login(formData.email, formData.password);
        
        if (result.success && rememberMe) {
          localStorage.setItem('remembered_email', formData.email);
        } else if (result.success && !rememberMe) {
          localStorage.removeItem('remembered_email');
        }
      } else {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
            },
          },
        });

        if (signupError) {
          result = { success: false, error: signupError };
        } else {
          result = { success: true, user: data.user };
        }
      }

      if (result.success) {
        success(isLogin ? 'Welcome back! 👋' : 'Account created successfully! 🎉');
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(from, { replace: true });
      } else {
        const errorMsgText = result.error?.message || 'Something went wrong. Please try again.';
        setErrorMsg(errorMsgText);
        showToast(errorMsgText, 'error');
      }
    } catch (err) {
      console.error('Auth submit error:', err);
      const errorMsgText = err.message || 'Something went wrong. Please try again.';
      setErrorMsg(errorMsgText);
      showToast(errorMsgText, 'error');
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
      padding: '36px 32px',
      borderRadius: '20px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 20px 60px rgba(30,41,59,0.06)',
      position: 'relative',
    },
    logoContainer: {
      textAlign: 'center',
      marginBottom: '28px',
    },
    logoWrapper: {
      width: '64px',
      height: '64px',
      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
      borderRadius: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 12px auto',
      boxShadow: '0 4px 20px rgba(245,158,11,0.25)',
    },
    brandName: {
      fontSize: '28px',
      fontWeight: '800',
      color: '#1E293B',
      margin: 0,
      letterSpacing: '-0.5px',
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
      marginTop: '2px',
    },
    header: {
      textAlign: 'center',
      marginBottom: '24px',
    },
    title: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#1E293B',
      margin: 0,
    },
    subtitle: {
      fontSize: '14px',
      color: '#94A3B8',
      margin: '4px 0 0 0',
    },
    errorAlert: {
      backgroundColor: '#FEF2F2',
      padding: '12px 14px',
      borderRadius: '10px',
      border: '1px solid #FECACA',
      marginBottom: '20px',
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
      lineHeight: 1,
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    },
    label: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#475569',
    },
    required: {
      color: '#EF4444',
    },
    inputWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    },
    inputIcon: {
      position: 'absolute',
      left: '14px',
      display: 'flex',
      alignItems: 'center',
      pointerEvents: 'none',
      color: '#94A3B8',
    },
    input: {
      width: '100%',
      padding: '12px 14px 12px 44px',
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
      display: 'flex',
      alignItems: 'center',
    },
    rememberContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '-4px',
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
      transition: 'color 0.2s',
    },
    submitButton: {
      width: '100%',
      padding: '14px',
      background: '#1E293B',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '700',
      color: '#FFFFFF',
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 12px rgba(30,41,59,0.15)',
      marginTop: '4px',
    },
    submitButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginTop: '24px',
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: '#E2E8F0',
    },
    dividerText: {
      fontSize: '12px',
      color: '#94A3B8',
      fontWeight: '500',
    },
    toggleContainer: {
      marginTop: '20px',
      textAlign: 'center',
      paddingTop: '16px',
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
      transition: 'color 0.2s',
    },
    toggleLink: {
      color: '#F59E0B',
      fontWeight: '700',
    },
    backLink: {
      marginTop: '20px',
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
            Msika<span style={styles.brandAccent}>AI</span>
          </h1>
          <p style={styles.brandTagline}>Malawi's Smart Marketplace</p>
        </div>

        <div style={styles.header}>
          <h2 style={styles.title}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={styles.subtitle}>
            {isLogin ? 'Sign in to continue to your dashboard' : 'Join the MsikaAI community today'}
          </p>
        </div>

        {errorMsg && (
          <div style={styles.errorAlert}>
            <span>⚠️</span>
            <span style={styles.errorText}>{errorMsg}</span>
            <button
              style={styles.errorClose}
              onClick={() => setErrorMsg('')}
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name <span style={styles.required}>*</span></label>
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
                  required={!isLogin}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address <span style={styles.required}>*</span></label>
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
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password <span style={styles.required}>*</span></label>
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
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon 
                  d={showPassword ? ICONS.eyeOff : ICONS.eye} 
                  size={18} 
                  color="#94A3B8" 
                  strokeWidth={1.75} 
                />
              </button>
            </div>
          </div>

          {!isLogin && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number <span style={{ color: '#94A3B8', fontWeight: '400' }}>(Optional)</span></label>
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
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>
            </div>
          )}

          {isLogin && (
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

          <button
            type="submit"
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonDisabled : {}),
            }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine}></span>
        </div>

        <div style={styles.toggleContainer}>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
            }}
            style={styles.toggleButton}
          >
            {isLogin ? (
              <>
                Don't have an account? <span style={styles.toggleLink}>Sign Up</span>
              </>
            ) : (
              <>
                Already have an account? <span style={styles.toggleLink}>Sign In</span>
              </>
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