// mobile/src/components/VerifyToPost.jsx
//
// Usage:
//   const { isVerified } = useAuth();
//   <VerifyToPost
//     open={!isVerified && showPostAttempt}
//     onClose={() => setShowPostAttempt(false)}
//     action="post a listing"
//   />
//
// Or as a wrapper: <VerifyGate action="post a listing">...</VerifyGate>

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyToPost = ({ open, onClose, action = 'continue' }) => {
  const navigate = useNavigate();
  const { isVerified } = useAuth();

  if (!open || isVerified) return null;

  const handleVerify = () => {
    onClose?.();
    navigate('/login', {
      state: {
        reason: 'verify',
        from: window.location.pathname + window.location.search,
      },
    });
  };

  return (
    <div className="v-modal-overlay" onClick={onClose}>
      <div className="v-modal" onClick={(e) => e.stopPropagation()}>
        <div className="v-icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
               stroke="#F59E0B" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <h2 className="v-title">Verify to {action}</h2>
        <p className="v-body">
          You can browse, like, comment, and message without an account.
          To {action}, we need to confirm who you are so buyers and sellers
          can trust each other.
        </p>

        <div className="v-benefits">
          <div className="v-benefit">
            <span className="v-dot" />
            <span>Keep everything you've already liked and messaged</span>
          </div>
          <div className="v-benefit">
            <span className="v-dot" />
            <span>Takes 30 seconds with email or Facebook</span>
          </div>
          <div className="v-benefit">
            <span className="v-dot" />
            <span>Free — no payment required to post</span>
          </div>
        </div>

        <div className="v-actions">
          <button className="v-primary" onClick={handleVerify}>
            Verify now
          </button>
          <button className="v-secondary" onClick={onClose}>
            Not yet
          </button>
        </div>
      </div>

      <style jsx>{`
        .v-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 9999;
          animation: fadeIn 0.18s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .v-modal {
          background: #FFFFFF;
          border-radius: 18px;
          padding: 28px 24px 22px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          text-align: center;
          animation: slideUp 0.22s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .v-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(245, 158, 11, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .v-title {
          font-family: Georgia, serif;
          font-size: 20px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 8px;
          letter-spacing: -0.02em;
        }

        .v-body {
          font-size: 14px;
          color: #64748B;
          line-height: 1.55;
          margin: 0 0 18px;
        }

        .v-benefits {
          text-align: left;
          background: #F8FAFC;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .v-benefit {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: #334155;
          line-height: 1.45;
        }

        .v-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          flex-shrink: 0;
          margin-top: 7px;
        }

        .v-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .v-primary {
          width: 100%;
          height: 46px;
          background: #1E293B;
          color: #FFFFFF;
          border: none;
          border-radius: 11px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
        }

        .v-primary:hover {
          background: #F59E0B;
        }

        .v-secondary {
          width: 100%;
          height: 40px;
          background: none;
          color: #94A3B8;
          border: none;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .v-secondary:hover {
          color: #1E293B;
        }
      `}</style>
    </div>
  );
};

// ============================================================
// Convenience wrapper — put around any JSX that requires verification
// ============================================================
export const VerifyGate = ({ children, action }) => {
  const { isVerified } = useAuth();
  const [open, setOpen] = React.useState(false);

  if (isVerified) return children;

  return (
    <>
      <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}>
        {children}
      </div>
      <VerifyToPost open={open} onClose={() => setOpen(false)} action={action} />
    </>
  );
};

export default VerifyToPost;