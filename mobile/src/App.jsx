// mobile/src/App.jsx
import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import LoadingSpinner from './components/LoadingSpinner';
import { ToastProvider } from './components/ToastContainer';
import { supabase } from './lib/supabase';
import './styles/global.css';
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

const PageLoader = ({ message }) => <LoadingSpinner message={message || 'Loading page...'} />;

// ============================================
// PUBLIC ROUTE - Redirects to dashboard if logged in
// ============================================
const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (isAuthenticated && user) {
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl && redirectUrl !== '/login' && redirectUrl !== '/register') {
      sessionStorage.removeItem('redirectAfterLogin');
      return <Navigate to={redirectUrl} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ============================================
// PROTECTED ROUTE - Requires authentication
// ============================================
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const adminCheckDone = useRef(false);

  useEffect(() => {
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

  if (loading || checkingAdmin) {
    return <PageLoader />;
  }

  if (!isAuthenticated || !user) {
    sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ============================================
// APP ROUTES
// ============================================
function AppRoutes() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [phase, setPhase] = useState('splash');
  const splashStarted = useRef(false);

  const SPLASH_MIN_MS = 2500;
  const MAX_BRIDGE_MS = 4000;

  useEffect(() => {
    if (splashStarted.current) return;
    splashStarted.current = true;

    const splashTimer = setTimeout(() => {
      setPhase('bridge');
    }, SPLASH_MIN_MS);

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (phase !== 'bridge') return;

    if (!authLoading) {
      setPhase('ready');
      return;
    }

    const failSafe = setTimeout(() => setPhase('ready'), MAX_BRIDGE_MS);
    return () => clearTimeout(failSafe);
  }, [phase, authLoading]);

  if (phase === 'splash') {
    return (
      <Suspense fallback={<PageLoader />}>
        <SplashScreen />
      </Suspense>
    );
  }

  if (phase === 'bridge') {
    return <PageLoader message="Preparing your marketplace..." />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        
        <Route path="/about" element={<About />} />
        <Route path="/search" element={<Search />} />
        <Route path="/listing/:id" element={<ListingDetails />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-listing" 
          element={
            <ProtectedRoute>
              <CreateListing />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ai-search" 
          element={
            <ProtectedRoute>
              <AISearch />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/voice-listing" 
          element={
            <ProtectedRoute>
              <VoiceListing />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ad-generator" 
          element={
            <ProtectedRoute>
              <AdGenerator />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/edit-profile" 
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

// ============================================
// MAIN APP
// ============================================
function App() {
  return (
    <AuthProvider>
      <TranslationProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </TranslationProvider>
    </AuthProvider>
  );
}

export default App;
