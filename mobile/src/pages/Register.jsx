// mobile/src/pages/Register.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

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

  // Auto-focus email input on mount
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
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
      // Register user with Supabase
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
        // Create profile in profiles table
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

        // Auto-login the user
        const loginResult = await login(formData.email, formData.password);
        
        if (loginResult.success) {
          // Navigate to onboarding
          navigate('/onboarding', { replace: true });
        } else {
          // If auto-login fails, redirect to login page
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
    return <LoadingSpinner message="Creating your account..." />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card} className="animate-fade-in-up">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <span style={styles.logoIcon}>🏪</span>
          </div>
          <h1 style={styles.title}>
            Create <span style={{ color: '#2563eb' }}>Account</span>
          </h1>
          <p style={styles.subtitle}>
            Join Kumsika Marketplace and start growing your business
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
          {/* Full Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Full Name <span style={styles.required}>*</span>
            </label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>👤</span>
              <input
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

          {/* Email */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Email Address <span style={styles.required}>*</span>
            </label>
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

          {/* Phone */}
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

          {/* Password */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Password <span style={styles.required}>*</span>
            </label>
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
            <p style={styles.hintText}>
              Must be at least 6 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Confirm Password <span style={styles.required}>*</span>
            </label>
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

          {/* Role Selection */}
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

          {/* Terms & Conditions */}
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

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading || !agreeToTerms}
            style={styles.submitButton}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          {/* Divider */}
          <div style={styles.divider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine}></span>
          </div>

          {/* Login Link */}
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
    backgroundColor: '#f8fafc',
    padding: '24px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
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
    width: '56px',
    height: '56px',
    backgroundColor: '#eff6ff',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px auto',
    border: '1px solid #dbeafe',
  },
  logoIcon: {
    fontSize: '28px',
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
    color: '#991b1b',
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
    color: '#991b1b',
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
    color: '#94a3b8',
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
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputSuccess: {
    borderColor: '#22c55e',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: '18px',
    padding: '4px',
  },
  hintText: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  errorHint: {
    fontSize: '12px',
    color: '#ef4444',
    marginTop: '2px',
  },
  successHint: {
    fontSize: '12px',
    color: '#22c55e',
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
    color: '#334155',
  },
  radioInput: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#2563eb',
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
    color: '#475569',
  },
  checkboxInput: {
    width: '18px',
    height: '18px',
    marginTop: '2px',
    flexShrink: 0,
    cursor: 'pointer',
    accentColor: '#2563eb',
  },
  checkboxText: {
    lineHeight: '1.5',
  },
  termsLink: {
    color: '#2563eb',
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
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  footerText: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  footerLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '600',
  },
};

export default Register;