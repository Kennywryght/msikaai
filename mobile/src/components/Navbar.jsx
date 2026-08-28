// mobile/src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import LanguageToggle from './LanguageToggle';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
  };

  const navLinks = [
    { path: '/search', label: 'Browse' },
    { path: '/ai-search', label: 'AI Search' },
    { path: '/create-listing', label: 'Sell' },
  ];

  return (
    <nav className="navbar glass sticky top-0 z-50 border-b border-white/10">
      <div className="container flex items-center justify-between w-full">
        {/* Logo */}
        <Link to="/" className="navbar-brand group">
          <div className="w-9 h-9 bg-gradient-accent rounded-lg flex items-center justify-center text-champion-blue font-bold text-lg transition-transform group-hover:scale-105">
            M
          </div>
          <span className="text-xl font-bold tracking-tight">
            Msika<span>AI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {user && (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-gray-600 hover:text-champion-blue transition-colors font-medium text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <LanguageToggle />
          
          {user && <NotificationBell />}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="User menu"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-accent flex items-center justify-center text-champion-blue font-bold text-sm">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 animate-slide-down origin-top-right">
                  <Link 
                    to="/dashboard" 
                    className="block px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/edit-profile" 
                    className="block px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link 
                    to="/create-listing" 
                    className="block px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Create Listing
                  </Link>
                  <Link 
                    to="/ad-generator" 
                    className="block px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Ad Generator
                  </Link>
                  {user?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="block px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm text-lavender-tonic"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm text-red-600"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-gray-600 hover:text-champion-blue transition-colors font-medium text-sm">
                {t('login') || 'Login'}
              </Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">
                {t('signup') || 'Sign Up'}
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white p-4 space-y-2 animate-slide-down">
          {user ? (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block py-2.5 px-4 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-gray-100" />
              <Link 
                to="/dashboard" 
                className="block py-2.5 px-4 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/edit-profile" 
                className="block py-2.5 px-4 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full text-left py-2.5 px-4 hover:bg-gray-50 rounded-lg transition-colors text-red-600"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="block py-2.5 px-4 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="block py-2.5 px-4 btn-primary text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;