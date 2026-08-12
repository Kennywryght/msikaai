// mobile/src/App.jsx
import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import LoadingSpinner from './components/LoadingSpinner';
import { supabase } from './lib/supabase';
import './index.css';

// Lazy load pages
const SplashScreen = lazy(() => import('./pages/SplashScreen'));
const About = lazy(() => import('./pages/About'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const CreateListing = lazy(() => import('./pages/CreateListing'));
const Search = lazy(() => import('./pages/Search'));
const ListingDetails = lazy(() => import('./pages/ListingDetails'));
const AISearch = lazy(() => import('./pages/AISearch'));
const VoiceListing = lazy(() => import('./pages/VoiceListing'));
const AdGenerator = lazy(() => import('./pages/AdGenerator'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const NotFound = lazy(() => import('./pages/NotFound'));

const PageLoader = () => <LoadingSpinner message="Loading page..." />;

// ✅ FIXED: Protected Route
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const adminCheckDone = useRef(false);

  useEffect(() => {
    // Only check admin once
    if (adminCheckDone.current) return;
    
    const checkAdmin = async () => {
      if (adminOnly && user) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          setIsAdmin(data?.role === 'admin');
        } catch (error) {
          console.error('Admin check error:', error);
          setIsAdmin(false);
        }
      }
      adminCheckDone.current = true;
      setCheckingAdmin(false);
    };

    if (!loading && user) {
      checkAdmin();
    } else if (!loading) {
      adminCheckDone.current = true;
      setCheckingAdmin(false);
    }
  }, [user, loading, adminOnly]);

  // Loading
  if (loading || checkingAdmin) {
    return <PageLoader />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin check
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ✅ FIXED: Main App Routes - Splash only once
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // ✅ CRITICAL FIX: Track if splash has been shown in this session
  const [splashComplete, setSplashComplete] = useState(() => {
    // If user is authenticated, skip splash entirely
    if (isAuthenticated) return true;
    // Check if splash was shown in this browser session
    return sessionStorage.getItem('splash_shown') === 'true';
  });

  // ✅ CRITICAL FIX: Show splash only once
  useEffect(() => {
    // If splash is already complete or user is authenticated, do nothing
    if (splashComplete || isAuthenticated || loading) {
      return;
    }

    // Only show splash on landing page
    if (location.pathname === '/') {
      const timer = setTimeout(() => {
        setSplashComplete(true);
        sessionStorage.setItem('splash_shown', 'true');
      }, 2000); // 2 seconds splash

      return () => clearTimeout(timer);
    } else {
      // Not on landing page, skip splash
      setSplashComplete(true);
      sessionStorage.setItem('splash_shown', 'true');
    }
  }, [location.pathname, isAuthenticated, loading, splashComplete]);

  // ✅ CRITICAL FIX: Show splash only if not complete and not authenticated
  if (!splashComplete && !isAuthenticated && !loading && location.pathname === '/') {
    return (
      <Suspense fallback={<PageLoader />}>
        <SplashScreen />
      </Suspense>
    );
  }

  // Loading state
  if (loading) {
    return <PageLoader />;
  }

  // ✅ CRITICAL FIX: If authenticated, always show dashboard
  if (isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />
          <Route path="/create-listing" element={
            <ProtectedRoute>
              <CreateListing />
            </ProtectedRoute>
          } />
          <Route path="/ai-search" element={
            <ProtectedRoute>
              <AISearch />
            </ProtectedRoute>
          } />
          <Route path="/voice-listing" element={
            <ProtectedRoute>
              <VoiceListing />
            </ProtectedRoute>
          } />
          <Route path="/ad-generator" element={
            <ProtectedRoute>
              <AdGenerator />
            </ProtectedRoute>
          } />
          <Route path="/edit-profile" element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Navigate to="/dashboard" replace />} />
          <Route path="/search" element={<Search />} />
          <Route path="/listing/:id" element={<ListingDetails />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    );
  }

  // ✅ Not authenticated - show public routes
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<Search />} />
        <Route path="/listing/:id" element={<ListingDetails />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <TranslationProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TranslationProvider>
    </AuthProvider>
  );
}

export default App;