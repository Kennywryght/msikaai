// mobile/src/components/CommentSection.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { interactionsAPI } from '../services/api';
import { useToast } from './ToastContainer';

/* ============================================================
   ICONS
   ============================================================ */
const Icon = ({ name, size = 16, color = 'currentColor', strokeWidth = 1.75 }) => {
  const icons = {
    heart:
      'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
    message:
      'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z',
    send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
    trash:
      'M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z',
    reply: 'M9 17l-6-6 6-6M3 11h10a4 4 0 014 4v4',
    x: 'M18 6L6 18M6 6l12 12',
    sparkle:
      'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z',
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d={icons[name] || icons.message} />
    </svg>
  );
};

/* ============================================================
   HELPERS
   ============================================================ */
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString();
};

const initialOf = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  return name.trim().charAt(0).toUpperCase() || 'U';
};

/* Stable pastel palette derived from a string (user id / name) */
const PALETTE = [
  { bg: '#24453B', fg: '#F7F1E3' },
  { bg: '#BC5B34', fg: '#F7F1E3' },
  { bg: '#8B5A83', fg: '#F7F1E3' },
  { bg: '#3E6C76', fg: '#F7F1E3' },
  { bg: '#5B7B5E', fg: '#F7F1E3' },
  { bg: '#6B6259', fg: '#F7F1E3' },
  { bg: '#D99A3B', fg: '#201F1B' },
];
const paletteFor = (seed) => {
  const s = String(seed || 'x');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

/* ============================================================
   COMMENT SECTION
   ============================================================ */
const CommentSection = ({ listingId, compact = false, onCountChange }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState(null); // { id, authorName }
  const [replyDraft, setReplyDraft] = useState('');
  const [likingIds, setLikingIds] = useState({});

  const draftInputRef = useRef(null);
  const replyInputRef = useRef(null);

  // Keep latest onCountChange in a ref so it never invalidates fetchComments
  const onCountChangeRef = useRef(onCountChange);
  useEffect(() => {
    onCountChangeRef.current = onCountChange;
  }, [onCountChange]);

  /* ---------- Fetch ---------- */
  const fetchComments = useCallback(async () => {
    if (!listingId) {
      console.warn('[CommentSection] No listingId provided — skipping fetch');
      setComments([]);
      setLoading(false);
      onCountChangeRef.current?.(0);
      return;
    }
    console.log('[CommentSection] Fetching comments for listingId:', listingId);
    setLoading(true);
    try {
      const res = await interactionsAPI.getComments(listingId, { limit: 100 });

      console.log('[CommentSection] raw response:', res);
      console.log('[CommentSection] res.data:', res?.data);
      console.log('[CommentSection] res.data.comments:', res?.data?.comments);
      console.log(
        '[CommentSection] comments count:',
        Array.isArray(res?.data?.comments) ? res.data.comments.length : 'NOT AN ARRAY'
      );
      if (Array.isArray(res?.data?.comments) && res.data.comments[0]) {
        console.log('[CommentSection] first comment shape:', res.data.comments[0]);
        console.log('[CommentSection] first comment keys:', Object.keys(res.data.comments[0]));
      }

      const data = res?.data?.comments || [];
      const list = Array.isArray(data) ? data : [];
      setComments(list);
      onCountChangeRef.current?.(list.length);
    } catch (err) {
      console.error('[CommentSection] fetchComments error:', err);
      console.error('[CommentSection] error status:', err?.response?.status);
      console.error('[CommentSection] error response data:', err?.response?.data);
      console.error('[CommentSection] error message:', err?.message);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [listingId]); // <-- ONLY listingId; onCountChange accessed via ref

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  /* ---------- Group top-level + replies ---------- */
  const { topLevel, repliesByParent } = useMemo(() => {
    const top = [];
    const replies = {};
    for (const c of comments) {
      if (c.parent_id) {
        (replies[c.parent_id] ||= []).push(c);
      } else {
        top.push(c);
      }
    }
    top.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    Object.values(replies).forEach((arr) =>
      arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    );
    return { topLevel: top, repliesByParent: replies };
  }, [comments]);

  /* ---------- Submit ---------- */
  const handleSubmit = async (parentId = null) => {
    if (!isAuthenticated) {
      showToast('Please sign in to comment', 'warning');
      return;
    }
    const content = (parentId ? replyDraft : draft).trim();
    if (!content || submitting) return;

    setSubmitting(true);

    const optimistic = {
      id: `temp-${Date.now()}`,
      listing_id: listingId,
      listingId,
      user_id: user?.id,
      userId: user?.id,
      parent_id: parentId,
      parentId,
      content,
      text: content,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      likes: 0,
      liked_by_me: false,
      likedByMe: false,
      users: {
        id: user?.id,
        full_name: user?.full_name || user?.fullName || user?.name || 'You',
        fullName: user?.full_name || user?.fullName || user?.name || 'You',
        avatar_url: user?.avatar_url || user?.avatarUrl,
        avatarUrl: user?.avatar_url || user?.avatarUrl,
      },
      _optimistic: true,
    };

    setComments((prev) => [optimistic, ...prev]);

    if (parentId) {
      setReplyDraft('');
      setReplyTo(null);
    } else {
      setDraft('');
    }

    try {
      console.log('[CommentSection] Submitting comment for listingId:', listingId, 'content:', content);
      const res = await interactionsAPI.createComment(listingId, content);
      console.log('[CommentSection] createComment response:', res);
      console.log('[CommentSection] createComment res.data:', res?.data);
      console.log('[CommentSection] createComment res.data.comment:', res?.data?.comment);
      const saved = res?.data?.comment;
      if (saved) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === optimistic.id
              ? {
                  ...optimistic,
                  ...saved,
                  users: saved.users || saved.user || optimistic.users,
                }
              : c
          )
        );
      }
      // Use functional update to get the true length
      setComments((prev) => {
        onCountChangeRef.current?.(prev.length);
        return prev;
      });
    } catch (err) {
      console.error('[CommentSection] addComment error:', err);
      console.error('[CommentSection] addComment error status:', err?.response?.status);
      console.error('[CommentSection] addComment error data:', err?.response?.data);
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      if (parentId) setReplyDraft(content);
      else setDraft(content);
      showToast(err?.response?.data?.error || 'Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Like a comment ---------- */
  const handleLikeComment = async (comment) => {
    if (!isAuthenticated) {
      showToast('Please sign in to like comments', 'warning');
      return;
    }
    if (likingIds[comment.id]) return;
    setLikingIds((p) => ({ ...p, [comment.id]: true }));

    const wasLiked = !!comment.liked_by_me;
    const newCount = (comment.likes ?? 0) + (wasLiked ? -1 : 1);

    setComments((prev) =>
      prev.map((c) =>
        c.id === comment.id ? { ...c, liked_by_me: !wasLiked, likes: newCount } : c
      )
    );

    try {
      const { commentsAPI } = await import('../services/api');
      if (wasLiked) await commentsAPI.unlike(comment.id);
      else await commentsAPI.like(comment.id);
    } catch (err) {
      // Comment likes are not yet persisted on the backend. Keep the
      // optimistic UI state so the button doesn't yank back on every click.
      console.warn('likeComment not persisted (endpoint not implemented):', err?.message);
    } finally {
      setLikingIds((p) => {
        const next = { ...p };
        delete next[comment.id];
        return next;
      });
    }
  };

  /* ---------- Delete ---------- */
  const handleDelete = async (comment) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await interactionsAPI.deleteComment(comment.id);
      setComments((prev) =>
        prev.filter((c) => c.id !== comment.id && c.parent_id !== comment.id)
      );
      showToast('Comment deleted', 'success');
      setComments((prev) => {
        onCountChangeRef.current?.(prev.length);
        return prev;
      });
    } catch (err) {
      console.error('deleteComment error:', err);
      showToast('Failed to delete comment', 'error');
    }
  };

  /* ---------- Render a single comment ---------- */
  const renderComment = (comment, isReply = false) => {
    const author = comment.users || comment.user || {};
    const authorName =
      author.full_name || author.fullName || author.name || 'User';
    const avatarUrl = author.avatar_url || author.avatarUrl;
    const isOwn = user?.id && comment.user_id === user.id;
    const liked = !!comment.liked_by_me;
    const body = comment.content ?? comment.text ?? '';
    const palette = paletteFor(author.id || authorName);
    const likeCount = comment.likes ?? 0;

    return (
      <div key={comment.id} className={`cmt ${isReply ? 'is-reply' : ''}`}>
        <div className="cmt-avatar" style={{ background: palette.bg, color: palette.fg }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={authorName} />
          ) : (
            <span>{initialOf(authorName)}</span>
          )}
        </div>

        <div className="cmt-body">
          <div className="cmt-bubble">
            <div className="cmt-head">
              <span className="cmt-name">{authorName}</span>
              {isOwn && <span className="cmt-you">You</span>}
              <span className="cmt-time">· {timeAgo(comment.created_at)}</span>
            </div>
            <p className="cmt-text">{body}</p>
          </div>

          <div className="cmt-actions">
            <button
              className={`cmt-act ${liked ? 'liked' : ''}`}
              onClick={() => handleLikeComment(comment)}
              disabled={!!likingIds[comment.id]}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              <Icon
                name="heart"
                size={13}
                color={liked ? '#BC5B34' : '#9C9482'}
                strokeWidth={liked ? 2.5 : 1.7}
              />
              <span>{likeCount > 0 ? likeCount : 'Like'}</span>
            </button>

            {!isReply && (
              <button
                className="cmt-act"
                onClick={() => {
                  setReplyTo({ id: comment.id, authorName });
                  setTimeout(() => replyInputRef.current?.focus(), 60);
                }}
              >
                <Icon name="reply" size={13} color="#9C9482" strokeWidth={1.7} />
                <span>Reply</span>
              </button>
            )}

            {isOwn && !comment._optimistic && (
              <button
                className="cmt-act cmt-del"
                onClick={() => handleDelete(comment)}
                aria-label="Delete comment"
              >
                <Icon name="trash" size={12} color="#9C9482" strokeWidth={1.7} />
              </button>
            )}
          </div>

          {replyTo?.id === comment.id && (
            <div className="cmt-reply-form">
              <input
                ref={replyInputRef}
                type="text"
                placeholder={`Reply to ${replyTo.authorName}…`}
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(comment.id);
                  }
                }}
                disabled={submitting}
              />
              <button
                className="cmt-reply-send"
                onClick={() => handleSubmit(comment.id)}
                disabled={!replyDraft.trim() || submitting}
                aria-label="Post reply"
              >
                <Icon name="send" size={13} color="#F7F1E3" strokeWidth={2} />
              </button>
              <button
                className="cmt-reply-cancel"
                onClick={() => {
                  setReplyTo(null);
                  setReplyDraft('');
                }}
                aria-label="Cancel reply"
              >
                <Icon name="x" size={13} color="#9C9482" strokeWidth={2.2} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className={`cs ${compact ? 'is-compact' : ''}`}>
      {/* Header */}
      <header className="cs-header">
        <div className="cs-header-left">
          <span className="cs-badge">
            <Icon name="message" size={14} color="#F7F1E3" strokeWidth={2} />
          </span>
          <div className="cs-header-text">
            <h3 className="cs-title">
              {comments.length > 0
                ? `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`
                : 'Comments'}
            </h3>
            <p className="cs-subtitle">
              {comments.length === 0
                ? 'Start the conversation'
                : 'Join the conversation'}
            </p>
          </div>
        </div>
      </header>

      {/* Composer */}
      {isAuthenticated ? (
        <div className="cs-composer">
          <div
            className="cs-composer-avatar"
            style={{
              background: paletteFor(user?.id || 'me').bg,
              color: paletteFor(user?.id || 'me').fg,
            }}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user?.full_name || 'You'}
              />
            ) : (
              <span>{initialOf(user?.full_name || user?.fullName || 'You')}</span>
            )}
          </div>
          <div className="cs-composer-field">
            <textarea
              ref={draftInputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Share your thoughts…"
              rows={1}
              maxLength={1000}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(null);
                }
              }}
              disabled={submitting}
            />
            <div className="cs-composer-footer">
              <span className="cs-char-count">
                {draft.length > 900 && `${draft.length}/1000`}
              </span>
              <button
                className="cs-post-btn"
                onClick={() => handleSubmit(null)}
                disabled={!draft.trim() || submitting}
              >
                {submitting ? (
                  <span className="cs-spinner" />
                ) : (
                  <>
                    <Icon name="send" size={13} color="#F7F1E3" strokeWidth={2.2} />
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="cs-signin-hint">
          <Icon name="message" size={16} color="#BC5B34" strokeWidth={1.8} />
          <span>Sign in to join the conversation</span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="cs-skeleton">
          {[0, 1, 2].map((i) => (
            <div key={i} className="cs-skel-row">
              <div className="cs-skel-avatar" />
              <div className="cs-skel-body">
                <div className="cs-skel-line short" />
                <div className="cs-skel-line" />
              </div>
            </div>
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <div className="cs-empty">
          <div className="cs-empty-icon">
            <Icon name="sparkle" size={22} color="#D99A3B" strokeWidth={1.8} />
          </div>
          <p className="cs-empty-title">No comments yet</p>
          <p className="cs-empty-sub">
            Be the first to share what you think.
          </p>
        </div>
      ) : (
        <div className="cs-list">
          {topLevel.map((c) => (
            <div key={c.id} className="cs-thread">
              {renderComment(c, false)}
              {(repliesByParent[c.id] || []).length > 0 && (
                <div className="cs-replies">
                  {(repliesByParent[c.id] || []).map((r) => renderComment(r, true))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ============ STYLES ============ */}
      <style jsx>{`
        .cs {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 4px 2px 8px;
        }
        .cs.is-compact { gap: 10px; }

        /* ---------- Header ---------- */
        .cs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cs-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cs-badge {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          background: linear-gradient(135deg, #24453B 0%, #16261F 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(36, 69, 59, 0.25);
        }
        .cs-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 15px;
          font-weight: 600;
          color: #201F1B;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .cs-subtitle {
          font-size: 11px;
          color: #9C9482;
          margin: 1px 0 0;
          letter-spacing: 0.01em;
        }

        /* ---------- Composer ---------- */
        .cs-composer {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 10px;
          background: #FFFDF8;
          border: 1px solid #EFE6CE;
          border-radius: 14px;
          box-shadow: 0 1px 2px rgba(22, 38, 31, 0.03);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cs-composer:focus-within {
          border-color: #D99A3B;
          box-shadow: 0 0 0 3px rgba(217, 154, 59, 0.12);
        }
        .cs-composer-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
          overflow: hidden;
        }
        .cs-composer-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cs-composer-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .cs-composer-field textarea {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          resize: none;
          padding: 6px 2px 0;
          font-family: inherit;
          font-size: 13.5px;
          line-height: 1.45;
          color: #201F1B;
          min-height: 24px;
          max-height: 140px;
          overflow-y: auto;
        }
        .cs-composer-field textarea::placeholder {
          color: #B7AD98;
        }
        .cs-composer-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 4px;
          border-top: 1px solid #F2EBD9;
        }
        .cs-char-count {
          font-size: 10.5px;
          color: #C0B49A;
          padding-left: 2px;
          font-variant-numeric: tabular-nums;
        }
        .cs-post-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 14px;
          background: #24453B;
          color: #F7F1E3;
          border: none;
          border-radius: 999px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.18s, transform 0.12s;
        }
        .cs-post-btn:hover:not(:disabled) {
          background: #BC5B34;
          transform: translateY(-1px);
        }
        .cs-post-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .cs-spinner {
          width: 13px;
          height: 13px;
          border: 2px solid rgba(247, 241, 227, 0.35);
          border-top-color: #F7F1E3;
          border-radius: 50%;
          animation: csSpin 0.7s linear infinite;
        }
        @keyframes csSpin {
          to { transform: rotate(360deg); }
        }

        .cs-signin-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: #FEF6E7;
          border: 1px dashed #F1D9A8;
          border-radius: 12px;
          font-size: 12.5px;
          color: #8A6A20;
          font-weight: 500;
        }

        /* ---------- List ---------- */
        .cs-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-top: 2px;
        }
        .cs-thread {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cs-replies {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-left: 22px;
          margin-left: 12px;
          border-left: 2px solid #F2EBD9;
          margin-top: 2px;
        }

        /* ---------- Comment ---------- */
        .cmt {
          display: flex;
          gap: 10px;
          animation: cmtIn 0.25s ease both;
        }
        .cmt.is-reply { gap: 8px; }
        @keyframes cmtIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cmt-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12.5px;
          font-weight: 700;
          flex-shrink: 0;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(22, 38, 31, 0.08);
        }
        .cmt.is-reply .cmt-avatar {
          width: 26px;
          height: 26px;
          font-size: 11px;
        }
        .cmt-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cmt-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cmt-bubble {
          background: #FFFDF8;
          border: 1px solid #F2EBD9;
          border-radius: 12px;
          padding: 9px 12px;
          box-shadow: 0 1px 2px rgba(22, 38, 31, 0.03);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cmt-bubble:hover {
          border-color: #E4D9BD;
          box-shadow: 0 2px 6px rgba(22, 38, 31, 0.05);
        }
        .cmt-head {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-bottom: 3px;
          flex-wrap: wrap;
        }
        .cmt-name {
          font-size: 12.5px;
          font-weight: 700;
          color: #201F1B;
          letter-spacing: -0.005em;
        }
        .cmt-you {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #BC5B34;
          background: #FBE9DF;
          padding: 1px 6px;
          border-radius: 5px;
          line-height: 1.3;
        }
        .cmt-time {
          font-size: 10.5px;
          color: #9C9482;
          font-weight: 500;
        }
        .cmt-text {
          font-size: 13.5px;
          line-height: 1.5;
          color: #3A362E;
          margin: 0;
          word-break: break-word;
          white-space: pre-wrap;
        }

        /* ---------- Actions ---------- */
        .cmt-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 1px 4px 0;
        }
        .cmt-act {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          padding: 3px 2px;
          font-family: inherit;
          font-size: 11.5px;
          font-weight: 600;
          color: #9C9482;
          cursor: pointer;
          transition: color 0.15s, transform 0.12s;
        }
        .cmt-act:hover:not(:disabled) {
          color: #201F1B;
          transform: translateY(-0.5px);
        }
        .cmt-act:disabled { opacity: 0.55; cursor: not-allowed; }
        .cmt-act.liked { color: #BC5B34; }
        .cmt-del { margin-left: auto; }
        .cmt-del:hover { color: #DC2626 !important; }

        /* ---------- Reply form ---------- */
        .cmt-reply-form {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          padding: 4px 4px 4px 12px;
          background: #FFFDF8;
          border: 1px solid #EFE6CE;
          border-radius: 10px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cmt-reply-form:focus-within {
          border-color: #D99A3B;
          box-shadow: 0 0 0 3px rgba(217, 154, 59, 0.1);
        }
        .cmt-reply-form input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          padding: 7px 0;
          font-family: inherit;
          font-size: 12.5px;
          color: #201F1B;
          min-width: 0;
        }
        .cmt-reply-form input::placeholder { color: #B7AD98; }
        .cmt-reply-send {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #24453B;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          flex-shrink: 0;
        }
        .cmt-reply-send:hover:not(:disabled) { background: #BC5B34; }
        .cmt-reply-send:disabled { opacity: 0.5; cursor: not-allowed; }
        .cmt-reply-cancel {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .cmt-reply-cancel:hover { background: #F2EBD9; }

        /* ---------- Skeleton ---------- */
        .cs-skeleton {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 6px 0;
        }
        .cs-skel-row {
          display: flex;
          gap: 10px;
        }
        .cs-skel-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #EFE6CE;
          flex-shrink: 0;
          animation: csPulse 1.4s ease-in-out infinite;
        }
        .cs-skel-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .cs-skel-line {
          height: 12px;
          border-radius: 6px;
          background: #EFE6CE;
          animation: csPulse 1.4s ease-in-out infinite;
        }
        .cs-skel-line.short { width: 40%; }
        @keyframes csPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }

        /* ---------- Empty ---------- */
        .cs-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 40px 20px 46px;
          text-align: center;
        }
        .cs-empty-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #FFF3E0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
          box-shadow: 0 6px 16px rgba(217, 154, 59, 0.15);
        }
        .cs-empty-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 15px;
          font-weight: 600;
          color: #201F1B;
          margin: 0;
        }
        .cs-empty-sub {
          font-size: 12.5px;
          color: #9C9482;
          margin: 0;
          max-width: 240px;
        }

        /* ---------- Compact overrides ---------- */
        .cs.is-compact .cs-composer { padding: 8px; }
        .cs.is-compact .cmt-avatar { width: 28px; height: 28px; }
        .cs.is-compact .cmt-text { font-size: 13px; }
        .cs.is-compact .cs-list { gap: 12px; }
      `}</style>
    </div>
  );
};

export default CommentSection;