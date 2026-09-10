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
// PROTECTED ROUTE - Instant redirect, no loading
// Also gates unfinished onboarding. NOTE: `register()` in
// AuthContext always defaults `role` to 'buyer' at signup, so
// role is never null/unset — it can't be used to detect "hasn't
// chosen a role yet". `onboarding_completed` (false at signup,
// flipped to true once the flow finishes) is the only reliable
// signal, so that's the single gate below. Entry point for an
// incomplete onboarding is /role-selection, which hands off to
// /profile-setup and finishes by calling
// updateProfile({ onboarding_completed: true }).
// (Onboarding.jsx / the old /onboarding route was a separate,
// unreachable buy-vs-sell chooser from an earlier iteration —
// removed here; delete the file itself once confirmed unused
// elsewhere.)
// ============================================================
const ONBOARDING_EXEMPT_PATHS = ['/role-selection', '/profile-setup'];

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authInitialized, user } = useAuth();
  const location = useLocation();

  if (!authInitialized) {
    return children; // ✅ Render children immediately, no loading
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
// ADMIN ROUTE - Requires authentication AND an admin role
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
// APP ROUTES
// Splash now waits on auth to actually resolve instead of a
// fixed timer, so an already-authenticated user isn't forced
// to sit through 2 seconds on every open.
// ============================================================
function AppRoutes() {
  const { authInitialized } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const splashTimer = React.useRef(null);

  // Keep a short minimum splash so the logo isn't a single-frame
  // flash on fast connections, but never block longer than auth needs.
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