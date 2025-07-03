# 📖 StoryShare - Story App

StoryShare adalah aplikasi berbasis web untuk membagikan cerita pribadi dalam bentuk teks dan gambar. Aplikasi ini memungkinkan pengguna untuk menulis cerita, melihat cerita dari pengguna lain, dan membagikan pengalaman mereka secara interaktif dengan fitur lokasi dan notifikasi.

## 🌐 Fitur Utama

- 🔥 **List Cerita**: Tampilkan kumpulan cerita terbaru dengan gambar, judul, waktu, lokasi, dan nama penulis.
- ➕ **Tambah Cerita**: Pengguna dapat mengunggah cerita baru dengan judul, deskripsi, foto, dan lokasi.
- 📍 **Lokasi Otomatis**: Cerita akan menampilkan lokasi berdasarkan informasi geografis pengguna.
- 🛎️ **Push Notifikasi**: Pengguna dapat mengaktifkan notifikasi untuk mendapatkan update cerita terbaru.
- 💾 **Cerita Tersimpan**: Simpan cerita favorit pengguna untuk dibaca nanti.
- 📱 **Responsive Design**: Tampilan antarmuka dioptimalkan untuk semua perangkat (mobile & desktop).
- ⚙️ **PWA Support**: Aplikasi dapat diinstal seperti aplikasi native dan dapat berjalan secara offline.

## 🛠️ Teknologi yang Digunakan

- **Frontend**: HTML, CSS, JavaScript
- **SPA Architecture**: Menggunakan `Hash Routing` untuk navigasi antar halaman
- **Service Worker**: Workbox untuk caching aset dan membuat aplikasi berjalan offline
- **Push Notification**: Web Push API
- **Geolocation API**: Untuk mengambil lokasi otomatis pengguna
- **Webpack**: Untuk bundling dan optimasi aset
- **RESTful API**: Digunakan untuk pengambilan dan penyimpanan data cerita

## 🚀 Instalasi
- npm install
- npx serve dist