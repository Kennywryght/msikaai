// mobile/src/App.jsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TrustProvider } from './context/TrustContext';
import { TranslationProvider } from './context/TranslationContext';
import { ToastProvider } from './components/ToastContainer';
import Navbar from './components/Navbar';
import { usePublishPresence } from './hooks/usePresence';
import './styles/global.css';
import './index.css';

import SplashScreen from './pages/SplashScreen';
// Pages load on demand so the first visit only downloads the home page.
const About = lazy(() => import('./pages/About'));
import Landing from './pages/Landing';
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const RoleSelection = lazy(() => import('./pages/RoleSelection'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const CreateListing = lazy(() => import('./pages/CreateListing'));
const Search = lazy(() => import('./pages/Search'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const CategoryBrowse = lazy(() => import('./pages/CategoryBrowse'));
const ListingDetails = lazy(() => import('./pages/ListingDetails'));
const AISearch = lazy(() => import('./pages/AISearch'));
const VoiceListing = lazy(() => import('./pages/VoiceListing'));
const AdGenerator = lazy(() => import('./pages/AdGenerator'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Chat = lazy(() => import('./pages/Chat'));
const Messages = lazy(() => import('./pages/Messages'));
const MyReservations = lazy(() => import('./pages/MyReservations'));
const IncomingRequests = lazy(() => import('./pages/IncomingRequests'));
const RatingReview = lazy(() => import('./pages/RatingReview'));
const PriceBoard = lazy(() => import('./pages/PriceBoard'));
const PostStock = lazy(() => import('./pages/PostStock'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Phase 3G
const TrustProfile = lazy(() => import('./pages/TrustProfile'));

// Phase 3H
const VerifyPhone = lazy(() => import('./pages/VerifyPhone'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const VerifyID = lazy(() => import('./pages/VerifyID'));
const VerifyBusiness = lazy(() => import('./pages/VerifyBusiness'));

// Phase 3I
const AdminVerifications = lazy(() => import('./pages/AdminVerifications'));
const AdminManage = lazy(() => import('./pages/AdminManage'));

// Phase 5F + 5H
const Requests = lazy(() => import('./pages/Requests'));
const RequestDetail = lazy(() => import('./pages/RequestDetail'));

// Phase 5G
const CreateRequest = lazy(() => import('./pages/CreateRequest'));

// ★ PHASE 6F-6H
const Deliveries = lazy(() => import('./pages/Deliveries'));
const CreateDelivery = lazy(() => import('./pages/CreateDelivery'));
const DeliveryDetail = lazy(() => import('./pages/DeliveryDetail'));
const DeliveryEarnings = lazy(() => import('./pages/DeliveryEarnings'));

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
      <div style={{ paddingTop: '68px' }}>{children}</div>
    </>
  );
};

// Shown for the split second a page's code is downloading.
const PageLoader = () => (
  <div role="status" aria-label="Loading" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="page-loader-spinner" />
    <style>{`.page-loader-spinner{width:32px;height:32px;border-radius:50%;border:3px solid var(--color-border,#E2E8F0);border-top-color:var(--color-primary,#1E3A8A);animation:pl-spin .8s linear infinite}@keyframes pl-spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.page-loader-spinner{animation-duration:2s}}`}</style>
  </div>
);

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
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ---------- Auth pages (public) ---------- */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route
        path="/forgot-password"
        element={<PublicRoute><ForgotPassword /></PublicRoute>}
      />
      <Route path="/update-password" element={<UpdatePassword />} />

      {/* ---------- Payment callback ---------- */}
      <Route path="/payment/callback" element={<PaymentCallback />} />

      {/* ---------- PUBLIC BROWSE ROUTES ---------- */}
      <Route path="/landing" element={<Layout><Landing /></Layout>} />
      <Route path="/search" element={<Layout><Search /></Layout>} />
      <Route path="/search-results" element={<Layout><SearchResults /></Layout>} />
      <Route path="/category/:category" element={<Layout><CategoryBrowse /></Layout>} />
      <Route path="/listing/:id" element={<Layout><ListingDetails /></Layout>} />

      {/* ---------- REQUESTS ---------- */}
      <Route path="/requests" element={<Layout><Requests /></Layout>} />
      <Route path="/requests/:id" element={<Layout><RequestDetail /></Layout>} />

      {/* ★ PHASE 6F + 6G + 6H: Deliveries (public feed & detail) */}
      <Route path="/deliveries" element={<Layout><Deliveries /></Layout>} />
      <Route path="/deliveries/new" element={<Layout><CreateDelivery /></Layout>} />
      <Route path="/deliveries/earnings" element={<Layout><DeliveryEarnings /></Layout>} />
      <Route path="/deliveries/:id" element={<Layout><DeliveryDetail /></Layout>} />

      {/* ---------- ROOT ---------- */}
      <Route path="/" element={<Navigate to="/landing" replace />} />

      {/* ---------- PROTECTED (any session) ---------- */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />

      {/* Admin — specific route first, then wildcard */}
      <Route path="/admin/verifications" element={<AdminRoute><Layout><AdminVerifications /></Layout></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><Layout><AdminManage section="users" /></Layout></AdminRoute>} />
      <Route path="/admin/listings" element={<AdminRoute><Layout><AdminManage section="listings" /></Layout></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><Layout><AdminManage section="reports" /></Layout></AdminRoute>} />
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

      {/* ---------- TRUST ---------- */}
      <Route path="/trust" element={<ProtectedRoute><Layout><TrustProfile /></Layout></ProtectedRoute>} />
      <Route path="/trust/:userId" element={<ProtectedRoute><Layout><TrustProfile /></Layout></ProtectedRoute>} />

      {/* ---------- VERIFICATION FLOWS ---------- */}
      <Route path="/verify-phone" element={<ProtectedRoute><Layout><VerifyPhone /></Layout></ProtectedRoute>} />
      <Route path="/verify-email" element={<Layout><VerifyEmail /></Layout>} />
      <Route path="/verify-id" element={<ProtectedRoute><Layout><VerifyID /></Layout></ProtectedRoute>} />
      <Route path="/verify-business" element={<ProtectedRoute><Layout><VerifyBusiness /></Layout></ProtectedRoute>} />

      {/* ---------- VERIFIED ONLY ---------- */}
      <Route path="/role-selection" element={<VerifiedRoute><Layout><RoleSelection /></Layout></VerifiedRoute>} />
      <Route path="/profile-setup" element={<VerifiedRoute><Layout><ProfileSetup /></Layout></VerifiedRoute>} />
      <Route path="/create-listing" element={<VerifiedRoute><Layout><CreateListing /></Layout></VerifiedRoute>} />
      <Route path="/listing/:id/edit" element={<ProtectedRoute><Layout><CreateListing /></Layout></ProtectedRoute>} />
      <Route path="/ai-search" element={<VerifiedRoute><Layout><AISearch /></Layout></VerifiedRoute>} />
      <Route path="/voice-listing" element={<VerifiedRoute><Layout><VoiceListing /></Layout></VerifiedRoute>} />
      <Route path="/ad-generator" element={<VerifiedRoute><Layout><AdGenerator /></Layout></VerifiedRoute>} />
      <Route path="/post-stock" element={<VerifiedRoute><Layout><PostStock /></Layout></VerifiedRoute>} />

      <Route path="/create-request" element={<VerifiedRoute><Layout><CreateRequest /></Layout></VerifiedRoute>} />

      {/* 404 */}
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <TrustProvider>
          <TranslationProvider>
            <BrowserRouter>
              <PresencePublisher />
              <AppRoutes />
            </BrowserRouter>
          </TranslationProvider>
        </TrustProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
