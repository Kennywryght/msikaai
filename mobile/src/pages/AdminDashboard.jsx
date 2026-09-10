// mobile/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    dashboard: "M3 12h3m6-6h3m-9 12h3m6-6h3m-6 6h3M3 6h3M3 18h3M12 6h3M12 18h3M21 6h3M21 18h3M12 12h3M21 12h3",
    users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    shopping: "M6 2l1.5 5M18 2l-1.5 5M4 7h16l-1.5 13a2 2 0 01-2 1.8H7.5a2 2 0 01-2-1.8L4 7zM9 11v3M15 11v3",
    dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
    clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    trendingUp: "M23 6l-9.5 9.5-5-5L1 18",
    check: "M20 6L9 17l-5-5",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
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
// MAIN COMPONENT
// ============================================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { showToast, success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const [stats, setStats] = useState({
    users: 0,
    projects: 0,
    orders: 0,
    revenue: 0,
    recentOrders: [],
    recentUsers: []
  });

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        navigate('/dashboard');
        return;
      }

      await loadDashboardData();
    } catch (err) {
      console.error('Error checking admin status:', err);
      showToast('Error loading dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: listingsCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed');

      const totalRevenue = ordersData?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;

      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        users: usersCount || 0,
        projects: listingsCount || 0,
        orders: ordersCount || 0,
        revenue: totalRevenue,
        recentOrders: recentOrders || [],
        recentUsers: recentUsers || []
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      showToast('Error loading data', 'error');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MW', {
      style: 'currency',
      currency: 'MWK',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  if (loading) {
    return (
      <div className="loading-skeleton">
        <div className="skeleton-header" />
        <div className="skeleton-stats">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-stat" />)}
        </div>
        <div className="skeleton-activities">
          {[1,2].map(i => <div key={i} className="skeleton-activity" />)}
        </div>
        <style jsx>{`
          .loading-skeleton {
            min-height: 100vh;
            background: #F8FAFC;
            padding: 20px 16px 80px;
            max-width: 1200px;
            margin: 0 auto;
          }
          .skeleton-header {
            height: 80px;
            background: #E2E8F0;
            border-radius: 12px;
            margin-bottom: 20px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          .skeleton-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .skeleton-stat {
            height: 70px;
            background: #E2E8F0;
            border-radius: 12px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          .skeleton-activities {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .skeleton-activity {
            height: 200px;
            background: #E2E8F0;
            border-radius: 12px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @media (max-width: 480px) {
            .skeleton-stats {
              grid-template-columns: repeat(2, 1fr);
            }
            .skeleton-activities {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="main-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-badge">
            <Icon name="dashboard" size={16} color="#F59E0B" strokeWidth={1.75} />
            <span>Admin</span>
          </div>
          <h1 className="welcome-title">Admin Dashboard</h1>
          <p className="welcome-subtitle">Overview of your platform's performance and activity</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <Icon name="users" size={18} color="#3B82F6" strokeWidth={1.75} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.users.toLocaleString()}</div>
              <div className="stat-label">Users</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
              <Icon name="store" size={18} color="#F59E0B" strokeWidth={1.75} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.projects.toLocaleString()}</div>
              <div className="stat-label">Listings</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <Icon name="shopping" size={18} color="#8B5CF6" strokeWidth={1.75} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.orders.toLocaleString()}</div>
              <div className="stat-label">Orders</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <Icon name="dollar" size={18} color="#10B981" strokeWidth={1.75} />
            </div>
            <div className="stat-info">
              <div className="stat-value stat-revenue">{formatCurrency(stats.revenue)}</div>
              <div className="stat-label">Revenue</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-grid">
          <div className="activity-card">
            <div className="card-header">
              <h3 className="card-title">
                <Icon name="clock" size={18} color="#F59E0B" strokeWidth={1.75} />
                Recent Orders
              </h3>
              <span className="card-count">{stats.recentOrders.length}</span>
            </div>
            {stats.recentOrders.length === 0 ? (
              <p className="empty-state">No orders recorded yet.</p>
            ) : (
              <div className="activity-list">
                {stats.recentOrders.map((order, index) => {
                  const isCompleted = order.status === 'completed';
                  const isCancelled = order.status === 'cancelled';
                  
                  return (
                    <div key={order.id} className={`activity-item ${index === stats.recentOrders.length - 1 ? 'last' : ''}`}>
                      <div className="activity-info">
                        <div className="activity-name">Order #{order.id?.slice(0, 8) || 'N/A'}</div>
                        <div className="activity-meta">
                          {formatCurrency(order.total_amount)}
                          {order.created_at && ` • ${formatDate(order.created_at)}`}
                        </div>
                      </div>
                      <span className={`status-badge ${isCompleted ? 'completed' : isCancelled ? 'cancelled' : 'pending'}`}>
                        {order.status || 'pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="activity-card">
            <div className="card-header">
              <h3 className="card-title">
                <Icon name="users" size={18} color="#3B82F6" strokeWidth={1.75} />
                Recent Users
              </h3>
              <span className="card-count">{stats.recentUsers.length}</span>
            </div>
            {stats.recentUsers.length === 0 ? (
              <p className="empty-state">No users registered yet.</p>
            ) : (
              <div className="activity-list">
                {stats.recentUsers.map((user, index) => (
                  <div key={user.id} className={`activity-item ${index === stats.recentUsers.length - 1 ? 'last' : ''}`}>
                    <div className="activity-info">
                      <div className="activity-name">{user.full_name || 'Anonymous User'}</div>
                      <div className="activity-meta">
                        {user.email || 'No email provided'}
                        {user.created_at && ` • ${formatDate(user.created_at)}`}
                      </div>
                    </div>
                    <span className={`role-badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                      {user.role || 'user'}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
        .admin-dashboard {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 80px;
        }

        @media (min-width: 769px) {
          .admin-dashboard {
            padding-bottom: 0;
          }
        }

        /* ===== MAIN CONTENT ===== */
        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 16px 40px;
        }

        /* ===== WELCOME ===== */
        .welcome-section {
          margin-bottom: 24px;
        }

        .welcome-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(245, 158, 11, 0.08);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          color: #F59E0B;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .welcome-title {
          font-size: clamp(24px, 2.8vw, 28px);
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 4px;
          letter-spacing: -0.5px;
        }

        .welcome-subtitle {
          font-size: 14px;
          color: #94A3B8;
          margin: 0;
        }

        /* ===== STATS ===== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }

        @media (min-width: 480px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-card {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 14px 16px;
          border: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
        }

        .stat-card:hover {
          border-color: #E2E8F0;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-info {
          flex: 1;
          min-width: 0;
        }

        .stat-value {
          font-size: clamp(18px, 1.8vw, 22px);
          font-weight: 700;
          color: #1E293B;
          line-height: 1.2;
        }

        .stat-revenue {
          color: #10B981;
        }

        .stat-label {
          font-size: 11px;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        /* ===== ACTIVITY GRID ===== */
        .activity-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 768px) {
          .activity-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .activity-card {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 16px 18px;
          border: 1px solid #F1F5F9;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .card-title {
          font-size: 15px;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .card-count {
          font-size: 12px;
          font-weight: 600;
          color: #94A3B8;
          background: #F1F5F9;
          padding: 2px 10px;
          border-radius: 12px;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
        }

        .activity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #F1F5F9;
          gap: 10px;
        }

        .activity-item.last {
          border-bottom: none;
        }

        .activity-info {
          flex: 1;
          min-width: 0;
        }

        .activity-name {
          font-size: 14px;
          font-weight: 600;
          color: #1E293B;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-meta {
          font-size: 12px;
          color: #94A3B8;
        }

        .empty-state {
          text-align: center;
          color: #94A3B8;
          font-size: 14px;
          padding: 20px 0;
        }

        /* ===== STATUS BADGES ===== */
        .status-badge {
          padding: 3px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
          flex-shrink: 0;
        }

        .status-badge.completed {
          background: #D1FAE5;
          color: #065F46;
        }

        .status-badge.cancelled {
          background: #FEE2E2;
          color: #991B1B;
        }

        .status-badge.pending {
          background: #FEF3C7;
          color: #92400E;
        }

        .role-badge {
          padding: 3px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
          flex-shrink: 0;
        }

        .role-badge.admin {
          background: #E0E7FF;
          color: #3730A3;
        }

        .role-badge.user {
          background: #F1F5F9;
          color: #64748B;
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
        @media (max-width: 380px) {
          .stats-grid {
            gap: 8px;
          }
          .stat-card {
            padding: 10px 12px;
          }
          .stat-icon {
            width: 32px;
            height: 32px;
          }
          .stat-value {
            font-size: 16px;
          }
          .activity-card {
            padding: 12px 14px;
          }
          .activity-item {
            padding: 8px 0;
          }
          .welcome-title {
            font-size: 20px;
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;