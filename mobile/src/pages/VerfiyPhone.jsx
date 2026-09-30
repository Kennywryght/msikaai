// mobile/src/pages/VerifyPhone.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trustAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';
import { useTrust } from '../context/TrustContext';

const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75 }) => {
  const icons = {
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
    check: 'M20 6L9 17l-5-5',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };
  const d = icons[name] || icons.shield;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
};

const isValidMalawiPhone = (phone) => /^(\+265|0)?[1-9]\d{7,8}$/.test(phone);

const VerifyPhone = () => {
  const navigate = useNavigate();
  const { showToast, success } = useToast();
  const { refreshOwnTrust } = useTrust();

  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'done'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmitPhone = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isValidMalawiPhone(phone.trim())) {
      setError('Please enter a valid Malawian phone number (e.g. 0999123456)');
      return;
    }

    setLoading(true);
    try {
      const res = await trustAPI.submitPhone(phone.trim());
      const data = res?.data || {};
      if (data.success && data.requestId) {
        setRequestId(data.requestId);
        setStep('otp');
        success('OTP sent — check the server console 📱');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = async (e) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const res = await trustAPI.confirmPhone(requestId, otp.trim());
      const data = res?.data || {};
      if (data.success) {
        setStep('done');
        success('Phone verified! 🎉');
        await refreshOwnTrust();
        setTimeout(() => navigate('/trust'), 2200);
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await trustAPI.submitPhone(phone.trim());
      const data = res?.data || {};
      if (data.success && data.requestId) {
        setRequestId(data.requestId);
        setOtp('');
        success('New OTP sent — check the server console');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
        </button>
        <h1 className="title">Verify Phone</h1>
      </div>

      <div className="content">
        {step === 'done' ? (
          <div className="done-card">
            <div className="done-icon">
              <Icon name="check" size={40} color="#10B981" strokeWidth={2.5} />
            </div>
            <h2 className="done-title">Phone Verified!</h2>
            <p className="done-desc">
              You've reached <strong>Tier 1</strong>. Your escrow limit is now{' '}
              <strong>MK 50,000</strong>.
            </p>
          </div>
        ) : (
          <>
            <div className="hero">
              <div className="hero-icon-wrap">
                <Icon name="phone" size={28} color="#3B82F6" strokeWidth={1.9} />
              </div>
              <p className="hero-text">
                Confirming your phone number earns you{' '}
                <strong>+5 trust points</strong> and unlocks{' '}
                <strong>Tier 1</strong> — a MK 50,000 escrow limit.
              </p>
            </div>

            {step === 'phone' && (
              <form onSubmit={handleSubmitPhone} className="form">
                <label className="label">Phone number</label>
                <div className="input-wrap">
                  <span className="prefix">🇲🇼 +265</span>
                  <input
                    type="tel"
                    className="input"
                    placeholder="0999123456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoFocus
                    disabled={loading}
                  />
                </div>
                {error && <p className="error">{error}</p>}
                <button type="submit" className="submit" disabled={loading || !phone.trim()}>
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleConfirmOtp} className="form">
                <p className="otp-info">
                  Enter the 6-digit code sent to <strong>{phone}</strong>. The OTP
                  is printed in the server console (stub SMS).
                </p>
                <label className="label">Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="input input-otp"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  disabled={loading}
                />
                {error && <p className="error">{error}</p>}
                <button type="submit" className="submit" disabled={loading || otp.length !== 6}>
                  {loading ? 'Verifying…' : 'Confirm'}
                </button>
                <button type="button" className="link-btn" onClick={handleResend} disabled={loading}>
                  Resend code
                </button>
              </form>
            )}

            <div className="info-card">
              <Icon name="info" size={16} color="#1E40AF" strokeWidth={1.9} />
              <span>
                Real SMS delivery will be enabled in a later phase. For now, the
                OTP appears in your backend logs.
              </span>
            </div>
          </>
        )}
      </div>

      <style jsx>{sharedStyles}</style>
    </div>
  );
};

const sharedStyles = `
  .page {
    min-height: 100vh;
    background: var(--color-bg);
    font-family: var(--font-sans);
    color: var(--color-text);
    padding-bottom: 40px;
  }
  .header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: rgba(255,255,255,0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border);
  }
  .back-btn {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text);
    flex-shrink: 0;
  }
  .back-btn:hover { background: var(--color-surface-alt); }
  .title {
    font-family: var(--font-serif);
    font-size: 22px;
    font-weight: 600;
    margin: 0;
    letter-spacing: -0.02em;
  }
  .content {
    max-width: 520px;
    margin: 0 auto;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .hero {
    display: flex;
    gap: 14px;
    padding: 16px;
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    border-radius: var(--radius-2xl);
  }
  .hero-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    background: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .hero-text {
    font-size: 13.5px;
    color: #1E3A8A;
    margin: 0;
    line-height: 1.5;
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2xl);
    padding: 20px;
  }
  .label {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--color-text-secondary);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .input-wrap {
    display: flex;
    align-items: stretch;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--color-surface-alt);
  }
  .input-wrap:focus-within {
    border-color: var(--color-primary);
    background: var(--color-surface);
  }
  .prefix {
    display: flex;
    align-items: center;
    padding: 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-secondary);
    border-right: 1px solid var(--color-border);
    background: var(--color-surface-alt);
  }
  .input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 14px 12px;
    font-size: 15px;
    color: var(--color-text);
    outline: none;
    font-family: inherit;
    font-weight: 500;
  }
  .input-otp {
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface-alt);
    text-align: center;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 12px;
    padding: 16px;
  }
  .input-otp:focus {
    border-color: var(--color-primary);
    background: var(--color-surface);
    outline: none;
  }
  .otp-info {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 0 0 6px;
    line-height: 1.5;
  }
  .error {
    font-size: 12.5px;
    color: var(--color-error);
    margin: 4px 0 0;
    font-weight: 600;
  }
  .submit {
    margin-top: 8px;
    padding: 14px;
    background: var(--color-primary);
    color: #FFFFFF;
    border: none;
    border-radius: var(--radius-xl);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
  }
  .submit:hover:not(:disabled) { background: #1E40AF; }
  .submit:disabled { opacity: 0.55; cursor: not-allowed; }
  .link-btn {
    background: none;
    border: none;
    color: var(--color-primary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 8px;
    font-family: inherit;
  }
  .link-btn:hover:not(:disabled) { text-decoration: underline; }
  .info-card {
    display: flex;
    gap: 10px;
    padding: 14px;
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    border-radius: var(--radius-xl);
    font-size: 12.5px;
    color: #1E3A8A;
    line-height: 1.5;
    align-items: flex-start;
  }
  .done-card {
    text-align: center;
    padding: 40px 20px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2xl);
  }
  .done-icon {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: #D1FAE5;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
  }
  .done-title {
    font-family: var(--font-serif);
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 10px;
    color: var(--color-text);
  }
  .done-desc {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0;
  }
`;

export default VerifyPhone;