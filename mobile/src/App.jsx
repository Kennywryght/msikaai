// mobile/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
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
import LoadingSpinner from './components/LoadingSpinner';
import './index.css';

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
    return <SplashScreen />;
  }

  return (
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