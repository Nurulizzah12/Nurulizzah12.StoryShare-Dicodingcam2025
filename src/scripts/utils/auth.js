// src/scripts/utils/auth.js
export function getAccessToken() {
  return localStorage.getItem('token');
}

export function setAccessToken(token) {
  localStorage.setItem('token', token);
}

export function logout() {
  localStorage.removeItem('token');
  // Opsional: hapus juga data user dari IndexedDB jika ada
  // import { deleteAuthToken } from '../database';
  // deleteAuthToken();
  window.location.hash = '#/login'; // Arahkan ke halaman login setelah logout
  window.location.reload(); // Reload halaman untuk memastikan state bersih
}