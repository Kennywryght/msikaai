// mobile/src/components/CommentSection.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, commentsAPI } from '../services/api';
import { useToast } from './ToastContainer';

const Icon = ({ name, size = 16, color = 'currentColor', strokeWidth = 1.75 }) => {
  const icons = {
    heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
    trash: "M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z",
    reply: "M9 17l-6-6 6-6M3 11h10a4 4 0 014 4v4",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d={icons[name]} />
    </svg>
  );
};

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

/**
 * Props:
 *   listingId: string (required)
 *   compact: bool — smaller padding for use inside cards
 *   onCountChange: (count) => void — optional
 */
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

  const inputRef = useRef(null);

  const fetchComments = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    try {
      const res = await listingsAPI.getComments(listingId, { limit: 100 });
      const data = res?.data?.comments || res?.data || [];
      setComments(Array.isArray(data) ? data : []);
      onCountChange?.(data.length);
    } catch (err) {
      console.error('fetchComments error:', err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [listingId, onCountChange]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Group: top-level + replies
  const { topLevel, repliesByParent } = React.useMemo(() => {
    const top = [];
    const replies = {};
    for (const c of comments) {
      if (c.parent_id) {
        (replies[c.parent_id] ||= []).push(c);
      } else {
        top.push(c);
      }
    }
    // sort newest first
    top.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { topLevel: top, repliesByParent: replies };
  }, [comments]);

  const handleSubmit = async (parentId = null) => {
    if (!isAuthenticated) {
      showToast('Please sign in to comment', 'warning');
      return;
    }
    const content = parentId ? replyDraft.trim() : draft.trim();
    if (!content) return;
    if (submitting) return;

    setSubmitting(true);
    // Optimistic
    const optimistic = {
      id: `temp-${Date.now()}`,
      listing_id: listingId,
      user_id: user?.id,
      parent_id: parentId,
      content,
      created_at: new Date().toISOString(),
      likes: 0,
      liked_by_me: false,
      users: {
        id: user?.id,
        full_name: user?.full_name || user?.name || 'You',
        avatar_url: user?.avatar_url,
      },
      _optimistic: true,
    };
    setComments((prev) => [optimistic, ...prev]);

    if (parentId) { setReplyDraft(''); setReplyTo(null); }
    else { setDraft(''); }

    try {
      const res = await listingsAPI.addComment(listingId, content, parentId);
      const saved = res?.data?.comment || res?.data;
      if (saved) {
        setComments((prev) => prev.map((c) => (c.id === optimistic.id ? saved : c)));
      }
      onCountChange?.((comments.length + 1));
    } catch (err) {
      console.error('addComment error:', err);
      // rollback
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      if (parentId) setReplyDraft(content); else setDraft(content);
      showToast(err?.response?.data?.error || 'Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (comment) => {
    if (!isAuthenticated) {
      showToast('Please sign in to like comments', 'warning');
      return;
    }
    if (likingIds[comment.id]) return;
    setLikingIds((p) => ({ ...p, [comment.id]: true }));

    const wasLiked = !!comment.liked_by_me;
    const newCount = (comment.likes ?? 0) + (wasLiked ? -1 : 1);

    // Optimistic
    setComments((prev) =>
      prev.map((c) =>
        c.id === comment.id
          ? { ...c, liked_by_me: !wasLiked, likes: newCount }
          : c
      )
    );

    try {
      if (wasLiked) await commentsAPI.unlike(comment.id);
      else await commentsAPI.like(comment.id);
    } catch (err) {
      console.error('likeComment error:', err);
      // rollback
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? { ...c, liked_by_me: wasLiked, likes: comment.likes ?? 0 }
            : c
        )
      );
      showToast('Failed to update like', 'error');
    } finally {
      setLikingIds((p) => {
        const next = { ...p };
        delete next[comment.id];
        return next;
      });
    }
  };

  const handleDelete = async (comment) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await listingsAPI.deleteComment(listingId, comment.id);
      setComments((prev) => prev.filter((c) => c.id !== comment.id && c.parent_id !== comment.id));
      showToast('Comment deleted', 'success');
    } catch (err) {
      console.error('deleteComment error:', err);
      showToast('Failed to delete comment', 'error');
    }
  };

  const renderComment = (comment, isReply = false) => {
    const author = comment.users || {};
    const authorName = author.full_name || author.name || 'User';
    const initial = authorName.charAt(0).toUpperCase();
    const isOwn = user?.id && comment.user_id === user.id;
    const liked = !!comment.liked_by_me;

    return (
      <div key={comment.id} className={`cmt ${isReply ? 'cmt-reply' : ''}`}>
        <div className="cmt-avatar">
          {author.avatar_url ? (
            <img src={author.avatar_url} alt={authorName} />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div className="cmt-body">
          <div className="cmt-head">
            <span className="cmt-name">{authorName}</span>
            <span className="cmt-time">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="cmt-text">{comment.content}</p>
          <div className="cmt-actions">
            <button
              className={`cmt-act ${liked ? 'liked' : ''}`}
              onClick={() => handleLikeComment(comment)}
              disabled={!!likingIds[comment.id]}
            >
              <Icon name="heart" size={13} color={liked ? '#BC5B34' : '#9C9482'} strokeWidth={liked ? 2.5 : 1.6} />
              <span>{(comment.likes ?? 0) > 0 ? comment.likes : 'Like'}</span>
            </button>
            {!isReply && (
              <button
                className="cmt-act"
                onClick={() => {
                  setReplyTo({ id: comment.id, authorName });
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
              >
                <Icon name="reply" size={13} color="#9C9482" />
                <span>Reply</span>
              </button>
            )}
            {isOwn && !comment._optimistic && (
              <button className="cmt-act cmt-del" onClick={() => handleDelete(comment)}>
                <Icon name="trash" size={12} color="#9C9482" />
              </button>
            )}
          </div>

          {replyTo?.id === comment.id && (
            <div className="cmt-reply-form">
              <input
                ref={inputRef}
                type="text"
                placeholder={`Reply to ${replyTo.authorName}…`}
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(comment.id); }}
                disabled={submitting}
              />
              <button
                onClick={() => handleSubmit(comment.id)}
                disabled={!replyDraft.trim() || submitting}
              >
                <Icon name="send" size={13} color="#F7F1E3" />
              </button>
              <button className="cancel" onClick={() => { setReplyTo(null); setReplyDraft(''); }}>
                ✕
              </button>
            </div>
          )}

          {isReply && null}
        </div>
      </div>
    );
  };

  return (
    <div className={`comments ${compact ? 'compact' : ''}`}>
      <div className="comments-header">
        <Icon name="message" size={15} color="#3A362E" />
        <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
      </div>

      {isAuthenticated && (
        <div className="comment-form">
          <input
            type="text"
            placeholder="Add a comment…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(null); }}
            disabled={submitting}
          />
          <button
            onClick={() => handleSubmit(null)}
            disabled={!draft.trim() || submitting}
            aria-label="Post comment"
          >
            <Icon name="send" size={14} color="#F7F1E3" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="comments-loading">Loading comments…</div>
      ) : topLevel.length === 0 ? (
        <div className="comments-empty">Be the first to comment</div>
      ) : (
        <div className="comments-list">
          {topLevel.map((c) => (
            <div key={c.id} className="cmt-thread">
              {renderComment(c, false)}
              {(repliesByParent[c.id] || []).map((r) => renderComment(r, true))}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .comments { display: flex; flex-direction: column; gap: 10px; }
        .comments.compact { gap: 8px; }
        .comments-header {
          display: flex; align-items: center; gap: 6px;
          font-size: 12.5px; font-weight: 600; color: #3A362E;
          padding-bottom: 4px; border-bottom: 1px solid #F2EBD9;
        }
        .comment-form {
          display: flex; gap: 6px; align-items: center;
          background: #F7F1E3; border-radius: 9px; padding: 4px 4px 4px 12px;
          border: 1px solid #EFE6CE;
        }
        .comment-form input {
          flex: 1; border: none; outline: none; background: transparent;
          padding: 8px 0; font-size: 13px; font-family: inherit; color: #201F1B;
        }
        .comment-form input::placeholder { color: #9C9482; }
        .comment-form button {
          width: 32px; height: 32px; border-radius: 7px;
          background: #24453B; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .comment-form button:hover:not(:disabled) { background: #BC5B34; }
        .comment-form button:disabled { opacity: 0.5; cursor: not-allowed; }

        .comments-list { display: flex; flex-direction: column; gap: 12px; }
        .cmt-thread { display: flex; flex-direction: column; gap: 8px; }

        .cmt { display: flex; gap: 8px; }
        .cmt-reply { margin-left: 32px; padding-left: 10px; border-left: 2px solid #F2EBD9; }

        .cmt-avatar {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          background: #24453B; color: #F7F1E3;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 600; overflow: hidden;
        }
        .cmt-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .cmt-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .cmt-head { display: flex; align-items: baseline; gap: 6px; }
        .cmt-name { font-size: 12.5px; font-weight: 600; color: #201F1B; }
        .cmt-time { font-size: 10.5px; color: #9C9482; }
        .cmt-text { font-size: 13px; line-height: 1.45; color: #3A362E; margin: 0; word-break: break-word; }

        .cmt-actions { display: flex; align-items: center; gap: 12px; margin-top: 2px; }
        .cmt-act {
          display: inline-flex; align-items: center; gap: 4px;
          background: none; border: none; padding: 2px 0;
          font-family: inherit; font-size: 11.5px; color: #9C9482;
          cursor: pointer; transition: color 0.15s;
        }
        .cmt-act:hover { color: #201F1B; }
        .cmt-act.liked { color: #BC5B34; font-weight: 600; }
        .cmt-del { margin-left: auto; }

        .cmt-reply-form {
          display: flex; gap: 6px; align-items: center; margin-top: 6px;
          background: #F7F1E3; border-radius: 8px; padding: 3px 3px 3px 10px;
          border: 1px solid #EFE6CE;
        }
        .cmt-reply-form input {
          flex: 1; border: none; outline: none; background: transparent;
          padding: 7px 0; font-size: 12.5px; font-family: inherit;
        }
        .cmt-reply-form button {
          width: 28px; height: 28px; border-radius: 6px;
          background: #24453B; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .cmt-reply-form button.cancel { background: transparent; color: #9C9482; font-size: 14px; }
        .cmt-reply-form button:disabled { opacity: 0.5; }

        .comments-loading, .comments-empty {
          font-size: 12.5px; color: #9C9482; padding: 8px 0; text-align: center;
        }
      `}</style>
    </div>
  );
};

export default CommentSection;