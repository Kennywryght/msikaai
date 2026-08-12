// mobile/src/App.jsx - COMPLETE REWRITE
import React, { useState, useEffect, Suspense, lazy } from 'react';
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

// ✅ SIMPLIFIED: Protected Route
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      if (adminOnly && user) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (mounted) setIsAdmin(data?.role === 'admin');
        } catch (error) {
          console.error('Admin check error:', error);
          if (mounted) setIsAdmin(false);
        }
      }
      if (mounted) setCheckingAdmin(false);
    };

    if (user) {
      checkAdmin();
    } else {
      setCheckingAdmin(false);
    }

    return () => { mounted = false; };
  }, [user, adminOnly]);

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

// ✅ SIMPLIFIED: Main App Routes
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // ✅ SIMPLIFIED: Single splash check
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash if not authenticated and not on login/register
    const shouldShow = !isAuthenticated && 
      !location.pathname.includes('/login') && 
      !location.pathname.includes('/register');
    return shouldShow;
  });

  useEffect(() => {
    // If user is authenticated, skip splash
    if (isAuthenticated) {
      setShowSplash(false);
      return;
    }

    // Only show splash on landing page
    const isLanding = location.pathname === '/';
    if (isLanding) {
      const hasVisited = localStorage.getItem('kumsika_has_visited');
      if (hasVisited === 'true') {
        // Quick splash for returning users
        setShowSplash(true);
        const timer = setTimeout(() => setShowSplash(false), 800);
        return () => clearTimeout(timer);
      } else {
        // Full splash for new users
        setShowSplash(true);
        const timer = setTimeout(() => {
          setShowSplash(false);
          localStorage.setItem('kumsika_has_visited', 'true');
        }, 2500);
        return () => clearTimeout(timer);
      }
    } else {
      setShowSplash(false);
    }
  }, [isAuthenticated, location.pathname]);

  // Loading state
  if (loading) {
    return <PageLoader />;
  }

  // Show splash
  if (showSplash) {
    return (
      <Suspense fallback={<PageLoader />}>
        <SplashScreen />
      </Suspense>
    );
  }

  // ✅ SIMPLIFIED: Routes
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