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

// ✅ Protected Route with stable auth check
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const adminCheckDone = useRef(false);

  useEffect(() => {
    // ✅ Only check admin once
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

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin check
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ✅ Main App Routes with stable splash
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(false);
  const splashShown = useRef(false);

  // ✅ Only show splash once
  useEffect(() => {
    // Don't show splash if authenticated or on auth pages
    if (isAuthenticated || loading) {
      setShowSplash(false);
      return;
    }

    // Only show splash on landing page and only once
    const isLanding = location.pathname === '/';
    if (isLanding && !splashShown.current) {
      splashShown.current = true;
      setShowSplash(true);
      
      const hasVisited = localStorage.getItem('kumsika_has_visited');
      const duration = hasVisited === 'true' ? 600 : 2500;
      
      const timer = setTimeout(() => {
        setShowSplash(false);
        if (hasVisited !== 'true') {
          localStorage.setItem('kumsika_has_visited', 'true');
        }
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loading, location.pathname]);

  // Loading state
  if (loading) {
    return <PageLoader />;
  }

  // Show splash
  if (showSplash && !isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <SplashScreen />
      </Suspense>
    );
  }

  // ✅ Routes
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<Search />} />
        <Route path="/listing/:id" element={<ListingDetails />} />

        {/* Protected Routes */}
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

        {/* 404 */}
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