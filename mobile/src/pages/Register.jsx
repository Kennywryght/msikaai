// mobile/src/pages/Register.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';

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
    check: "M20 6L9 17l-5-5",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
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

  return (
    <div className="register-page">
      <div className="register-card">
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
          <h2 className="title">Create Account</h2>
          <p className="subtitle">Join the Kumsika community today</p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{errorMsg}</span>
            <button className="error-close" onClick={() => setErrorMsg('')}>×</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          {/* Full Name */}
          <div className="form-group">
            <label className="label">
              Full Name <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icon name="user" size={18} color="#94A3B8" strokeWidth={1.75} />
              </span>
              <input
                ref={nameInputRef}
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Kondwani Banda"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="label">
              Email Address <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icon name="mail" size={18} color="#94A3B8" strokeWidth={1.75} />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="name@example.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="label">Phone Number</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icon name="phone" size={18} color="#94A3B8" strokeWidth={1.75} />
              </span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="+265 999 000 000"
                disabled={loading}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="label">
              Password <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icon name="lock" size={18} color="#94A3B8" strokeWidth={1.75} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field password-input"
                placeholder="Min 6 characters"
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} color="#94A3B8" strokeWidth={1.75} />
              </button>
            </div>
            <p className="hint-text">Must be at least 6 characters</p>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="label">
              Confirm Password <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icon name="lock" size={18} color="#94A3B8" strokeWidth={1.75} />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input-field password-input ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword ? 'error' : ''
                } ${
                  formData.confirmPassword && formData.password === formData.confirmPassword ? 'success' : ''
                }`}
                placeholder="Confirm your password"
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} size={18} color="#94A3B8" strokeWidth={1.75} />
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="error-hint">Passwords do not match</p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="success-hint">✓ Passwords match</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="form-group">
            <label className="label">I am a...</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="role"
                  value="buyer"
                  checked={formData.role === 'buyer'}
                  onChange={handleChange}
                  className="radio-input"
                  disabled={loading}
                />
                <span className="radio-text">👤 Buyer</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="role"
                  value="seller"
                  checked={formData.role === 'seller'}
                  onChange={handleChange}
                  className="radio-input"
                  disabled={loading}
                />
                <span className="radio-text">🏪 Seller</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="role"
                  value="provider"
                  checked={formData.role === 'provider'}
                  onChange={handleChange}
                  className="radio-input"
                  disabled={loading}
                />
                <span className="radio-text">🔧 Provider</span>
              </label>
            </div>
          </div>

          {/* Terms */}
          <div className="terms-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={agreeToTerms}
                onChange={handleChange}
                className="checkbox-input"
                disabled={loading}
              />
              <span className="checkbox-text">
                I agree to the{' '}
                <Link to="/terms" className="terms-link">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="terms-link">
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={`submit-btn ${loading || !agreeToTerms ? 'disabled' : ''}`}
            disabled={loading || !agreeToTerms}
          >
            {loading ? (
              <span className="btn-spinner" />
            ) : (
              'Create Account'
            )}
          </button>

          {/* Divider */}
          <div className="divider">
            <span className="divider-line" />
            <span className="divider-text">or</span>
            <span className="divider-line" />
          </div>

          {/* Login Link */}
          <p className="footer-text">
            Already have an account?{' '}
            <Link to="/login" className="footer-link">
              Sign In
            </Link>
          </p>
        </form>
      </div>

      <style jsx>{`
        .register-page {
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
        .register-card {
          width: 100%;
          max-width: 440px;
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

        /* ===== FORM ===== */
        .register-form {
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

        .required {
          color: #EF4444;
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

        .input-field.error {
          border-color: #EF4444;
        }

        .input-field.success {
          border-color: #10B981;
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

        .hint-text {
          font-size: 12px;
          color: #94A3B8;
        }

        .error-hint {
          font-size: 12px;
          color: #EF4444;
        }

        .success-hint {
          font-size: 12px;
          color: #10B981;
        }

        /* ===== RADIO ===== */
        .radio-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 14px;
          color: #64748B;
          padding: 6px 12px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .radio-label:hover {
          border-color: #F59E0B;
        }

        .radio-input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #F59E0B;
        }

        .radio-text {
          font-size: 13px;
          font-weight: 500;
        }

        /* ===== TERMS ===== */
        .terms-group {
          margin: 2px 0;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          font-size: 13px;
          color: #64748B;
        }

        .checkbox-input {
          width: 18px;
          height: 18px;
          margin-top: 1px;
          flex-shrink: 0;
          cursor: pointer;
          accent-color: #F59E0B;
        }

        .checkbox-text {
          line-height: 1.5;
        }

        .terms-link {
          color: #F59E0B;
          text-decoration: none;
          font-weight: 500;
        }

        .terms-link:hover {
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
          margin-top: 4px;
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
          margin: 4px 0;
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

        /* ===== FOOTER ===== */
        .footer-text {
          text-align: center;
          font-size: 13px;
          color: #94A3B8;
          margin: 0;
        }

        .footer-link {
          color: #F59E0B;
          text-decoration: none;
          font-weight: 600;
        }

        .footer-link:hover {
          text-decoration: underline;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .register-card {
            padding: 24px 16px;
          }
          .brand-name {
            font-size: 20px;
          }
          .radio-group {
            gap: 8px;
          }
          .radio-label {
            padding: 4px 10px;
            font-size: 13px;
          }
        }

        @media (max-width: 380px) {
          .register-card {
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
          .radio-group {
            flex-direction: column;
          }
          .radio-label {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;