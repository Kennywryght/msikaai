import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface LoginProps {
  onLogin: (user: any) => void;
}

const LoginScreen: React.FC<LoginProps> = ({ onLogin }) => {
  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'phone'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Email auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Phone OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<'send' | 'verify'>('send');

  // ============================================
  // EMAIL AUTH HANDLERS
  // ============================================

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/login-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Store session
      localStorage.setItem('supabase_session', JSON.stringify(data.session));
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !fullName) {
      setError('All fields are required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/signup-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phone })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Signup failed');
      }

      alert('Signup successful! Please verify your email.');
      setAuthMode('login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PHONE OTP HANDLERS
  // ============================================

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Valid phone number is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpStep('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phoneNumber, 
          token: otp,
          fullName: fullName || 'User'
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      localStorage.setItem('supabase_session', JSON.stringify(data.session));
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const renderEmailAuth = () => (
    <div>
      {authMode === 'signup' && (
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={inputStyle}
        />
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />
      {authMode === 'signup' && (
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
        />
      )}
      <button
        onClick={authMode === 'login' ? handleEmailLogin : handleEmailSignup}
        disabled={loading}
        style={{ ...buttonStyle, background: '#2563eb' }}
      >
        {loading ? 'Processing...' : authMode === 'login' ? 'Login' : 'Sign Up'}
      </button>
      <button
        onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
        style={{ ...buttonStyle, background: 'transparent', color: '#2563eb', border: '1px solid #2563eb' }}
      >
        {authMode === 'login' ? 'Create Account' : 'Already have an account?'}
      </button>
      <button
        onClick={() => setAuthMode('phone')}
        style={{ ...buttonStyle, background: '#16a34a' }}
      >
        Use Phone Number
      </button>
    </div>
  );

  const renderPhoneAuth = () => (
    <div>
      {otpStep === 'send' ? (
        <>
          <input
            type="tel"
            placeholder="Phone Number (0999XXXXXX)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={inputStyle}
          />
          <button
            onClick={handleSendOTP}
            disabled={loading}
            style={{ ...buttonStyle, background: '#2563eb' }}
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </>
      ) : (
        <>
          <p style={{ textAlign: 'center', marginBottom: 10 }}>
            OTP sent to {phoneNumber}
          </p>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={inputStyle}
          />
          <button
            onClick={handleVerifyOTP}
            disabled={loading}
            style={{ ...buttonStyle, background: '#16a34a' }}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            onClick={() => setOtpStep('send')}
            style={{ ...buttonStyle, background: 'transparent', color: '#6b7280' }}
          >
            Back
          </button>
        </>
      )}
      <button
        onClick={() => setAuthMode('login')}
        style={{ ...buttonStyle, background: 'transparent', color: '#6b7280' }}
      >
        Use Email Instead
      </button>
    </div>
  );

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>MsikaAI</h1>
      <p style={subtitleStyle}>Mitundu's Marketplace</p>

      {error && <div style={errorStyle}>{error}</div>}

      {authMode === 'phone' ? renderPhoneAuth() : renderEmailAuth()}
    </div>
  );
};

// ============================================
// STYLES
// ============================================

const containerStyle: React.CSSProperties = {
  maxWidth: 400,
  margin: '0 auto',
  padding: 40,
  fontFamily: 'Arial, sans-serif'
};

const titleStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#2563eb',
  fontSize: 32,
  marginBottom: 8
};

const subtitleStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#4b5563',
  fontSize: 16,
  marginBottom: 24
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  marginBottom: 12,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 16,
  boxSizing: 'border-box'
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  marginBottom: 8,
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: 16,
  cursor: 'pointer',
  boxSizing: 'border-box'
};

const errorStyle: React.CSSProperties = {
  background: '#fee2e2',
  color: '#dc2626',
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
  fontSize: 14
};

export default LoginScreen;