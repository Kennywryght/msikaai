// mobile/src/components/SkeletonLoader.jsx
import React from 'react';

// ============================================================
// SKELETON BASE
// ============================================================
const SkeletonBase = ({ width = '100%', height = 16, borderRadius = 8, style = {}, className = '' }) => (
  <div
    className={`skeleton-base ${className}`}
    style={{
      width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius,
      ...style,
    }}
  />
);

// ============================================================
// SKELETON LOADER — MAIN COMPONENT
// ============================================================
const SkeletonLoader = ({
  variant = 'listing', // 'listing' | 'card' | 'list' | 'listItem' | 'detail' | 'profile' | 'chat' | 'custom'
  count = 1,
  className = '',
  children,
}) => {
  // ============================================================
  // CUSTOM
  // ============================================================
  if (variant === 'custom') {
    return <div className={className}>{children}</div>;
  }

  // ============================================================
  // LISTING CARD
  // ============================================================
  const ListingCardSkeleton = () => (
    <div className="skeleton-listing-card">
      <SkeletonBase height={140} borderRadius={0} />
      <div className="skeleton-card-body">
        <SkeletonBase width="80%" height={14} />
        <SkeletonBase width="50%" height={10} style={{ marginTop: 8 }} />
        <div className="skeleton-card-footer">
          <SkeletonBase width={60} height={14} />
          <SkeletonBase width={40} height={12} />
        </div>
      </div>
    </div>
  );

  // ============================================================
  // GENERIC CARD
  // ============================================================
  const CardSkeleton = () => (
    <div className="skeleton-card">
      <div className="skeleton-card-row">
        <SkeletonBase width={48} height={48} borderRadius="50%" />
        <div className="skeleton-card-content">
          <SkeletonBase width="70%" height={14} />
          <SkeletonBase width="40%" height={10} style={{ marginTop: 8 }} />
        </div>
      </div>
    </div>
  );

  // ============================================================
  // LIST ITEM
  // ============================================================
  const ListItemSkeleton = () => (
    <div className="skeleton-list-item">
      <SkeletonBase width={72} height={72} borderRadius={12} />
      <div className="skeleton-list-item-content">
        <SkeletonBase width="75%" height={14} />
        <SkeletonBase width="50%" height={12} style={{ marginTop: 6 }} />
        <SkeletonBase width="40%" height={10} style={{ marginTop: 6 }} />
      </div>
    </div>
  );

  // ============================================================
  // DETAIL VIEW
  // ============================================================
  const DetailSkeleton = () => (
    <div className="skeleton-detail">
      <SkeletonBase height={200} borderRadius={16} />
      <div className="skeleton-detail-body">
        <SkeletonBase width="80%" height={22} />
        <SkeletonBase width="40%" height={18} style={{ marginTop: 12 }} />
        <SkeletonBase width="100%" height={14} style={{ marginTop: 16 }} />
        <SkeletonBase width="90%" height={14} style={{ marginTop: 6 }} />
        <SkeletonBase width="60%" height={14} style={{ marginTop: 6 }} />
        <div className="skeleton-detail-buttons">
          <SkeletonBase height={44} borderRadius={12} />
          <SkeletonBase height={44} borderRadius={12} />
        </div>
      </div>
    </div>
  );

  // ============================================================
  // PROFILE
  // ============================================================
  const ProfileSkeleton = () => (
    <div className="skeleton-profile">
      <div className="skeleton-profile-header">
        <SkeletonBase width={80} height={80} borderRadius="50%" />
        <SkeletonBase width={120} height={18} style={{ marginTop: 12 }} />
        <SkeletonBase width={80} height={12} style={{ marginTop: 6 }} />
      </div>
      <div className="skeleton-profile-stats">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-profile-stat">
            <SkeletonBase width={40} height={20} />
            <SkeletonBase width={60} height={10} style={{ marginTop: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );

  // ============================================================
  // CHAT
  // ============================================================
  const ChatSkeleton = () => (
    <div className="skeleton-chat">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`skeleton-chat-row ${i % 2 === 0 ? 'right' : 'left'}`}>
          <SkeletonBase 
            width={`${40 + Math.random() * 40}%`} 
            height={40} 
            borderRadius={16} 
          />
        </div>
      ))}
    </div>
  );

  // ============================================================
  // RENDER
  // ============================================================
  const renderItem = (idx) => {
    switch (variant) {
      case 'listing':
        return <ListingCardSkeleton key={idx} />;
      case 'card':
        return <CardSkeleton key={idx} />;
      case 'list':
      case 'listItem':
        return <ListItemSkeleton key={idx} />;
      case 'detail':
        return <DetailSkeleton key={idx} />;
      case 'profile':
        return <ProfileSkeleton key={idx} />;
      case 'chat':
        return <ChatSkeleton key={idx} />;
      default:
        return <CardSkeleton key={idx} />;
    }
  };

  return (
    <>
      <div className={`skeleton-loader skeleton-loader-${variant}`}>
        {Array.from({ length: count }, (_, i) => renderItem(i))}
      </div>

      <style jsx>{`
        /* ===== BASE ANIMATION ===== */
        :global(.skeleton-base) {
          background: linear-gradient(
            90deg,
            #F1F5F9 0%,
            #E2E8F0 50%,
            #F1F5F9 100%
          );
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }

        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ===== LOADER CONTAINER ===== */
        .skeleton-loader {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-loader-listing {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }

        .skeleton-loader-card,
        .skeleton-loader-list,
        .skeleton-loader-listItem {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* ===== LISTING CARD ===== */
        .skeleton-listing-card {
          background: #FFFFFF;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #F1F5F9;
        }

        .skeleton-card-body {
          padding: 12px;
        }

        .skeleton-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid #F8FAFC;
        }

        /* ===== GENERIC CARD ===== */
        .skeleton-card {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 14px;
          border: 1px solid #F1F5F9;
        }

        .skeleton-card-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .skeleton-card-content {
          flex: 1;
          min-width: 0;
        }

        /* ===== LIST ITEM ===== */
        .skeleton-list-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
        }

        .skeleton-list-item-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* ===== DETAIL ===== */
        .skeleton-detail {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .skeleton-detail-body {
          padding: 16px 0;
        }

        .skeleton-detail-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 24px;
        }

        /* ===== PROFILE ===== */
        .skeleton-profile {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 24px 0;
        }

        .skeleton-profile-header {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .skeleton-profile-stats {
          display: flex;
          gap: 32px;
        }

        .skeleton-profile-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* ===== CHAT ===== */
        .skeleton-chat {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
        }

        .skeleton-chat-row {
          display: flex;
          width: 100%;
        }

        .skeleton-chat-row.left {
          justify-content: flex-start;
        }

        .skeleton-chat-row.right {
          justify-content: flex-end;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .skeleton-loader-listing {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .skeleton-detail-buttons {
            gap: 8px;
          }

          .skeleton-profile-stats {
            gap: 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.skeleton-base) {
            animation: none;
            background: #F1F5F9;
          }
        }
      `}</style>
    </>
  );
};

// ============================================================
// EXPORT VARIANTS AS NAMED EXPORTS
// ============================================================
export const SkeletonBox = SkeletonBase;
export const ListingCardSkeleton = () => <SkeletonLoader variant="listing" count={1} />;
export const CardSkeleton = () => <SkeletonLoader variant="card" count={1} />;
export const ListItemSkeleton = () => <SkeletonLoader variant="listItem" count={1} />;
export const DetailSkeleton = () => <SkeletonLoader variant="detail" count={1} />;
export const ProfileSkeleton = () => <SkeletonLoader variant="profile" count={1} />;
export const ChatSkeleton = () => <SkeletonLoader variant="chat" count={1} />;

export default SkeletonLoader;