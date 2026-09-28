// mobile/src/pages/UpdatePassword.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastContainer';

// ============================================================
// ICONS
// ============================================================
const Icon = ({ name, size = 18, color = 'currentColor', strokeWidth = 1.75 }) => {
  const icons = {
    lock: 'M12 2a4 4 0 00-4 4v4H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-2V6a4 4 0 00-4-4zM12 14v4M9 12h6',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
    eyeOff: 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22',
    arrowRight: 'M5 12h14M12 5l7 7-7 7',
    check: 'M20 6L9 17l-5-5',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    alert: 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  };
  const d = icons[name] || icons.lock;
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
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const UpdatePassword = () => {
  const navigate = useNavigate();
  const { success } = useToast();

  const [ready, setReady] = useState(false);
  const [linkValid, setLinkValid] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ============================================================
  // On mount: wait for Supabase to consume the recovery token from
  // the URL hash and produce a session. Two cases:
  //
  //  1. PASSWORD_RECOVERY event fires via onAuthStateChange
  //  2. getSession() shows an existing session (already recovered)
  //
  // If neither, the link is expired or invalid.
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data?.session) {
        setReady(true);
        setLinkValid(true);
      } else {
        // Give onAuthStateChange a moment to fire (PKCE flow)
        setTimeout(async () => {
          if (cancelled) return;
          const { data: retry } = await supabase.auth.getSession();
          if (retry?.session) {
            setReady(true);
            setLinkValid(true);
          } else {
            setReady(true);
            setLinkValid(false);
          }
        }, 800);
      }
    };

    // Listen for the recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;
        if (event === 'PASSWORD_RECOVERY' && session) {
          setReady(true);
          setLinkValid(true);
        }
      }
    );

    checkSession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const validate = () => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const v = validate();
    if (v) {
      setErrorMsg(v);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      success('Password updated successfully 🎉');

      // Sign out so the user logs in fresh with the new password.
      // This also invalidates any other sessions tied to the old password.
      await supabase.auth.signOut();

      // Navigate to login after a beat so the toast is readable
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { message: 'Password updated. Please sign in.' },
        });
      }, 900);
    } catch (err) {
      console.error('Password update error:', err);
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('same password')) {
        setErrorMsg('New password must be different from your old one.');
      } else if (msg.toLowerCase().includes('weak')) {
        setErrorMsg('Please choose a stronger password.');
      } else {
        setErrorMsg('Could not update password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER — loading / detecting
  // ============================================================
  if (!ready) {
    return (
      <div className="auth-page">
        <div className="boot">
          <div className="boot-spinner" />
          <p className="boot-text">Verifying your reset link…</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  // ============================================================
  // RENDER — invalid/expired link
  // ============================================================
  if (!linkValid) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-brand">
            <div className="brand-mark error-mark">
              <Icon name="alert" size={24} color="#DC2626" strokeWidth={2} />
            </div>
            <h1 className="brand-name">Link expired</h1>
            <p className="brand-tagline">
              This password reset link is invalid or has expired.
            </p>
          </div>

          <div className="auth-card">
            <div className="info-block warning">
              <Icon name="info" size={16} color="#92400E" strokeWidth={1.75} />
              <div>
                <p className="info-title">Reset links expire after 1 hour</p>
                <p className="info-body">
                  Request a new link to continue.
                </p>
              </div>
            </div>

            <Link to="/forgot-password" className="submit as-link">
              <span>Request a new link</span>
              <Icon name="arrowRight" size={16} color="currentColor" strokeWidth={2.25} />
            </Link>

            <Link to="/login" className="back-link">
              Back to sign in
            </Link>
          </div>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  // ============================================================
  // RENDER — new password form
  // ============================================================
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <div className="brand-mark">
            <Icon name="lock" size={24} color="#F59E0B" strokeWidth={2} />
          </div>
          <h1 className="brand-name">Set a new password</h1>
          <p className="brand-tagline">
            Choose a strong password you haven't used before.
          </p>
        </div>

        <div className="auth-card">
          {errorMsg && (
            <div className="error" role="alert">
              <span className="error-dot" />
              <span className="error-msg">{errorMsg}</span>
              <button
                type="button"
                className="error-x"
                onClick={() => setErrorMsg('')}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="form" noValidate>
            <div className="field">
              <label className="label" htmlFor="new-password">
                New password
              </label>
              <div className="input-wrap">
                <span className="input-icon">
                  <Icon name="lock" size={16} color="#94a3b8" />
                </span>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  className="input input-pw"
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  disabled={loading}
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  className="eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} color="#94a3b8" />
                </button>
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="confirm-password">
                Confirm new password
              </label>
              <div className="input-wrap">
                <span className="input-icon">
                  <Icon name="lock" size={16} color="#94a3b8" />
                </span>
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  className="input input-pw"
                  placeholder="Re-enter your new password"
                  required
                  minLength={6}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="eye"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showConfirm ? 'eyeOff' : 'eye'} size={16} color="#94a3b8" />
                </button>
              </div>
              {confirmPassword && password && password !== confirmPassword && (
                <p className="field-hint error-hint">Passwords don't match yet</p>
              )}
              {confirmPassword && password && password === confirmPassword && (
                <p className="field-hint success-hint">
                  <Icon name="check" size={12} color="#10B981" strokeWidth={2.5} />
                  {' '}Passwords match
                </p>
              )}
            </div>

            <button type="submit" className="submit" disabled={loading}>
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  <span>Update password</span>
                  <Icon name="arrowRight" size={16} color="currentColor" strokeWidth={2.25} />
                </>
              )}
            </button>
          </form>

          <div className="info-note">
            <Icon name="info" size={14} color="#64748B" strokeWidth={1.75} />
            <span>
              You'll be signed out after updating. Sign in again with your new password.
            </span>
          </div>
        </div>
      </div>

      <style jsx>{styles}</style>
    </div>
  );
};

// ============================================================
// SHARED STYLES
// ============================================================
const styles = `
  .auth-page {
    min-height: 100vh;
    min-height: 100dvh;
    width: 100%;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0f172a;
    box-sizing: border-box;
  }

  .auth-container {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .auth-brand {
    text-align: center;
    margin-bottom: 24px;
  }

  .brand-mark {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: #1e293b;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 14px;
    box-shadow: 0 4px 16px rgba(30, 41, 59, 0.18);
  }

  .error-mark {
    background: rgba(220, 38, 38, 0.1);
    box-shadow: none;
  }

  .brand-name {
    font-family: Georgia, serif;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 6px;
    color: #1e293b;
  }

  .brand-name-accent { color: #f59e0b; }

  .brand-tagline {
    font-size: 13px;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
  }

  .auth-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  }

  .error {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 10px 12px;
    margin-bottom: 16px;
    font-size: 13px;
    color: #991b1b;
  }

  .error-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ef4444;
    flex-shrink: 0;
  }

  .error-msg { flex: 1; line-height: 1.4; }

  .error-x {
    background: none;
    border: none;
    color: #991b1b;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    padding: 0 4px;
  }

  .form { display: flex; flex-direction: column; gap: 16px; }

  .field { display: flex; flex-direction: column; gap: 6px; }

  .label {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
  }

  .input-wrap {
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

  .input {
    width: 100%;
    height: 44px;
    padding: 0 12px 0 38px;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    font-size: 14px;
    color: #0f172a;
    background: #ffffff;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .input::placeholder { color: #94a3b8; }

  .input:focus {
    border-color: #1e293b;
    box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.08);
  }

  .input:disabled {
    background: #f8fafc;
    cursor: not-allowed;
    opacity: 0.7;
  }

  .input-pw { padding-right: 42px; }

  .eye {
    position: absolute;
    right: 6px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 6px;
    transition: background 0.15s;
  }

  .eye:hover { background: #f1f5f9; }

  .submit {
    width: 100%;
    height: 46px;
    margin-top: 4px;
    background: #1e293b;
    border: none;
    border-radius: 10px;
    color: #ffffff;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.15s, transform 0.1s;
    text-decoration: none;
  }

  .submit:hover:not(:disabled) { background: #0f172a; }
  .submit:active:not(:disabled) { transform: scale(0.99); }
  .submit:disabled { opacity: 0.6; cursor: not-allowed; }

  .as-link { margin-top: 0; }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .field-hint {
    font-size: 12px;
    margin: 4px 0 0;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .error-hint { color: #DC2626; }
  .success-hint { color: #10B981; }

  .info-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 12px;
    color: #64748b;
    line-height: 1.5;
    margin-top: 16px;
  }

  .info-block {
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 10px;
    margin-bottom: 16px;
  }

  .info-block.warning {
    background: #fffbeb;
    border-color: #fde68a;
  }

  .info-title {
    font-size: 13px;
    font-weight: 600;
    color: #1e40af;
    margin: 0 0 2px;
  }

  .info-block.warning .info-title { color: #92400e; }

  .info-body {
    font-size: 12px;
    color: #1e40af;
    line-height: 1.45;
    margin: 0;
  }

  .info-block.warning .info-body { color: #92400e; }

  .back-link {
    margin-top: 16px;
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: #94a3b8;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.15s;
  }

  .back-link:hover { color: #475569; }

  .boot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .boot-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e2e8f0;
    border-top-color: #f59e0b;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .boot-text {
    font-size: 13px;
    color: #64748b;
    margin: 0;
  }
`;

export default UpdatePassword;