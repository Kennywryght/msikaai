// mobile/src/hooks/usePresence.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────
// Shared global presence channel.
// Only one channel may exist per topic. We create it lazily and
// keep a module-level reference so every hook attaches to the
// SAME channel instead of racing to create competing ones.
// ─────────────────────────────────────────────────────────────
let globalChannel = null;
let globalChannelRefCount = 0;
const listeners = new Set();

const getGlobalChannel = () => {
  if (globalChannel) return globalChannel;

  globalChannel = supabase.channel('presence:global', {
    // ✅ Supabase JS v2: options are flat, NOT wrapped in `config`
    presence: { key: 'presence' },
  });

  globalChannel
    .on('presence', { event: 'sync' }, () => {
      const state = globalChannel.presenceState();
      listeners.forEach((fn) => {
        try {
          fn(state);
        } catch (e) {
          console.warn('presence listener error:', e);
        }
      });
    })
    .on('presence', { event: 'join' }, () => {
      const state = globalChannel.presenceState();
      listeners.forEach((fn) => {
        try {
          fn(state);
        } catch {}
      });
    })
    .on('presence', { event: 'leave' }, () => {
      const state = globalChannel.presenceState();
      listeners.forEach((fn) => {
        try {
          fn(state);
        } catch {}
      });
    })
    .subscribe((status) => {
      console.log('🛰️ presence:global status:', status);
    });

  return globalChannel;
};

const releaseGlobalChannel = () => {
  globalChannelRefCount -= 1;
  if (globalChannelRefCount <= 0 && globalChannel) {
    supabase.removeChannel(globalChannel);
    globalChannel = null;
    globalChannelRefCount = 0;
  }
};

/**
 * Track a single user's online status via Supabase Realtime Presence.
 * Reuses the shared global channel — no duplicate subscriptions.
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

    const check = (state) => {
      if (!mounted) return;
      const online = Object.values(state)
        .flat()
        .some((p) => p?.userId === targetUserId);
      setIsOnline(online);
    };

    // Register as a listener on the shared channel
    listeners.add(check);

    // Ensure the channel exists (increments refcount on first call)
    const channel = getGlobalChannel();
    globalChannelRefCount += 1;

    // Initial read
    try {
      check(channel.presenceState());
    } catch {}

    return () => {
      mounted = false;
      listeners.delete(check);
      releaseGlobalChannel();
    };
  }, [targetUserId]);

  return { isOnline };
};

/**
 * Broadcast our own presence — call once, high in the tree.
 * Reuses the same shared channel.
 */
export const usePublishPresence = (userId) => {
  useEffect(() => {
    if (!userId) return;

    const channel = getGlobalChannel();
    globalChannelRefCount += 1;

    let tracked = false;
    const tryTrack = async () => {
      try {
        await channel.track({
          userId,
          onlineAt: new Date().toISOString(),
        });
        tracked = true;
      } catch (e) {
        console.warn('presence track error:', e);
      }
    };

    // If already subscribed, track immediately. Otherwise wait for status.
    if (channel.state === 'joined') {
      tryTrack();
    } else {
      // The shared channel already has a subscribe callback that logs status.
      // We just retry tracking a few times until it works.
      const interval = setInterval(() => {
        if (channel.state === 'joined' && !tracked) {
          tryTrack();
          clearInterval(interval);
        }
      }, 300);
      setTimeout(() => clearInterval(interval), 5000);
    }

    const onUnload = () => {
      channel.untrack().catch(() => {});
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      window.removeEventListener('beforeunload', onUnload);
      releaseGlobalChannel();
      // Note: we DON'T untrack on unmount because other consumers
      // may still be using the channel. The `beforeunload` handler
      // untracks when the tab is actually closing.
    };
  }, [userId]);
};