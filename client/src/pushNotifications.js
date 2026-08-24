// pushNotifications.js — registers the service worker and subscribes this
// browser to push notifications, using the app's own VAPID key (no
// third-party push service — this is the browser-native Web Push standard).
import { pushApi } from './api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && Boolean(VAPID_PUBLIC_KEY);
}

/** 'default' (not yet asked) | 'granted' | 'denied' | 'unsupported' */
export function getPushPermissionState() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function enablePushNotifications() {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  await pushApi.subscribe(subscription.toJSON());
  return subscription;
}

export async function disablePushNotifications() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await pushApi.unsubscribe(subscription.endpoint);
    await subscription.unsubscribe();
  }
}
