import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn('FCM not supported or already created', e.message);
}

export const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export async function requestNotificationPermission() {
  if (!('Notification' in window)) throw new Error('Notifications not supported');
  const permission = await Notification.requestPermission();
  return permission;
}

export async function getFCMToken() {
  if (!messaging) throw new Error('Messaging not initialized. Check .env.local and Firebase config.');
  if (!vapidKey) throw new Error('VITE_FIREBASE_VAPID_KEY is required.');
  const token = await getToken(messaging, { vapidKey });
  return token;
}

export function onForegroundMessage(callback) {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}

export { messaging };
