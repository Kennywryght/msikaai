import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// --- HAND-DRAWN STYLE INLINE SVG ICON COMPONENT ---
const SketchIcon = ({ d, size = 20, color = 'currentColor', strokeWidth = 2, onClick, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    onClick={onClick}
    style={{
      ...style,
      cursor: onClick ? 'pointer' : 'default',
      display: 'inline-block',
      verticalAlign: 'middle',
      flexShrink: 0,
    }}
  >
    <path d={d} />
  </svg>
);

// --- HAND-DRAWN ICON PATHS ---
const ICONS = {
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeOff: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  alert: "M12 8v4M12 16h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
};

const Login = () => {
  const { login, signup, error } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let result;
    if (isLogin) {
      result = await login(formData.email, formData.password);
    } else {
      result = await signup(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone
      );
    }

    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header Section */}
        <div style={styles.headerGroup}>
          <div style={styles.logoBadge}>
            <SketchIcon d={ICONS.store} size={24} color="#2563eb" strokeWidth={2.5} />
          </div>
          <h1 style={styles.title}>
            Msika<span style={{ color: '#2563eb' }}>AI</span>
          </h1>
          <p style={styles.subtitle}>
            {isLogin ? 'Sign in to access your account.' : 'Create an account to join the market.'}
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div style={styles.errorBox}>
            <SketchIcon d={ICONS.alert} size={18} color="#dc2626" strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <div style={styles.inputWrapper}>
                <div style={styles.leftIconContainer}>
                  <SketchIcon d={ICONS.user} size={18} color="#64748b" strokeWidth={2} />
                </div>
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. Kondwani Banda"
                  value={formData.fullName}
                  onChange={handleChange}
                  style={styles.input}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <div style={styles.leftIconContainer}>
                <SketchIcon d={ICONS.mail} size={18} color="#64748b" strokeWidth={2} />
              </div>
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <div style={styles.leftIconContainer}>
                <SketchIcon d={ICONS.lock} size={18} color="#64748b" strokeWidth={2} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                style={{ ...styles.input, paddingRight: '42px' }}
                required
              />
              {/* Show / Hide Password Toggle Icon */}
              <div style={styles.rightIconContainer}>
                <SketchIcon
                  d={showPassword ? ICONS.eyeOff : ICONS.eye}
                  size={18}
                  color="#64748b"
                  strokeWidth={2}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
            </div>
          </div>

          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone Number (Optional)</label>
              <div style={styles.inputWrapper}>
                <div style={styles.leftIconContainer}>
                  <SketchIcon d={ICONS.phone} size={18} color="#64748b" strokeWidth={2} />
                </div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+265 999 000 000"
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <span>{loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}</span>
            {!loading && (
              <SketchIcon d={ICONS.arrowRight} size={18} color="#ffffff" strokeWidth={2.5} />
            )}
          </button>
        </form>

        {/* Form Mode Switcher */}
        <div style={styles.toggleContainer}>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={styles.toggleButton}
          >
            {isLogin ? (
              <>
                Don't have an account? <span style={styles.toggleHighlight}>Sign Up</span>
              </>
            ) : (
              <>
                Already have an account? <span style={styles.toggleHighlight}>Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Repositioned Outside: Back to Market Link */}
      <Link to="/" style={styles.footerBackLink}>
        ← Back to Market Home
      </Link>
    </div>
  );
};

// --- STYLES OBJECT ---
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
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
  },
  headerGroup: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoBadge: {
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
  errorBox: {
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  leftIconContainer: {
    position: 'absolute',
    left: '12px',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  rightIconContainer: {
    position: 'absolute',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
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
  submitButton: {
    marginTop: '6px',
    width: '100%',
    padding: '12px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
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
  toggleHighlight: {
    color: '#2563eb',
    fontWeight: '700',
  },
  footerBackLink: {
    marginTop: '20px',
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'color 0.2s ease',
  },
};

export default Login;