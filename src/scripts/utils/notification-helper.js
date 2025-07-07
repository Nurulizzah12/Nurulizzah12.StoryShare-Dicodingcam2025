// src/scripts/utils/notification-helper.js

import { VAPID_PUBLIC_KEY } from '../globals/config';
import StoryApiSource from '../data/story-api-source'; // Import StoryApiSource sebagai default export

// HAPUS BARIS INI:
// import { isPushNotificationSupported, urlBase64ToUint8Array, requestNotificationPermission } from './index';

const successSubscribeMessage = 'Notifikasi berhasil diaktifkan!';
const failureSubscribeMessage = 'Gagal mengaktifkan notifikasi. Pastikan Anda memberikan izin.';

// --- Definisi fungsi-fungsi utilitas yang dipindahkan ke sini ---
function isPushNotificationSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  return permission;
}
// --- Akhir definisi fungsi-fungsi utilitas ---

function generateSubscribeOptions() {
  return {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  };
}

/**
 * Subscribe to push notifications
 * @returns {Promise<void>}
 */
async function subscribe() {
  console.log('🔔 Memulai proses subscribe push notification...');

  if (!isPushNotificationSupported()) { // Menggunakan fungsi yang didefinisikan di sini
    console.log('❌ Push notification not supported.');
    alert('Browser Anda tidak mendukung notifikasi push.');
    return;
  }

  let pushSubscription = null;
  let serviceWorkerRegistration = null;

  try {
    // Step 1: Request notification permission
    const permission = await requestNotificationPermission(); // Menggunakan fungsi yang didefinisikan di sini
    if (permission !== 'granted') {
      alert('Izin notifikasi ditolak. Aktifkan izin notifikasi di pengaturan browser.');
      return;
    }

    // Step 2: Get service worker registration
    serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();
    if (!serviceWorkerRegistration) {
      console.error('❌ Service Worker belum terdaftar.');
      alert('Service Worker belum aktif. Coba refresh halaman.');
      return;
    }

    console.log('✅ Service Worker ready:', serviceWorkerRegistration);

    // Step 3: Check if already subscribed
    const existingSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('ℹ️ Already subscribed to push notifications');
      alert('Notifikasi sudah aktif!');
      return;
    }

    // Step 4: Subscribe to push notifications
    pushSubscription = await serviceWorkerRegistration.pushManager.subscribe(generateSubscribeOptions());
    console.log('✅ Push subscription created:', pushSubscription);

    // Step 5: Format request body sesuai permintaan reviewer
    const subscriptionJSON = pushSubscription.toJSON();
    const subscriptionData = {
      endpoint: subscriptionJSON.endpoint,
      keys: {
        auth: subscriptionJSON.keys.auth,
        p256dh: subscriptionJSON.keys.p256dh,
      },
    };

    console.log('📤 Sending subscription to server:', subscriptionData);

    // Step 6: Send subscription to server
    const response = await StoryApiSource.subscribePushNotification(subscriptionData); // Panggil dari StoryApiSource

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    console.log('✅ Subscription sent to server successfully');
    alert(successSubscribeMessage);

  } catch (error) {
    console.error('❌ Error during push notification subscription:', error);
    alert(failureSubscribeMessage + ` Error: ${error.message}`);
    
    // Cleanup: Batalkan langganan di client jika gagal di server
    if (pushSubscription) {
      try {
        await pushSubscription.unsubscribe();
        console.log('🧹 Subscription cleaned up from client');
      } catch (cleanupError) {
        console.error('❌ Error cleaning up subscription:', cleanupError);
      }
    }
  }
}

/**
 * Unsubscribe from push notifications
 * @returns {Promise<void>}
 */
async function unsubscribe() {
  console.log('🔕 Memulai proses unsubscribe push notification...');

  if (!isPushNotificationSupported()) { // Menggunakan fungsi yang didefinisikan di sini
    console.log('❌ Push notification not supported.');
    return;
  }

  try {
    const serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();
    if (!serviceWorkerRegistration) {
      console.error('❌ Service Worker belum terdaftar.');
      return;
    }

    const pushSubscription = await serviceWorkerRegistration.pushManager.getSubscription();

    if (pushSubscription) {
      // Pastikan StoryApiSource juga punya unsubscribePushNotification
      await StoryApiSource.unsubscribePushNotification(pushSubscription.endpoint); // Panggil dari StoryApiSource
      await pushSubscription.unsubscribe();
      console.log('✅ Unsubscribed from push notifications');
      alert('Notifikasi berhasil dinonaktifkan.');
    } else {
      alert('Anda belum berlangganan notifikasi.');
    }
  } catch (error) {
    console.error('❌ Error during push notification unsubscription:', error);
    alert('Gagal menonaktifkan notifikasi: ' + error.message);
  }
}

/**
 * Check if user is currently subscribed to push notifications
 * @returns {Promise<boolean>}
 */
async function isSubscribed() {
  if (!isPushNotificationSupported()) { // Menggunakan fungsi yang didefinisikan di sini
    return false;
  }

  try {
    const serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();
    if (!serviceWorkerRegistration) {
      return false;
    }

    const pushSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
    return pushSubscription !== null;
  } catch (error) {
    console.error('❌ Error checking subscription status:', error);
    return false;
  }
}

export { subscribe, unsubscribe, isSubscribed };