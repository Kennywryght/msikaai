// mobile/src/pages/Register.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import PrimaryButton from '../components/PrimaryButton';
import LoadingSpinner from '../components/LoadingSpinner';

// ==========================================
// BRAND COLORS
// ==========================================
const COLORS = {
  championBlue: '#151130',
  championBlueLight: '#2A2438',
  championBlueDark: '#0A081F',
  lavenderTonic: '#C8BEFA',
  lavenderLight: '#D8CFFF',
  lavenderDark: '#B8A8F0',
  white: '#FFFFFF',
  gray50: '#F8F7FA',
  gray100: '#EEECF5',
  gray200: '#DDD9EB',
  gray300: '#C5C0D6',
  gray400: '#9E97B3',
  gray500: '#787090',
  gray600: '#5C5470',
  gray700: '#3F384F',
  gray800: '#2A2438',
  gray900: '#151130',
  success: '#10B981',
  error: '#EF4444',
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
    role: 'user',
  });

  const emailInputRef = useRef(null);
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

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <div style={styles.logoWrapper}>
            <span style={styles.logoEmoji}>🛒</span>
          </div>
          <h1 style={styles.brandName}>
            Msika<span style={{ color: COLORS.lavenderTonic }}>AI</span>
          </h1>
          <p style={styles.brandTagline}>Malawi's Smart Marketplace</p>
        </div>

        <div style={styles.header}>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Join the MsikaAI community today</p>
        </div>

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

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name <span style={styles.required}>*</span></label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>👤</span>
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
              <span style={styles.inputIcon}>✉️</span>
              <input
                ref={emailInputRef}
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
              <span style={styles.inputIcon}>📱</span>
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
              <span style={styles.inputIcon}>🔒</span>
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
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
            <p style={styles.hintText}>Must be at least 6 characters</p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password <span style={styles.required}>*</span></label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔐</span>
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
                {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
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
                  value="user"
                  checked={formData.role === 'user'}
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
                  value="vendor"
                  checked={formData.role === 'vendor'}
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

          <PrimaryButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading || !agreeToTerms}
            style={styles.submitButton}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </PrimaryButton>

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
    backgroundColor: COLORS.gray50,
    padding: '24px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: COLORS.white,
    padding: '36px 32px',
    borderRadius: '20px',
    border: '1px solid COLORS.gray200',
    boxShadow: '0 20px 60px rgba(21, 17, 48, 0.06)',
    position: 'relative',
    overflow: 'hidden',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoWrapper: {
    width: '64px',
    height: '64px',
    backgroundColor: COLORS.lavenderLight,
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px auto',
    border: '1px solid COLORS.lavenderTonic',
  },
  logoEmoji: {
    fontSize: '32px',
  },
  brandName: {
    fontSize: '28px',
    fontWeight: '800',
    color: COLORS.gray900,
    margin: 0,
    letterSpacing: '-0.5px',
  },
  brandTagline: {
    fontSize: '11px',
    color: COLORS.gray400,
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
    color: COLORS.gray900,
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: COLORS.gray500,
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
  errorIcon: {
    fontSize: '16px',
    flexShrink: 0,
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
    color: COLORS.gray700,
  },
  required: {
    color: COLORS.championBlue,
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
    color: COLORS.gray400,
    fontSize: '16px',
  },
  input: {
    width: '100%',
    padding: '11px 14px 11px 40px',
    border: `2px solid ${COLORS.gray200}`,
    borderRadius: '10px',
    fontSize: '14px',
    color: COLORS.gray900,
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: COLORS.white,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputSuccess: {
    borderColor: COLORS.success,
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: COLORS.gray400,
    fontSize: '18px',
    padding: '4px',
  },
  hintText: {
    fontSize: '12px',
    color: COLORS.gray400,
    marginTop: '2px',
  },
  errorHint: {
    fontSize: '12px',
    color: COLORS.error,
    marginTop: '2px',
  },
  successHint: {
    fontSize: '12px',
    color: COLORS.success,
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
    color: COLORS.gray700,
  },
  radioInput: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: COLORS.championBlue,
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
    color: COLORS.gray600,
  },
  checkboxInput: {
    width: '18px',
    height: '18px',
    marginTop: '2px',
    flexShrink: 0,
    cursor: 'pointer',
    accentColor: COLORS.championBlue,
  },
  checkboxText: {
    lineHeight: '1.5',
  },
  termsLink: {
    color: COLORS.lavenderTonic,
    textDecoration: 'none',
    fontWeight: '500',
  },
  submitButton: {
    marginTop: '4px',
    height: '48px',
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
    backgroundColor: COLORS.gray200,
  },
  dividerText: {
    fontSize: '12px',
    color: COLORS.gray400,
    fontWeight: '500',
  },
  footerText: {
    textAlign: 'center',
    fontSize: '14px',
    color: COLORS.gray500,
    margin: 0,
  },
  footerLink: {
    color: COLORS.lavenderTonic,
    textDecoration: 'none',
    fontWeight: '600',
  },
};

export default Register;