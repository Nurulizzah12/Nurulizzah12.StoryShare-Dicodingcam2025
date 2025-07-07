// src/index.js
import 'leaflet/dist/leaflet.css';
import './styles/style.css';

import App from './scripts/app';
import { getAccessToken } from './scripts/utils/auth';
import CONFIG, { VAPID_PUBLIC_KEY } from './scripts/globals/config';
// Import fungsi subscribe, unsubscribe, isSubscribed dari notification-helper
import { subscribe, unsubscribe, isSubscribed } from './scripts/utils/notification-helper';

// Inisialisasi aplikasi
const app = new App({
  content: document.getElementById('mainContent'),
});

window.addEventListener('DOMContentLoaded', async () => {
  app.renderPage();

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', (event) => {
      event.preventDefault();
      console.log('Logout diklik');

      const confirmLogout = confirm('Yakin ingin logout?');
      if (confirmLogout) {
        localStorage.removeItem('token');
        alert('Berhasil logout!');
        window.location.hash = '#/login';
      }
    });
  }

  // Panggil setupPushNotificationButton setelah DOM siap
  setupPushNotificationButton();
});

window.addEventListener('hashchange', () => {
  app.renderPage();
});

// Service Worker Registration
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker tidak didukung browser ini!');
    return;
  }

  navigator.serviceWorker.register('/service-worker.js')
    .then((registration) => {
      console.log('✅ Service Worker berhasil didaftarkan:', registration);
      // setupPushNotificationAfterSW tidak diperlukan lagi jika subscribe dihandle oleh notification-helper
      // setupPushNotificationAfterSW();
    })
    .catch((error) => {
      console.error('❌ Pendaftaran Service Worker gagal:', error);
    });
}

// HAPUS FUNGSI handleEnablePushNotification INI, karena logikanya sudah di notification-helper.js
// async function handleEnablePushNotification() { /* ... */ }

// HAPUS FUNGSI setupPushNotification INI, karena tidak lagi relevan
// function setupPushNotification() { /* ... */ }

// HAPUS FUNGSI setupPushNotificationAfterSW INI, karena tidak lagi relevan
// function setupPushNotificationAfterSW() { /* ... */ }

// --- LOGIKA TOMBOL NOTIFIKASI SUDAH DI SINI, HANYA SEDIKIT PENYESUAIAN ---
async function setupPushNotificationButton() {
  const enablePushBtn = document.getElementById('enablePush');

  if (!enablePushBtn) {
    console.warn('Tombol "enablePush" tidak ditemukan di DOM.');
    return;
  }

  const updateButtonState = async () => {
    const subscribed = await isSubscribed(); // Gunakan isSubscribed dari notification-helper
    if (subscribed) {
      enablePushBtn.textContent = '🔕 Disable Notifications';
      enablePushBtn.classList.remove('enable-push-btn');
      enablePushBtn.classList.add('disable-push-btn');
    } else {
      enablePushBtn.textContent = '🔔 Enable Notifications';
      enablePushBtn.classList.remove('disable-push-btn');
      enablePushBtn.classList.add('enable-push-btn');
    }
  };

  // Update state tombol saat halaman dimuat
  await updateButtonState();

  enablePushBtn.addEventListener('click', async () => {
    try {
      const subscribed = await isSubscribed(); // Gunakan isSubscribed dari notification-helper
      if (subscribed) {
        await unsubscribe(); // Gunakan unsubscribe dari notification-helper
      } else {
        await subscribe(); // Gunakan subscribe dari notification-helper
      }
      // Update state tombol setelah subscribe/unsubscribe
      await updateButtonState();
    } catch (error) {
      console.error('Error handling notification button click:', error);
      alert('Terjadi kesalahan saat mengubah status notifikasi.');
    }
  });

  console.log('✅ Push notification button setup complete.');
}

// HAPUS FUNGSI urlBase64ToUint8Array INI KARENA SUDAH DIPINDAHKAN KE notification-helper.js
// function urlBase64ToUint8Array(base64String) { /* ... */ }

// Panggil fungsi registerServiceWorker saat aplikasi dimuat
window.addEventListener('load', () => {
  registerServiceWorker();
});