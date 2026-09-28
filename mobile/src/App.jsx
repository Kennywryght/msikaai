// mobile/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TranslationProvider } from './context/TranslationContext';
import { ToastProvider } from './components/ToastContainer';
import Navbar from './components/Navbar';
import { usePublishPresence } from './hooks/usePresence';
import './styles/global.css';
import './index.css';

import SplashScreen from './pages/SplashScreen';
import About from './pages/About';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';
import PaymentCallback from './pages/PaymentCallback';
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

function PresencePublisher() {
  const { user } = useAuth();
  usePublishPresence(user?.id);
  return null;
}

const ONBOARDING_EXEMPT_PATHS = ['/role-selection', '/profile-setup'];

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authInitialized, user } = useAuth();
  const location = useLocation();

  if (!authInitialized) return children;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  const needsOnboarding = !user?.onboarding_completed;
  const isExemptPath = ONBOARDING_EXEMPT_PATHS.includes(location.pathname);

  if (needsOnboarding && !isExemptPath) {
    return <Navigate to="/role-selection" replace />;
  }

  return children;
};

const VerifiedRoute = ({ children }) => {
  const { isAuthenticated, isVerified, authInitialized } = useAuth();
  const location = useLocation();

  if (!authInitialized) return children;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname + location.search,
          reason: 'verify',
        }}
        replace
      />
    );
  }

  if (!isVerified) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname + location.search,
          reason: 'verify',
        }}
        replace
      />
    );
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isVerified, authInitialized } = useAuth();
  const location = useLocation();

  if (!authInitialized) return children;

  if (isVerified) {
    const from = location.state?.from;
    return <Navigate to={from || '/landing'} replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, authInitialized, isAdmin } = useAuth();
  const location = useLocation();

  if (!authInitialized) return children;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  if (!isAdmin()) return <Navigate to="/landing" replace />;

  return children;
};

const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavbar = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/update-password',
  ].includes(location.pathname);
  if (hideNavbar) return children;
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '60px' }}>{children}</div>
    </>
  );
};

function AppRoutes() {
  const { authInitialized } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const splashTimer = React.useRef(null);

  useEffect(() => {
    splashTimer.current = setTimeout(() => setMinTimeElapsed(true), 600);
    return () => {
      if (splashTimer.current) clearTimeout(splashTimer.current);
    };
  }, []);

  const showSplash = !authInitialized || !minTimeElapsed;
  if (showSplash) return <SplashScreen onComplete={() => setMinTimeElapsed(true)} />;

  return (
    <Routes>
      {/* ---------- Auth pages (public) ---------- */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route
        path="/forgot-password"
        element={<PublicRoute><ForgotPassword /></PublicRoute>}
      />
      <Route path="/update-password" element={<UpdatePassword />} />

      {/* ---------- Payment callback (auth-aware, not wrapped) ---------- */}
      <Route path="/payment/callback" element={<PaymentCallback />} />

      {/* ---------- PUBLIC BROWSE ROUTES ---------- */}
      <Route path="/landing" element={<Layout><Landing /></Layout>} />
      <Route path="/search" element={<Layout><Search /></Layout>} />
      <Route path="/search-results" element={<Layout><SearchResults /></Layout>} />
      <Route path="/category/:category" element={<Layout><CategoryBrowse /></Layout>} />
      <Route path="/listing/:id" element={<Layout><ListingDetails /></Layout>} />

      {/* ---------- ROOT ---------- */}
      <Route path="/" element={<Navigate to="/landing" replace />} />

      {/* ---------- PROTECTED (any session) ---------- */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/admin/*" element={<AdminRoute><Layout><AdminDashboard /></Layout></AdminRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><EditProfile /></Layout></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Layout><Messages /></Layout></ProtectedRoute>} />
      <Route path="/chat/:id" element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
      <Route path="/my-reservations" element={<ProtectedRoute><Layout><MyReservations /></Layout></ProtectedRoute>} />
      <Route path="/incoming-requests" element={<ProtectedRoute><Layout><IncomingRequests /></Layout></ProtectedRoute>} />
      <Route path="/rating-review/:transactionId" element={<ProtectedRoute><Layout><RatingReview /></Layout></ProtectedRoute>} />
      <Route path="/price-board" element={<ProtectedRoute><Layout><PriceBoard /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
      <Route path="/about" element={<ProtectedRoute><Layout><About /></Layout></ProtectedRoute>} />

      {/* ---------- VERIFIED ONLY ---------- */}
      <Route path="/role-selection" element={<VerifiedRoute><Layout><RoleSelection /></Layout></VerifiedRoute>} />
      <Route path="/profile-setup" element={<VerifiedRoute><Layout><ProfileSetup /></Layout></VerifiedRoute>} />
      <Route path="/create-listing" element={<VerifiedRoute><Layout><CreateListing /></Layout></VerifiedRoute>} />
      <Route path="/ai-search" element={<VerifiedRoute><Layout><AISearch /></Layout></VerifiedRoute>} />
      <Route path="/voice-listing" element={<VerifiedRoute><Layout><VoiceListing /></Layout></VerifiedRoute>} />
      <Route path="/ad-generator" element={<VerifiedRoute><Layout><AdGenerator /></Layout></VerifiedRoute>} />
      <Route path="/post-stock" element={<VerifiedRoute><Layout><PostStock /></Layout></VerifiedRoute>} />

      {/* 404 */}
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <TranslationProvider>
          <BrowserRouter>
            <PresencePublisher />
            <AppRoutes />
          </BrowserRouter>
        </TranslationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;