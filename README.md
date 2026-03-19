# Push Notification Test (Firebase)

Test sending and receiving push notifications: **React frontend** + **Node backend** using Firebase Cloud Messaging (FCM).

## What you need

1. **Firebase project** (free) at [console.firebase.google.com](https://console.firebase.google.com)
2. **Backend**: Firebase **service account key** (JSON)
3. **Frontend**: Firebase **Web app config** + **Web Push (VAPID) key**

---

## 1. Firebase Console setup

1. Create a project (or use existing) in [Firebase Console](https://console.firebase.google.com).
2. **Web app**
   - Project Overview → Add app → **Web** (</>).
   - Register app, copy the `firebaseConfig` object (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
3. **Cloud Messaging / VAPID**
   - Project Settings (gear) → **Cloud Messaging**.
   - Under **Web Push certificates**, click **Generate key pair** and copy the key (starts with `B...`). This is your **VAPID key**.
4. **Service account (for backend)**
   - Project Settings → **Service accounts** → **Generate new private key**.
   - Save the downloaded JSON as `backend/serviceAccountKey.json` (or set path in backend `.env`).

---

## 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set PORT if needed. Leave FIREBASE_SERVICE_ACCOUNT_PATH if you put key as serviceAccountKey.json
npm install
npm start
```

Runs at **http://localhost:4000**.  
Endpoint: `POST /send-notification` with body:

```json
{
  "token": "<FCM device token from frontend>",
  "title": "Optional title",
  "body": "Optional body"
}
```

---

## 3. Frontend

```bash
cd frontend
cp .env.example .env.local
```

Edit **`.env.local`** and set:

- All `VITE_FIREBASE_*` from your Firebase Web app config.
- `VITE_FIREBASE_VAPID_KEY` = Web Push key from Cloud Messaging.
- `VITE_BACKEND_URL=http://localhost:4000` (or your backend URL).

Then:

```bash
npm install
npm run dev
```

Open **http://localhost:3000**:

1. Click **Allow & get FCM token** (browser will ask for notification permission).
2. Copy or use the shown FCM token.
3. Use **Send notification** on the page (sends via your backend), or call your backend API with that token to send a message.

---

## Flow

- **Frontend**: Requests permission → gets **FCM token** → can receive notifications (foreground via React, background via service worker).
- **Backend**: Uses Firebase Admin SDK to send to that **token**.
- **Testing**: Click “Send notification” in the React app to send a message through the backend to the same browser; you should see the notification (or the “Last received” block when the tab is in focus).

---

## Troubleshooting

- **Token not generated**: Ensure `.env.local` has all Firebase keys and VAPID key, and you’re on **HTTPS or localhost**.
- **Backend “Firebase not initialized”**: Add `serviceAccountKey.json` in `backend/` or set `FIREBASE_SERVICE_ACCOUNT_PATH` / `FIREBASE_SERVICE_ACCOUNT_JSON` in backend `.env`.
- **No notification in background**: Ensure `firebase-messaging-sw.js` is at the site root (Vite serves `public/` at `/`). Run `npm run generate-sw` after changing `.env.local`.
- **CORS**: Backend has `cors` enabled for all origins; restrict in production.
