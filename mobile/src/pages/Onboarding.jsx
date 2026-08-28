// mobile/src/pages/Onboarding.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PrimaryButton from '../components/PrimaryButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContainer';

// ==========================================
// BRAND COLORS
// ==========================================
const COLORS = {
  championBlue: '#151130',
  lavenderTonic: '#C8BEFA',
  white: '#FFFFFF',
  gray50: '#F8F7FA',
  gray100: '#EEECF5',
  gray200: '#DDD9EB',
  gray300: '#C5C0D6',
  gray400: '#9E97B3',
  gray500: '#787090',
  gray600: '#5C5470',
  gray700: '#3F384F',
  gray900: '#151130',
  success: '#10B981',
  error: '#EF4444',
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { showToast, success, error } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    const firstNameInput = document.querySelector('input[name="fullName"]');
    if (firstNameInput) {
      setTimeout(() => firstNameInput.focus(), 100);
    }
  }, []);

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

      success('Profile setup complete! 🎉');
      
      setTimeout(() => {
        if (formData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (err) {
      console.error('Error completing onboarding:', err);
      const errMsg = err.message || 'Error saving profile';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Setting up your profile..." />;
  }

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.gray50,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    },
    card: {
      backgroundColor: COLORS.white,
      borderRadius: '16px',
      padding: 'clamp(24px, 3vw, 40px)',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 4px 12px rgba(21, 17, 48, 0.08)',
      border: '1px solid ' + COLORS.gray200
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    title: {
      fontSize: 'clamp(24px, 3vw, 28px)',
      fontWeight: '700',
      color: COLORS.gray900,
      margin: '0 0 8px 0'
    },
    subtitle: {
      fontSize: 'clamp(14px, 1.2vw, 16px)',
      color: COLORS.gray500,
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
      backgroundColor: COLORS.gray200,
      transition: 'background-color 0.3s'
    },
    stepDotActive: {
      backgroundColor: COLORS.lavenderTonic
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      fontWeight: '500',
      color: COLORS.gray900,
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: 'clamp(8px, 0.8vw, 10px) clamp(12px, 1vw, 14px)',
      border: '1px solid ' + COLORS.gray200,
      borderRadius: '8px',
      fontSize: 'clamp(14px, 1.2vw, 15px)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxSizing: 'border-box',
      outline: 'none',
      fontFamily: 'inherit',
      backgroundColor: COLORS.white,
      color: COLORS.gray900
    },
    select: {
      width: '100%',
      padding: 'clamp(8px, 0.8vw, 10px) clamp(12px, 1vw, 14px)',
      border: '1px solid ' + COLORS.gray200,
      borderRadius: '8px',
      fontSize: 'clamp(14px, 1.2vw, 15px)',
      backgroundColor: COLORS.white,
      cursor: 'pointer',
      fontFamily: 'inherit',
      outline: 'none',
      color: COLORS.gray900
    },
    interestsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '8px',
      marginTop: '8px'
    },
    interestChip: {
      padding: 'clamp(6px, 0.6vw, 8px) clamp(10px, 1vw, 12px)',
      borderRadius: '8px',
      border: '1px solid ' + COLORS.gray200,
      backgroundColor: COLORS.white,
      cursor: 'pointer',
      fontSize: 'clamp(12px, 1vw, 14px)',
      textAlign: 'center',
      transition: 'all 0.2s',
      userSelect: 'none',
      color: COLORS.gray700
    },
    interestChipActive: {
      backgroundColor: COLORS.lavenderTonic,
      color: COLORS.championBlue,
      borderColor: COLORS.lavenderTonic
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
      <style>{`
        .input-focus:focus {
          border-color: ${COLORS.lavenderTonic};
          box-shadow: 0 0 0 3px rgba(200, 190, 250, 0.2);
        }
      `}</style>

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
                className="input-focus"
                required
                autoComplete="name"
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
                className="input-focus"
                autoComplete="tel"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                style={styles.select}
                className="input-focus"
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
                className="input-focus"
                autoComplete="organization"
              />
            </div>

            <PrimaryButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setStep(2)}
              disabled={!formData.fullName}
            >
              Continue →
            </PrimaryButton>
          </>
        )}

        {step === 2 && (
          <>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select your interests</label>
              <p style={{ fontSize: 'clamp(13px, 1.1vw, 14px)', color: COLORS.gray500, marginTop: '4px' }}>
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
              <PrimaryButton
                variant="outline"
                size="md"
                fullWidth
                onClick={() => setStep(1)}
                style={styles.buttonHalf}
              >
                ← Back
              </PrimaryButton>
              <PrimaryButton
                variant="primary"
                size="md"
                fullWidth
                onClick={handleSubmit}
                disabled={loading}
                loading={loading}
                style={styles.buttonHalf}
              >
                Complete Setup ✨
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;