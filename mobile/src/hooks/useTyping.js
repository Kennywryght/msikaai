// mobile/src/hooks/useTyping.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const TYPING_DEBOUNCE_MS = 2000; // re-broadcast interval while actively typing
const TYPING_TIMEOUT_MS = 5000; // hide indicator after 5s of silence

/**
 * Returns:
 *  - otherUserIsTyping: boolean (for the UI to show "typing...")
 *  - notifyTyping(): call this on every keystroke
 *  - stopTyping(): call this when the user sends or blurs the input
 */
export const useTyping = (conversationId, currentUserId, otherUserId) => {
  const [otherUserIsTyping, setOtherUserIsTyping] = useState(false);

  const channelRef = useRef(null);
  const lastBroadcastRef = useRef(0);
  const timeoutRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // Subscribe to typing broadcasts
  useEffect(() => {
    if (!conversationId || !otherUserId) return;

    const channel = supabase.channel(`typing:${conversationId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, isTyping } = payload?.payload || {};
        // Only react to the OTHER participant
        if (!userId || userId === currentUserId) return;

        lastUpdateRef.current = Date.now();

        if (isTyping) {
          setOtherUserIsTyping(true);
          // Reset safety timeout
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setOtherUserIsTyping(false);
          }, TYPING_TIMEOUT_MS);
        } else {
          setOtherUserIsTyping(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, currentUserId, otherUserId]);

  // Broadcast our own typing (debounced)
  const notifyTyping = useCallback(() => {
    if (!channelRef.current) return;
    const now = Date.now();
    // Only broadcast once every 2 seconds while the user keeps typing
    if (now - lastBroadcastRef.current < TYPING_DEBOUNCE_MS) return;
    lastBroadcastRef.current = now;
    channelRef.current
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, isTyping: true },
      })
      .catch(() => {});
  }, [currentUserId]);

  // Tell the other side we stopped
  const stopTyping = useCallback(() => {
    if (!channelRef.current) return;
    lastBroadcastRef.current = 0;
    channelRef.current
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, isTyping: false },
      })
      .catch(() => {});
  }, [currentUserId]);

  return { otherUserIsTyping, notifyTyping, stopTyping };
};