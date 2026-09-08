// mobile/src/pages/VoiceListing.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { voiceAPI, businessAPI } from '../services/api';
import SocialShare from '../components/SocialShare';
import PrimaryButton from '../components/PrimaryButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContainer';

const Icon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.75 }) => (
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
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  mic: "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8",
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  check: "M20 6L9 17l-5-5",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
  close: "M18 6L6 18M6 6l12 12",
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  plus: "M12 4v16m8-8H4",
  message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
};

const VoiceListing = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast, success, error } = useToast();
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [listingData, setListingData] = useState(null);
  const [createdListingId, setCreatedListingId] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [language, setLanguage] = useState('ny');
  const [samplePrompts, setSamplePrompts] = useState([]);
  const [validation, setValidation] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchBusinesses();
    fetchSamplePrompts();
  }, [user, language]);

  const handleLogout = async () => {
    try {
      await logout();
      success('Logged out successfully');
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      showToast('Failed to logout', 'error');
    }
  };

  const fetchBusinesses = async () => {
    if (!user?.id) return;
    try {
      const response = await businessAPI.getByUser(user.id);
      if (response.data.business) {
        setBusinesses([response.data.business]);
        setSelectedBusiness(response.data.business.id);
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
    }
  };

  const fetchSamplePrompts = async () => {
    try {
      const response = await voiceAPI.getPrompts(language);
      if (response.data.success) {
        setSamplePrompts(response.data.prompts || []);
      }
    } catch (err) {
      console.error('Error fetching prompts:', err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        processAudio(audioBlob);
      };

      mediaRecorder.current.start();
      setRecording(true);
      setErrorMsg('');
      setTranscript('Recording...');
    } catch (err) {
      setErrorMsg('Microphone access denied. Please allow microphone access.');
      showToast('Microphone access denied', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
      setProcessing(true);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);

      const response = await voiceAPI.processVoice(formData);
      
      if (response.data.success) {
        setTranscript(response.data.transcript);
        setListingData(response.data.listing);
        setValidation(response.data.validation);
        
        if (response.data.validation) {
          const validationErrors = response.data.validation.errors || [];
          if (validationErrors.length > 0) {
            setErrorMsg('Please review: ' + validationErrors.join(', '));
          }
        }
      } else {
        setErrorMsg(response.data.error || 'Failed to process voice');
        showToast(response.data.error || 'Failed to process voice', 'error');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to process voice');
      showToast(err.response?.data?.error || 'Failed to process voice', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateListing = async () => {
    if (!selectedBusiness || !listingData) {
      setErrorMsg('Please select a business and record a listing');
      showToast('Please select a business and record a listing', 'error');
      return;
    }

    setProcessing(true);
    setErrorMsg('');

    try {
      const response = await voiceAPI.createListing({
        businessId: selectedBusiness,
        userId: user.id,
        language: language,
        listingData: listingData,
        transcript: transcript
      });

      if (response.data.success) {
        setSuccessMsg('🎉 Listing created successfully!');
        success('🎉 Listing created successfully!');
        setCreatedListingId(response.data.listing?.id);
        setListingData(response.data.listing || listingData);
        setValidation(response.data.validation);
      } else {
        setErrorMsg(response.data.error || 'Failed to create listing');
        showToast(response.data.error || 'Failed to create listing', 'error');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create listing');
      showToast(err.message || 'Failed to create listing', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  if (processing && !transcript) {
    return <LoadingSpinner fullScreen message="Processing your voice..." />;
  }

  return (
    <div className="voice-listing">
      {/* Navbar */}
      <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link to="/landing" className="logo">
            <span className="logo-icon">K</span>
            <span className="logo-text">Kumsika</span>
          </Link>
          <div className="nav-actions">
            <span className="greeting">👋 {user?.email?.split('@')[0] || 'User'}</span>
            <button onClick={handleLogout} className="logout-btn">
              <Icon d={ICONS.logout} size={16} color="#EF4444" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </nav>

      <div className="main-content">
        {/* Back Button */}
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <Icon d={ICONS.arrowLeft} size={16} color="#64748B" strokeWidth={1.75} />
          Back
        </button>

        {/* Main Card */}
        <div className="main-card">
          <div className="card-header">
            <div className="header-icon">
              <Icon d={ICONS.mic} size={28} color="#F59E0B" strokeWidth={1.75} />
            </div>
            <h1 className="card-title">Voice Listing</h1>
            <p className="card-subtitle">Speak to create a listing in Chichewa or English</p>
          </div>

          {/* Language Selector */}
          <div className="form-group">
            <label className="form-label">
              <Icon d={ICONS.sparkles} size={14} color="#94A3B8" strokeWidth={1.75} />
              Language
            </label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                fetchSamplePrompts();
              }}
              className="form-select"
            >
              <option value="ny">🇲🇼 Chichewa</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>

          {/* Business Selector */}
          {businesses.length > 0 && (
            <div className="form-group">
              <label className="form-label">
                <Icon d={ICONS.store} size={14} color="#94A3B8" strokeWidth={1.75} />
                Business <span className="required">*</span>
              </label>
              <select
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                className="form-select"
              >
                {businesses.map(biz => (
                  <option key={biz.id} value={biz.id}>
                    {biz.business_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Record Button */}
          <div className="record-section">
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`record-btn ${recording ? 'recording' : ''}`}
              disabled={!selectedBusiness || processing}
            >
              {recording ? '⏹️' : '🎙️'}
            </button>
            <p className="record-label">
              {recording ? 'Recording... Click to stop' : 'Click to start recording'}
            </p>
            {recording && (
              <div className="recording-indicator">
                <span className="recording-dot" />
                <span>Recording in progress...</span>
              </div>
            )}
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="transcript-box">
              <p className="transcript-label">📝 Transcript</p>
              <p className="transcript-text">{transcript}</p>
            </div>
          )}

          {/* Listing Preview */}
          {listingData && (
            <div className="preview-box">
              <p className="preview-label">📋 Extracted Listing</p>
              <div className="preview-grid">
                <div className="preview-item">
                  <span className="preview-key">Title</span>
                  <span className="preview-value">{listingData.title || 'Untitled'}</span>
                </div>
                <div className="preview-item">
                  <span className="preview-key">Category</span>
                  <span className="preview-value">{listingData.category || 'Not specified'}</span>
                </div>
                {listingData.price && (
                  <div className="preview-item">
                    <span className="preview-key">Price</span>
                    <span className="preview-value">MWK {listingData.price}</span>
                  </div>
                )}
                {listingData.quantity && (
                  <div className="preview-item">
                    <span className="preview-key">Quantity</span>
                    <span className="preview-value">{listingData.quantity} {listingData.unit || 'units'}</span>
                  </div>
                )}
                {listingData.deliveryAvailable && (
                  <div className="preview-item">
                    <span className="preview-key">Delivery</span>
                    <span className="preview-value badge-success">Available</span>
                  </div>
                )}
              </div>

              {/* Confidence Bar */}
              {validation && validation.confidence && (
                <div className="confidence-section">
                  <div className="confidence-header">
                    <span className="confidence-label">Confidence</span>
                    <span className="confidence-value">{Math.round(validation.confidence * 100)}%</span>
                  </div>
                  <div className="confidence-bar">
                    <div 
                      className={`confidence-fill ${validation.confidence > 0.7 ? 'high' : validation.confidence > 0.4 ? 'medium' : 'low'}`}
                      style={{ width: `${validation.confidence * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation Warnings */}
          {validation && validation.warnings && validation.warnings.length > 0 && (
            <div className="warning-box">
              <p className="warning-label">⚠️ Suggestions</p>
              {validation.warnings.map((warning, index) => (
                <p key={index} className="warning-item">• {warning}</p>
              ))}
            </div>
          )}

          {/* Error/Success */}
          {errorMsg && (
            <div className="error-banner">
              <Icon d={ICONS.close} size={16} color="#EF4444" strokeWidth={1.75} />
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="success-banner">
              <Icon d={ICONS.check} size={16} color="#10B981" strokeWidth={2.5} />
              {successMsg}
            </div>
          )}

          {/* Create Listing Button */}
          {listingData && !successMsg && (
            <button
              onClick={handleCreateListing}
              className="create-btn"
              disabled={processing || !selectedBusiness}
            >
              <Icon d={ICONS.check} size={18} color="#FFFFFF" strokeWidth={1.75} />
              {processing ? 'Processing...' : 'Create Listing'}
            </button>
          )}

          {/* Share Section */}
          {successMsg && createdListingId && (
            <div className="share-section">
              <p className="share-label">📤 Share Your Listing</p>
              <SocialShare 
                title={listingData?.title || 'New Listing on Kumsika'}
                description={listingData?.description || ''}
                url={`${window.location.origin}/listing/${createdListingId}`}
              />
            </div>
          )}
        </div>

        {/* Sample Prompts */}
        <div className="prompts-card">
          <h3 className="prompts-title">
            <Icon d={ICONS.sparkles} size={16} color="#F59E0B" strokeWidth={1.75} />
            Sample {language === 'ny' ? 'Chichewa' : 'English'} Prompts
          </h3>
          <div className="prompts-list">
            {samplePrompts.map((prompt, index) => (
              <button
                key={index}
                className="prompt-btn"
                onClick={() => {
                  setTranscript(prompt);
                  setProcessing(true);
                  setTimeout(() => {
                    const extracted = {
                      title: prompt.split(' ').slice(0, 4).join(' ') + '...',
                      category: 'Other',
                      price: prompt.match(/\d+/) ? parseInt(prompt.match(/\d+/)[0]) : null,
                      quantity: 1,
                      unit: 'unit',
                      deliveryAvailable: false,
                      confidence: 0.6
                    };
                    setListingData(extracted);
                    setValidation({
                      isValid: true,
                      errors: [],
                      warnings: ['Please review the extracted data'],
                      confidence: 0.6
                    });
                    setProcessing(false);
                  }, 500);
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      {isMobile && (
        <div className="bottom-nav">
          {[
            { id: 'home', label: 'Home', icon: 'home' },
            { id: 'search', label: 'Search', icon: 'search' },
            { id: 'sell', label: 'Sell', icon: 'plus' },
            { id: 'messages', label: 'Chat', icon: 'message' },
            { id: 'profile', label: 'Profile', icon: 'user' },
          ].map((item) => {
            const active = item.id === 'sell';
            return (
              <button key={item.id} className="nav-item" onClick={() => handleBottomNav(item.id)}>
                <div className={`nav-icon ${active ? 'nav-icon-active' : ''}`}>
                  <Icon d={ICONS[item.icon]} size={20} color={active ? '#FFF' : '#94A3B8'} strokeWidth={1.75} />
                </div>
                <span className={`nav-label ${active ? 'nav-label-active' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .voice-listing {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 80px;
        }

        @media (min-width: 769px) {
          .voice-listing {
            padding-bottom: 0;
          }
        }

        /* ===== NAVBAR ===== */
        .navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.4);
          transition: all 0.2s;
        }

        .navbar-scrolled {
          box-shadow: 0 2px 16px rgba(0,0,0,0.04);
        }

        .navbar-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: #1E293B;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #F59E0B;
          font-weight: 700;
          font-size: 16px;
        }

        .logo-text {
          font-size: 18px;
          font-weight: 700;
          color: #1E293B;
          letter-spacing: -0.5px;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .greeting {
          font-size: 13px;
          color: #64748B;
          display: none;
        }

        @media (min-width: 640px) {
          .greeting { display: inline; }
        }

        .logout-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: #FEF2F2;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: #FEE2E2;
        }

        /* ===== MAIN CONTENT ===== */
        .main-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 16px 16px 40px;
        }

        /* ===== BACK BUTTON ===== */
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 14px;
          background: #FFFFFF;
          border: 1px solid #F1F5F9;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          margin-bottom: 16px;
        }

        .back-btn:hover {
          background: #F1F5F9;
          border-color: #E2E8F0;
        }

        /* ===== MAIN CARD ===== */
        .main-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 18px 20px;
          border: 1px solid #F1F5F9;
          margin-bottom: 16px;
        }

        .card-header {
          margin-bottom: 20px;
        }

        .header-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 14px;
          margin-bottom: 8px;
        }

        .card-title {
          font-size: clamp(22px, 2.8vw, 26px);
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 4px;
          letter-spacing: -0.5px;
        }

        .card-subtitle {
          font-size: 14px;
          color: #94A3B8;
          margin: 0;
        }

        /* ===== FORM ===== */
        .form-group {
          margin-bottom: 14px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 4px;
        }

        .required {
          color: #EF4444;
        }

        .form-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          font-size: 14px;
          color: #1E293B;
          outline: none;
          background: #FFFFFF;
          font-family: inherit;
          transition: all 0.2s;
          box-sizing: border-box;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
        }

        .form-select:focus {
          border-color: #F59E0B;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.08);
        }

        /* ===== RECORD SECTION ===== */
        .record-section {
          text-align: center;
          padding: 16px 0;
        }

        .record-btn {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: none;
          font-size: 32px;
          cursor: pointer;
          background: #EDE9F5;
          color: #1E293B;
          transition: all 0.3s;
          box-shadow: 0 4px 16px rgba(30, 41, 59, 0.08);
        }

        .record-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 24px rgba(30, 41, 59, 0.12);
        }

        .record-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .record-btn.recording {
          background: #EF4444;
          color: #FFFFFF;
          animation: pulse 1s infinite;
          box-shadow: 0 4px 24px rgba(239, 68, 68, 0.3);
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }

        .record-label {
          font-size: 14px;
          color: #94A3B8;
          margin: 8px 0 0;
          font-weight: 500;
        }

        .recording-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
          font-size: 13px;
          color: #EF4444;
          font-weight: 500;
        }

        .recording-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #EF4444;
          animation: blink 0.8s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }

        /* ===== TRANSCRIPT ===== */
        .transcript-box {
          padding: 12px 14px;
          background: #F8FAFC;
          border-radius: 10px;
          border: 1px solid #F1F5F9;
          margin-top: 12px;
        }

        .transcript-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748B;
          margin: 0 0 4px;
        }

        .transcript-text {
          font-size: 14px;
          color: #1E293B;
          margin: 0;
          line-height: 1.6;
        }

        /* ===== PREVIEW ===== */
        .preview-box {
          padding: 14px 16px;
          background: #FEFCF5;
          border-radius: 10px;
          border: 1px solid #FDE68A;
          margin-top: 12px;
        }

        .preview-label {
          font-size: 12px;
          font-weight: 600;
          color: #92400E;
          margin: 0 0 8px;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 16px;
        }

        .preview-item {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          font-size: 13px;
        }

        .preview-key {
          color: #94A3B8;
        }

        .preview-value {
          color: #1E293B;
          font-weight: 500;
        }

        .badge-success {
          color: #10B981;
          font-weight: 600;
        }

        /* ===== CONFIDENCE ===== */
        .confidence-section {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #F1F5F9;
        }

        .confidence-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .confidence-label {
          color: #94A3B8;
        }

        .confidence-value {
          font-weight: 600;
          color: #1E293B;
        }

        .confidence-bar {
          width: 100%;
          height: 4px;
          background: #F1F5F9;
          border-radius: 2px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        .confidence-fill.high {
          background: #10B981;
        }

        .confidence-fill.medium {
          background: #F59E0B;
        }

        .confidence-fill.low {
          background: #EF4444;
        }

        /* ===== WARNINGS ===== */
        .warning-box {
          padding: 12px 14px;
          background: #FEF3C7;
          border-radius: 10px;
          border: 1px solid #FDE68A;
          margin-top: 12px;
        }

        .warning-label {
          font-size: 12px;
          font-weight: 600;
          color: #92400E;
          margin: 0 0 4px;
        }

        .warning-item {
          font-size: 13px;
          color: #78350F;
          margin: 2px 0;
        }

        /* ===== BANNERS ===== */
        .error-banner {
          color: #EF4444;
          font-size: 13px;
          padding: 10px 14px;
          background: #FEF2F2;
          border-radius: 10px;
          border: 1px solid #FECACA;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }

        .success-banner {
          color: #10B981;
          font-size: 13px;
          padding: 10px 14px;
          background: #ECFDF5;
          border-radius: 10px;
          border: 1px solid #BBF7D0;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }

        /* ===== CREATE BUTTON ===== */
        .create-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #10B981, #059669);
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #FFFFFF;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          margin-top: 12px;
        }

        .create-btn:hover:not(:disabled) {
          transform: scale(0.98);
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
        }

        .create-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ===== SHARE ===== */
        .share-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #F1F5F9;
        }

        .share-label {
          font-size: 14px;
          font-weight: 600;
          color: #1E293B;
          margin: 0 0 10px;
        }

        /* ===== PROMPTS CARD ===== */
        .prompts-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 16px 18px;
          border: 1px solid #F1F5F9;
        }

        .prompts-title {
          font-size: 16px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .prompts-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .prompt-btn {
          padding: 8px 14px;
          background: #F8FAFC;
          border: 1px solid #F1F5F9;
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          font-size: 14px;
          color: #64748B;
          font-family: inherit;
          transition: all 0.2s;
        }

        .prompt-btn:hover {
          background: #F1F5F9;
          border-color: #E2E8F0;
          transform: translateX(4px);
        }

        /* ===== BOTTOM NAV ===== */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(226, 232, 240, 0.4);
          display: flex;
          justify-content: space-around;
          padding: 4px 0 8px;
          z-index: 100;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          font-family: inherit;
          min-width: 44px;
        }

        .nav-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .nav-icon-active {
          background: #1E293B;
        }

        .nav-label {
          font-size: 9px;
          font-weight: 500;
          color: #94A3B8;
        }

        .nav-label-active {
          color: #1E293B;
          font-weight: 600;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .main-card {
            padding: 14px 16px;
          }
          .prompts-card {
            padding: 14px 16px;
          }
          .preview-grid {
            grid-template-columns: 1fr;
          }
          .record-btn {
            width: 64px;
            height: 64px;
            font-size: 28px;
          }
        }

        @media (max-width: 380px) {
          .main-content {
            padding: 12px 12px 32px;
          }
          .record-btn {
            width: 56px;
            height: 56px;
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default VoiceListing;