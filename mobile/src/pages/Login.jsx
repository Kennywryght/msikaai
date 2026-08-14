// mobile/src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContainer';

const Login = () => {
  const { login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, success, error } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });

  // Get redirect URL from location state or session storage
  const from = location.state?.from?.pathname || 
               sessionStorage.getItem('redirectAfterLogin') || 
               '/dashboard';

  // Clear redirect after component mounts
  useEffect(() => {
    if (sessionStorage.getItem('redirectAfterLogin')) {
      // Keep it for the redirect
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
      } else {
        // Sign up directly via Supabase
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
        
        // Clear redirect and navigate
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
    return <LoadingSpinner message="Checking your session..." />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <span style={styles.logoIcon}>🏪</span>
          </div>
          <h1 style={styles.title}>
            Kum<span style={{ color: '#2563eb' }}>sika</span>
          </h1>
          <p style={styles.subtitle}>
            {isLogin ? 'Sign in to access your account.' : 'Create an account to join the market.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={styles.errorAlert}>
            <span style={styles.errorIcon}>⚠️</span>
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name <span style={styles.required}>*</span></label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>👤</span>
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
              <span style={styles.inputIcon}>✉️</span>
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
              <span style={styles.inputIcon}>🔒</span>
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
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number (Optional)</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>📱</span>
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

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Toggle */}
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
        ← Back to Market Home
      </Link>
    </div>
  );
};

// ==========================================
// STYLES
// ==========================================

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: '24px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#ffffff',
    padding: '36px 32px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoWrapper: {
    width: '48px',
    height: '48px',
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px auto',
    border: '1px solid #dbeafe',
  },
  logoIcon: {
    fontSize: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 6px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #fecaca',
    marginBottom: '20px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  errorIcon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  errorText: {
    flex: 1,
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
    lineHeight: 1,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  required: {
    color: '#ef4444',
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
    color: '#64748b',
    fontSize: '16px',
  },
  input: {
    width: '100%',
    padding: '11px 14px 11px 40px',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    fontSize: '18px',
    padding: '4px',
  },
  submitButton: {
    marginTop: '4px',
    height: '48px',
  },
  toggleContainer: {
    marginTop: '24px',
    textAlign: 'center',
    paddingTop: '18px',
    borderTop: '1px solid #f1f5f9',
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  toggleLink: {
    color: '#2563eb',
    fontWeight: '700',
  },
  backLink: {
    marginTop: '20px',
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '600',
  },
};

export default Login;