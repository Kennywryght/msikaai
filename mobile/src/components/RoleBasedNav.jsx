// mobile/src/components/RoleBasedNav.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from './LanguageToggle';

// ============================================================
// PREMIUM FEATHER/LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => (
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

const ICONS = {
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  plus: "M12 4v16m8-8H4",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  dashboard: "M3 12h3m6-6h3m-9 12h3m6-6h3m-6 6h3M3 6h3M3 18h3M12 6h3M12 18h3M21 6h3M21 18h3M12 12h3M21 12h3",
  heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  chart: "M3 3v18h18M18 9l-4-4-4 4-4-4M18 15l-4-4-4 4-4-4",
  close: "M6 18L18 6M6 6l12 12",
  menu: "M4 6h16M4 12h16M4 18h16",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
};

export const RoleBasedNav = () => {
  const { isAuthenticated, userRole, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ============================================================
  // Close mobile menu on route change
  // ============================================================
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // ============================================================
  // Navigation configuration based on role
  // ============================================================
  const navConfig = {
    guest: [
      { label: 'Home', path: '/', icon: 'home' },
      { label: 'Browse', path: '/search', icon: 'search' },
      { label: 'About', path: '/about', icon: 'store' },
      { label: 'Sign In', path: '/login', icon: 'user' },
    ],
    buyer: [
      { label: 'Home', path: '/', icon: 'home' },
      { label: 'Browse', path: '/search', icon: 'search' },
      { label: 'Favorites', path: '/favorites', icon: 'heart' },
      { label: 'Messages', path: '/messages', icon: 'message' },
      { label: 'Profile', path: '/profile', icon: 'user' },
    ],
    seller: [
      { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      { label: 'Listings', path: '/my-listings', icon: 'store' },
      { label: 'Add', path: '/create-listing', icon: 'plus' },
      { label: 'Messages', path: '/messages', icon: 'message' },
      { label: 'Profile', path: '/profile', icon: 'user' },
    ],
    business: [
      { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      { label: 'Listings', path: '/my-listings', icon: 'store' },
      { label: 'Analytics', path: '/analytics', icon: 'chart' },
      { label: 'Messages', path: '/messages', icon: 'message' },
      { label: 'Profile', path: '/profile', icon: 'user' },
    ],
    admin: [
      { label: 'Admin', path: '/admin', icon: 'dashboard' },
      { label: 'Users', path: '/admin/users', icon: 'user' },
      { label: 'Listings', path: '/admin/listings', icon: 'store' },
      { label: 'Reports', path: '/admin/reports', icon: 'chart' },
    ],
  };

  const items = navConfig[isAuthenticated ? userRole : 'guest'] || navConfig.guest;

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // ✅ Determine if sidebar should be expanded
  const isExpanded = isHovered;

  if (loading) {
    return (
      <div style={styles.container}>
        <button style={styles.hamburgerBtn} disabled>
          <span style={styles.hamburgerLine} />
          <span style={styles.hamburgerLine} />
          <span style={styles.hamburgerLine} />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ===== HAMBURGER BUTTON (Always Visible) ===== */}
      <div style={styles.container}>
        <button 
          style={styles.hamburgerBtn}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="Toggle navigation"
        >
          <span style={styles.hamburgerLine} />
          <span style={styles.hamburgerLine} />
          <span style={styles.hamburgerLine} />
        </button>
      </div>

      {/* ===== SIDEBAR (Hidden by default, shows on hover) ===== */}
      <aside 
        style={{ 
          ...styles.sidebar, 
          ...(isExpanded ? styles.sidebarExpanded : styles.sidebarHidden),
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={styles.sidebarContainer}>
          {/* ===== LOGO ===== */}
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <span style={styles.logoIconText}>M</span>
            </div>
            <span style={styles.logoText}>
              Msika<span style={styles.logoAccent}>AI</span>
            </span>
          </div>

          {/* ===== NAVIGATION ITEMS ===== */}
          <nav style={styles.nav}>
            {items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...styles.navItem,
                  ...(isActive(item.path) ? styles.navItemActive : {}),
                }}
              >
                <div style={styles.navIconWrapper}>
                  <Icon
                    d={ICONS[item.icon]}
                    size={22}
                    color={isActive(item.path) ? '#F59E0B' : '#64748B'}
                    strokeWidth={1.75}
                  />
                  {isActive(item.path) && <div style={styles.navActiveDot} />}
                </div>
                <span style={styles.navLabel}>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* ===== BOTTOM SECTION ===== */}
          <div style={styles.bottomSection}>
            <div style={styles.bottomDivider} />
            
            {/* Language Toggle */}
            <div style={styles.bottomItem}>
              <LanguageToggle />
              <span style={styles.bottomLabel}>Language</span>
            </div>

            {/* Logout */}
            {isAuthenticated && (
              <button style={styles.logoutBtn} onClick={handleLogout}>
                <div style={styles.navIconWrapper}>
                  <Icon d={ICONS.logout} size={22} color="#EF4444" strokeWidth={1.75} />
                </div>
                <span style={styles.navLabel}>Logout</span>
              </button>
            )}

            {/* Version */}
            <div style={styles.version}>v2.0.0</div>
          </div>
        </div>
      </aside>

      {/* ===== MOBILE OVERLAY ===== */}
      {isMobileMenuOpen && (
        <div style={styles.mobileOverlay} onClick={() => setIsMobileMenuOpen(false)}>
          <div style={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            {/* Mobile Menu Header */}
            <div style={styles.mobileMenuHeader}>
              <div style={styles.mobileMenuLogo}>
                <span style={styles.mobileMenuLogoIcon}>M</span>
                <span style={styles.mobileMenuLogoText}>Msika<span style={styles.mobileMenuLogoAccent}>AI</span></span>
              </div>
              <button
                style={styles.mobileMenuClose}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon d={ICONS.close} size={24} color="#1E293B" strokeWidth={1.75} />
              </button>
            </div>

            {/* User Info */}
            {isAuthenticated && (
              <div style={styles.mobileUserInfo}>
                <div style={styles.mobileUserAvatar}>
                  {userRole === 'seller' ? '🛒' : userRole === 'admin' ? '👑' : '👤'}
                </div>
                <div>
                  <div style={styles.mobileUserRole}>{userRole.toUpperCase()}</div>
                  <div style={styles.mobileUserStatus}>Active</div>
                </div>
              </div>
            )}

            {/* Navigation Items */}
            <div style={styles.mobileNavItems}>
              {items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    ...styles.mobileNavItem,
                    ...(isActive(item.path) ? styles.mobileNavItemActive : {}),
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon
                    d={ICONS[item.icon]}
                    size={20}
                    color={isActive(item.path) ? '#F59E0B' : '#64748B'}
                    strokeWidth={1.75}
                  />
                  <span>{item.label}</span>
                  {isActive(item.path) && <span style={styles.mobileNavActiveDot} />}
                </Link>
              ))}
            </div>

            {/* Bottom Actions */}
            <div style={styles.mobileBottom}>
              <div style={styles.mobileDivider} />
              <LanguageToggle />
              {isAuthenticated ? (
                <button
                  style={styles.mobileLogoutBtn}
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                >
                  <Icon d={ICONS.logout} size={20} color="#EF4444" strokeWidth={1.75} />
                  <span>Logout</span>
                </button>
              ) : (
                <Link to="/login" style={styles.mobileSignInBtn} onClick={() => setIsMobileMenuOpen(false)}>
                  <Icon d={ICONS.user} size={20} color="#FFFFFF" strokeWidth={1.75} />
                  <span>Sign In</span>
                </Link>
              )}
              <div style={styles.mobileVersion}>v2.0.0</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MOBILE HAMBURGER (for mobile only) ===== */}
      <button
        style={styles.mobileHamburger}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <Icon d={ICONS.menu} size={24} color="#1E293B" strokeWidth={1.75} />
      </button>
    </>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  // ===== HAMBURGER BUTTON (Always visible) =====
  container: {
    position: 'fixed',
    top: '12px',
    left: '12px',
    zIndex: 1001,
  },
  hamburgerBtn: {
    width: '44px',
    height: '44px',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    boxShadow: '0 2px 12px rgba(30,41,59,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    padding: '10px',
  },
  hamburgerLine: {
    display: 'block',
    width: '20px',
    height: '2px',
    background: '#1E293B',
    borderRadius: '2px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // ===== SIDEBAR =====
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '260px',
    background: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
    boxShadow: '4px 0 32px rgba(30,41,59,0.08)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    transform: 'translateX(-100%)',
  },
  sidebarHidden: {
    transform: 'translateX(-100%)',
  },
  sidebarExpanded: {
    transform: 'translateX(0)',
  },
  sidebarContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '20px 16px',
    overflow: 'hidden',
  },

  // ===== LOGO =====
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 4px 20px 4px',
    borderBottom: '1px solid #F1F5F9',
    marginBottom: '16px',
    minHeight: '60px',
  },
  logoIcon: {
    width: '38px',
    height: '38px',
    background: 'linear-gradient(135deg, #1E293B, #F59E0B)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 12px rgba(245,158,11,0.25)',
    flexShrink: 0,
  },
  logoIconText: {
    color: '#FFFFFF',
    fontFamily: '"Fraunces", Georgia, serif',
    fontSize: '18px',
    fontWeight: '700',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: '-0.02em',
    fontFamily: '"Fraunces", Georgia, serif',
    whiteSpace: 'nowrap',
  },
  logoAccent: {
    color: '#F59E0B',
  },

  // ===== NAVIGATION =====
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '10px 12px',
    borderRadius: '10px',
    textDecoration: 'none',
    color: '#64748B',
    transition: 'all 0.2s ease',
    position: 'relative',
    minHeight: '44px',
    cursor: 'pointer',
  },
  navItemActive: {
    color: '#F59E0B',
    background: 'rgba(245,158,11,0.08)',
  },
  navIconWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    flexShrink: 0,
  },
  navActiveDot: {
    position: 'absolute',
    right: '-10px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '20px',
    background: '#F59E0B',
    borderRadius: '2px',
  },
  navLabel: {
    fontSize: '14px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },

  // ===== BOTTOM SECTION =====
  bottomSection: {
    borderTop: '1px solid #F1F5F9',
    paddingTop: '12px',
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  bottomDivider: {
    height: '1px',
    background: '#F1F5F9',
    marginBottom: '8px',
  },
  bottomItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '8px 12px',
    borderRadius: '10px',
    minHeight: '44px',
  },
  bottomLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748B',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#EF4444',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    width: '100%',
    minHeight: '44px',
  },
  version: {
    fontSize: '10px',
    color: '#94A3B8',
    textAlign: 'center',
    padding: '8px 0',
    fontFamily: 'monospace',
    letterSpacing: '0.5px',
  },

  // ===== MOBILE HAMBURGER =====
  mobileHamburger: {
    position: 'fixed',
    top: '12px',
    left: '12px',
    zIndex: 999,
    width: '44px',
    height: '44px',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    boxShadow: '0 2px 12px rgba(30,41,59,0.06)',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // ===== MOBILE OVERLAY =====
  mobileOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(30,41,59,0.4)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 1001,
    animation: 'fadeIn 0.25s ease',
    display: 'none',
  },
  mobileMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '85%',
    maxWidth: '340px',
    height: '100%',
    background: '#FFFFFF',
    padding: '24px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '8px 0 40px rgba(30,41,59,0.1)',
    animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
  },
  mobileMenuHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid #F1F5F9',
    marginBottom: '16px',
  },
  mobileMenuLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  mobileMenuLogoIcon: {
    width: '36px',
    height: '36px',
    background: 'linear-gradient(135deg, #1E293B, #F59E0B)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontFamily: '"Fraunces", Georgia, serif',
    fontSize: '17px',
    fontWeight: '700',
  },
  mobileMenuLogoText: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: '"Fraunces", Georgia, serif',
  },
  mobileMenuLogoAccent: {
    color: '#F59E0B',
  },
  mobileMenuClose: {
    background: 'none',
    border: 'none',
    padding: '6px',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'background 0.2s ease',
  },
  mobileUserInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: '#F8FAFC',
    borderRadius: '12px',
    marginBottom: '16px',
    border: '1px solid #F1F5F9',
  },
  mobileUserAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #EDE9F5, #F59E0B)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  },
  mobileUserRole: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  mobileUserStatus: {
    fontSize: '12px',
    color: '#10B981',
    fontWeight: '500',
  },
  mobileNavItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  mobileNavItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#64748B',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  mobileNavItemActive: {
    color: '#F59E0B',
    background: 'rgba(245,158,11,0.08)',
  },
  mobileNavActiveDot: {
    width: '6px',
    height: '6px',
    background: '#F59E0B',
    borderRadius: '50%',
    position: 'absolute',
    right: '16px',
  },
  mobileBottom: {
    marginTop: 'auto',
    paddingTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  mobileDivider: {
    height: '1px',
    background: '#F1F5F9',
    marginBottom: '8px',
  },
  mobileLogoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '14px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#EF4444',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    cursor: 'pointer',
    fontFamily: 'inherit',
    width: '100%',
    transition: 'all 0.2s ease',
  },
  mobileSignInBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '14px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#FFFFFF',
    background: '#1E293B',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    width: '100%',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 12px rgba(30,41,59,0.15)',
  },
  mobileVersion: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '4px',
    fontFamily: 'monospace',
    letterSpacing: '0.5px',
  },
};

// ============================================================
// ADD KEYFRAMES & RESPONSIVE STYLES
// ============================================================
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideIn {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  /* ===== HOVER EFFECTS ===== */
  .hamburger-btn:hover {
    background: #F8FAFC;
    box-shadow: 0 4px 16px rgba(30,41,59,0.12);
  }
  .hamburger-btn:hover .hamburger-line {
    background: #F59E0B;
  }
  .hamburger-btn:hover .hamburger-line:nth-child(2) {
    width: 16px;
  }
  .nav-item:hover {
    background: #F8FAFC;
    color: #1E293B;
  }
  .logout-btn:hover {
    background: #FEF2F2;
  }
  .mobile-hamburger:hover {
    background: #F8FAFC;
    box-shadow: 0 4px 16px rgba(30,41,59,0.1);
  }
  .mobile-menu-close:hover {
    background: #F1F5F9;
  }
  .mobile-nav-item:hover {
    background: #F8FAFC;
  }
  .mobile-logout-btn:hover {
    background: #FECACA;
  }
  .mobile-sign-in-btn:hover {
    background: #334155;
  }

  /* ===== RESPONSIVE BREAKPOINTS ===== */
  
  /* Desktop & Tablet - Show hamburger only */
  @media (min-width: 769px) {
    .mobile-hamburger { display: none !important; }
    .mobile-overlay { display: none !important; }
  }

  /* Mobile - Show mobile hamburger */
  @media (max-width: 768px) {
    .container { display: none !important; }
    .mobile-hamburger { display: flex !important; }
    .mobile-overlay { display: block !important; }
    .sidebar { 
      width: 100% !important;
      max-width: 320px !important;
    }
  }

  /* ===== SCROLLBAR STYLING ===== */
  .nav::-webkit-scrollbar {
    width: 3px;
  }
  .nav::-webkit-scrollbar-track {
    background: transparent;
  }
  .nav::-webkit-scrollbar-thumb {
    background: #E2E8F0;
    border-radius: 20px;
  }

  /* ===== MAIN CONTENT OFFSET ===== */
  .main-content {
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .main-content-expanded {
    margin-left: 260px;
  }
`;
document.head.appendChild(styleSheet);

export default RoleBasedNav;