// mobile/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import { ToastProvider } from './components/ToastContainer';
import Navbar from './components/Navbar';
import { usePublishPresence } from './hooks/usePresence'; // ✅ NEW
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
import RoleSelection from './pages/RoleSelection';
import ProfileSetup from './pages/ProfileSetup';
import CreateListing from './pages/CreateListing';
import Search from './pages/Search';
import SearchResults from './pages/SearchResults';
import CategoryBrowse from './pages/CategoryBrowse';
import ListingDetails from './pages/ListingDetails';
import AISearch from './pages/AISearch';
import VoiceListing from './pages/VoiceListing';
import AdGenerator from './pages/AdGenerator';
import EditProfile from './pages/EditProfile';
import Chat from './pages/Chat';
import Messages from './pages/Messages';
import MyReservations from './pages/MyReservations';
import IncomingRequests from './pages/IncomingRequests';
import RatingReview from './pages/RatingReview';
import PriceBoard from './pages/PriceBoard';
import PostStock from './pages/PostStock';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';

// ============================================================
// ✅ PRESENCE PUBLISHER
// Publishes the current user's online status globally, so any
// other user viewing a chat with them sees a green dot.
// Rendered once inside AuthProvider so it can read `user`.
// ============================================================
function PresencePublisher() {
  const { user } = useAuth();
  usePublishPresence(user?.id);
  return null;
}

// ============================================================
// PROTECTED ROUTE
// ============================================================
const ONBOARDING_EXEMPT_PATHS = ['/role-selection', '/profile-setup'];

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authInitialized, user } = useAuth();
  const location = useLocation();

  if (!authInitialized) {
    return children;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const needsOnboarding = !user?.onboarding_completed;
  const isExemptPath = ONBOARDING_EXEMPT_PATHS.includes(location.pathname);

  if (needsOnboarding && !isExemptPath) {
    return <Navigate to="/role-selection" replace />;
  }

  return children;
};

// ============================================================
// PUBLIC ROUTE
// ============================================================
const PublicRoute = ({ children }) => {
  const { isAuthenticated, authInitialized } = useAuth();

  if (!authInitialized) {
    return children;
  }

  if (isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  return children;
};

// ============================================================
// ADMIN ROUTE
// ============================================================
const AdminRoute = ({ children }) => {
  const { isAuthenticated, authInitialized, isAdmin } = useAuth();

  if (!authInitialized) {
    return children;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/landing" replace />;
  }

  return children;
};

// ============================================================
// LAYOUT WRAPPER
// ============================================================
const Layout = ({ children }) => {
  const location = useLocation();

  const hideNavbar = ['/', '/login', '/register'].includes(location.pathname);

  if (hideNavbar) {
    return children;
  }

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '60px' }}>{children}</div>
    </>
  );
};

// ============================================================
// APP ROUTES
// ============================================================
function AppRoutes() {
  const { authInitialized } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const splashTimer = React.useRef(null);

  useEffect(() => {
    splashTimer.current = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 600);

    return () => {
      if (splashTimer.current) {
        clearTimeout(splashTimer.current);
      }
    };
  }, []);

  const showSplash = !authInitialized || !minTimeElapsed;

  if (showSplash) {
    return <SplashScreen onComplete={() => setMinTimeElapsed(true)} />;
  }

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

      {/* Protected Routes - With Navbar */}
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
          <AdminRoute>
            <Layout>
              <AdminDashboard />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/role-selection"
        element={
          <ProtectedRoute>
            <Layout>
              <RoleSelection />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfileSetup />
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
        path="/search-results"
        element={
          <ProtectedRoute>
            <Layout>
              <SearchResults />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/category/:category"
        element={
          <ProtectedRoute>
            <Layout>
              <CategoryBrowse />
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
        path="/messages"
        element={
          <ProtectedRoute>
            <Layout>
              <Messages />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <Chat />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-reservations"
        element={
          <ProtectedRoute>
            <Layout>
              <MyReservations />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/incoming-requests"
        element={
          <ProtectedRoute>
            <Layout>
              <IncomingRequests />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rating-review/:transactionId"
        element={
          <ProtectedRoute>
            <Layout>
              <RatingReview />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/price-board"
        element={
          <ProtectedRoute>
            <Layout>
              <PriceBoard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/post-stock"
        element={
          <ProtectedRoute>
            <Layout>
              <PostStock />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <Notifications />
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

      {/* 404 */}
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
            {/* ✅ NEW: publish current user's presence globally */}
            <PresencePublisher />
            <AppRoutes />
          </BrowserRouter>
        </TranslationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;