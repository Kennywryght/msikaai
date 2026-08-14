// mobile/src/pages/VoiceListing.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { voiceAPI, businessAPI } from '../services/api';
import SocialShare from '../components/SocialShare';

// --- HAND-DRAWN STYLE INLINE SVG ICONS ---
const SketchIcon = ({ d, size = 20, color = 'currentColor', strokeWidth = 2 }) => (
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
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  mic: "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8",
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  check: "M20 6L9 17l-5-5",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"
};

const VoiceListing = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [listingData, setListingData] = useState(null);
  const [createdListingId, setCreatedListingId] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [language, setLanguage] = useState('ny');
  const [samplePrompts, setSamplePrompts] = useState([]);
  const [validation, setValidation] = useState(null);
  
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  useEffect(() => {
    fetchBusinesses();
    fetchSamplePrompts();
  }, [user, language]);

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
      setError('');
      setTranscript('Recording...');
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access.');
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
            setError('Please review: ' + validationErrors.join(', '));
          }
        }
      } else {
        setError(response.data.error || 'Failed to process voice');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process voice');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateListing = async () => {
    if (!selectedBusiness || !listingData) {
      setError('Please select a business and record a listing');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const response = await voiceAPI.createListing({
        businessId: selectedBusiness,
        userId: user.id,
        language: language,
        listingData: listingData,
        transcript: transcript
      });

      if (response.data.success) {
        setSuccess('🎉 Listing created successfully!');
        setCreatedListingId(response.data.listing?.id);
        setListingData(response.data.listing || listingData);
        setValidation(response.data.validation);
      } else {
        setError(response.data.error || 'Failed to create listing');
      }
    } catch (err) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setProcessing(false);
    }
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '24px 16px',
      maxWidth: '800px',
      margin: '0 auto'
    },
    backButton: {
      padding: '8px 16px',
      backgroundColor: '#ffffff',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#334155',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '16px',
      transition: 'all 0.2s'
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '16px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    },
    title: {
      fontSize: '22px',
      fontWeight: '800',
      color: '#0f172a',
      margin: '0 0 4px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#64748b',
      margin: '0 0 20px 0'
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      color: '#334155',
      marginBottom: '4px'
    },
    select: {
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#0f172a',
      boxSizing: 'border-box',
      outline: 'none',
      backgroundColor: '#ffffff',
      fontFamily: 'inherit',
      transition: 'border-color 0.2s'
    },
    recordContainer: {
      textAlign: 'center',
      margin: '20px 0'
    },
    recordBtn: {
      padding: '16px',
      border: 'none',
      borderRadius: '50%',
      fontSize: '28px',
      cursor: 'pointer',
      width: '80px',
      height: '80px',
      backgroundColor: '#2563eb',
      color: 'white',
      transition: 'all 0.2s'
    },
    recordBtnRecording: {
      padding: '16px',
      border: 'none',
      borderRadius: '50%',
      fontSize: '28px',
      cursor: 'pointer',
      width: '80px',
      height: '80px',
      backgroundColor: '#dc2626',
      color: 'white',
      animation: 'pulse 1s infinite'
    },
    recordBtnDisabled: {
      padding: '16px',
      border: 'none',
      borderRadius: '50%',
      fontSize: '28px',
      cursor: 'not-allowed',
      width: '80px',
      height: '80px',
      backgroundColor: '#93c5fd',
      color: 'white',
      opacity: 0.5
    },
    recordLabel: {
      marginTop: '8px',
      color: '#64748b',
      fontSize: '14px',
      fontWeight: '500'
    },
    transcriptBox: {
      padding: '12px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      marginTop: '12px',
      border: '1px solid #e2e8f0'
    },
    transcriptLabel: {
      fontWeight: '600',
      marginBottom: '4px',
      fontSize: '13px',
      color: '#334155'
    },
    transcriptText: {
      color: '#1e293b',
      margin: 0,
      fontSize: '14px',
      lineHeight: '1.6'
    },
    preview: {
      padding: '12px',
      backgroundColor: '#dbeafe',
      borderRadius: '8px',
      marginTop: '12px',
      border: '1px solid #bfdbfe'
    },
    previewLabel: {
      fontWeight: '600',
      marginBottom: '4px',
      fontSize: '13px',
      color: '#1e40af'
    },
    previewItem: {
      fontSize: '14px',
      color: '#1e293b',
      margin: '2px 0'
    },
    error: {
      color: '#dc2626',
      padding: '12px',
      backgroundColor: '#fef2f2',
      borderRadius: '8px',
      border: '1px solid #fecaca',
      marginTop: '12px'
    },
    success: {
      color: '#16a34a',
      padding: '12px',
      backgroundColor: '#ecfdf5',
      borderRadius: '8px',
      border: '1px solid #a7f3d0',
      marginTop: '12px'
    },
    validationBox: {
      padding: '12px',
      backgroundColor: '#fef3c7',
      borderRadius: '8px',
      marginTop: '12px',
      border: '1px solid #fde68a'
    },
    validationLabel: {
      fontWeight: '600',
      marginBottom: '4px',
      fontSize: '13px',
      color: '#92400e'
    },
    validationItem: {
      fontSize: '13px',
      color: '#78350f',
      margin: '2px 0'
    },
    createBtn: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#16a34a',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '12px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'background-color 0.2s'
    },
    createBtnDisabled: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#86efac',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'not-allowed',
      marginTop: '12px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    prompts: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginTop: '8px'
    },
    promptBtn: {
      padding: '10px 14px',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: '14px',
      color: '#334155',
      transition: 'background-color 0.2s',
      fontFamily: 'inherit'
    },
    promptSectionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    shareSection: {
      marginTop: '16px',
      paddingTop: '16px',
      borderTop: '1px solid #e2e8f0'
    },
    shareLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '8px'
    },
    confidenceBar: {
      width: '100%',
      height: '4px',
      backgroundColor: '#e2e8f0',
      borderRadius: '2px',
      marginTop: '8px',
      overflow: 'hidden'
    },
    confidenceFill: {
      height: '100%',
      borderRadius: '2px',
      transition: 'width 0.5s ease'
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      
      <button 
        onClick={() => navigate('/dashboard')} 
        style={styles.backButton}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
      >
        <SketchIcon d={ICONS.arrowRight} size={16} color="#64748b" strokeWidth={2.5} />
        Back to Dashboard
      </button>

      <div style={styles.card}>
        <h2 style={styles.title}>
          <SketchIcon d={ICONS.mic} size={24} color="#ec4899" strokeWidth={2} />
          Voice Listing
        </h2>
        <p style={styles.subtitle}>Speak to create a listing in Chichewa or English</p>

        {/* Language Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={styles.label}>Language</label>
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              fetchSamplePrompts();
            }}
            style={styles.select}
          >
            <option value="ny">Chichewa</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Business Selector */}
        {businesses.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>
              <SketchIcon d={ICONS.store} size={14} color="#64748b" strokeWidth={2} />
              <span style={{ marginLeft: '4px' }}>Business</span>
              <span style={{ color: '#dc2626' }}> *</span>
            </label>
            <select
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              style={styles.select}
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
        <div style={styles.recordContainer}>
          <button
            onClick={recording ? stopRecording : startRecording}
            style={
              !selectedBusiness || processing
                ? styles.recordBtnDisabled
                : recording
                ? styles.recordBtnRecording
                : styles.recordBtn
            }
            disabled={!selectedBusiness || processing}
          >
            {recording ? '⏹️' : '🎙️'}
          </button>
          <p style={styles.recordLabel}>
            {recording ? 'Recording... Click to stop' : 'Click to start recording'}
          </p>
        </div>

        {/* Transcript */}
        {transcript && (
          <div style={styles.transcriptBox}>
            <p style={styles.transcriptLabel}>📝 Transcript:</p>
            <p style={styles.transcriptText}>{transcript}</p>
          </div>
        )}

        {/* Listing Preview */}
        {listingData && (
          <div style={styles.preview}>
            <p style={styles.previewLabel}>📋 Extracted Listing:</p>
            <p style={styles.previewItem}><strong>Title:</strong> {listingData.title || 'Untitled'}</p>
            <p style={styles.previewItem}><strong>Category:</strong> {listingData.category}</p>
            {listingData.price && (
              <p style={styles.previewItem}><strong>Price:</strong> MWK {listingData.price}</p>
            )}
            {listingData.quantity && (
              <p style={styles.previewItem}><strong>Quantity:</strong> {listingData.quantity} {listingData.unit || 'units'}</p>
            )}
            {listingData.deliveryAvailable && (
              <p style={styles.previewItem}><strong>Delivery:</strong> Available</p>
            )}
            
            {/* Confidence Bar */}
            {validation && validation.confidence && (
              <div style={{ marginTop: '8px' }}>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
                  Confidence: {Math.round(validation.confidence * 100)}%
                </p>
                <div style={styles.confidenceBar}>
                  <div style={{
                    ...styles.confidenceFill,
                    width: `${validation.confidence * 100}%`,
                    backgroundColor: validation.confidence > 0.7 ? '#22c55e' : validation.confidence > 0.4 ? '#f59e0b' : '#ef4444'
                  }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Validation Warnings */}
        {validation && validation.warnings && validation.warnings.length > 0 && (
          <div style={styles.validationBox}>
            <p style={styles.validationLabel}>⚠️ Suggestions:</p>
            {validation.warnings.map((warning, index) => (
              <p key={index} style={styles.validationItem}>• {warning}</p>
            ))}
          </div>
        )}

        {/* Error/Success */}
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        {/* Create Listing Button */}
        {listingData && !success && (
          <button
            onClick={handleCreateListing}
            disabled={processing || !selectedBusiness}
            style={processing || !selectedBusiness ? styles.createBtnDisabled : styles.createBtn}
            onMouseEnter={(e) => {
              if (!processing && selectedBusiness) e.currentTarget.style.backgroundColor = '#15803d';
            }}
            onMouseLeave={(e) => {
              if (!processing && selectedBusiness) e.currentTarget.style.backgroundColor = '#16a34a';
            }}
          >
            <SketchIcon d={ICONS.check} size={18} color="#ffffff" strokeWidth={2} />
            {processing ? 'Processing...' : 'Create Listing'}
          </button>
        )}

        {/* Share Section - Show after successful creation */}
        {success && createdListingId && (
          <div style={styles.shareSection}>
            <p style={styles.shareLabel}>📤 Share Your Listing</p>
            <SocialShare 
              title={listingData?.title || 'New Listing on MsikaAI'}
              description={listingData?.description || ''}
              url={`${window.location.origin}/listing/${createdListingId}`}
            />
          </div>
        )}
      </div>

      {/* Sample Prompts */}
      <div style={styles.card}>
        <h3 style={styles.promptSectionTitle}>
          <SketchIcon d={ICONS.sparkles} size={16} color="#f59e0b" strokeWidth={2} />
          Sample {language === 'ny' ? 'Chichewa' : 'English'} Prompts
        </h3>
        <div style={styles.prompts}>
          {samplePrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => {
                setTranscript(prompt);
                // Simulate processing
                setProcessing(true);
                setTimeout(() => {
                  // Extract listing data from prompt
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
              style={styles.promptBtn}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceListing;