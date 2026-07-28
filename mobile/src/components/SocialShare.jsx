import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
  whatsapp: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5zM16 12v1.5M12 12v1.5M8 12v1.5",
  facebook: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
  twitter: "M4 4l11.733 16h4.267l-11.733 -16zM4 20l6.768 -6.768M19 4l-6.768 6.768",
  tiktok: "M9 12a4 4 0 100 8 4 4 0 000-8zm0 0V2h5a4 4 0 004 4v4a8 8 0 00-4-4v6a4 4 0 01-4 4z",
  copy: "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z",
  share: "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13",
  check: "M20 6L9 17l-5-5"
};

const SocialShare = ({ 
  title, 
  url, 
  description = '', 
  category = '',
  onShare,
  showLabel = true,
  compact = false 
}) => {
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = url || window.location.href;
  const shareTitle = title || 'Check this out on MsikaAI';
  const shareDescription = description || '';

  const handleShare = async (platform) => {
    setSharing(true);

    try {
      let shareUrl = '';
      const message = `${shareTitle}\n${shareDescription}\n\nView: ${fullUrl}`;

      switch (platform) {
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}&quote=${encodeURIComponent(shareTitle)}`;
          break;
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(fullUrl)}`;
          break;
        case 'tiktok':
          shareUrl = `https://www.tiktok.com/share/video?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareTitle)}`;
          break;
        case 'copy':
          await navigator.clipboard.writeText(`${shareTitle}\n${fullUrl}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
          setSharing(false);
          return;
        default:
          setSharing(false);
          return;
      }

      if (shareUrl) {
        window.open(shareUrl, '_blank');
        onShare?.(platform);
      }
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setSharing(false);
    }
  };

  const shareButtons = [
    { platform: 'whatsapp', label: 'WhatsApp', color: '#25D366', icon: ICONS.whatsapp },
    { platform: 'facebook', label: 'Facebook', color: '#1877F2', icon: ICONS.facebook },
    { platform: 'twitter', label: 'Twitter', color: '#000000', icon: ICONS.twitter },
    { platform: 'tiktok', label: 'TikTok', color: '#000000', icon: ICONS.tiktok },
    { platform: 'copy', label: copied ? 'Copied!' : 'Copy Link', color: '#64748b', icon: copied ? ICONS.check : ICONS.copy }
  ];

  const styles = {
    container: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: compact ? '6px' : '8px',
      marginTop: compact ? '8px' : '12px'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: compact ? '4px' : '6px',
      padding: compact ? '6px 12px' : '8px 14px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: compact ? '12px' : '13px',
      fontWeight: '600',
      color: '#ffffff',
      transition: 'opacity 0.2s, transform 0.2s'
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  };

  return (
    <div style={styles.container}>
      {shareButtons.map(({ platform, label, color, icon }) => (
        <button
          key={platform}
          onClick={() => handleShare(platform)}
          disabled={sharing}
          style={{
            ...styles.button,
            ...(sharing ? styles.buttonDisabled : {}),
            backgroundColor: color
          }}
          onMouseEnter={(e) => {
            if (!sharing) e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <SketchIcon d={icon} size={compact ? 14 : 16} color="#ffffff" strokeWidth={2} />
          {showLabel && <span>{label}</span>}
        </button>
      ))}
    </div>
  );
};

export default SocialShare;