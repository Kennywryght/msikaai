// mobile/src/components/Layout.jsx
import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ 
  children, 
  className = '', 
  showFooter = true,
  showNavbar = true,
  container = true,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {showNavbar && <Navbar />}
      
      <main className={`flex-1 ${container ? 'container' : ''} py-6 ${className}`}>
        {children}
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;