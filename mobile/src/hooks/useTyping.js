// mobile/src/hooks/useTyping.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const TYPING_DEBOUNCE_MS = 2000;
const TYPING_TIMEOUT_MS = 5000;

export const useTyping = (conversationId, currentUserId, otherUserId) => {
  const [otherUserIsTyping, setOtherUserIsTyping] = useState(false);

  const channelRef = useRef(null);
  const lastBroadcastRef = useRef(0);
  const timeoutRef = useRef(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!conversationId || !otherUserId) return;

    const channel = supabase.channel(`typing:${conversationId}`, {
      // ✅ Supabase JS v2: flat options, no `config` wrapper
      broadcast: { self: false },
    });

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, isTyping } = payload?.payload || {};
        if (!userId || userId === currentUserId) return;

        lastUpdateRef.current = Date.now();

        if (isTyping) {
          setOtherUserIsTyping(true);
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

  const notifyTyping = useCallback(() => {
    if (!channelRef.current) return;
    const now = Date.now();
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