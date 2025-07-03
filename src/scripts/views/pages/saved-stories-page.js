// src/scripts/views/pages/saved-stories-page.js
import StoryRepository from '../../data/story-repository';
import StoryApiSource from '../../data/story-api-source'; // Diperlukan untuk instansiasi StoryRepository
import { createSavedStoryItemTemplate } from '../templates/template-creator'; // Import template baru

// Fungsi untuk mendapatkan fungsi message box global
function getGlobalMessageBoxFunctions() {
    const showMessageBox = typeof window.showMessageBox === 'function' ? window.showMessageBox : (msg, type) => console.log(`[Message: ${type}] ${msg}`);
    const showModalMessageBox = typeof window.showModalMessageBox === 'function' ? window.showModalMessageBox : (title, msg, callback, isConfirm) => {
        // Fallback untuk showModalMessageBox dengan callback
        console.log(`[Modal: ${title}] ${msg}`);
        if (callback && typeof callback === 'function') {
            if (isConfirm) {
                // Untuk konfirmasi, gunakan confirm dialog
                const result = confirm(`${title}: ${msg}`);
                callback(result);
            } else {
                callback();
            }
        }
    };
    return { showMessageBox, showModalMessageBox };
}

const SavedStoriesPage = {
    async render() {
      return `
        <section class="content">
          <h2 class="content__heading">Cerita Tersimpan Anda</h2>
          <div class="loading-indicator" id="loading-saved-stories" style="display: none;">Memuat cerita tersimpan...</div>
          <div class="error-container" id="error-saved-stories" style="display: none;"></div>
          <div id="saved-stories-list" class="stories"></div>
        </section>
      `;
    },
  
    async afterRender() {
        const { showMessageBox, showModalMessageBox } = getGlobalMessageBoxFunctions();
        const storyRepository = new StoryRepository(StoryApiSource); // Inisialisasi StoryRepository
        const loadingElement = document.querySelector('#loading-saved-stories');
        const errorElement = document.querySelector('#error-saved-stories');
        const savedStoriesList = document.querySelector('#saved-stories-list');

        const displaySavedStories = async () => {
            loadingElement.style.display = 'block';
            errorElement.style.display = 'none';
            savedStoriesList.innerHTML = ''; // Bersihkan daftar sebelumnya

            try {
                const savedStories = await storyRepository.getSavedStories();

                if (savedStories.length === 0) {
                    savedStoriesList.innerHTML = '<div class="empty-state">Anda belum menyimpan cerita apapun.</div>';
                } else {
                    savedStories.forEach(story => {
                        savedStoriesList.innerHTML += createSavedStoryItemTemplate(story);
                    });
                }
            } catch (error) {
                console.error('Error fetching saved stories:', error);
                errorElement.innerHTML = `<p class="error-message">Gagal memuat cerita tersimpan: ${error.message || 'Terjadi kesalahan.'}</p>`;
                errorElement.style.display = 'block';
                showModalMessageBox('Error', 'Gagal memuat cerita tersimpan.');
            } finally {
                loadingElement.style.display = 'none';
            }
        };

        // Panggil untuk pertama kali
        await displaySavedStories();

        // Tambahkan event listener untuk tombol hapus
        savedStoriesList.addEventListener('click', async (event) => {
            console.log('Click event detected:', event.target); // Debug log
            
            const deleteButton = event.target.closest('.btn-delete');
            if (deleteButton) {
                console.log('Delete button found:', deleteButton); // Debug log
                const storyId = deleteButton.dataset.id;
                console.log('Story ID to delete:', storyId); // Debug log
                
                if (!storyId) {
                    console.error('Story ID is missing from delete button');
                    showModalMessageBox('Error', 'ID cerita tidak ditemukan.');
                    return;
                }
                
                // Gunakan confirm dialog sebagai fallback jika showModalMessageBox tidak mendukung callback
                const confirmDelete = confirm('Apakah Anda yakin ingin menghapus cerita ini dari daftar tersimpan?');
                
                if (confirmDelete) {
                    try {
                        console.log('Attempting to delete story with ID:', storyId); // Debug log
                        await storyRepository.deleteSavedStory(storyId);
                        showMessageBox('Cerita berhasil dihapus dari daftar tersimpan!', 'success');
                        await displaySavedStories(); // Muat ulang daftar setelah menghapus
                    } catch (error) {
                        console.error('Error deleting saved story:', error);
                        showModalMessageBox('Hapus Gagal', `Gagal menghapus cerita: ${error.message || 'Terjadi kesalahan.'}`);
                    }
                }
            } else {
                console.log('Delete button not found, clicked element:', event.target); // Debug log
            }
        });
    },
};

export default SavedStoriesPage;