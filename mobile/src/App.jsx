// mobile/src/App.jsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

// ✅ FIXED: Protected Route with proper auth check
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
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
      setCheckingAdmin(false);
    };

    if (user) {
      checkAdmin();
    } else {
      setCheckingAdmin(false);
    }
  }, [user, adminOnly]);

  // Show loading while checking
  if (loading || checkingAdmin) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check admin access
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [splashDone, setSplashDone] = useState(false);

  // ✅ FIXED: Splash screen logic - only show once
  useEffect(() => {
    const hasVisited = localStorage.getItem('kumsika_has_visited');
    
    if (hasVisited) {
      // Already visited, show splash briefly
      const timer = setTimeout(() => {
        setShowSplash(false);
        setSplashDone(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // First visit - show splash for 3 seconds
      const timer = setTimeout(() => {
        setShowSplash(false);
        setSplashDone(true);
        localStorage.setItem('kumsika_has_visited', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // ✅ FIXED: Don't show splash if already done
  if (showSplash && !splashDone) {
    return (
      <Suspense fallback={<PageLoader />}>
        <SplashScreen />
      </Suspense>
    );
  }

  // ✅ FIXED: Show loading only during auth check
  if (loading) {
    return <LoadingSpinner message="Loading your account..." />;
  }

  // ✅ FIXED: If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
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

  // ✅ FIXED: Not authenticated - show public routes
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