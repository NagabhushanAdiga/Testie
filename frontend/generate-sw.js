/**
 * Generates public/firebase-messaging-sw.js from .env.local
 * Run: node generate-sw.js (after filling .env.local)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env.local');
const swPath = path.join(__dirname, 'public', 'firebase-messaging-sw.js');

if (!fs.existsSync(envPath)) {
  console.warn('.env.local not found. Copy .env.example to .env.local and fill Firebase config, then run this again.');
  process.exit(0);
}

const env = fs.readFileSync(envPath, 'utf8');
const vars = {};
env.split('\n').forEach((line) => {
  const m = line.match(/^VITE_FIREBASE_(.+?)=(.+)$/);
  if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
});

const config = {
  apiKey: vars.API_KEY || 'YOUR_API_KEY',
  authDomain: vars.AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
  projectId: vars.PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: vars.STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: vars.MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: vars.APP_ID || 'YOUR_APP_ID',
};

const swContent = `// Auto-generated from .env.local - do not edit by hand
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Notification';
  const options = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});
`;

fs.writeFileSync(swPath, swContent);
console.log('Generated public/firebase-messaging-sw.js from .env.local');
