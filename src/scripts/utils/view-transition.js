/**
 * Fungsi untuk mengatur transisi antar halaman
 * @param {Function} updateCallback - Callback yang mengupdate DOM
 * @returns {Promise} - Promise yang selesai ketika transisi selesai
 */
export const startViewTransition = async (updateCallback) => {
  // Cek apakah browser mendukung View Transitions API
  if (document.startViewTransition) {
    try {
      // Gunakan View Transitions API jika didukung
      const transition = document.startViewTransition(updateCallback);
      await transition.finished;
    } catch (error) {
      console.error('View transition error:', error);
      
      // Jika terjadi error saat transisi, tetap jalankan callback
      await updateCallback();
    }
  } else {
    // Jika tidak didukung, jalankan callback tanpa transisi
    await updateCallback();
  }
};