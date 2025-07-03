import 'leaflet/dist/leaflet.css';
import './styles/style.css';

import App from './scripts/app';
import { getAccessToken } from './scripts/utils/auth';

// Inisialisasi aplikasi
const app = new App({
  content: document.getElementById('mainContent'),
});

window.addEventListener('DOMContentLoaded', () => {
  app.renderPage();

  const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
  logoutButton.addEventListener('click', (event) => {
    event.preventDefault();
    console.log('Logout diklik'); // ✅ Sudah jalan

    const confirmLogout = confirm('Yakin ingin logout?');
    if (confirmLogout) {
      // Hapus token dari localStorage
      localStorage.removeItem('token');

      // Tampilkan alert
      alert('Berhasil logout!');

      // Redirect ke halaman login
      window.location.hash = '#/login';

      // Optional: Reload aplikasi
      // location.reload();
    }
  });
}
});


window.addEventListener('hashchange', () => {
  app.renderPage();
});

// ✅ PERBAIKAN: Service Worker Registration yang aman
function registerServiceWorker() {
  // Cek environment dengan lebih aman
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const forceEnableSW = localStorage.getItem('force-enable-sw') === 'true';
  
  // PERBAIKAN: Di development, disable SW secara default
  if (isDevelopment && !forceEnableSW) {
    console.log('🔧 Service Worker disabled in development mode');
    console.log('💡 To enable SW in dev, run in console: window.debugSW.enable()');
    return;
  }

  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Worker not supported');
    return;
  }

  // PERBAIKAN: Tambahkan flag untuk mencegah multiple registration
  if (window.swRegistrationInProgress) {
    console.log('⏳ SW registration already in progress');
    return;
  }

  window.swRegistrationInProgress = true;

  window.addEventListener('load', async () => {
    try {
      // PERBAIKAN: Hanya unregister jika ada konflik nyata
      const existingRegs = await navigator.serviceWorker.getRegistrations();
      let needsCleanup = false;
      
      for (const reg of existingRegs) {
        // Hanya unregister jika scope berbeda atau dalam development mode
        if (reg.scope !== window.location.origin + '/' || (isDevelopment && forceEnableSW)) {
          console.log('🧹 Cleaning up conflicting SW:', reg.scope);
          await reg.unregister();
          needsCleanup = true;
        }
      }

      // PERBAIKAN: Jika ada cleanup, tunggu sebentar sebelum register ulang
      if (needsCleanup) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Register service worker baru
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      console.log('✅ Service Worker registered successfully:', registration.scope);

      // PERBAIKAN: Handle updates dengan lebih hati-hati
      registration.addEventListener('updatefound', handleServiceWorkerUpdate);

      // PERBAIKAN: Controller change handler yang lebih aman
      let controllerChangeHandled = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (controllerChangeHandled) return;
        controllerChangeHandled = true;
        
        console.log('🔄 Service Worker controller changed');
        
        // Hanya reload jika user sudah konfirmasi update
        const userConfirmedUpdate = sessionStorage.getItem('sw-update-confirmed') === 'true';
        if (userConfirmedUpdate) {
          sessionStorage.removeItem('sw-update-confirmed');
          console.log('🔄 Reloading after SW update...');
          window.location.reload();
        }
      });

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      
      // PERBAIKAN: Error handling yang tidak menyebabkan loop
      if (isDevelopment) {
        console.log('🔧 Disabling SW due to registration error');
        localStorage.removeItem('force-enable-sw');
      }
    } finally {
      window.swRegistrationInProgress = false;
    }
  });
}

// PERBAIKAN: Update handler yang lebih aman
function handleServiceWorkerUpdate(event) {
  const registration = event.target;
  const newWorker = registration.installing;
  
  if (!newWorker) return;
  
  console.log('🆕 New service worker installing...');
  
  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      console.log('🆕 New service worker available, waiting for user confirmation');
      
      // PERBAIKAN: Gunakan UI yang lebih user-friendly
      showUpdateNotification(() => {
        sessionStorage.setItem('sw-update-confirmed', 'true');
        newWorker.postMessage({ type: 'SKIP_WAITING' });
      });
    }
  });
}

// PERBAIKAN: Update notification yang tidak memaksa reload
function showUpdateNotification(onConfirm) {
  // Buat notification yang tidak intrusive
  const notification = document.createElement('div');
  notification.id = 'sw-update-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 300px;
      font-family: Inter, sans-serif;
    ">
      <div style="font-weight: 600; margin-bottom: 8px;">
        ⚡ Update Tersedia
      </div>
      <div style="font-size: 14px; margin-bottom: 12px;">
        Ada versi baru aplikasi. Perbarui sekarang?
      </div>
      <div>
        <button id="sw-update-yes" style="
          background: white;
          color: #4CAF50;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          margin-right: 8px;
          cursor: pointer;
          font-weight: 600;
        ">Perbarui</button>
        <button id="sw-update-later" style="
          background: transparent;
          color: white;
          border: 1px solid white;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        ">Nanti</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Event listeners untuk tombol
  notification.querySelector('#sw-update-yes').addEventListener('click', () => {
    document.body.removeChild(notification);
    onConfirm();
  });
  
  notification.querySelector('#sw-update-later').addEventListener('click', () => {
    document.body.removeChild(notification);
  });
  
  // Auto-hide setelah 10 detik
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 10000);
}

// PERBAIKAN: Debug helper yang lebih aman
window.debugSW = {
  enable: () => {
    localStorage.setItem('force-enable-sw', 'true');
    console.log('✅ SW force-enabled. Reloading...');
    location.reload();
  },
  disable: () => {
    localStorage.removeItem('force-enable-sw');
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => {
        console.log('🗑️ Unregistering SW:', reg.scope);
        reg.unregister();
      });
      console.log('✅ SW disabled. Reloading...');
      location.reload();
    });
  },
  status: () => {
    console.log('📊 SW Status:', {
      environment: process.env.NODE_ENV || 'development',
      forceEnabled: localStorage.getItem('force-enable-sw'),
      registered: navigator.serviceWorker.controller ? 'Yes' : 'No',
      registrations: navigator.serviceWorker.getRegistrations().then(regs => 
        regs.map(r => r.scope)
      )
    });
  },
  cleanup: async () => {
    // Emergency cleanup function
    console.log('🧹 Emergency SW cleanup...');
    localStorage.removeItem('force-enable-sw');
    sessionStorage.clear();
    
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(reg => reg.unregister()));
    
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    console.log('✅ Cleanup completed. Reloading...');
    location.reload();
  }
};

// PERBAIKAN: Panggil registrasi dengan safety check
try {
  registerServiceWorker();
} catch (error) {
  console.error('❌ Failed to initialize SW registration:', error);
}

// ✅ Push Notification (tidak diubah, sudah OK)
document.getElementById('enablePush')?.addEventListener('click', async () => {
  try {
    if (!('serviceWorker' in navigator)) {
      alert('Service Worker tidak didukung browser ini!');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('Izin notifikasi ditolak');
      return;
    }

    const swRegistration = await navigator.serviceWorker.ready;

    const response = await fetch('https://story-api.dicoding.dev/v1/notifications/key');
    const { data: { publicKey } } = await response.json();

    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    alert('Notifikasi berhasil diaktifkan!');
  } catch (error) {
    console.error('❌ Push notification setup failed:', error);
    alert('Gagal mengaktifkan notifikasi: ' + error.message);
  }
});

// Fungsi bantu VAPID key (tidak diubah)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}