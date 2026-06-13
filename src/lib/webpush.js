import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

// Resolve VAPID keys file path
const keysPath = path.join(process.cwd(), 'src/lib/vapid-keys.json');

let vapidKeys = null;

if (fs.existsSync(keysPath)) {
  try {
    vapidKeys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
  } catch (err) {
    console.error('Error reading VAPID keys:', err);
  }
}

if (!vapidKeys) {
  // Generate VAPID keys dynamically if not exists
  console.log('[WEBPUSH] Generating VAPID keys...');
  vapidKeys = webpush.generateVAPIDKeys();
  try {
    // Ensure parent dir exists
    const dir = path.dirname(keysPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(keysPath, JSON.stringify(vapidKeys, null, 2), 'utf8');
    console.log('[WEBPUSH] Saved generated VAPID keys to src/lib/vapid-keys.json');
  } catch (err) {
    console.error('[WEBPUSH] Error saving VAPID keys:', err);
  }
}

// Configure web-push
webpush.setVapidDetails(
  'mailto:admin@mymuayy.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export { webpush, vapidKeys };

export async function sendPush(subscription, payload) {
  try {
    const subObj = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    await webpush.sendNotification(subObj, payloadStr);
    return { success: true };
  } catch (err) {
    console.error('[WEBPUSH SEND ERROR]:', err);
    // If subscription is expired/invalid (status 410 or 404), return expired to clean it up from DB
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { success: false, expired: true };
    }
    return { success: false, error: err };
  }
}
