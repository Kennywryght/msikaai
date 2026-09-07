// mobile/src/pages/Register.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import LoadingSpinner from '../components/LoadingSpinner';

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
  check: "M20 6L9 17l-5-5",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
};

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast, success, error } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: 'buyer',
  });

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setErrorMsg('');
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setErrorMsg('Full name is required');
      return false;
    }

    if (!formData.email.trim()) {
      setErrorMsg('Email address is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMsg('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return false;
    }

    if (!agreeToTerms) {
      setErrorMsg('You must agree to the Terms of Service and Privacy Policy');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone || null,
            role: formData.role,
          },
        },
      });

      if (signupError) throw signupError;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: formData.email,
              full_name: formData.fullName,
              phone: formData.phone || null,
              role: formData.role,
              onboarding_completed: false,
            },
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        success('🎉 Account created successfully!');

        const loginResult = await login(formData.email, formData.password);
        
        if (loginResult.success) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/login', { 
            replace: true,
            state: { message: 'Account created! Please log in.' }
          });
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.message?.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please log in instead.';
      } else if (err.message?.includes('password')) {
        errorMessage = 'Password must be at least 6 characters.';
      } else if (err.message?.includes('email')) {
        errorMessage = 'Please enter a valid email address.';
      }
      
      setErrorMsg(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Creating your account..." />;
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
      maxWidth: '460px',
      background: '#FFFFFF',
      padding: '36px 32px',
      borderRadius: '20px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 20px 60px rgba(30,41,59,0.06)',
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
      background: '#FEF2F2',
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
      left: '12px',
      display: 'flex',
      alignItems: 'center',
      pointerEvents: 'none',
      color: '#94A3B8',
    },
    input: {
      width: '100%',
      padding: '11px 14px 11px 40px',
      border: '2px solid #E2E8F0',
      borderRadius: '10px',
      fontSize: '14px',
      color: '#1E293B',
      outline: 'none',
      boxSizing: 'border-box',
      background: '#FFFFFF',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      fontFamily: 'inherit',
    },
    inputError: {
      borderColor: '#EF4444',
    },
    inputSuccess: {
      borderColor: '#10B981',
    },
    eyeButton: {
      position: 'absolute',
      right: '12px',
      display: 'flex',
      alignItems: 'center',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#94A3B8',
      padding: '4px',
    },
    hintText: {
      fontSize: '12px',
      color: '#94A3B8',
      marginTop: '2px',
    },
    errorHint: {
      fontSize: '12px',
      color: '#EF4444',
      marginTop: '2px',
    },
    successHint: {
      fontSize: '12px',
      color: '#10B981',
      marginTop: '2px',
    },
    radioGroup: {
      display: 'flex',
      gap: '16px',
      marginTop: '4px',
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#64748B',
    },
    radioInput: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
      accentColor: '#F59E0B',
    },
    radioText: {
      fontSize: '14px',
      fontWeight: '500',
    },
    termsGroup: {
      marginTop: '4px',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      cursor: 'pointer',
      fontSize: '13px',
      color: '#64748B',
    },
    checkboxInput: {
      width: '18px',
      height: '18px',
      marginTop: '2px',
      flexShrink: 0,
      cursor: 'pointer',
      accentColor: '#F59E0B',
    },
    checkboxText: {
      lineHeight: '1.5',
    },
    termsLink: {
      color: '#F59E0B',
      textDecoration: 'none',
      fontWeight: '500',
      transition: 'color 0.2s',
    },
    submitButton: {
      marginTop: '4px',
      height: '48px',
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
    },
    submitButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      margin: '8px 0 4px 0',
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      background: '#E2E8F0',
    },
    dividerText: {
      fontSize: '12px',
      color: '#94A3B8',
      fontWeight: '500',
    },
    footerText: {
      textAlign: 'center',
      fontSize: '14px',
      color: '#94A3B8',
      margin: 0,
    },
    footerLink: {
      color: '#F59E0B',
      textDecoration: 'none',
      fontWeight: '600',
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
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Join the Kumsika community today</p>
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
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name <span style={styles.required}>*</span></label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>
                <Icon d={ICONS.user} size={18} color="#94A3B8" strokeWidth={1.75} />
              </span>
              <input
                ref={nameInputRef}
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g., Kondwani Banda"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address <span style={styles.required}>*</span></label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>
                <Icon d={ICONS.mail} size={18} color="#94A3B8" strokeWidth={1.75} />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                placeholder="name@example.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>
                <Icon d={ICONS.phone} size={18} color="#94A3B8" strokeWidth={1.75} />
              </span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={styles.input}
                placeholder="+265 999 000 000"
                disabled={loading}
                autoComplete="tel"
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
                value={formData.password}
                onChange={handleChange}
                style={styles.input}
                placeholder="Min 6 characters"
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon d={showPassword ? ICONS.eyeOff : ICONS.eye} size={18} color="#94A3B8" strokeWidth={1.75} />
              </button>
            </div>
            <p style={styles.hintText}>Must be at least 6 characters</p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password <span style={styles.required}>*</span></label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>
                <Icon d={ICONS.lock} size={18} color="#94A3B8" strokeWidth={1.75} />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(formData.confirmPassword && formData.password !== formData.confirmPassword && styles.inputError),
                  ...(formData.confirmPassword && formData.password === formData.confirmPassword && styles.inputSuccess),
                }}
                placeholder="Confirm your password"
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <Icon d={showConfirmPassword ? ICONS.eyeOff : ICONS.eye} size={18} color="#94A3B8" strokeWidth={1.75} />
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p style={styles.errorHint}>Passwords do not match</p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p style={styles.successHint}>✓ Passwords match</p>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>I am a...</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="role"
                  value="buyer"
                  checked={formData.role === 'buyer'}
                  onChange={handleChange}
                  style={styles.radioInput}
                  disabled={loading}
                />
                <span style={styles.radioText}>👤 Buyer</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="role"
                  value="seller"
                  checked={formData.role === 'seller'}
                  onChange={handleChange}
                  style={styles.radioInput}
                  disabled={loading}
                />
                <span style={styles.radioText}>🏪 Seller/Vendor</span>
              </label>
            </div>
          </div>

          <div style={styles.termsGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={agreeToTerms}
                onChange={handleChange}
                style={styles.checkboxInput}
                disabled={loading}
              />
              <span style={styles.checkboxText}>
                I agree to the{' '}
                <Link to="/terms" style={styles.termsLink}>
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" style={styles.termsLink}>
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonDisabled : {}),
            }}
            disabled={loading || !agreeToTerms}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div style={styles.divider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine}></span>
          </div>

          <p style={styles.footerText}>
            Already have an account?{' '}
            <Link to="/login" style={styles.footerLink}>
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;