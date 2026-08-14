// mobile/src/pages/Login.jsx - COMPLETE FIX
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
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
    setError('');
    setLoading(true);

    try {
      let result;

      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        // Sign up directly via Supabase since AuthContext doesn't expose signup
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
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error?.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Auth submit error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8fafc',
      padding: '24px 16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#ffffff',
        padding: '36px 32px',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#eff6ff',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            border: '1px solid #dbeafe'
          }}>
            <span style={{ fontSize: '24px' }}>🏪</span>
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 6px 0',
            letterSpacing: '-0.5px'
          }}>
            Kum<span style={{ color: '#2563eb' }}>sika</span>
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: 0
          }}>
            {isLogin ? 'Sign in to access your account.' : 'Create an account to join the market.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            padding: '12px 14px',
            borderRadius: '10px',
            border: '1px solid #fecaca',
            marginBottom: '20px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Full Name</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  color: '#64748b'
                }}>👤</span>
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. Kondwani Banda"
                  value={formData.fullName}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff'
                  }}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Email Address</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                color: '#64748b'
              }}>✉️</span>
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff'
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                color: '#64748b'
              }}>🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                  paddingRight: '42px'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Phone Number (Optional)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  color: '#64748b'
                }}>📱</span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+265 999 000 000"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
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
              boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <span>{loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}</span>
            {!loading && <span>→</span>}
          </button>
        </form>

        {/* Toggle */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          paddingTop: '18px',
          borderTop: '1px solid #f1f5f9'
        }}>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {isLogin ? (
              <>
                Don't have an account? <span style={{ color: '#2563eb', fontWeight: '700' }}>Sign Up</span>
              </>
            ) : (
              <>
                Already have an account? <span style={{ color: '#2563eb', fontWeight: '700' }}>Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>

      <Link to="/" style={{
        marginTop: '20px',
        color: '#64748b',
        textDecoration: 'none',
        fontSize: '13px',
        fontWeight: '600'
      }}>
        ← Back to Market Home
      </Link>
    </div>
  );
};

export default Login;