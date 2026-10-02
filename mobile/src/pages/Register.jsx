// mobile/src/pages/Register.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import Logo from '../components/Logo';

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

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast, success } = useToast();

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
    if (nameInputRef.current) nameInputRef.current.focus();
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
    if (!formData.fullName.trim()) { setErrorMsg('Full name is required'); return false; }
    if (!formData.email.trim()) { setErrorMsg('Email address is required'); return false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { setErrorMsg('Please enter a valid email address'); return false; }
    if (formData.password.length < 6) { setErrorMsg('Password must be at least 6 characters'); return false; }
    if (formData.password !== formData.confirmPassword) { setErrorMsg('Passwords do not match'); return false; }
    if (!agreeToTerms) { setErrorMsg('You must agree to the Terms of Service and Privacy Policy'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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

        if (profileError) console.error('Profile creation error:', profileError);

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
        <div className="logo-section">
          <Logo variant="full" size={160} clickable={false} />
          <p className="brand-tagline">Malawi's Smart Marketplace</p>
        </div>

        <div className="header">
          <h2 className="title">Create Account</h2>
          <p className="subtitle">Join the Kumsika community today</p>
        </div>

        {errorMsg && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{errorMsg}</span>
            <button className="error-close" onClick={() => setErrorMsg('')}>×</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label className="label">Full Name <span className="required">*</span></label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icon name="user" size={20} color="var(--color-text-muted)" strokeWidth={1.75} />
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

          <div className="form-group">
            <label className="label">Email Address <span className="required">*</span></label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icon name="mail" size={20} color="var(--color-text-muted)" strokeWidth={1.75} />
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

          <div className="form-group">
            <label className="label">Phone Number</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icon name="phone" size={20} color="var(--color-text-muted)" strokeWidth={1.75} />
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

          <div className="form-group">
            <label className="label">Password <span className="required">*</span></label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icon name="lock" size={20} color="var(--color-text-muted)" strokeWidth={1.75} />
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
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} color="var(--color-text-muted)" strokeWidth={1.75} />
              </button>
            </div>
            <p className="hint-text">Must be at least 6 characters</p>
          </div>

          <div className="form-group">
            <label className="label">Confirm Password <span className="required">*</span></label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Icon name="lock" size={20} color="var(--color-text-muted)" strokeWidth={1.75} />
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
                <Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} size={20} color="var(--color-text-muted)" strokeWidth={1.75} />
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="error-hint">Passwords do not match</p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="success-hint">✓ Passwords match</p>
            )}
          </div>

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
                <Link to="/terms" className="terms-link">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="terms-link">Privacy Policy</Link>
              </span>
            </label>
          </div>

          <button
            type="submit"
            className={`submit-btn ${loading || !agreeToTerms ? 'disabled' : ''}`}
            disabled={loading || !agreeToTerms}
          >
            {loading ? <span className="btn-spinner" /> : 'Create Account'}
          </button>

          <div className="divider">
            <span className="divider-line" />
            <span className="divider-text">or</span>
            <span className="divider-line" />
          </div>

          <p className="footer-text">
            Already have an account?{' '}
            <Link to="/login" className="footer-link">Sign In</Link>
          </p>
        </form>
      </div>

      <style jsx>{`
        .register-page {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--color-bg);
          background-image: radial-gradient(var(--color-accent-tint) 1px, transparent 1px);
          background-size: 22px 22px;
          padding: 32px 20px;
          font-family: var(--font-sans);
        }

        .register-card {
          width: 100%;
          max-width: 500px;
          background: var(--color-surface);
          padding: 40px 32px;
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-sm);
        }

        .logo-section {
          text-align: center;
          margin-bottom: 28px;
        }

        .logo-section :global(.kumsika-logo) {
          margin: 0 auto 12px;
        }

        .brand-tagline {
          font-size: 12.5px;
          color: var(--color-text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin: 0;
        }

        .header { text-align: center; margin-bottom: 26px; }

        .title {
          font-size: 26px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }

        .subtitle {
          font-size: 15px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--color-error-bg);
          padding: 13px 16px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-error);
          margin-bottom: 20px;
        }

        .error-icon { font-size: 16px; }
        .error-text { flex: 1; font-size: 14.5px; color: var(--color-error); line-height: 1.4; }
        .error-close {
          background: none;
          border: none;
          font-size: 22px;
          color: var(--color-error);
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .label {
          font-size: 14.5px;
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .required { color: var(--color-error); }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .input-field {
          width: 100%;
          padding: 15px 16px 15px 48px;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-size: 15.5px;
          color: var(--color-text);
          outline: none;
          box-sizing: border-box;
          background: var(--color-surface);
          font-family: inherit;
          transition: all var(--transition-fast);
        }

        .input-field:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-tint);
        }

        .input-field::placeholder { color: var(--color-text-muted); font-size: 15px; }
        .input-field:disabled { opacity: 0.5; cursor: not-allowed; }
        .input-field.error { border-color: var(--color-error); }
        .input-field.success { border-color: var(--color-success); }
        .password-input { padding-right: 50px; }

        .eye-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
        }

        .hint-text { font-size: 13px; color: var(--color-text-muted); margin: 2px 0 0; }
        .error-hint { font-size: 13px; color: var(--color-error); margin: 2px 0 0; }
        .success-hint { font-size: 13px; color: var(--color-success); margin: 2px 0 0; }

        .radio-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 15px;
          color: var(--color-text-secondary);
          padding: 10px 16px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .radio-label:hover {
          border-color: var(--color-accent);
          background: var(--color-accent-soft);
        }

        .radio-input {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--color-accent);
        }

        .radio-text { font-size: 14.5px; font-weight: 500; }

        .terms-group { margin: 4px 0; }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          font-size: 14.5px;
          color: var(--color-text-secondary);
        }

        .checkbox-input {
          width: 20px;
          height: 20px;
          margin-top: 1px;
          flex-shrink: 0;
          cursor: pointer;
          accent-color: var(--color-accent);
        }

        .checkbox-text { line-height: 1.5; }

        .terms-link {
          color: var(--color-accent);
          text-decoration: none;
          font-weight: 600;
        }

        .terms-link:hover {
          color: var(--color-accent-hover);
          text-decoration: underline;
        }

        .submit-btn {
          width: 100%;
          padding: 16px;
          background: var(--color-accent);
          border: none;
          border-radius: var(--radius-lg);
          font-size: 16.5px;
          font-weight: 700;
          color: var(--color-text-inverse);
          cursor: pointer;
          font-family: inherit;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 58px;
          margin-top: 6px;
          box-shadow: var(--shadow-accent);
        }

        .submit-btn:hover:not(.disabled) {
          background: var(--color-accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(255, 92, 35, 0.32);
        }

        .submit-btn.disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

        .btn-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: var(--color-text-inverse);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 4px 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--color-border);
        }

        .divider-text {
          font-size: 12.5px;
          color: var(--color-text-muted);
          font-weight: 600;
          white-space: nowrap;
        }

        .footer-text {
          text-align: center;
          font-size: 14.5px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .footer-link {
          color: var(--color-accent);
          text-decoration: none;
          font-weight: 600;
        }

        .footer-link:hover {
          color: var(--color-accent-hover);
          text-decoration: underline;
        }

        /* ================= SMALL MOBILE ================= */
        @media (max-width: 480px) {
          .register-page { padding: 20px 16px; }
          .register-card { padding: 32px 24px; border-radius: var(--radius-xl); }
          .logo-section { margin-bottom: 22px; }
          .header { margin-bottom: 22px; }
          .title { font-size: 24px; }
          .subtitle { font-size: 14px; }
          .register-form { gap: 16px; }
          .input-field { padding: 14px 14px 14px 46px; font-size: 15px; }
          .radio-group { gap: 8px; }
          .radio-label { padding: 9px 12px; font-size: 14px; }
          .radio-text { font-size: 13.5px; }
          .submit-btn { font-size: 15.5px; min-height: 54px; padding: 14px; }
        }

        /* ================= SHORT PHONES ================= */
        @media (max-width: 480px) and (max-height: 780px) {
          .register-page { padding: 14px 12px; }
          .register-card { padding: 24px 20px; border-radius: var(--radius-lg); }
          .logo-section { margin-bottom: 16px; }
          .header { margin-bottom: 16px; }
          .title { font-size: 22px; }
          .subtitle { font-size: 13px; }
          .error-alert { padding: 10px 12px; margin-bottom: 14px; }
          .error-text { font-size: 13px; }
          .register-form { gap: 12px; }
          .form-group { gap: 5px; }
          .label { font-size: 13.5px; }
          .input-field { padding: 12px 14px 12px 44px; font-size: 14.5px; }
          .input-icon { left: 14px; }
          .password-input { padding-right: 46px; }
          .hint-text, .error-hint, .success-hint { font-size: 12px; }
          .radio-label { padding: 8px 11px; font-size: 13.5px; }
          .radio-input { width: 16px; height: 16px; }
          .radio-text { font-size: 13px; }
          .checkbox-label { font-size: 13.5px; gap: 10px; }
          .checkbox-input { width: 18px; height: 18px; }
          .submit-btn { font-size: 14.5px; min-height: 48px; padding: 12px; }
          .divider { margin: 2px 0; }
          .divider-text { font-size: 11.5px; }
          .footer-text { font-size: 13.5px; }
        }

        /* ================= VERY SHORT PHONES ================= */
        @media (max-width: 480px) and (max-height: 680px) {
          .register-page { padding: 10px 10px; }
          .register-card { padding: 18px 16px; border-radius: var(--radius-md); }
          .logo-section { margin-bottom: 10px; }
          .logo-section :global(.kumsika-logo) { max-height: 100px; }
          .brand-tagline { font-size: 11px; }
          .header { margin-bottom: 12px; }
          .title { font-size: 20px; }
          .subtitle { font-size: 12px; }
          .error-alert { padding: 8px 10px; margin-bottom: 12px; }
          .error-text { font-size: 12.5px; }
          .register-form { gap: 10px; }
          .form-group { gap: 4px; }
          .label { font-size: 13px; }
          .input-field { padding: 11px 12px 11px 42px; font-size: 14px; }
          .input-icon { left: 13px; }
          .password-input { padding-right: 42px; }
          .eye-btn { right: 8px; padding: 6px; }
          .hint-text, .error-hint, .success-hint { font-size: 11.5px; }
          .radio-group { gap: 6px; }
          .radio-label { padding: 7px 10px; font-size: 13px; }
          .radio-text { font-size: 12.5px; }
          .checkbox-label { font-size: 13px; gap: 8px; }
          .checkbox-input { width: 17px; height: 17px; }
          .submit-btn { font-size: 14px; min-height: 44px; padding: 11px; }
          .divider { margin: 2px 0; gap: 10px; }
          .footer-text { font-size: 13px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .submit-btn:hover:not(.disabled) { transform: none; }
        }
      `}</style>
    </div>
  );
};

export default Register;