import { useState, useEffect } from 'react';
import {
  requestNotificationPermission,
  getFCMToken,
  onForegroundMessage,
} from './firebase';
import './App.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export default function App() {
  const [permission, setPermission] = useState(Notification?.permission || '');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastMessage, setLastMessage] = useState(null);
  const [sendToken, setSendToken] = useState('');
  const [sendDeviceLabel, setSendDeviceLabel] = useState('');
  const [sendTitle, setSendTitle] = useState('Test from React');
  const [sendBody, setSendBody] = useState('Hello, this is a push notification!');
  const [sendImage, setSendImage] = useState('');
  const [sendIcon, setSendIcon] = useState('');
  const [sendLink, setSendLink] = useState('');
  const [sendDataJson, setSendDataJson] = useState('{}');
  const [sendStatus, setSendStatus] = useState('');

  useEffect(() => {
    setPermission(Notification?.permission || '');
  }, []);

  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      setLastMessage(payload);
      if (payload.notification) {
        setLastMessage((m) => ({ ...m, title: payload.notification?.title, body: payload.notification?.body }));
        // Show a system notification when app is in foreground so you always see the push
        if (Notification.permission === 'granted') {
          const n = payload.notification;
          new Notification(n.title || 'Notification', {
            body: n.body || '',
            icon: n.icon || '/favicon.ico',
            tag: 'fcm-foreground',
          });
        }
      }
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const handleRequestPermission = async () => {
    setError('');
    setLoading(true);
    try {
      const p = await requestNotificationPermission();
      setPermission(p);
      if (p === 'granted') {
        const t = await getFCMToken();
        setToken(t);
        setSendToken(t);
      } else {
        setError('Permission denied');
      }
    } catch (e) {
      setError(e.message || 'Failed to get permission/token');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    const targetToken = sendToken.trim();
    if (!targetToken) {
      setError('FCM token is required. Paste a device token or use "Use my device token".');
      return;
    }
    if (!sendTitle.trim()) {
      setError('Title is required.');
      return;
    }
    if (!sendBody.trim()) {
      setError('Body is required.');
      return;
    }
    let data = {};
    if (sendDataJson.trim()) {
      try {
        data = JSON.parse(sendDataJson);
      } catch {
        setError('Custom data must be valid JSON.');
        return;
      }
    }
    if (sendDeviceLabel.trim()) {
      data = { ...data, recipientLabel: sendDeviceLabel.trim() };
    }
    setSendStatus('Sending...');
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: targetToken,
          title: sendTitle.trim(),
          body: sendBody.trim(),
          image: sendImage.trim() || undefined,
          icon: sendIcon.trim() || undefined,
          link: sendLink.trim() || undefined,
          data: Object.keys(data).length ? data : undefined,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || res.statusText);
      setSendStatus('Sent! Notification delivered to device.');
    } catch (e) {
      setSendStatus('');
      setError(e.message);
    }
  };

  const fillMyToken = async () => {
    setError('');
    if (token) {
      setSendToken(token);
      setSendStatus('Filled with your token');
      setTimeout(() => setSendStatus(''), 2000);
      return;
    }
    setLoading(true);
    try {
      const p = await requestNotificationPermission();
      setPermission(p);
      if (p === 'granted') {
        const t = await getFCMToken();
        setToken(t);
        setSendToken(t);
        setSendStatus('Filled with your token');
        setTimeout(() => setSendStatus(''), 2000);
      } else {
        setError('Permission denied');
      }
    } catch (e) {
      setError(e.message || 'Failed to get token');
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setSendStatus('Token copied to clipboard');
      setTimeout(() => setSendStatus(''), 2000);
    }
  };

  return (
    <div className="app">
      <h1>Send Push Notification</h1>
      <p className="subtitle">Fill the form and press Send to deliver to a device</p>

      <section className="card form-card">
        <h2>Notification form</h2>

        <div className="form-section">
          <span className="form-section-title">Device / recipient</span>
          <label>
            <span className="label">FCM device token <em>(required)</em></span>
            <textarea
              placeholder="Paste the FCM token of the device to send to, or use the button below"
              value={sendToken}
              onChange={(e) => setSendToken(e.target.value)}
              rows={2}
              className="mono"
            />
            <button type="button" className="button-secondary" onClick={fillMyToken} disabled={loading}>
              {loading ? 'Requesting…' : 'Use my device token'}
            </button>
          </label>
          <label>
            <span className="label">Recipient / device label <em>(optional)</em></span>
            <input
              type="text"
              placeholder="e.g. John's iPhone, Android device"
              value={sendDeviceLabel}
              onChange={(e) => setSendDeviceLabel(e.target.value)}
            />
          </label>
        </div>

        <div className="form-section">
          <span className="form-section-title">Notification content</span>
          <label>
            <span className="label">Title <em>(required)</em></span>
            <input
              type="text"
              placeholder="e.g. New message"
              value={sendTitle}
              onChange={(e) => setSendTitle(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Body <em>(required)</em></span>
            <textarea
              placeholder="e.g. You have a new message from John"
              value={sendBody}
              onChange={(e) => setSendBody(e.target.value)}
              rows={2}
            />
          </label>
          <label>
            <span className="label">Image URL <em>(optional)</em></span>
            <input
              type="url"
              placeholder="https://example.com/image.png"
              value={sendImage}
              onChange={(e) => setSendImage(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Icon URL <em>(optional)</em></span>
            <input
              type="url"
              placeholder="https://example.com/icon.png"
              value={sendIcon}
              onChange={(e) => setSendIcon(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Click link <em>(optional)</em></span>
            <input
              type="url"
              placeholder="https://example.com or /path"
              value={sendLink}
              onChange={(e) => setSendLink(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Custom data <em>(optional JSON)</em></span>
            <textarea
              placeholder='{"key": "value"}'
              value={sendDataJson}
              onChange={(e) => setSendDataJson(e.target.value)}
              rows={2}
              className="mono"
            />
          </label>
        </div>

        <button type="button" className="button-send" onClick={handleSendTest}>
          Send notification
        </button>
        {sendStatus && <p className="status">{sendStatus}</p>}
      </section>

      {token && (
        <section className="card card-compact">
          <h2>Your FCM token</h2>
          <p className="token">{token.slice(0, 60)}…</p>
          <button type="button" className="button-secondary" onClick={copyToken}>Copy full token</button>
        </section>
      )}

      {lastMessage && (
        <section className="card last-message">
          <h2>Last received (this device)</h2>
          <pre>{JSON.stringify(lastMessage.notification || lastMessage, null, 2)}</pre>
        </section>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
