// mobile/src/pages/VoiceListing.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { voiceAPI, businessAPI } from '../services/api';
import SocialShare from '../components/SocialShare';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
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
  };

  const d = icons[name] || icons.store;
  
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
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
};

// ============================================================
// SOUND WAVE COMPONENT
// ============================================================
const SoundWave = ({ isRecording, audioLevel }) => {
  const [bars, setBars] = useState(Array(20).fill(5));

  useEffect(() => {
    if (!isRecording) {
      setBars(Array(20).fill(5));
      return;
    }

    const interval = setInterval(() => {
      const newBars = bars.map(() => {
        // Generate random height based on audio level
        const baseHeight = 4 + (audioLevel || 0) * 20;
        const randomFactor = 0.5 + Math.random() * 0.5;
        return Math.min(baseHeight * randomFactor, 100);
      });
      setBars(newBars);
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, audioLevel, bars]);

  return (
    <div className="sound-wave-container">
      {bars.map((height, index) => (
        <div
          key={index}
          className="sound-bar"
          style={{
            height: `${Math.max(4, height)}%`,
            animationDelay: `${index * 0.05}s`,
            opacity: isRecording ? 1 : 0.2,
          }}
        />
      ))}
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const VoiceListing = () => {
  const { user } = useAuth();
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
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(null);
  
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const dataArray = useRef(null);
  const animationFrame = useRef(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  useEffect(() => {
    fetchBusinesses();
    fetchSamplePrompts();
  }, [user, language]);

  useEffect(() => {
    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, [recordingTimer]);

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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      // Set up audio context for visualization
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 256;
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyser.current);
      dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);

      // Start audio visualization
      updateAudioLevel();

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
        // Clean up audio context
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }
        if (audioContext.current) {
          audioContext.current.close();
        }
      };

      mediaRecorder.current.start(1000);
      setRecording(true);
      setErrorMsg('');
      setTranscript('');
      setRecordingTime(0);
      
      // Start timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingTimer(timer);
      
      showToast('Recording started... 🎙️', 'info');
    } catch (err) {
      setErrorMsg('Microphone access denied. Please allow microphone access.');
      showToast('Microphone access denied', 'error');
    }
  };

  const updateAudioLevel = () => {
    if (!analyser.current || !recording) return;

    analyser.current.getByteFrequencyData(dataArray.current);
    const average = dataArray.current.reduce((acc, val) => acc + val, 0) / dataArray.current.length;
    const normalizedLevel = Math.min(average / 128, 1);
    setAudioLevel(normalizedLevel);

    animationFrame.current = requestAnimationFrame(updateAudioLevel);
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
      
      // Clear timer
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      showToast('Processing your recording... ⏳', 'info');
    }
  };

  const processAudio = async (audioBlob) => {
    setProcessing(true);
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
        success('Voice processed successfully! 🎉');
      } else {
        setErrorMsg(response.data.error || 'Failed to process voice');
        showToast(response.data.error || 'Failed to process voice', 'error');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to process voice');
      showToast(err.response?.data?.error || 'Failed to process voice', 'error');
    } finally {
      setProcessing(false);
      setAudioLevel(0);
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetAll = () => {
    setTranscript('');
    setListingData(null);
    setValidation(null);
    setErrorMsg('');
    setSuccessMsg('');
    setCreatedListingId(null);
    setRecordingTime(0);
    setAudioLevel(0);
  };

  return (
    <div className="voice-listing">
      <div className="main-content">
        {/* Back Button */}
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <Icon name="arrowLeft" size={16} color="#64748B" strokeWidth={1.75} />
          Back
        </button>

        {/* Main Card */}
        <div className="main-card">
          <div className="card-header">
            <div className="header-icon">
              <Icon name="mic" size={24} color="#F59E0B" strokeWidth={1.75} />
            </div>
            <h1 className="card-title">Voice Listing</h1>
            <p className="card-subtitle">Speak to create a listing in Chichewa or English</p>
          </div>

          {/* Language Selector */}
          <div className="form-group">
            <label className="form-label">Language</label>
            <div className="language-selector">
              <button
                className={`lang-btn ${language === 'ny' ? 'active' : ''}`}
                onClick={() => {
                  setLanguage('ny');
                  fetchSamplePrompts();
                }}
              >
                🇲🇼 Chichewa
              </button>
              <button
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => {
                  setLanguage('en');
                  fetchSamplePrompts();
                }}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Business Selector */}
          {businesses.length > 0 && (
            <div className="form-group">
              <label className="form-label">
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

          {/* Record Section with Sound Wave */}
          <div className="record-section">
            {/* Sound Wave Visualization */}
            <SoundWave isRecording={recording} audioLevel={audioLevel} />

            {/* Record Button */}
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`record-btn ${recording ? 'recording' : ''}`}
              disabled={!selectedBusiness || processing}
            >
              {recording ? (
                <Icon name="mic" size={28} color="#FFFFFF" strokeWidth={2} />
              ) : (
                <Icon name="mic" size={28} color="#1E293B" strokeWidth={2} />
              )}
            </button>
            
            <div className="record-status">
              {recording ? (
                <>
                  <span className="status-dot recording" />
                  <span className="status-text">Recording... {formatTime(recordingTime)}</span>
                </>
              ) : processing ? (
                <>
                  <span className="status-dot processing" />
                  <span className="status-text">Processing...</span>
                </>
              ) : transcript ? (
                <>
                  <span className="status-dot done" />
                  <span className="status-text">Done</span>
                </>
              ) : (
                <>
                  <span className="status-dot idle" />
                  <span className="status-text">Ready to record</span>
                </>
              )}
            </div>
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
                    <span className="preview-value">MK {listingData.price}</span>
                  </div>
                )}
                {listingData.quantity && (
                  <div className="preview-item">
                    <span className="preview-key">Quantity</span>
                    <span className="preview-value">{listingData.quantity} {listingData.unit || 'units'}</span>
                  </div>
                )}
              </div>

              {/* Confidence */}
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

              {/* Warnings */}
              {validation && validation.warnings && validation.warnings.length > 0 && (
                <div className="warning-box">
                  <p className="warning-label">⚠️ Suggestions</p>
                  {validation.warnings.map((warning, index) => (
                    <p key={index} className="warning-item">• {warning}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error/Success */}
          {errorMsg && (
            <div className="error-banner">
              <Icon name="close" size={16} color="#EF4444" strokeWidth={1.75} />
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="success-banner">
              <Icon name="check" size={16} color="#10B981" strokeWidth={2.5} />
              {successMsg}
            </div>
          )}

          {/* Action Buttons */}
          {listingData && !successMsg && (
            <button
              onClick={handleCreateListing}
              className="create-btn"
              disabled={processing || !selectedBusiness}
            >
              {processing ? 'Processing...' : 'Create Listing'}
            </button>
          )}

          {successMsg && createdListingId && (
            <>
              <button className="create-btn success" onClick={() => navigate(`/listing/${createdListingId}`)}>
                View Listing →
              </button>
              <button className="reset-btn" onClick={resetAll}>
                Create Another
              </button>
            </>
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
            <Icon name="sparkles" size={16} color="#F59E0B" strokeWidth={1.75} />
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
              <button key={item.id} className="nav-btn" onClick={() => handleBottomNav(item.id)}>
                <div className={`nav-icon-wrap ${active ? 'active' : ''}`}>
                  <Icon name={item.icon} size={20} color={active ? '#FFFFFF' : '#94A3B8'} strokeWidth={1.75} />
                </div>
                <span className={`nav-label ${active ? 'active' : ''}`}>{item.label}</span>
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

        /* ===== MAIN CONTENT ===== */
        .main-content {
          max-width: 600px;
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
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #F1F5F9;
          margin-bottom: 16px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
        }

        .card-header {
          text-align: center;
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
          font-size: 22px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 4px;
        }

        .card-subtitle {
          font-size: 14px;
          color: #94A3B8;
          margin: 0;
        }

        /* ===== FORM ===== */
        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 4px;
        }

        .required {
          color: #EF4444;
        }

        .form-select {
          width: 100%;
          padding: 10px 14px;
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

        /* ===== LANGUAGE SELECTOR ===== */
        .language-selector {
          display: flex;
          gap: 8px;
        }

        .lang-btn {
          flex: 1;
          padding: 8px 12px;
          border: 2px solid #E2E8F0;
          border-radius: 10px;
          background: #FFFFFF;
          font-size: 14px;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .lang-btn:hover {
          border-color: #94A3B8;
        }

        .lang-btn.active {
          border-color: #F59E0B;
          background: rgba(245, 158, 11, 0.05);
          color: #F59E0B;
        }

        /* ===== RECORD SECTION ===== */
        .record-section {
          text-align: center;
          padding: 16px 0;
        }

        /* ===== SOUND WAVE ===== */
        .sound-wave-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          height: 60px;
          margin-bottom: 16px;
          padding: 0 20px;
        }

        .sound-bar {
          flex: 1;
          max-width: 6px;
          min-height: 4px;
          background: linear-gradient(180deg, #F59E0B, #D97706);
          border-radius: 3px;
          transition: height 0.15s ease;
          opacity: 0.3;
        }

        .sound-bar.active {
          opacity: 1;
        }

        .sound-bar.recording {
          animation: wave-pulse 0.8s ease-in-out infinite;
        }

        @keyframes wave-pulse {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }

        /* ===== RECORD BUTTON ===== */
        .record-btn {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          background: #F1F5F9;
          color: #1E293B;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        }

        .record-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        }

        .record-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .record-btn.recording {
          background: #EF4444;
          color: #FFFFFF;
          animation: pulse 1s infinite;
          box-shadow: 0 4px 24px rgba(239, 68, 68, 0.2);
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }

        .record-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 12px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .status-dot.idle {
          background: #94A3B8;
        }

        .status-dot.recording {
          background: #EF4444;
          animation: blink 0.8s infinite;
        }

        .status-dot.processing {
          background: #F59E0B;
          animation: blink 0.8s infinite;
        }

        .status-dot.done {
          background: #10B981;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .status-text {
          font-size: 14px;
          color: #64748B;
          font-weight: 500;
        }

        /* ===== TRANSCRIPT ===== */
        .transcript-box {
          padding: 14px 16px;
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
          padding: 16px 18px;
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

        .confidence-fill.high { background: #10B981; }
        .confidence-fill.medium { background: #F59E0B; }
        .confidence-fill.low { background: #EF4444; }

        /* ===== WARNINGS ===== */
        .warning-box {
          padding: 12px 14px;
          background: #FEF3C7;
          border-radius: 10px;
          border: 1px solid #FDE68A;
          margin-top: 10px;
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
          background: #1E293B;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #FFFFFF;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          margin-top: 12px;
          min-height: 48px;
        }

        .create-btn:hover:not(:disabled) {
          background: #F59E0B;
          transform: scale(0.98);
        }

        .create-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .create-btn.success {
          background: #10B981;
        }

        .create-btn.success:hover {
          background: #059669;
        }

        .reset-btn {
          width: 100%;
          padding: 10px;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .reset-btn:hover {
          background: #E2E8F0;
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
          border-radius: 12px;
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

        .nav-btn {
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

        .nav-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .nav-icon-wrap.active {
          background: #1E293B;
        }

        .nav-label {
          font-size: 9px;
          font-weight: 500;
          color: #94A3B8;
        }

        .nav-label.active {
          color: #1E293B;
          font-weight: 600;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .main-card {
            padding: 16px;
          }
          .prompts-card {
            padding: 14px 16px;
          }
          .preview-grid {
            grid-template-columns: 1fr;
          }
          .record-btn {
            width: 60px;
            height: 60px;
          }
          .record-btn svg {
            width: 24px;
            height: 24px;
          }
          .card-title {
            font-size: 20px;
          }
          .header-icon {
            width: 40px;
            height: 40px;
          }
          .header-icon svg {
            width: 22px;
            height: 22px;
          }
          .language-selector {
            flex-direction: column;
          }
          .sound-wave-container {
            height: 40px;
            gap: 2px;
          }
          .sound-bar {
            max-width: 4px;
          }
        }

        @media (max-width: 380px) {
          .main-content {
            padding: 12px 12px 32px;
          }
          .main-card {
            padding: 14px;
          }
          .record-btn {
            width: 52px;
            height: 52px;
          }
          .record-btn svg {
            width: 20px;
            height: 20px;
          }
          .card-title {
            font-size: 18px;
          }
          .prompt-btn {
            font-size: 13px;
            padding: 6px 12px;
          }
          .sound-wave-container {
            height: 32px;
            gap: 2px;
          }
        }
      `}</style>
    </div>
  );
};

export default VoiceListing;