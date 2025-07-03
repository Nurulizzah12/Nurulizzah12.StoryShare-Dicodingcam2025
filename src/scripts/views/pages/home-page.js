// src/scripts/views/pages/home-page.js
import { createStoryItemTemplate } from '../templates/template-creator';
import HomePresenter from '../../presenter/home-presenter';
import StoryRepository from '../../data/story-repository';
import StoryApiSource from '../../data/story-api-source';
import MapHelper from '../../utils/map-helper';
import L from 'leaflet';

// Fungsi untuk mendapatkan fungsi message box global
function getGlobalMessageBoxFunctions() {
    const showMessageBox = typeof window.showMessageBox === 'function' ? window.showMessageBox : (msg, type) => console.log(`[Message: ${type}] ${msg}`);
    const showModalMessageBox = typeof window.showModalMessageBox === 'function' ? window.showModalMessageBox : (title, msg) => console.log(`[Modal: ${title}] ${msg}`);
    return { showMessageBox, showModalMessageBox };
}

const HomePage = {
  async render() {
    return `
      <section class="content">
        <h2 class="content__heading">List Story</h2>
        <div class="loading" id="loading" style="display: none;">Memuat cerita...</div>
        <div class="error-container" id="error-container" style="display: none;"></div>
        <div id="stories" class="stories"></div>
        <div id="map" class="map" style="height: 400px; margin-top: 20px;"></div>
      </section>
    `;
  },

  async afterRender() {
    const { showMessageBox, showModalMessageBox } = getGlobalMessageBoxFunctions();
    const storyRepository = new StoryRepository(StoryApiSource);
    const storiesContainer = document.querySelector('#stories');
    const loadingElement = document.querySelector('#loading');
    const errorContainer = document.querySelector('#error-container');
    const mapContainer = document.querySelector('#map');

    const view = {
      showLoading() {
        loadingElement.style.display = 'block';
        storiesContainer.innerHTML = '';
        errorContainer.style.display = 'none';
      },

      hideLoading() {
        loadingElement.style.display = 'none';
      },

      showError(error) {
        errorContainer.innerHTML = `<p class="error-message">Error: ${error.message || 'Something went wrong'}</p>`;
        errorContainer.style.display = 'block';
        storiesContainer.innerHTML = '';
        showModalMessageBox('Gagal Memuat Cerita', error.message || 'Terjadi kesalahan saat memuat cerita.');
      },

      showLoginError() {
        errorContainer.innerHTML = '<div class="empty-state">Silakan login terlebih dahulu untuk melihat cerita.</div>';
        errorContainer.style.display = 'block';
        storiesContainer.innerHTML = '';
        showModalMessageBox('Akses Ditolak', 'Silakan login terlebih dahulu untuk melihat cerita.');
      },

      showEmptyStories() {
        storiesContainer.innerHTML = '<div class="empty-state">Tidak ada cerita yang tersedia</div>';
      },

      // Di bagian showStories function dalam home-page.js
      showStories(stories) {
        // 🔍 DEBUG: Cek data yang masuk ke view
        console.log('🔍 DEBUG: Stories received in view:', stories);
        console.log('🔍 DEBUG: Stories length in view:', stories.length);
        if (stories.length > 0) {
          console.log('🔍 DEBUG: First story in view:', stories[0]);
          console.log('🔍 DEBUG: Story keys in view:', Object.keys(stories[0]));
        }
        
        if (stories.length > 0) {
          storiesContainer.innerHTML = '';
          stories.forEach((story, index) => {
            console.log(`🔍 DEBUG: Processing story ${index}:`, story);
            const template = createStoryItemTemplate(story);
            console.log(`🔍 DEBUG: Generated template for story ${index}:`, template);
            storiesContainer.innerHTML += template;
          });
        } else {
          this.showEmptyStories();
        }

        if (mapContainer) {
          this.renderMap(stories);
        } else {
          console.error('HomePage: Elemen peta (#map) tidak ditemukan di DOM.');
          showModalMessageBox('Error Peta', 'Elemen peta tidak ditemukan di halaman beranda.');
        }
      },

      showMapError(message) {
        if (mapContainer) {
          mapContainer.innerHTML = `<div class="error-message">Map tidak dapat dimuat: ${message}</div>`;
          mapContainer.style.display = 'block';
          showModalMessageBox('Error Peta', `Peta tidak dapat dimuat: ${message}`);
        }
      },

      renderMap(stories) {
        try {
          if (!mapContainer || typeof L === 'undefined') {
            this.showMapError('Leaflet JS tidak ditemukan atau container peta tidak ada.');
            return;
          }

          // ✅ PERBAIKAN DI SINI UNTUK MAP: Hapus peta lama jika sudah ada
          // Cek apakah elemen mapContainer sudah memiliki instance peta Leaflet
          if (mapContainer._leaflet_id) {
              const existingMap = MapHelper.getMapInstance('map'); // Asumsi MapHelper punya getMapInstance yang mengembalikan instance berdasarkan ID DOM
              if (existingMap) {
                  existingMap.remove(); // Hapus instance peta lama
                  console.log('MapHelper: Peta lama di beranda dihapus.');
              }
          }
          
          const initialLat = stories.length > 0 && stories[0].latitude ? stories[0].latitude : -2.5489;
          const initialLon = stories.length > 0 && stories[0].longitude ? stories[0].longitude : 118.0149;

          const map = MapHelper.initMap('map', { // Gunakan ID string 'map'
            lat: initialLat,
            lng: initialLon,
            zoom: stories.length > 0 ? 5 : 4
          });

          if (map) {
            stories.filter(s => s.latitude && s.longitude).forEach(story => {
              L.marker([story.latitude, story.longitude]).addTo(map)
                .bindPopup(`<b>${story.title}</b><br>${story.location || 'Lokasi tidak diketahui'}`)
                .on('click', () => {
                  window.location.hash = `#/detail/${story.id}`;
                });
            });
            map.invalidateSize();
          } else {
            console.error('Leaflet map instance not found for rendering markers in home page.');
            showModalMessageBox('Error Peta', 'Instans peta Leaflet tidak ditemukan untuk menampilkan marker di beranda.');
          }
        } catch (error) {
          this.showMapError(error.message);
        }
      }
    };

    const homePresenter = new HomePresenter({
      view,
      storyRepository
    });

    await homePresenter.init();
  },
};

export default HomePage;