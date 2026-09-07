// mobile/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import PrimaryButton from '../components/PrimaryButton';
import { useToast } from '../components/ToastContainer';

// ============================================
// PREMIUM FEATHER ICONS
// ============================================
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
  dashboard: "M3 12h3m6-6h3m-9 12h3m6-6h3m-6 6h3M3 6h3M3 18h3M12 6h3M12 18h3M21 6h3M21 18h3M12 12h3M21 12h3",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87",
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  shopping: "M6 2l1.5 5M18 2l-1.5 5M4 7h16l-1.5 13a2 2 0 01-2 1.8H7.5a2 2 0 01-2-1.8L4 7zM9 11v3M15 11v3",
  dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { showToast, success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    projects: 0,
    orders: 0,
    revenue: 0,
    recentOrders: [],
    recentUsers: []
  });

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

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      background: '#FFFFFF',
      padding: 'clamp(16px, 2vw, 20px) clamp(16px, 4vw, 32px)',
      borderBottom: '1px solid #E2E8F0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
    },
    headerTitle: {
      fontSize: 'clamp(20px, 2.5vw, 24px)',
      fontWeight: '700',
      color: '#1E293B',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: '"Fraunces", Georgia, serif',
    },
    headerActions: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(160px, 22vw, 220px), 1fr))',
      gap: 'clamp(12px, 1.5vw, 20px)',
      padding: 'clamp(16px, 2vw, 28px) clamp(16px, 4vw, 32px)',
    },
    statCard: {
      background: '#FFFFFF',
      borderRadius: '12px',
      padding: 'clamp(14px, 1.5vw, 20px)',
      border: '1px solid #E2E8F0',
      boxShadow: '0 2px 12px rgba(30,41,59,0.04)',
    },
    statLabel: {
      fontSize: 'clamp(11px, 0.9vw, 13px)',
      fontWeight: '600',
      color: '#94A3B8',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      margin: '0 0 8px 0',
    },
    statValue: {
      fontSize: 'clamp(22px, 3vw, 28px)',
      fontWeight: '700',
      color: '#1E293B',
      margin: 0,
      fontFamily: '"Fraunces", Georgia, serif',
    },
    statValueGreen: {
      color: '#10B981',
    },
    contentGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 40vw, 340px), 1fr))',
      gap: 'clamp(12px, 1.5vw, 20px)',
      padding: '0 clamp(16px, 4vw, 32px) clamp(32px, 4vw, 32px) clamp(16px, 4vw, 32px)',
    },
    section: {
      background: '#FFFFFF',
      borderRadius: '12px',
      padding: 'clamp(16px, 2vw, 24px)',
      border: '1px solid #E2E8F0',
      boxShadow: '0 2px 12px rgba(30,41,59,0.04)',
    },
    sectionTitle: {
      fontSize: 'clamp(16px, 1.6vw, 18px)',
      fontWeight: '700',
      color: '#1E293B',
      margin: '0 0 16px 0',
      fontFamily: '"Fraunces", Georgia, serif',
    },
    listItem: {
      padding: 'clamp(10px, 1vw, 12px) 0',
      borderBottom: '1px solid #F1F5F9',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px',
    },
    listItemLast: {
      borderBottom: 'none',
    },
    itemName: {
      fontWeight: '600',
      color: '#1E293B',
      fontSize: 'clamp(14px, 1.2vw, 15px)',
    },
    itemSub: {
      fontSize: 'clamp(12px, 1vw, 13px)',
      color: '#94A3B8',
      marginTop: '2px',
    },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: 'clamp(11px, 0.9vw, 12px)',
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    emptyText: {
      color: '#94A3B8',
      fontSize: '14px',
      textAlign: 'center',
      padding: '20px 0',
    },
    logoutBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      background: '#FEF2F2',
      border: '1px solid #FECACA',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      color: '#EF4444',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>
          <Icon d={ICONS.dashboard} size={24} color="#F59E0B" strokeWidth={1.75} />
          Admin Dashboard
        </h1>
        <div style={styles.headerActions}>
          <button
            onClick={handleLogout}
            style={styles.logoutBtn}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FECACA'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
          >
            <Icon d={ICONS.logout} size={16} color="#EF4444" strokeWidth={1.75} />
            Logout
          </button>
        </div>
      </header>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Users</p>
          <p style={styles.statValue}>{stats.users.toLocaleString()}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Listings</p>
          <p style={styles.statValue}>{stats.projects.toLocaleString()}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Orders</p>
          <p style={styles.statValue}>{stats.orders.toLocaleString()}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Revenue</p>
          <p style={{ ...styles.statValue, ...styles.statValueGreen }}>{formatCurrency(stats.revenue)}</p>
        </div>
      </div>

      <div style={styles.contentGrid}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Orders</h2>
          {stats.recentOrders.length === 0 ? (
            <p style={styles.emptyText}>No orders recorded yet.</p>
          ) : (
            stats.recentOrders.map((order, index) => {
              const isCompleted = order.status === 'completed';
              const isCancelled = order.status === 'cancelled';
              
              return (
                <div key={order.id} style={{
                  ...styles.listItem,
                  ...(index === stats.recentOrders.length - 1 ? styles.listItemLast : {})
                }}>
                  <div>
                    <div style={styles.itemName}>Order #{order.id?.slice(0, 8) || 'N/A'}</div>
                    <div style={styles.itemSub}>
                      {formatCurrency(order.total_amount)}
                      {order.created_at && ` • ${formatDate(order.created_at)}`}
                    </div>
                  </div>
                  <span style={{
                    ...styles.statusBadge,
                    background: isCompleted ? '#D1FAE5' : isCancelled ? '#FEE2E2' : '#FEF3C7',
                    color: isCompleted ? '#065F46' : isCancelled ? '#991B1B' : '#92400E'
                  }}>
                    {order.status || 'pending'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Users</h2>
          {stats.recentUsers.length === 0 ? (
            <p style={styles.emptyText}>No users registered yet.</p>
          ) : (
            stats.recentUsers.map((user, index) => (
              <div key={user.id} style={{
                ...styles.listItem,
                ...(index === stats.recentUsers.length - 1 ? styles.listItemLast : {})
              }}>
                <div>
                  <div style={styles.itemName}>{user.full_name || 'Anonymous User'}</div>
                  <div style={styles.itemSub}>
                    {user.email || 'No email provided'}
                    {user.created_at && ` • ${formatDate(user.created_at)}`}
                  </div>
                </div>
                <span style={{
                  ...styles.statusBadge,
                  background: user.role === 'admin' ? '#E0E7FF' : '#F1F5F9',
                  color: user.role === 'admin' ? '#3730A3' : '#64748B'
                }}>
                  {user.role || 'user'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;