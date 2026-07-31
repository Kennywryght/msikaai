// mobile/src/pages/Onboarding.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Toast from '../components/Toast';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    role: 'user',
    company: '',
    interests: []
  });

  const interestsList = [
    'Web Development',
    'Mobile Apps',
    'AI/ML',
    'Data Science',
    'DevOps',
    'Cybersecurity',
    'Cloud Computing',
    'UI/UX Design'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          role: formData.role,
          company: formData.company,
          interests: formData.interests,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setToast({ message: 'Profile setup complete! 🎉', type: 'success' });
      
      // Redirect based on role
      setTimeout(() => {
        if (formData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setToast({ message: 'Error saving profile', type: 'error' });
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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '40px',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#0f172a',
      margin: '0 0 8px 0'
    },
    subtitle: {
      fontSize: '16px',
      color: '#64748b',
      margin: 0
    },
    stepIndicator: {
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      marginBottom: '32px'
    },
    stepDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#e2e8f0',
      transition: 'background-color 0.3s'
    },
    stepDotActive: {
      backgroundColor: '#2563eb'
    },
    formGroup: {
      marginBottom: '20px'
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
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '15px',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '15px',
      backgroundColor: 'white',
      cursor: 'pointer'
    },
    interestsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '8px',
      marginTop: '8px'
    },
    interestChip: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      textAlign: 'center',
      transition: 'all 0.2s',
      userSelect: 'none'
    },
    interestChipActive: {
      backgroundColor: '#2563eb',
      color: 'white',
      borderColor: '#2563eb'
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
    buttonSecondary: {
      backgroundColor: '#e2e8f0',
      color: '#0f172a',
      marginTop: '8px'
    },
    buttonContainer: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px'
    },
    buttonHalf: {
      flex: 1
    }
  };

  return (
    <div style={styles.container}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Welcome! 👋</h1>
          <p style={styles.subtitle}>Let's set up your profile</p>
        </div>

        <div style={styles.stepIndicator}>
          {[1, 2].map((num) => (
            <div
              key={num}
              style={{
                ...styles.stepDot,
                ...(step === num ? styles.stepDotActive : {})
              }}
            />
          ))}
        </div>

        {step === 1 && (
          <>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="John Doe"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="+1 234 567 8900"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                style={styles.select}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Company (Optional)</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Your company name"
              />
            </div>

            <button
              style={{
                ...styles.button,
                ...(!formData.fullName && styles.buttonDisabled)
              }}
              onClick={() => setStep(2)}
              disabled={!formData.fullName}
            >
              Continue →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select your interests</label>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                Choose areas you're interested in (click to toggle)
              </p>
              <div style={styles.interestsGrid}>
                {interestsList.map((interest) => (
                  <div
                    key={interest}
                    style={{
                      ...styles.interestChip,
                      ...(formData.interests.includes(interest)
                        ? styles.interestChipActive
                        : {})
                    }}
                    onClick={() => handleInterestToggle(interest)}
                  >
                    {interest}
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.buttonContainer}>
              <button
                style={{
                  ...styles.button,
                  ...styles.buttonHalf,
                  ...styles.buttonSecondary
                }}
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button
                style={{
                  ...styles.button,
                  ...styles.buttonHalf,
                  ...(loading && styles.buttonDisabled)
                }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Complete Setup ✨'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
