// mobile/src/App.jsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import LoadingSpinner from './components/LoadingSpinner';
import './index.css';

// Lazy load pages for better performance
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

// Loading fallback component
const PageLoader = () => <LoadingSpinner message="Loading page..." />;

// Protected Route component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  useEffect(() => {
    if (adminOnly && user) {
      setCheckingAdmin(true);
      // Check if user is admin
      import('./lib/supabase').then(({ supabase }) => {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setIsAdmin(data?.role === 'admin');
            setCheckingAdmin(false);
          })
          .catch(() => {
            setIsAdmin(false);
            setCheckingAdmin(false);
          });
      });
    }
  }, [adminOnly, user]);

  if (loading || checkingAdmin) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    console.log('🔒 Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    console.log('🔒 Not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('✅ Authenticated, showing protected content');
  return children;
};

function AppRoutes() {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('msikaai_has_visited');
    
    // If has visited, skip splash after a brief moment
    if (hasVisited) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // First time visitor - show splash for 4 seconds
      const timer = setTimeout(() => {
        setShowSplash(false);
        localStorage.setItem('msikaai_has_visited', 'true');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Show splash screen
  if (showSplash) {
    return (
      <Suspense fallback={<PageLoader />}>
        <SplashScreen />
      </Suspense>
    );
  }

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
        
        {/* Onboarding Route - Accessible after registration */}
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
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
        
        {/* 404 Not Found - Always last */}
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