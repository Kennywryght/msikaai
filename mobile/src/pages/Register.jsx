// mobile/src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: formData.email,
              full_name: formData.fullName,
              onboarding_completed: false
            }
          ]);

        // Navigate to onboarding
        navigate('/onboarding');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8fafc',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '40px',
      maxWidth: '400px',
      width: '100%',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#0f172a',
      margin: '0 0 8px 0',
      textAlign: 'center'
    },
    subtitle: {
      fontSize: '16px',
      color: '#64748b',
      textAlign: 'center',
      margin: '0 0 32px 0'
    },
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#0f172a',
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #e2e8f0',  // ✅ FIXED: Removed extra quotes
      borderRadius: '8px',
      fontSize: '15px',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s'
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    error: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px'
    },
    link: {
      color: '#2563eb',
      textDecoration: 'none',
      fontWeight: '500'
    },
    footer: {
      textAlign: 'center',
      marginTop: '24px',
      fontSize: '14px',
      color: '#64748b'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Join MsikaAI today</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              style={styles.input}
              placeholder="John Doe"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              placeholder="you@example.com"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              placeholder="Min 6 characters"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={styles.input}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.link}>Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;