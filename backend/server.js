require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Firebase Admin
let initialized = false;
function initFirebase() {
  if (initialized) return;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const cred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({ credential: admin.credential.cert(cred) });
    } else {
      const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, 'serviceAccountKey.json');
      const serviceAccount = require(keyPath);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    initialized = true;
    console.log('Firebase Admin initialized');
  } catch (err) {
    console.error('Firebase init error:', err.message);
  }
}

initFirebase();

// Send push to a single FCM token (from your React app)
app.post('/send-notification', async (req, res) => {
  const { token, title, body, image, icon, link, data } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Missing "token" (FCM device token from frontend)' });
  }
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase not initialized. Add service account key.' });
  }
  try {
    const notification = {
      title: title || 'Test Notification',
      body: body || 'Hello from backend!',
    };
    if (image) notification.image = image;
    if (icon) notification.icon = icon;

    const message = {
      token,
      notification,
      data: data && typeof data === 'object' ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [String(k), String(v)])
      ) : {},
      webpush: {
        fcmOptions: {
          link: link || '/',
        },
      },
    };
    const id = await admin.messaging().send(message);
    return res.json({ success: true, messageId: id });
  } catch (err) {
    console.error('Send error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, firebase: initialized });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  if (!initialized) console.log('Add serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT_JSON to send notifications.');
});
