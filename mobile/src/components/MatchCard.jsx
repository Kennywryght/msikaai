// mobile/src/components/MatchCard.jsx
import React from 'react';
import { MapPin, Tag, Clock, Phone, Users, Sparkles } from 'lucide-react';

const MatchCard = ({ need, showContact = false }) => {
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getUrgencyEmoji = (urgency) => {
    switch (urgency) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '💤';
      default: return '📌';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Title */}
          <h4 className="font-semibold text-gray-900 text-base">
            {need.title}
          </h4>
          
          {/* Description */}
          {need.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {need.description}
            </p>
          )}
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-2">
            {need.category && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-100">
                <Tag className="w-3 h-3" />
                {need.category}
              </span>
            )}
            {need.location && (
              <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2.5 py-0.5 rounded-full border border-purple-100">
                <MapPin className="w-3 h-3" />
                {need.location}
              </span>
            )}
            {need.urgency && (
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border ${getUrgencyColor(need.urgency)}`}>
                <span>{getUrgencyEmoji(need.urgency)}</span>
                {need.urgency} urgency
              </span>
            )}
          </div>

          {/* Budget */}
          {(need.budget_min || need.budget_max) && (
            <div className="text-sm text-gray-500 mt-2">
              💰 Budget: {need.budget_min ? `MWK ${need.budget_min.toLocaleString()}` : 'Any'} 
              {need.budget_max ? ` - MWK ${need.budget_max.toLocaleString()}` : ''}
            </div>
          )}

          {/* User Info */}
          {need.profiles && (
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {need.profiles.full_name || 'Anonymous Buyer'}
              </span>
              {showContact && need.profiles.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4 text-green-600" />
                  <a 
                    href={`tel:${need.profiles.phone}`} 
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    Contact
                  </a>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Match Score (if available) */}
        {need.matchScore && (
          <div className="flex flex-col items-center ml-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {need.matchScore}%
            </div>
            <span className="text-xs text-gray-400 mt-1">Match</span>
          </div>
        )}

        {/* Posted time */}
        {need.created_at && (
          <div className="text-xs text-gray-400 mt-1">
            {new Date(need.created_at).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <button 
          className="flex-1 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          onClick={() => window.location.href = `/search?q=${encodeURIComponent(need.title)}`}
        >
          Find Matching Products
        </button>
        {showContact && need.profiles?.phone && (
          <a 
            href={`https://wa.me/${need.profiles.phone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium text-center"
          >
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
};

export default MatchCard;