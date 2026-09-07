// mobile/src/App.jsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import LoadingSpinner from './components/LoadingSpinner';
import { ToastProvider } from './components/ToastContainer';
import Navbar from './components/Navbar';
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

const PageLoader = ({ message }) => <LoadingSpinner fullScreen message={message || 'Loading page...'} />;

// ============================================================
// PROTECTED ROUTE
// ============================================================
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, authInitialized } = useAuth();
  const location = useLocation();

  if (loading || !authInitialized) {
    return <PageLoader message="Verifying your session..." />;
  }

  if (!isAuthenticated) {
    sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// ============================================================
// PUBLIC ROUTE
// ============================================================
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, authInitialized } = useAuth();

  if (loading || !authInitialized) {
    return <PageLoader message="Loading..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  return children;
};

// ============================================================
// APP ROUTES
// ============================================================
function AppRoutes() {
  const { loading: authLoading } = useAuth();
  const [phase, setPhase] = useState('splash');
  const splashStarted = React.useRef(false);
  const splashComplete = React.useRef(false);

  const SPLASH_MIN_MS = 2000;
  const MAX_BRIDGE_MS = 4000;

  const handleSplashComplete = () => {
    splashComplete.current = true;
    setPhase('bridge');
  };

  useEffect(() => {
    if (splashStarted.current) return;
    splashStarted.current = true;

    const fallbackTimer = setTimeout(() => {
      if (!splashComplete.current) {
        setPhase('bridge');
      }
    }, SPLASH_MIN_MS + 2000);

    return () => clearTimeout(fallbackTimer);
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
        <SplashScreen onComplete={handleSplashComplete} />
      </Suspense>
    );
  }

  if (phase === 'bridge') {
    return <PageLoader message="Preparing your marketplace..." />;
  }

  return (
    <>
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ✅ Public Routes - Only accessible when NOT logged in */}
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

          {/* ✅ Protected Routes - Require Authentication */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Navigate to="/landing" replace />  {/* ✅ Changed to /landing */}
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/landing" 
            element={
              <ProtectedRoute>
                <Landing />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute>
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
            path="/search" 
            element={
              <ProtectedRoute>
                <Search />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/listing/:id" 
            element={
              <ProtectedRoute>
                <ListingDetails />
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
            path="/profile" 
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/about" 
            element={
              <ProtectedRoute>
                <About />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

// ============================================================
// MAIN APP
// ============================================================
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <TranslationProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TranslationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;