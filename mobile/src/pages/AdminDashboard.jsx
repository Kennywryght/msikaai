// mobile/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { useToast } from '../components/ToastContainer';

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

      // Check if user is admin
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
      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total listings
      const { count: listingsCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

      // Get total orders
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Get revenue
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed');

      const totalRevenue = ordersData?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;

      // Get recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent users
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

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      backgroundColor: '#ffffff',
      padding: 'clamp(16px, 2vw, 20px) clamp(16px, 4vw, 32px)',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px'
    },
    headerTitle: {
      fontSize: 'clamp(20px, 2.5vw, 24px)',
      fontWeight: '800',
      color: '#0f172a',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    headerActions: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(160px, 22vw, 220px), 1fr))',
      gap: 'clamp(12px, 1.5vw, 20px)',
      padding: 'clamp(16px, 2vw, 28px) clamp(16px, 4vw, 32px) clamp(12px, 1.5vw, 20px) clamp(16px, 4vw, 32px)'
    },
    statCard: {
      backgroundColor: '#ffffff',
      borderRadius: '14px',
      padding: 'clamp(14px, 1.5vw, 20px)',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
    },
    statLabel: {
      fontSize: 'clamp(11px, 0.9vw, 13px)',
      fontWeight: '600',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      margin: '0 0 8px 0'
    },
    statValue: {
      fontSize: 'clamp(22px, 3vw, 28px)',
      fontWeight: '800',
      color: '#0f172a',
      margin: 0
    },
    contentGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 40vw, 340px), 1fr))',
      gap: 'clamp(12px, 1.5vw, 20px)',
      padding: '0 clamp(16px, 4vw, 32px) clamp(32px, 4vw, 32px) clamp(16px, 4vw, 32px)'
    },
    section: {
      backgroundColor: '#ffffff',
      borderRadius: '14px',
      padding: 'clamp(16px, 2vw, 24px)',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
    },
    sectionTitle: {
      fontSize: 'clamp(16px, 1.6vw, 18px)',
      fontWeight: '700',
      color: '#0f172a',
      margin: '0 0 16px 0'
    },
    listItem: {
      padding: 'clamp(10px, 1vw, 12px) 0',
      borderBottom: '1px solid #f1f5f9',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px'
    },
    listItemLast: {
      borderBottom: 'none'
    },
    itemName: {
      fontWeight: '600',
      color: '#0f172a',
      fontSize: 'clamp(14px, 1.2vw, 15px)'
    },
    itemSub: {
      fontSize: 'clamp(12px, 1vw, 13px)',
      color: '#64748b',
      marginTop: '2px'
    },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: 'clamp(11px, 0.9vw, 12px)',
      fontWeight: '600',
      textTransform: 'capitalize'
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>📊 Admin Dashboard</h1>
        <div style={styles.headerActions}>
          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
          >
            Logout
          </Button>
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
          <p style={{ ...styles.statValue, color: '#16a34a' }}>{formatCurrency(stats.revenue)}</p>
        </div>
      </div>

      <div style={styles.contentGrid}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Orders</h2>
          {stats.recentOrders.length === 0 ? (
            <p style={styles.itemSub}>No orders recorded yet.</p>
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
                    backgroundColor: isCompleted ? '#d1fae5' : isCancelled ? '#fee2e2' : '#fef3c7',
                    color: isCompleted ? '#065f46' : isCancelled ? '#991b1b' : '#92400e'
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
            <p style={styles.itemSub}>No users registered yet.</p>
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
                  backgroundColor: user.role === 'admin' ? '#dbeafe' : '#f1f5f9',
                  color: user.role === 'admin' ? '#1e40af' : '#475569'
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