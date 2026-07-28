import React, { useState, useEffect } from 'react';

const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const [location, setLocation] = useState(initialLocation || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getCurrentLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const loc = { lat: latitude, lng: longitude };
        setLocation(loc);
        onLocationSelect(loc);
        setLoading(false);
      },
      (err) => {
        setError('Unable to retrieve your location: ' + err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Styles
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const buttonStyle = {
    padding: '10px 16px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  };

  const buttonDisabledStyle = {
    ...buttonStyle,
    opacity: 0.5,
    cursor: 'not-allowed'
  };

  const locationDisplayStyle = {
    padding: '8px 12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#374151'
  };

  const errorStyle = {
    color: '#dc2626',
    fontSize: '14px'
  };

  return (
    <div style={containerStyle}>
      <button
        onClick={getCurrentLocation}
        disabled={loading}
        style={loading ? buttonDisabledStyle : buttonStyle}
      >
        {loading ? 'Finding location...' : '📍 Use Current Location'}
      </button>

      {location && (
        <div style={locationDisplayStyle}>
          📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>
      )}

      {error && <div style={errorStyle}>{error}</div>}
    </div>
  );
};

export default LocationPicker;