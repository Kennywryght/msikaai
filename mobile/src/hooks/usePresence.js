// mobile/src/hooks/usePresence.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Track a single user's online status via Supabase Realtime Presence.
 * All authenticated sessions join the same global presence channel.
 *
 * @param {string} targetUserId - the user whose status we want to know
 * @returns {{ isOnline: boolean }}
 */
export const useUserPresence = (targetUserId) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!targetUserId) {
      setIsOnline(false);
      return;
    }

    let mounted = true;
    const channel = supabase.channel('presence:global', {
      config: { presence: { key: 'presence' } },
    });

    const sync = () => {
      if (!mounted) return;
      const state = channel.presenceState();
      const online = Object.values(state)
        .flat()
        .some((p) => p.userId === targetUserId);
      setIsOnline(online);
    };

    channel
      .on('presence', { event: 'sync' }, sync)
      .on('presence', { event: 'join' }, sync)
      .on('presence', { event: 'leave' }, sync)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          sync();
        }
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [targetUserId]);

  return { isOnline };
};

/**
 * Broadcast our own presence — call once, high in the tree.
 * Used by the AuthProvider or a dedicated component.
 */
export const usePublishPresence = (userId) => {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('presence:global', {
      config: { presence: { key: 'presence' } },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId,
          onlineAt: new Date().toISOString(),
        });
      }
    });

    const onUnload = () => {
      channel.untrack().catch(() => {});
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      window.removeEventListener('beforeunload', onUnload);
      supabase.removeChannel(channel);
    };
  }, [userId]);
};