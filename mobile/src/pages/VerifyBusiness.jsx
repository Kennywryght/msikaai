// mobile/src/pages/VerifyBusiness.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { trustAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';

const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75 }) => {
  const icons = {
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    building: 'M3 21h18M5 21V7l7-5 7 5v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01',
    upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
    check: 'M20 6L9 17l-5-5',
    clock: 'M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    x: 'M18 6L6 18M6 6l12 12',
    fileText: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  };
  const d = icons[name] || icons.building;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
};

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_MB = 10;

const VerifyBusiness = () => {
  const navigate = useNavigate();
  const { success } = useToast();
  const fileInputRef = useRef(null);

  const [businessName, setBusinessName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [file, setFile] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Only JPG, PNG, WEBP, or PDF files are allowed');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File must be smaller than ${MAX_MB} MB`);
      return;
    }
    setError(null);
    setFile(f);
    setUploadedUrl(null);
    setUploadProgress(0);
  };

  const uploadFile = async () => {
    if (!file) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await trustAPI.uploadDocument(file, (pct) => setUploadProgress(pct));
      const data = res?.data || {};
      if (data.success && data.url) {
        setUploadedUrl(data.url);
        return data.url;
      }
      setError(data.error || 'Upload failed');
      return null;
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Upload failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!businessName.trim()) {
      setError('Business name is required');
      return;
    }
    if (!file) {
      setError('Please upload a registration certificate');
      return;
    }

    let url = uploadedUrl;
    if (!url) url = await uploadFile();
    if (!url) return;

    setLoading(true);
    try {
      const res = await trustAPI.submitBusiness({
        businessName: businessName.trim(),
        registrationNumber: registrationNumber.trim(),
        documentUrl: url,
      });
      const data = res?.data || {};
      if (data.success) {
        setSubmitted(true);
        success('Business verification submitted');
      } else {
        setError(data.error || 'Submission failed');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadedUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="page">
      <div className="header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
        </button>
        <h1 className="title">Verify Business</h1>
      </div>

      <div className="content">
        {submitted ? (
          <div className="done-card">
            <div className="done-icon">
              <Icon name="clock" size={40} color="#F59E0B" strokeWidth={2.5} />
            </div>
            <h2 className="done-title">Submitted for Review</h2>
            <p className="done-desc">
              Your business verification is pending admin approval. Once approved
              you'll reach <strong>Tier 3</strong> — a MK 1,000,000 escrow limit.
            </p>
            <button className="submit" onClick={() => navigate('/trust')}>
              Back to Trust Profile
            </button>
          </div>
        ) : (
          <>
            <div className="hero">
              <div className="hero-icon-wrap">
                <Icon name="building" size={28} color="#10B981" strokeWidth={1.9} />
              </div>
              <p className="hero-text">
                Verifying your registered business earns{' '}
                <strong>+2 trust points</strong> and unlocks{' '}
                <strong>Tier 3</strong> — a MK 1,000,000 escrow limit and a
                "Business Verified" badge on all listings.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="form">
              <label className="label">Business name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Mitundu Fresh Produce"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={loading}
              />

              <label className="label">Registration number (optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. TRL-MW-12345"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                disabled={loading}
              />

              <label className="label">Registration certificate</label>
              {!file ? (
                <button
                  type="button"
                  className="file-drop"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Icon name="upload" size={22} color="#6B7280" strokeWidth={1.9} />
                  <span className="file-drop-title">Choose a file</span>
                  <span className="file-drop-desc">
                    JPG, PNG, WEBP, or PDF · Max {MAX_MB} MB
                  </span>
                </button>
              ) : (
                <div className="file-preview">
                  <div className="file-info">
                    <Icon name="fileText" size={22} color="#3B82F6" strokeWidth={1.9} />
                    <div className="file-meta">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="file-remove"
                    onClick={clearFile}
                    aria-label="Remove file"
                    disabled={loading}
                  >
                    <Icon name="x" size={16} strokeWidth={2.4} />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="progress-label">Uploading… {uploadProgress}%</span>
                </div>
              )}

              {error && <p className="error">{error}</p>}

              <button
                type="submit"
                className="submit"
                disabled={loading || !businessName.trim() || !file}
              >
                {loading ? 'Submitting…' : 'Submit for review'}
              </button>
            </form>

            <div className="info-card">
              <Icon name="info" size={16} color="#1E40AF" strokeWidth={1.9} />
              <span>
                Business documents are stored securely and only visible to Kumsika
                admins. Approval usually takes 24–48 hours.
              </span>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
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
          background: #ECFDF5;
          border: 1px solid #6EE7B7;
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
          color: #065F46;
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
          margin-top: 6px;
        }
        .input {
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-alt);
          padding: 14px 12px;
          font-size: 15px;
          color: var(--color-text);
          outline: none;
          font-family: inherit;
          font-weight: 500;
        }
        .input:focus {
          border-color: var(--color-primary);
          background: var(--color-surface);
        }
        .file-drop {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 24px 16px;
          background: var(--color-surface-alt);
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-xl);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .file-drop:hover:not(:disabled) {
          border-color: var(--color-primary);
          background: var(--color-surface);
        }
        .file-drop-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
        }
        .file-drop-desc {
          font-size: 11.5px;
          color: var(--color-text-muted);
        }
        .file-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 14px;
          background: var(--color-surface-alt);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-xl);
        }
        .file-info {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .file-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .file-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .file-size {
          font-size: 11px;
          color: var(--color-text-muted);
        }
        .file-remove {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-md);
          border: none;
          background: var(--color-error-bg);
          color: var(--color-error);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .progress {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .progress-bar {
          width: 100%;
          height: 6px;
          background: var(--color-surface-alt);
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3B82F6, #10B981);
          transition: width 0.2s ease;
        }
        .progress-label {
          font-size: 11.5px;
          color: var(--color-text-muted);
        }
        .error {
          font-size: 12.5px;
          color: var(--color-error);
          margin: 4px 0 0;
          font-weight: 600;
        }
        .submit {
          margin-top: 12px;
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
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .done-icon {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: #FEF3C7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        .done-title {
          font-family: var(--font-serif);
          font-size: 22px;
          font-weight: 700;
          margin: 0;
          color: var(--color-text);
        }
        .done-desc {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default VerifyBusiness;