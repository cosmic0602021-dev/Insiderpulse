/**
 * PWA Push Subscription Manager
 * Handles Web Push API subscription for browser notifications
 */

import { resolveApiUrl } from './queryClient';

/**
 * Subscribe to push notifications (PWA only)
 * Requests notification permission and creates push subscription
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  // Check browser support
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported in this browser');
    return null;
  }

  if (!('PushManager' in window)) {
    console.warn('Push notifications not supported in this browser');
    return null;
  }

  try {
    // 1. Register service worker (if not already registered)
    let registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) {
      console.log('[Push] Registering service worker...');
      registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[Push] Service worker registered');
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('[Push] Service worker ready');

    // 2. Request notification permission
    const permission = await Notification.requestPermission();
    console.log('[Push] Notification permission:', permission);

    if (permission !== 'granted') {
      console.warn('[Push] Notification permission denied');
      return null;
    }

    // 3. Get VAPID public key from server
    const response = await fetch(resolveApiUrl('/api/notifications/vapid-public-key'));
    if (!response.ok) {
      throw new Error('Failed to get VAPID public key');
    }
    const { publicKey } = await response.json();
    console.log('[Push] Got VAPID public key');

    // 4. Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('[Push] Already subscribed, using existing subscription');
      return existingSubscription;
    }

    // 5. Create new push subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    console.log('[Push] ✅ Successfully subscribed to push notifications');
    return subscription;
  } catch (error) {
    console.error('[Push] Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('[Push] ✅ Unsubscribed from push notifications');
      return true;
    }

    console.log('[Push] No active subscription to unsubscribe');
    return false;
  } catch (error) {
    console.error('[Push] Failed to unsubscribe:', error);
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  try {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('[Push] Failed to get subscription:', error);
    return null;
  }
}

/**
 * Check if notifications are supported and permission is granted
 */
export function isNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Check notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Convert VAPID public key from base64 to Uint8Array
 * Required for push subscription
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Test push notification (for debugging)
 * Sends a test notification to verify setup
 */
export async function testPushNotification(): Promise<void> {
  if (!('Notification' in window)) {
    console.error('Notifications not supported');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('InsiderPulse Test', {
      body: 'Push notifications are working! 🎉',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'test',
      requireInteraction: false
    });
    console.log('[Push] Test notification sent');
  }
}
