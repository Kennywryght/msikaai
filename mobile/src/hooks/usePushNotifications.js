// mobile/src/hooks/usePushNotifications.js
import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

/**
 * Convert a base64 VAPID public key into a Uint8Array
 * (required by the PushManager.subscribe() API).
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = (userId) => {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default'); // 'default' | 'granted' | 'denied'
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const check = async () => {
      const isSupported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      setSupported(isSupported);
      if (!isSupported) return;

      setPermission(Notification.permission);

      if (Notification.permission === 'granted' && userId) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const existing = await reg.pushManager.getSubscription();
          setSubscribed(!!existing);
        } catch (err) {
          console.warn('Push check error:', err);
        }
      }
    };
    check();
  }, [userId]);

  const subscribe = useCallback(async () => {
    if (!supported || !userId) return { success: false, error: 'Not supported' };

    setBusy(true);
    try {
      // 1. Ask for permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setBusy(false);
        return { success: false, error: 'Permission denied' };
      }

      // 2. Get the VAPID public key from our backend
      const keyRes = await api.get('/notifications/push/public-key');
      const publicKey = keyRes.data?.publicKey;
      if (!publicKey) throw new Error('Server did not return a public key');

      // 3. Register the subscription with the browser
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      // 4. Send it to our backend
      await api.post('/notifications/push/subscribe', {
        subscription: subscription.toJSON(),
      });

      setSubscribed(true);
      setBusy(false);
      return { success: true };
    } catch (err) {
      console.error('Subscribe error:', err);
      setBusy(false);
      return { success: false, error: err.message };
    }
  }, [supported, userId]);

  const unsubscribe = useCallback(async () => {
    if (!supported || !userId) return { success: false };
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await api.post('/notifications/push/unsubscribe', { endpoint });
      }
      setSubscribed(false);
      setBusy(false);
      return { success: true };
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setBusy(false);
      return { success: false, error: err.message };
    }
  }, [supported, userId]);

  return { supported, permission, subscribed, busy, subscribe, unsubscribe };
};