// mobile/src/App.jsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
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

// ============================================================
// ✅ NO LOADING SPINNER - Just render null
// ============================================================
const PageLoader = () => null;

// ============================================================
// PROTECTED ROUTE
// ============================================================
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, authInitialized } = useAuth();
  const location = useLocation();

  if (loading || !authInitialized) {
    return null;
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
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  return children;
};

// ============================================================
// ✅ LAYOUT WRAPPER - Controls Navbar visibility
// ============================================================
const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Pages where Navbar should NOT show
  const hideNavbar = ['/', '/login', '/register'].includes(location.pathname);
  
  // If it's a page that should hide the navbar, just return children
  if (hideNavbar) {
    return children;
  }

  // For all other pages, show the Navbar
  return (
    <>
      {/* ✅ Only ONE navbar for the entire app */}
      <Navbar />
      <div style={{ paddingTop: '60px' }}>
        {children}
      </div>
    </>
  );
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

  // Splash screen - NO NAVBAR, NO SPINNER
  if (phase === 'splash') {
    return (
      <Suspense fallback={null}>
        <SplashScreen onComplete={handleSplashComplete} />
      </Suspense>
    );
  }

  // Bridge phase - NO SPINNER
  if (phase === 'bridge') {
    return null;
  }

  // Ready phase
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Public Routes - No Navbar */}
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

        {/* Protected Routes - With Navbar (via Layout) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout>
                <Navigate to="/landing" replace />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/landing" 
          element={
            <ProtectedRoute>
              <Layout>
                <Landing />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <Layout>
                <Onboarding />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-listing" 
          element={
            <ProtectedRoute>
              <Layout>
                <CreateListing />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/search" 
          element={
            <ProtectedRoute>
              <Layout>
                <Search />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/listing/:id" 
          element={
            <ProtectedRoute>
              <Layout>
                <ListingDetails />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ai-search" 
          element={
            <ProtectedRoute>
              <Layout>
                <AISearch />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/voice-listing" 
          element={
            <ProtectedRoute>
              <Layout>
                <VoiceListing />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ad-generator" 
          element={
            <ProtectedRoute>
              <Layout>
                <AdGenerator />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout>
                <EditProfile />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/about" 
          element={
            <ProtectedRoute>
              <Layout>
                <About />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* 404 - With Navbar */}
        <Route 
          path="*" 
          element={
            <Layout>
              <NotFound />
            </Layout>
          } 
        />
      </Routes>
    </Suspense>
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