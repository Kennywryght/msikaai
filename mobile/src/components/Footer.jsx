// mobile/src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 18, color = 'currentColor', strokeWidth = 1.75, fill = 'none' }) => {
  const icons = {
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
    mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
    phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
    facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
    twitter: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
    instagram: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M7.5 21.5h9a4 4 0 004-4v-11a4 4 0 00-4-4h-9a4 4 0 00-4 4v11a4 4 0 004 4z",
    whatsapp: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
    globe: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
    arrowRight: "M5 12h14M12 5l7 7-7 7",
  };

  const d = icons[name] || icons.mapPin;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
};

// ============================================================
// FOOTER COMPONENT
// ============================================================
const Footer = () => {
  const currentYear = new Date().getFullYear();

  const linkSections = [
    {
      title: 'Marketplace',
      links: [
        { label: 'Browse Listings', to: '/search' },
        { label: 'Sell on Kumsika', to: '/create-listing' },
        { label: 'AI Search', to: '/ai-search' },
        { label: 'Price Board', to: '/price-board' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', to: '/help' },
        { label: 'Contact Us', to: '/contact' },
        { label: 'Report a Problem', to: '/report' },
        { label: 'About Us', to: '/about' },
      ],
    },
  ];

  const socialLinks = [
    { name: 'facebook', href: 'https://facebook.com/kumsika', label: 'Facebook' },
    { name: 'twitter', href: 'https://twitter.com/kumsika', label: 'Twitter' },
    { name: 'instagram', href: 'https://instagram.com/kumsika', label: 'Instagram' },
    { name: 'whatsapp', href: 'https://wa.me/265888921110', label: 'WhatsApp' },
  ];

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Main Content */}
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <div className="footer-logo">
              <div className="footer-logo-icon">K</div>
              <span className="footer-logo-text">
                Ku<span className="footer-logo-accent">msika</span>
              </span>
            </div>
            <p className="footer-tagline">
              Malawi's smart local marketplace — connecting buyers, sellers, and tradespeople in Mitundu.
            </p>

            {/* Contact Info */}
            <div className="footer-contact">
              <a href="mailto:hello@kumsika.com" className="footer-contact-item">
                <Icon name="mail" size={14} color="#94A3B8" strokeWidth={1.75} />
                <span>hello@kumsika.com</span>
              </a>
              <a href="https://wa.me/265888921110" target="_blank" rel="noopener noreferrer" className="footer-contact-item">
                <Icon name="phone" size={14} color="#94A3B8" strokeWidth={1.75} />
                <span>+265 888 921 110</span>
              </a>
              <div className="footer-contact-item">
                <Icon name="mapPin" size={14} color="#94A3B8" strokeWidth={1.75} />
                <span>Mitundu, Malawi</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="footer-social">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-btn"
                  aria-label={social.label}
                >
                  <Icon name={social.name} size={16} color="#94A3B8" strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          <div className="footer-links-col">
            {linkSections.map((section) => (
              <div key={section.title} className="footer-links-group">
                <h3 className="footer-links-title">{section.title}</h3>
                <ul className="footer-links-list">
                  {section.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="footer-link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} Kumsika. Made with ❤️ for Malawi 🇲🇼
          </p>
          <div className="footer-legal">
            <Link to="/privacy" className="footer-legal-link">Privacy</Link>
            <span className="footer-legal-divider">·</span>
            <Link to="/terms" className="footer-legal-link">Terms</Link>
            <span className="footer-legal-divider">·</span>
            <Link to="/cookies" className="footer-legal-link">Cookies</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: linear-gradient(180deg, #1E293B 0%, #0F172A 100%);
          color: #FFFFFF;
          margin-top: 40px;
        }

        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px 20px;
        }

        /* ===== MAIN GRID ===== */
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }

        @media (min-width: 640px) {
          .footer-grid {
            grid-template-columns: 1.5fr 1fr;
          }
        }

        /* ===== BRAND COLUMN ===== */
        .footer-brand-col {
          max-width: 400px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .footer-logo-icon {
          width: 40px;
          height: 40px;
          background: #F59E0B;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1E293B;
          font-size: 20px;
          font-weight: 700;
          font-family: 'Georgia', serif;
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.25);
        }

        .footer-logo-text {
          font-family: 'Georgia', serif;
          font-size: 22px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .footer-logo-accent {
          color: #F59E0B;
        }

        .footer-tagline {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
          margin: 0 0 20px;
        }

        /* ===== CONTACT ===== */
        .footer-contact {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .footer-contact-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: all 0.2s;
        }

        a.footer-contact-item:hover {
          color: #F59E0B;
        }

        /* ===== SOCIAL ===== */
        .footer-social {
          display: flex;
          gap: 8px;
        }

        .footer-social-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          text-decoration: none;
        }

        .footer-social-btn:hover {
          background: #F59E0B;
          border-color: #F59E0B;
          transform: translateY(-2px);
        }

        .footer-social-btn:hover :global(svg) {
          stroke: #1E293B;
        }

        /* ===== LINKS COLUMN ===== */
        .footer-links-col {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .footer-links-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-links-title {
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .footer-links-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .footer-link {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          transition: all 0.2s;
          display: inline-block;
        }

        .footer-link:hover {
          color: #F59E0B;
          transform: translateX(2px);
        }

        /* ===== BOTTOM BAR ===== */
        .footer-bottom {
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
        }

        @media (min-width: 640px) {
          .footer-bottom {
            flex-direction: row;
            justify-content: space-between;
            text-align: left;
          }
        }

        .footer-copyright {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          margin: 0;
        }

        .footer-legal {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .footer-legal-link {
          color: rgba(255, 255, 255, 0.4);
          text-decoration: none;
          transition: all 0.2s;
        }

        .footer-legal-link:hover {
          color: #F59E0B;
        }

        .footer-legal-divider {
          color: rgba(255, 255, 255, 0.2);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .footer-inner {
            padding: 32px 16px 16px;
          }
          .footer-grid {
            gap: 24px;
          }
          .footer-logo-text {
            font-size: 20px;
          }
          .footer-social-btn {
            width: 36px;
            height: 36px;
          }
          .footer-links-col {
            gap: 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .footer-social-btn,
          .footer-link,
          .footer-contact-item {
            transition: none;
          }
          .footer-social-btn:hover,
          .footer-link:hover {
            transform: none;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;