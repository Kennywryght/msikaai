// mobile/src/components/SmartMatch.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { matchingAPI } from '../services/api';
import { Sparkles, Users, MapPin, Tag, Clock, Phone } from 'lucide-react';

const SmartMatch = ({ businessId, category, location }) => {
  const { user } = useAuth();
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNeeds, setShowNeeds] = useState(false);

  useEffect(() => {
    if (businessId) {
      fetchBusinessNeeds();
    }
  }, [businessId]);

  const fetchBusinessNeeds = async () => {
    try {
      const response = await matchingAPI.getBusinessNeeds(businessId, { limit: 10 });
      setNeeds(response.data.needs || []);
    } catch (error) {
      console.error('Error fetching needs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  if (loading) return null;
  if (needs.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden mb-6">
      <div 
        className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 cursor-pointer flex justify-between items-center"
        onClick={() => setShowNeeds(!showNeeds)}
      >
        <div className="flex items-center gap-3 text-white">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">
            {needs.length} {needs.length === 1 ? 'Potential Customer' : 'Potential Customers'} Looking for Your Products
          </span>
        </div>
        <span className="text-white/80 text-sm">
          {showNeeds ? 'Hide' : 'View'}
        </span>
      </div>

      {showNeeds && (
        <div className="p-4 divide-y divide-gray-100">
          {needs.map((need) => (
            <div key={need.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{need.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{need.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      <Tag className="w-3 h-3" />
                      {need.category}
                    </span>
                    {need.location && (
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        <MapPin className="w-3 h-3" />
                        {need.location}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${getUrgencyColor(need.urgency)}`}>
                      <Clock className="w-3 h-3" />
                      {need.urgency} urgency
                    </span>
                  </div>

                  {need.budget_min || need.budget_max && (
                    <div className="text-sm text-gray-500 mt-1">
                      Budget: {need.budget_min ? `MWK ${need.budget_min.toLocaleString()}` : 'Any'} 
                      {need.budget_max ? ` - MWK ${need.budget_max.toLocaleString()}` : ''}
                    </div>
                  )}

                  {need.profiles && (
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {need.profiles.full_name || 'Anonymous'}
                      </span>
                      {need.profiles.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {need.profiles.phone}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartMatch;