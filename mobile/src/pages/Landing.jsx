// mobile/src/pages/Landing.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, businessAPI, notificationsAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    menu: "M4 6h16M4 12h16M4 18h16",
    close: "M6 18L18 6M6 6l12 12",
    arrowRight: "M5 12h14M12 5l7 7-7 7",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z",
    truck: "M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
    clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
    check: "M20 6L9 17l-5-5",
    sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
    reply: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    wheat: "M12 22V8M12 8c0-3 2-5 5-5-1 3-2 5-5 5zM12 8c0-3-2-5-5-5 1 3 2 5 5 5zM12 14c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4zM12 14c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4z",
    hammer: "M14.5 4.5l5 5L17 12l-5-5 2.5-2.5zM3 21l7.5-7.5M13 8L6 15l-1 4 4-1 7-7",
    wrench: "M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4z",
    bag: "M6 2l1.5 5M18 2l-1.5 5M4 7h16l-1.5 13a2 2 0 01-2 1.8H7.5a2 2 0 01-2-1.8L4 7zM9 11v3M15 11v3",
    coffee: "M8 3v3m4-3v3m4-3v3M4 14h16a2 2 0 002-2v-1a2 2 0 00-2-2H4a2 2 0 00-2 2v1a2 2 0 002 2zm0 0v4a4 4 0 004 4h8a4 4 0 004-4v-4",
    shirt: "M16 3l4 4-3 3-2-2v13H9V8L7 10 4 7l4-4 2 2h4l2-2z",
    tool: "M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4z",
    layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    refresh: "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15",
    bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
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
// CATEGORIES WITH LUCIDE ICONS
// ============================================================
const CATEGORIES = [
  { label: 'All', icon: 'layers' },
  { label: 'Food', icon: 'coffee' },
  { label: 'Clothing', icon: 'shirt' },
  { label: 'Services', icon: 'wrench' },
  { label: 'Farm Inputs', icon: 'wheat' },
  { label: 'Hardware', icon: 'hammer' },
];

// ============================================================
// BOARD ITEMS
// ============================================================
const BOARD_ITEMS = [
  { label: 'Tomatoes', price: 'MK500-700', emoji: '🍅', color: '#F59E0B' },
  { label: 'Maize', price: 'MK350', emoji: '🌽', color: '#10B981' },
  { label: 'Onions', price: 'MK800', emoji: '🧅', color: '#8B5CF6' },
  { label: 'Cabbage', price: 'MK400', emoji: '🥬', color: '#3B82F6' },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const Landing = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast, success } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const [likedItems, setLikedItems] = useState({});
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});
  const [replyTo, setReplyTo] = useState({});
  const [replyText, setReplyText] = useState({});
  const [commentText, setCommentText] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  
  const searchInputRef = useRef(null);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load comments from localStorage
  useEffect(() => {
    const savedComments = localStorage.getItem('listingComments');
    if (savedComments) {
      try {
        setComments(JSON.parse(savedComments));
      } catch (e) {
        console.error('Error loading comments:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (Object.keys(comments).length > 0) {
      localStorage.setItem('listingComments', JSON.stringify(comments));
    }
  }, [comments]);

  const handleLike = (itemId) => {
    setLikedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleAddComment = (itemId) => {
    const text = commentText[itemId]?.trim();
    if (!text) return;

    const newComment = {
      id: Date.now().toString(),
      user: user?.email?.split('@')[0] || 'Anonymous',
      userId: user?.id || 'unknown',
      text: text,
      timestamp: Date.now(),
      replies: [],
    };

    setComments(prev => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), newComment]
    }));

    setCommentText(prev => ({ ...prev, [itemId]: '' }));
    success('💬 Comment added!');

    const listing = allListings.find(l => l.id === itemId);
    if (listing && listing.businesses?.id && listing.businesses.id !== user?.id) {
      sendNotification(listing.businesses.id, 'comment', `New comment on "${listing.title}"`);
    }
  };

  const handleAddReply = (itemId, commentId) => {
    const text = replyText[`${itemId}-${commentId}`]?.trim();
    if (!text) return;

    const newReply = {
      id: Date.now().toString(),
      user: user?.email?.split('@')[0] || 'Anonymous',
      userId: user?.id || 'unknown',
      text: text,
      timestamp: Date.now(),
    };

    setComments(prev => ({
      ...prev,
      [itemId]: prev[itemId].map(c => 
        c.id === commentId 
          ? { ...c, replies: [...(c.replies || []), newReply] }
          : c
      )
    }));

    setReplyText(prev => ({ ...prev, [`${itemId}-${commentId}`]: '' }));
    setReplyTo(prev => ({ ...prev, [`${itemId}-${commentId}`]: false }));
    success('💬 Reply added!');

    const comment = comments[itemId]?.find(c => c.id === commentId);
    if (comment && comment.userId !== user?.id) {
      sendNotification(comment.userId, 'reply', `Someone replied to your comment`);
    }
  };

  const toggleComments = (itemId) => {
    setShowComments(prev => ({ 
      ...prev, 
      [itemId]: !prev[itemId] 
    }));
  };

  const toggleReply = (itemId, commentId) => {
    const key = `${itemId}-${commentId}`;
    setReplyTo(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sendNotification = async (recipientId, type, message) => {
    try {
      await notificationsAPI.create({
        userId: recipientId,
        type: type,
        title: type === 'comment' ? 'New Comment' : 'New Reply',
        description: message,
        read: false,
      });
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [listingsRes, bizResponse] = await Promise.all([
          listingsAPI.search({ limit: 50 }),
          businessAPI.getAll({ limit: 20 }).catch(() => ({ data: { businesses: [] } }))
        ]);
        
        if (!mounted) return;
        
        let listingsData = listingsRes.data?.listings || [];
        
        if (listingsData.length === 0 && bizResponse.data?.businesses?.length > 0) {
          listingsData = bizResponse.data.businesses.map((b) => ({
            id: `biz-${b.id}`,
            title: b.business_name,
            description: b.description || 'Business in Mitundu',
            category: b.category,
            price: null,
            images: b.logo_url ? [b.logo_url] : [],
            businesses: { business_name: b.business_name, id: b.id },
            created_at: b.created_at,
            is_business: true,
            location_area: b.location_text || 'Mitundu Trading Centre',
            delivery_available: b.delivery_available || false,
            business_id: b.id,
            likes: Math.floor(Math.random() * 20),
            comments_count: Math.floor(Math.random() * 5),
          }));
        }
        
        listingsData = listingsData.map(item => ({
          ...item,
          likes: item.likes || Math.floor(Math.random() * 15),
          comments_count: item.comments_count || Math.floor(Math.random() * 5),
        }));
        
        if (mounted) setAllListings(listingsData);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchData();
    return () => { mounted = false; };
  }, []);

  const filteredListings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const isService = (item) => {
      const serviceCategories = ['Plumber', 'Electrician', 'Carpenter', 'Mechanic', 'Tailor', 'Hairdresser', 'Services'];
      return serviceCategories.some(cat => item.category?.toLowerCase().includes(cat.toLowerCase()));
    };

    return allListings.filter((item) => {
      const categoryMatch = selectedCategory === 'All' || 
        item.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      const searchMatch = !query ||
        item.title?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.businesses?.business_name?.toLowerCase().includes(query);
      
      let tabMatch = true;
      if (activeTab === 'goods') tabMatch = !isService(item);
      else if (activeTab === 'services') tabMatch = isService(item);
      
      return categoryMatch && searchMatch && tabMatch;
    });
  }, [allListings, selectedCategory, searchQuery, activeTab]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [searchQuery, navigate]);

  const handleListingClick = useCallback((item) => {
    if (item.is_business) {
      navigate(`/search?q=${encodeURIComponent(item.title)}`);
    } else {
      navigate(`/listing/${item.id}`);
    }
  }, [navigate]);

  const formatPrice = useCallback((price) => {
    if (!price) return 'Price on request';
    return `MK ${Number(price).toLocaleString()}`;
  }, []);

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  const getTotalCommentCount = (itemId) => {
    const itemComments = comments[itemId] || [];
    let count = itemComments.length;
    itemComments.forEach(c => {
      count += (c.replies || []).length;
    });
    return count;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  if (loading) {
    return (
      <div className="loading-skeleton">
        <div className="skeleton-hero" />
        <div className="skeleton-categories">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-chip" />)}
        </div>
        <div className="skeleton-board" />
        <div className="skeleton-feed">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-card" />)}
        </div>
        <style jsx>{`
          .loading-skeleton {
            min-height: 100vh;
            background: #F8FAFC;
            padding: 16px;
            padding-bottom: 80px;
          }
          .skeleton-hero {
            height: 120px;
            background: #E2E8F0;
            border-radius: 16px;
            margin-bottom: 16px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          .skeleton-categories {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
          }
          .skeleton-chip {
            width: 70px;
            height: 32px;
            background: #E2E8F0;
            border-radius: 16px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          .skeleton-board {
            height: 80px;
            background: #E2E8F0;
            border-radius: 16px;
            margin-bottom: 16px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          .skeleton-feed {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .skeleton-card {
            height: 80px;
            background: #E2E8F0;
            border-radius: 12px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ===== HERO / SEARCH ===== */}
      <header className="header">
        <div className="header-content">
          <div className="hero">
            <h1 className="hero-title">
              Find what you need,<br />
              <span className="hero-highlight">right here.</span>
            </h1>
            <p className="hero-desc">Local products, services, and tradespeople in Mitundu</p>
            
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-wrapper">
                <Icon name="search" size={18} color="#94A3B8" strokeWidth={1.75} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search Mitundu marketplace..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-btn">
                  <Icon name="search" size={16} color="#FFFFFF" strokeWidth={2} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* ===== CATEGORIES ===== */}
      <div className="categories-section">
        <div className="categories-scroll">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                className={`category-chip ${active ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.label)}
              >
                <Icon name={cat.icon} size={14} color={active ? '#F59E0B' : '#94A3B8'} strokeWidth={1.75} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== BOARD ===== */}
      <div className="board-section">
        <div className="board-header">
          <div className="board-title-wrap">
            <Icon name="sparkles" size={16} color="#F59E0B" strokeWidth={1.75} />
            <h3 className="board-title">Today's Board</h3>
          </div>
          <span className="board-time">Updated 7:40am</span>
        </div>
        <div className="board-grid">
          {BOARD_ITEMS.map((item, index) => (
            <div key={index} className="board-item" style={{ borderColor: item.color }}>
              <span className="board-emoji">{item.emoji}</span>
              <div className="board-info">
                <span className="board-label">{item.label}</span>
                <span className="board-price" style={{ color: item.color }}>{item.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="tabs-section">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Icon name="layers" size={14} color={activeTab === 'all' ? '#F59E0B' : '#94A3B8'} strokeWidth={1.75} />
          All
        </button>
        <button 
          className={`tab-btn ${activeTab === 'goods' ? 'active' : ''}`}
          onClick={() => setActiveTab('goods')}
        >
          <Icon name="store" size={14} color={activeTab === 'goods' ? '#F59E0B' : '#94A3B8'} strokeWidth={1.75} />
          Goods
        </button>
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Icon name="wrench" size={14} color={activeTab === 'services' ? '#F59E0B' : '#94A3B8'} strokeWidth={1.75} />
          Services
        </button>
      </div>

      {/* ===== LISTINGS ===== */}
      <section className="listings">
        <div className="listings-header">
          <div className="listings-header-left">
            <h2 className="listings-title">Recent</h2>
            <span className="listings-count">{filteredListings.length}</span>
          </div>
          <button className="filter-btn" onClick={() => {}}>
            <Icon name="filter" size={16} color="#94A3B8" strokeWidth={1.75} />
          </button>
        </div>

        <div className="listings-feed">
          {filteredListings.length > 0 ? (
            filteredListings.map((item) => {
              const isLiked = likedItems[item.id] || false;
              const itemComments = comments[item.id] || [];
              const showCommentsForItem = showComments[item.id] || false;
              const totalComments = getTotalCommentCount(item.id);

              return (
                <div key={item.id} className="feed-card">
                  <div className="feed-card-main" onClick={() => handleListingClick(item)}>
                    <div className="feed-image">
                      {item.images && item.images.length > 0 ? (
                        <img src={item.images[0]} alt={item.title} className="feed-img" loading="lazy" />
                      ) : (
                        <div className="feed-placeholder">
                          <Icon name="store" size={24} color="#CBD5E1" strokeWidth={1.5} />
                        </div>
                      )}
                      {item.delivery_available && (
                        <span className="feed-delivery">
                          <Icon name="truck" size={8} color="#FFF" strokeWidth={2} />
                        </span>
                      )}
                    </div>
                    <div className="feed-content">
                      <div className="feed-top">
                        <h3 className="feed-title">{item.title}</h3>
                        <span className="feed-price">{formatPrice(item.price)}</span>
                      </div>
                      <div className="feed-meta">
                        <span className="feed-seller">
                          <Icon name="user" size={10} color="#94A3B8" strokeWidth={1.75} />
                          {item.businesses?.business_name || 'Local seller'}
                        </span>
                        <span className="feed-rating">
                          <Icon name="star" size={10} color="#F59E0B" strokeWidth={2} />
                          4.8
                        </span>
                        <span className="feed-location">
                          <Icon name="mapPin" size={10} color="#94A3B8" strokeWidth={1.75} />
                          {item.location_area || 'Near you'}
                        </span>
                      </div>
                      <div className="feed-actions">
                        <button 
                          className="action-btn like-btn"
                          onClick={(e) => { e.stopPropagation(); handleLike(item.id); }}
                        >
                          <Icon 
                            name="heart" 
                            size={14} 
                            color={isLiked ? '#EF4444' : '#94A3B8'} 
                            strokeWidth={isLiked ? 2.5 : 1.5}
                          />
                          <span>{item.likes + (isLiked ? 1 : 0)}</span>
                        </button>
                        <button 
                          className="action-btn comment-btn"
                          onClick={(e) => { e.stopPropagation(); toggleComments(item.id); }}
                        >
                          <Icon name="message" size={14} color="#94A3B8" strokeWidth={1.75} />
                          <span>{item.comments_count + totalComments}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  {showCommentsForItem && (
                    <div className="feed-comments" onClick={(e) => e.stopPropagation()}>
                      <div className="comment-input-wrap">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentText[item.id] || ''}
                          onChange={(e) => setCommentText(prev => ({ ...prev, [item.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(item.id); }}
                          className="comment-input"
                        />
                        <button 
                          className="comment-send"
                          onClick={() => handleAddComment(item.id)}
                        >
                          <Icon name="send" size={14} color="#FFFFFF" strokeWidth={2} />
                        </button>
                      </div>

                      <div className="comment-list">
                        {itemComments.length === 0 ? (
                          <p className="no-comments">No comments yet</p>
                        ) : (
                          itemComments.map((comment) => (
                            <div key={comment.id} className="comment-item">
                              <div className="comment-head">
                                <span className="comment-user">{comment.user}</span>
                                <span className="comment-time">{formatTime(comment.timestamp)}</span>
                              </div>
                              <p className="comment-text">{comment.text}</p>
                              <button 
                                className="reply-trigger"
                                onClick={() => toggleReply(item.id, comment.id)}
                              >
                                <Icon name="reply" size={10} color="#94A3B8" strokeWidth={1.75} />
                                Reply
                              </button>

                              {replyTo[`${item.id}-${comment.id}`] && (
                                <div className="reply-input-wrap">
                                  <input
                                    type="text"
                                    placeholder={`Reply to ${comment.user}...`}
                                    value={replyText[`${item.id}-${comment.id}`] || ''}
                                    onChange={(e) => setReplyText(prev => ({ 
                                      ...prev, 
                                      [`${item.id}-${comment.id}`]: e.target.value 
                                    }))}
                                    onKeyDown={(e) => { 
                                      if (e.key === 'Enter') handleAddReply(item.id, comment.id); 
                                    }}
                                    className="reply-input"
                                  />
                                  <button 
                                    className="reply-send"
                                    onClick={() => handleAddReply(item.id, comment.id)}
                                  >
                                    <Icon name="send" size={12} color="#FFFFFF" strokeWidth={2} />
                                  </button>
                                </div>
                              )}

                              {(comment.replies || []).length > 0 && (
                                <div className="replies">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id} className="reply-item">
                                      <div className="reply-head">
                                        <span className="reply-user">{reply.user}</span>
                                        <span className="reply-time">{formatTime(reply.timestamp)}</span>
                                      </div>
                                      <p className="reply-text">{reply.text}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <Icon name="store" size={48} color="#CBD5E1" strokeWidth={1.5} />
              <h3 className="empty-title">No listings found</h3>
              <p className="empty-desc">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== BOTTOM NAV ===== */}
      {isMobile && (
        <div className="bottom-nav">
          {[
            { id: 'home', label: 'Home', icon: 'home' },
            { id: 'search', label: 'Search', icon: 'search' },
            { id: 'sell', label: 'Sell', icon: 'plus' },
            { id: 'messages', label: 'Chat', icon: 'message' },
            { id: 'profile', label: 'Profile', icon: 'user' },
          ].map((item) => {
            const active = item.id === 'home';
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
        .app {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 80px;
        }

        @media (min-width: 769px) {
          .app { padding-bottom: 0; }
        }

        /* ===== HEADER / HERO ===== */
        .header {
          background: #FFFFFF;
          padding: 16px 16px 0;
          border-bottom: 1px solid #F1F5F9;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero {
          padding: 4px 0 20px;
        }

        .hero-title {
          font-size: clamp(24px, 3.5vw, 32px);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0 0 4px;
          line-height: 1.2;
        }

        .hero-highlight {
          color: #F59E0B;
        }

        .hero-desc {
          font-size: 14px;
          color: #94A3B8;
          margin: 0 0 16px;
        }

        /* ===== SEARCH ===== */
        .search-form {
          max-width: 500px;
        }

        .search-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #F1F5F9;
          border-radius: 12px;
          padding: 4px 4px 4px 14px;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .search-wrapper:focus-within {
          border-color: #F59E0B;
          background: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(245,158,11,0.08);
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          padding: 10px 0;
          font-size: 15px;
          font-family: inherit;
          color: #1E293B;
        }

        .search-input::placeholder {
          color: #94A3B8;
        }

        .search-btn {
          padding: 8px 14px;
          background: #1E293B;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .search-btn:hover {
          background: #F59E0B;
        }

        /* ===== CATEGORIES ===== */
        .categories-section {
          padding: 12px 16px;
          background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
        }

        .categories-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .categories-scroll::-webkit-scrollbar {
          display: none;
        }

        .category-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          background: #F8FAFC;
          border: 1px solid #F1F5F9;
          font-size: 12px;
          font-weight: 500;
          color: #94A3B8;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          font-family: inherit;
        }

        .category-chip:hover {
          background: #F1F5F9;
        }

        .category-chip.active {
          background: rgba(245,158,11,0.08);
          border-color: #F59E0B;
          color: #F59E0B;
        }

        /* ===== BOARD ===== */
        .board-section {
          padding: 14px 16px;
          background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
        }

        .board-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .board-title-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .board-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }

        .board-time {
          font-size: 11px;
          color: #94A3B8;
        }

        .board-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 8px;
        }

        .board-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #F8FAFC;
          border-radius: 10px;
          border-left: 3px solid;
        }

        .board-emoji {
          font-size: 18px;
        }

        .board-info {
          display: flex;
          flex-direction: column;
        }

        .board-label {
          font-size: 11px;
          font-weight: 500;
          color: #1E293B;
        }

        .board-price {
          font-size: 11px;
          font-weight: 600;
        }

        /* ===== TABS ===== */
        .tabs-section {
          display: flex;
          gap: 4px;
          padding: 10px 16px;
          background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 500;
          color: #94A3B8;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          background: #F8FAFC;
        }

        .tab-btn.active {
          background: rgba(245,158,11,0.08);
          color: #F59E0B;
        }

        /* ===== LISTINGS ===== */
        .listings {
          padding: 14px 16px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .listings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .listings-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .listings-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
        }

        .listings-count {
          font-size: 12px;
          color: #94A3B8;
          background: #F1F5F9;
          padding: 1px 10px;
          border-radius: 12px;
        }

        .filter-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #F1F5F9;
          background: #FFFFFF;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: #F8FAFC;
        }

        .listings-feed {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .feed-card {
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
          overflow: hidden;
          transition: all 0.2s;
        }

        .feed-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        }

        .feed-card-main {
          display: flex;
          gap: 12px;
          padding: 12px;
          cursor: pointer;
        }

        .feed-image {
          width: 68px;
          height: 68px;
          border-radius: 10px;
          flex-shrink: 0;
          background: #F8FAFC;
          overflow: hidden;
          position: relative;
        }

        .feed-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .feed-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feed-delivery {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background: #10B981;
          border-radius: 4px;
          padding: 2px 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feed-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .feed-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .feed-title {
          font-size: 13px;
          font-weight: 600;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          padding-right: 8px;
        }

        .feed-price {
          font-size: 13px;
          font-weight: 700;
          color: #10B981;
          flex-shrink: 0;
        }

        .feed-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          color: #94A3B8;
          margin: 2px 0;
        }

        .feed-seller {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .feed-rating {
          display: flex;
          align-items: center;
          gap: 3px;
          color: #F59E0B;
        }

        .feed-location {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .feed-actions {
          display: flex;
          gap: 12px;
          margin-top: 2px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 3px;
          background: none;
          border: none;
          font-size: 11px;
          color: #94A3B8;
          cursor: pointer;
          font-family: inherit;
          padding: 2px 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #F8FAFC;
        }

        .like-btn:hover {
          color: #EF4444;
        }

        .comment-btn:hover {
          color: #F59E0B;
        }

        /* ===== COMMENTS ===== */
        .feed-comments {
          padding: 10px 12px 12px;
          border-top: 1px solid #F1F5F9;
        }

        .comment-input-wrap {
          display: flex;
          gap: 6px;
          margin-bottom: 8px;
        }

        .comment-input {
          flex: 1;
          padding: 6px 12px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 12px;
          font-family: inherit;
          color: #1E293B;
          outline: none;
          background: #FFFFFF;
          transition: all 0.2s;
        }

        .comment-input:focus {
          border-color: #F59E0B;
        }

        .comment-input::placeholder {
          color: #94A3B8;
        }

        .comment-send {
          padding: 6px 10px;
          background: #1E293B;
          border: none;
          border-radius: 8px;
          color: #FFFFFF;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .comment-send:hover {
          background: #F59E0B;
        }

        .comment-list {
          max-height: 140px;
          overflow-y: auto;
        }

        .comment-list::-webkit-scrollbar {
          width: 2px;
        }

        .comment-list::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 4px;
        }

        .no-comments {
          font-size: 11px;
          color: #94A3B8;
          text-align: center;
          padding: 4px 0;
        }

        .comment-item {
          padding: 6px 0;
          border-bottom: 1px solid #F8FAFC;
        }

        .comment-item:last-child {
          border-bottom: none;
        }

        .comment-head {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .comment-user {
          font-weight: 600;
          font-size: 11px;
          color: #1E293B;
        }

        .comment-time {
          font-size: 9px;
          color: #94A3B8;
        }

        .comment-text {
          font-size: 12px;
          color: #64748B;
          margin: 2px 0;
        }

        .reply-trigger {
          background: none;
          border: none;
          font-size: 10px;
          color: #94A3B8;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 0;
          transition: all 0.2s;
        }

        .reply-trigger:hover {
          color: #F59E0B;
        }

        .reply-input-wrap {
          display: flex;
          gap: 6px;
          margin: 4px 0 4px 16px;
        }

        .reply-input {
          flex: 1;
          padding: 4px 10px;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          font-size: 11px;
          font-family: inherit;
          color: #1E293B;
          outline: none;
          background: #FFFFFF;
        }

        .reply-input:focus {
          border-color: #F59E0B;
        }

        .reply-send {
          padding: 4px 8px;
          background: #1E293B;
          border: none;
          border-radius: 6px;
          color: #FFFFFF;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .reply-send:hover {
          background: #F59E0B;
        }

        .replies {
          margin-left: 16px;
          padding-left: 10px;
          border-left: 1px solid #F1F5F9;
        }

        .reply-item {
          padding: 4px 0;
        }

        .reply-head {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .reply-user {
          font-weight: 600;
          font-size: 10px;
          color: #64748B;
        }

        .reply-time {
          font-size: 8px;
          color: #94A3B8;
        }

        .reply-text {
          font-size: 11px;
          color: #94A3B8;
          margin: 1px 0;
        }

        /* ===== EMPTY ===== */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-title {
          font-size: 16px;
          font-weight: 600;
          color: #1E293B;
          margin: 8px 0 4px;
        }

        .empty-desc {
          font-size: 13px;
          color: #94A3B8;
          margin: 0;
        }

        /* ===== BOTTOM NAV ===== */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(226,232,240,0.4);
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
          .header {
            padding: 12px 12px 0;
          }
          .hero-title {
            font-size: 22px;
          }
          .board-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .feed-card-main {
            padding: 10px;
            gap: 10px;
          }
          .feed-image {
            width: 56px;
            height: 56px;
          }
          .feed-title {
            font-size: 12px;
          }
          .feed-price {
            font-size: 12px;
          }
          .tabs-section {
            padding: 8px 12px;
          }
          .tab-btn {
            font-size: 12px;
            padding: 4px 10px;
          }
        }

        @media (max-width: 380px) {
          .board-grid {
            grid-template-columns: 1fr 1fr;
          }
          .feed-image {
            width: 48px;
            height: 48px;
          }
          .feed-meta {
            font-size: 10px;
            gap: 6px;
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .board-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;