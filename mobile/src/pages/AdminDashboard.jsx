// mobile/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    projects: 0,
    orders: 0,
    revenue: 0,
    recentOrders: [],
    recentUsers: []
  });
  const [toast, setToast] = useState(null);

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
    } catch (error) {
      console.error('Error checking admin status:', error);
      setToast({ message: 'Error loading dashboard', type: 'error' });
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

      // Get total projects
      const { count: projectsCount } = await supabase
        .from('projects')
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

      const totalRevenue = ordersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

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
        projects: projectsCount || 0,
        orders: ordersCount || 0,
        revenue: totalRevenue,
        recentOrders: recentOrders || [],
        recentUsers: recentUsers || []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setToast({ message: 'Error loading data', type: 'error' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      backgroundColor: 'white',
      padding: '20px 32px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#0f172a',
      margin: 0
    },
    headerActions: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    logoutBtn: {
      padding: '8px 16px',
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      padding: '24px 32px'
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    statLabel: {
      fontSize: '14px',
      color: '#64748b',
      margin: '0 0 8px 0'
    },
    statValue: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#0f172a',
      margin: 0
    },
    contentGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      padding: '0 32px 32px 32px'
    },
    section: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#0f172a',
      margin: '0 0 16px 0'
    },
    listItem: {
      padding: '12px 0',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    listItemLast: {
      borderBottom: 'none'
    },
    itemName: {
      fontWeight: '500',
      color: '#0f172a'
    },
    itemSub: {
      fontSize: '14px',
      color: '#64748b'
    },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600'
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div style={styles.container}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <header style={styles.header}>
        <h1 style={styles.headerTitle}>📊 Admin Dashboard</h1>
        <div style={styles.headerActions}>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Users</p>
          <p style={styles.statValue}>{stats.users}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Projects</p>
          <p style={styles.statValue}>{stats.projects}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Orders</p>
          <p style={styles.statValue}>{stats.orders}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Revenue</p>
          <p style={styles.statValue}>${stats.revenue.toFixed(2)}</p>
        </div>
      </div>

      <div style={styles.contentGrid}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Orders</h2>
          {stats.recentOrders.length === 0 ? (
            <p style={styles.itemSub}>No orders yet</p>
          ) : (
            stats.recentOrders.map((order, index) => (
              <div key={order.id} style={{
                ...styles.listItem,
                ...(index === stats.recentOrders.length - 1 ? styles.listItemLast : {})
              }}>
                <div>
                  <div style={styles.itemName}>Order #{order.id.slice(0, 8)}</div>
                  <div style={styles.itemSub}>${order.total_amount?.toFixed(2) || '0.00'}</div>
                </div>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: order.status === 'completed' ? '#d1fae5' : '#fef3c7',
                  color: order.status === 'completed' ? '#065f46' : '#92400e'
                }}>
                  {order.status || 'pending'}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Users</h2>
          {stats.recentUsers.length === 0 ? (
            <p style={styles.itemSub}>No users yet</p>
          ) : (
            stats.recentUsers.map((user, index) => (
              <div key={user.id} style={{
                ...styles.listItem,
                ...(index === stats.recentUsers.length - 1 ? styles.listItemLast : {})
              }}>
                <div>
                  <div style={styles.itemName}>{user.full_name || 'Anonymous'}</div>
                  <div style={styles.itemSub}>{user.email}</div>
                </div>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: user.role === 'admin' ? '#dbeafe' : '#e2e8f0',
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