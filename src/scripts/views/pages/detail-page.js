// src/scripts/views/pages/detail-page.js
import UrlParser from '../../utils/url-parser';
import StoryRepository from '../../data/story-repository';
import StoryApiSource from '../../data/story-api-source';
import { createStoryDetailTemplate } from '../templates/template-creator';
import DetailPresenter from '../../presenter/detail-presenter';
import MapHelper from '../../utils/map-helper';

// Fungsi untuk mendapatkan fungsi message box global
function getGlobalMessageBoxFunctions() {
    const showModalMessageBox = typeof window.showModalMessageBox === 'function' ? window.showModalMessageBox : (title, msg) => console.log(`[Modal: ${title}] ${msg}`);
    return { showModalMessageBox };
}

const DetailPage = {
  async render() {
    return `
      <div class="content">
        <h2 class="content__heading">Story Detail</h2>
        <div id="story" class="story"></div>
        <div id="loading" class="loading-indicator" style="display: none;">Memuat...</div>
        <div id="error-container" class="error-container" style="display: none;"></div>
        <!-- Tambahkan container untuk peta -->
        <div id="detail-map-container" style="height: 400px; margin-top: 20px;"></div>
      </div>
    `;
  },

  async afterRender() {
    const { showModalMessageBox } = getGlobalMessageBoxFunctions();
    const storyContainer = document.querySelector('#story');
    const loadingElement = document.querySelector('#loading');
    const errorContainer = document.querySelector('#error-container');
    const detailMapContainer = document.querySelector('#detail-map-container');

    // Get the story ID from URL
    const url = UrlParser.parseActiveUrlWithoutCombiner();
    let id = url.id;

    // 🔍 DEBUG: Log detail URL parsing dengan informasi lebih lengkap
    console.log('🐛 DetailPage afterRender:', {
      currentHash: window.location.hash,
      currentHashRaw: window.location.hash.slice(1),
      parsedUrl: url,
      rawId: id,
      idType: typeof id,
      hashParts: window.location.hash.slice(1).split('/')
    });

    // ✅ VALIDASI ID yang lebih baik
    if (!id || id.trim() === '' || id === 'undefined' || id === 'null') {
        console.error('❌ DetailPage: Invalid or missing story ID:', {
          id: id,
          hash: window.location.hash,
          urlParts: window.location.hash.slice(1).split('/')
        });
        
        const userMessage = 'ID cerita tidak ditemukan di URL. Pastikan Anda mengakses link yang benar.';
        showModalMessageBox('Error Navigasi', userMessage);
        
        errorContainer.innerHTML = `
          <div class="error-message">
            <h3>Error: ID cerita tidak valid</h3>
            <p>URL saat ini: <code>${window.location.hash}</code></p>
            <p>ID yang terdeteksi: <code>${id || 'null'}</code></p>
            <button onclick="window.location.hash='#/'" class="btn-back">← Kembali ke Beranda</button>
          </div>
        `;
        errorContainer.style.display = 'block';
        loadingElement.style.display = 'none';
        return;
    }

    // ✅ CLEAN ID (hapus whitespace, tapi pertahankan case)
    id = id.trim();
    
    console.log('✅ DetailPage: Using cleaned story ID:', {
      original: url.id,
      cleaned: id,
      length: id.length
    });
    
    // Initialize the repository
    const storyRepository = new StoryRepository(StoryApiSource);
    
    // Define the view interface for the presenter
    const view = {
      showLoading() {
        console.log('🔄 DetailPage View: Showing loading...');
        loadingElement.style.display = 'block';
        storyContainer.innerHTML = '';
        errorContainer.style.display = 'none';
      },
      
      hideLoading() {
        console.log('✅ DetailPage View: Hiding loading...');
        loadingElement.style.display = 'none';
      },
      
      showError(error) {
        console.error('❌ DetailPage View: Showing error:', error);
        
        // Analisis jenis error untuk pesan yang lebih informatif
        let userMessage = 'Gagal memuat detail cerita.';
        let technicalInfo = error.message || 'Unknown error';
        let suggestions = [];
        
        if (error.message.includes('tidak ditemukan') || error.message.includes('404')) {
          userMessage = 'Cerita tidak ditemukan';
          suggestions = [
            'Pastikan ID cerita benar',
            'Cerita mungkin sudah dihapus',
            'Coba refresh halaman atau kembali ke beranda'
          ];
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          userMessage = 'Masalah koneksi jaringan';
          suggestions = [
            'Periksa koneksi internet Anda',
            'Coba refresh halaman',
            'Server mungkin sedang bermasalah'
          ];
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
          userMessage = 'Sesi telah berakhir';
          suggestions = [
            'Silakan login kembali',
            'Token akses mungkin sudah kedaluwarsa'
          ];
        }

        errorContainer.innerHTML = `
          <div class="error-message">
            <h3>❌ ${userMessage}</h3>
            <p><strong>ID Cerita:</strong> <code>${id}</code></p>
            <p><strong>Detail Error:</strong> ${technicalInfo}</p>
            ${suggestions.length > 0 ? `
              <div class="error-suggestions">
                <p><strong>Saran:</strong></p>
                <ul>
                  ${suggestions.map(s => `<li>${s}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            <div class="error-actions">
              <button onclick="window.location.reload()" class="btn-retry">🔄 Coba Lagi</button>
              <button onclick="window.location.hash='#/'" class="btn-back">← Kembali ke Beranda</button>
            </div>
          </div>
        `;
        errorContainer.style.display = 'block';
        storyContainer.innerHTML = '';
        
        // Tampilkan modal error yang lebih user-friendly
        showModalMessageBox('Error Memuat Cerita', userMessage);
      },
      
      // Perbaikan untuk event listener di detail-page.js
// Ganti bagian showStoryDetail di DetailPage dengan yang ini:

showStoryDetail(story) {
    console.log('✅ DetailPage View: Showing story detail:', story);
    
    // Validasi data story sebelum render
    if (!story || !story.id) {
        console.error('❌ Invalid story data received:', story);
        this.showError(new Error('Data cerita tidak valid dari server'));
        return;
    }
    
    storyContainer.innerHTML = createStoryDetailTemplate(story);
    
    // Initialize map if coordinates are available
    if (story.latitude && story.longitude) {
        console.log('🗺️ Rendering map for story location');
        this.renderMap(story.latitude, story.longitude, story.location || 'Lokasi Cerita');
    } else {
        console.log('ℹ️ No location data available for map');
        // Hide map container if no location data
        if (detailMapContainer) {
            detailMapContainer.style.display = 'none';
        }
    }

    // ✅ PERBAIKAN: Event listener untuk tombol simpan dengan error handling yang lebih baik
    const saveStoryBtn = document.getElementById('saveStoryBtn');
    if (saveStoryBtn) {
        saveStoryBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            console.log('🔄 Save button clicked, story:', story);
            
            // Disable button sementara untuk mencegah multiple clicks
            saveStoryBtn.disabled = true;
            saveStoryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
            
            try {
                // Pastikan ada konfirmasi yang jelas
                const confirmResult = await new Promise((resolve) => {
                    if (typeof showModalMessageBox === 'function' && showModalMessageBox.length >= 3) {
                        // Jika showModalMessageBox mendukung callback
                        showModalMessageBox('Konfirmasi Simpan', 'Apakah Anda yakin ingin menyimpan cerita ini?', resolve, true);
                    } else {
                        // Fallback menggunakan confirm browser
                        const result = confirm('Apakah Anda yakin ingin menyimpan cerita ini?');
                        resolve(result);
                    }
                });
                
                if (confirmResult) {
                    console.log('🔄 User confirmed, saving story...');
                    
                    // Pastikan storyRepository terdefinisi
                    if (!storyRepository) {
                        throw new Error('StoryRepository tidak tersedia');
                    }
                    
                    // Pastikan method saveStory ada
                    if (typeof storyRepository.saveStory !== 'function') {
                        throw new Error('Method saveStory tidak tersedia di StoryRepository');
                    }
                    
                    await storyRepository.saveStory(story);
                    
                    // Berhasil disimpan
                    saveStoryBtn.innerHTML = '<i class="fas fa-check"></i> Tersimpan!';
                    saveStoryBtn.classList.add('success');
                    
                    // Reset button setelah 2 detik
                    setTimeout(() => {
                        saveStoryBtn.innerHTML = '<i class="fas fa-bookmark"></i> Simpan Story';
                        saveStoryBtn.classList.remove('success');
                        saveStoryBtn.disabled = false;
                    }, 2000);
                    
                    console.log('✅ Story saved successfully');
                } else {
                    console.log('ℹ️ User cancelled save operation');
                    // Reset button jika user batal
                    saveStoryBtn.innerHTML = '<i class="fas fa-bookmark"></i> Simpan Story';
                    saveStoryBtn.disabled = false;
                }
                
            } catch (saveError) {
                console.error('❌ Failed to save story:', saveError);
                
                // Reset button dengan status error
                saveStoryBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Gagal Menyimpan';
                saveStoryBtn.classList.add('error');
                saveStoryBtn.disabled = false;
                
                // Show error message
                const errorMessage = saveError.message || 'Terjadi kesalahan saat menyimpan cerita';
                showModalMessageBox('Simpan Gagal', errorMessage);
                
                // Reset button setelah 3 detik
                setTimeout(() => {
                    saveStoryBtn.innerHTML = '<i class="fas fa-bookmark"></i> Simpan Story';
                    saveStoryBtn.classList.remove('error');
                }, 3000);
            }
        });
    } else {
        console.error('❌ Save button not found in DOM');
    }

    // Event listener untuk tombol notifikasi
    const tryNotificationBtn = document.getElementById('tryNotificationBtn');
    if (tryNotificationBtn) {
        tryNotificationBtn.addEventListener('click', () => {
            console.log('🔔 Notification button clicked');
            showModalMessageBox('Notifikasi Percobaan', `Anda akan mendapatkan notifikasi untuk: ${story.title}`);
        });
    }

    // Event listener untuk tombol kembali
    const backToListBtn = document.getElementById('backToListBtn');
    if (backToListBtn) {
        backToListBtn.addEventListener('click', () => {
            console.log('🔙 Back button clicked');
            window.location.hash = '#/';
        });
    }
},
      
      renderMap(lat, lon, locationName = 'Lokasi Cerita') {
        if (detailMapContainer && typeof L !== 'undefined') {
            detailMapContainer.id = 'map-instance';
            detailMapContainer.style.display = 'block';
            
            try {
              MapHelper.initMap(document.getElementById('map-instance'), {
                lat: lat,
                lng: lon,
                zoom: 13,
              });
              
              const mapInstance = MapHelper.getMapInstance(document.getElementById('map-instance'));
              if (mapInstance) {
                  L.marker([lat, lon]).addTo(mapInstance)
                      .bindPopup(locationName)
                      .openPopup();
                  mapInstance.invalidateSize();
                  console.log('✅ Map rendered successfully');
              } else {
                  throw new Error('Map instance not found');
              }
            } catch (mapError) {
              console.error('❌ Error rendering map:', mapError);
              detailMapContainer.innerHTML = '<div class="error-message">Peta tidak dapat dimuat.</div>';
            }
        } else {
            console.warn('⚠️ Map container or Leaflet JS not available');
            if (detailMapContainer) {
                detailMapContainer.innerHTML = '<div class="info-message">Peta lokasi tidak tersedia.</div>';
                detailMapContainer.style.display = 'block';
            }
        }
      }
    };
    
    // Initialize the presenter
    console.log('🚀 Initializing DetailPresenter with cleaned ID:', id);
    const detailPresenter = new DetailPresenter({ view, storyRepository, id });
    await detailPresenter.init();
  },
};

export default DetailPage;