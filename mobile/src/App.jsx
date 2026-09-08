// mobile/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import { ToastProvider } from './components/ToastContainer';
import Navbar from './components/Navbar';
import './styles/global.css';
import './index.css';

// ✅ Import pages directly (no lazy loading)
import SplashScreen from './pages/SplashScreen';
import About from './pages/About';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Onboarding from './pages/Onboarding';
import CreateListing from './pages/CreateListing';
import Search from './pages/Search';
import ListingDetails from './pages/ListingDetails';
import AISearch from './pages/AISearch';
import VoiceListing from './pages/VoiceListing';
import AdGenerator from './pages/AdGenerator';
import EditProfile from './pages/EditProfile';
import NotFound from './pages/NotFound';

// ============================================================
// PROTECTED ROUTE - Instant redirect, no loading
// ============================================================
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authInitialized } = useAuth();

  if (!authInitialized) {
    return children; // ✅ Render children immediately, no loading
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ============================================================
// PUBLIC ROUTE - Instant redirect, no loading
// ============================================================
const PublicRoute = ({ children }) => {
  const { isAuthenticated, authInitialized } = useAuth();

  if (!authInitialized) {
    return children; // ✅ Render children immediately, no loading
  }

  if (isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  return children;
};

// ============================================================
// LAYOUT WRAPPER - Controls Navbar visibility
// ============================================================
const Layout = ({ children }) => {
  const location = useLocation();
  
  // Pages where Navbar should NOT show
  const hideNavbar = ['/', '/login', '/register'].includes(location.pathname);
  
  if (hideNavbar) {
    return children;
  }

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '60px' }}>
        {children}
      </div>
    </>
  );
};

// ============================================================
// APP ROUTES - No splash screen, instant loading
// ============================================================
function AppRoutes() {
  const { authInitialized } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const splashTimer = React.useRef(null);

  // Show splash screen for 2 seconds, then hide
  useEffect(() => {
    splashTimer.current = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => {
      if (splashTimer.current) {
        clearTimeout(splashTimer.current);
      }
    };
  }, []);

  // Show splash screen while it's visible
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // ✅ Ready phase - Direct rendering, NO loading spinners
  return (
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