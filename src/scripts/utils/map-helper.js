// src/scripts/utils/map-helper.js
import L from 'leaflet';

// Fungsi untuk mendapatkan fungsi message box global
function getGlobalMessageBoxFunctions() {
    const showModalMessageBox = typeof window.showModalMessageBox === 'function' ? window.showModalMessageBox : (title, msg) => console.log(`[Modal: ${title}] ${msg}`);
    return { showModalMessageBox };
}

// Map ini akan menyimpan referensi instance peta yang diinisialisasi
const mapInstances = new Map();

const MapHelper = {
  /**
   * Menginisialisasi peta Leaflet di container yang diberikan.
   * @param {HTMLElement|string} mapContainer - Elemen DOM atau ID string container peta.
   * @param {Object} options - Opsi peta (lat, lng, zoom).
   * @param {Array<Object>} [stories] - Opsional: Daftar cerita untuk menambahkan marker.
   * @returns {L.Map|null} Instance peta Leaflet atau null jika gagal.
   */
  initMap(mapContainer, options = {}, stories = []) {
    const { showModalMessageBox } = getGlobalMessageBoxFunctions();
    let mapElement;
    let mapElementId;

    if (typeof mapContainer === 'string') {
        mapElementId = mapContainer;
        mapElement = document.getElementById(mapElementId);
    } else if (mapContainer instanceof HTMLElement) {
        mapElement = mapContainer;
        mapElementId = mapContainer.id;
        if (!mapElementId) {
            mapElementId = `leaflet-map-${Date.now()}`; // Pastikan ID unik jika tidak ada
            mapElement.id = mapElementId;
        }
    } else {
        console.error('Map container harus berupa ID string atau elemen DOM.');
        return null;
    }

    if (!mapElement) {
        console.error(`Elemen map dengan ID "${mapElementId}" tidak ditemukan di DOM.`);
        return null;
    }

    if (typeof L === 'undefined') {
      console.error('Leaflet tidak tersedia. Ini seharusnya tidak terjadi setelah import.');
      showModalMessageBox('Error Peta', 'Library peta tidak ditemukan. Ada masalah internal.');
      return null;
    }

    // Cek apakah online atau offline
    if (!navigator.onLine) {
      console.log('MapHelper: Sedang offline, menampilkan fallback map');
      return this.createOfflineMap(mapElement, options, stories);
    }

    // Pendekatan yang lebih kuat untuk menghapus peta yang sudah ada
    // Cek apakah elemen DOM sudah memiliki instance peta Leaflet
    if (mapElement._leaflet_id) { // Properti internal Leaflet untuk menandai container yang sudah diinisialisasi
        console.log(`MapHelper: Menghapus peta lama dari elemen ${mapElementId} (ditemukan _leaflet_id).`);
        const existingMap = mapInstances.get(mapElementId);
        if (existingMap && existingMap instanceof L.Map) {
            existingMap.remove();
            mapInstances.delete(mapElementId);
        } else {
            // Jika _leaflet_id ada tapi tidak di mapInstances, coba hapus secara paksa
            // Ini adalah hack, tapi kadang diperlukan
            try {
                const mapToRemove = L.map(mapElementId); // Ini akan mencoba menginisialisasi lagi dan mungkin gagal
                mapToRemove.remove();
                console.warn(`MapHelper: Berhasil menghapus peta lama secara paksa untuk ${mapElementId}.`);
            } catch (e) {
                console.error(`MapHelper: Gagal menghapus peta lama secara paksa untuk ${mapElementId}:`, e.message);
                // Jika gagal menghapus, kita tidak bisa menginisialisasi ulang.
                // Kembalikan null dan biarkan UI menampilkan pesan error.
                showModalMessageBox('Error Peta', `Gagal membersihkan peta lama di ${mapElementId}: ${e.message}.`);
                return null;
            }
        }
    }

    try {
      const defaultLat = options.lat || -2.5489;
      const defaultLng = options.lng || 118.0149;
      const defaultZoom = options.zoom || 5;

      const map = L.map(mapElementId).setView([defaultLat, defaultLng], defaultZoom);

      // Tambahkan error handler untuk tile layer
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjEyOCIgeT0iMTI4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5PZmZsaW5lPC90ZXh0Pjwvc3ZnPg=='
      });

      tileLayer.on('tileerror', (e) => {
        console.warn('Tile loading error:', e);
        // Jika banyak tile error, mungkin sedang offline
        if (!navigator.onLine) {
          this.showOfflineIndicator(map);
        }
      });

      tileLayer.addTo(map);

      delete L.Icon.Default.prototype._getIconUrl; 
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'images/marker-icon-2x.png', 
        iconUrl: 'images/marker-icon.png', 
        shadowUrl: 'images/marker-shadow.png', 
      });

      if (stories && stories.length > 0) {
        stories.forEach((story) => {
          if (story.latitude && story.longitude) {
            const popupContent = `
              <div class="map-popup">
                <h3>${story.title}</h3>
                <img src="${story.image || './images/placehold.co_100x75_333_ffffff_text_No_Image.png'}" alt="${story.title}" style="max-width: 100px; height: auto; border-radius: 5px;">
                <p>${story.description.substring(0, 50)}${story.description.length > 50 ? '...' : ''}</p>
                <a href="#/detail/${story.id}" class="popup-link" style="display: block; margin-top: 5px; color: #be279e; text-decoration: none;">Lihat Detail</a>
              </div>
            `;
            this.addMarker(map, story.latitude, story.longitude, story.title, popupContent); 
          }
        });
      }
      
      mapInstances.set(mapElementId, map);
      
      // Pre-cache tiles untuk offline usage
      this.preCacheMapTiles(defaultLat, defaultLng, defaultZoom);
      
      return map;
    } catch (error) {
      console.error('MapHelper: Error initializing map:', error);
      showModalMessageBox('Error Peta', `Gagal menginisialisasi peta: ${error.message}`);
      
      // Fallback ke offline map jika gagal inisialisasi
      return this.createOfflineMap(mapElement, options, stories);
    }
  },

  /**
   * Membuat fallback map untuk kondisi offline
   * @param {HTMLElement} mapElement - Elemen DOM container peta
   * @param {Object} options - Opsi peta (lat, lng, zoom)
   * @param {Array<Object>} stories - Daftar cerita
   * @returns {Object} Objek representasi offline map
   */
  createOfflineMap(mapElement, options = {}, stories = []) {
    const defaultLat = options.lat || -2.5489;
    const defaultLng = options.lng || 118.0149;
    
    // Buat static map sebagai fallback
    mapElement.innerHTML = `
      <div class="offline-map" style="
        width: 100%;
        height: 400px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        border-radius: 8px;
        position: relative;
        font-family: Arial, sans-serif;
      ">
        <div style="text-align: center; z-index: 10;">
          <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
          <h3 style="margin: 0 0 8px 0;">Peta Offline</h3>
          <p style="margin: 0; opacity: 0.8;">Latitude: ${defaultLat.toFixed(4)}</p>
          <p style="margin: 0; opacity: 0.8;">Longitude: ${defaultLng.toFixed(4)}</p>
          <p style="margin: 16px 0 0 0; font-size: 14px; opacity: 0.7;">
            ${stories.length > 0 ? `${stories.length} cerita di sekitar area ini` : 'Peta tidak tersedia saat offline'}
          </p>
        </div>
        
        <!-- Decorative elements -->
        <div style="
          position: absolute;
          top: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        ">📍</div>
        
        ${stories.length > 0 ? `
          <div style="
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 12px;
            backdrop-filter: blur(10px);
          ">
            <h4 style="margin: 0 0 8px 0; font-size: 14px;">Cerita di Area Ini:</h4>
            <div style="max-height: 80px; overflow-y: auto;">
              ${stories.slice(0, 3).map(story => `
                <div style="margin-bottom: 4px; font-size: 12px; opacity: 0.9;">
                  • ${story.title}
                </div>
              `).join('')}
              ${stories.length > 3 ? `<div style="font-size: 12px; opacity: 0.7;">...dan ${stories.length - 3} cerita lainnya</div>` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Simpan data untuk kemungkinan reload saat online
    mapElement.dataset.lat = defaultLat;
    mapElement.dataset.lng = defaultLng;
    mapElement.dataset.zoom = options.zoom || 5;

    // Return objek yang menyerupai Leaflet map untuk kompatibilitas
    return {
      isOfflineMap: true,
      element: mapElement,
      lat: defaultLat,
      lng: defaultLng,
      stories: stories,
      remove: () => {
        mapElement.innerHTML = '';
      }
    };
  },

  /**
   * Menampilkan indikator offline pada peta
   * @param {L.Map} map - Instance peta Leaflet
   */
  showOfflineIndicator(map) {
    const offlineControl = L.control({ position: 'topright' });
    offlineControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-control-offline');
      div.innerHTML = `
        <div style="
          background: rgba(255, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        ">
          📶 Offline Mode
        </div>
      `;
      return div;
    };
    offlineControl.addTo(map);
  },

  /**
   * Pre-cache tiles untuk offline usage
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} zoom - Zoom level
   */
  async preCacheMapTiles(lat, lng, zoom = 13) {
    if (!navigator.onLine) return;
    
    try {
      const cache = await caches.open('maps-tiles-cache');
      const tiles = this.generateTileUrls(lat, lng, zoom);
      
      const promises = tiles.map(url => 
        fetch(url).then(response => {
          if (response.ok) {
            cache.put(url, response.clone());
          }
        }).catch(() => {
          // Ignore failed tile requests
        })
      );
      
      await Promise.allSettled(promises);
      console.log(`Pre-cached ${tiles.length} map tiles for offline use`);
    } catch (error) {
      console.error('Error pre-caching tiles:', error);
    }
  },

  /**
   * Generate URLs untuk tiles di sekitar koordinat
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} zoom - Zoom level
   * @returns {Array<string>} Array of tile URLs
   */
  generateTileUrls(lat, lng, zoom) {
    const tiles = [];
    const tileX = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const tileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    
    // Cache tiles di sekitar lokasi (3x3 grid)
    for (let x = tileX - 1; x <= tileX + 1; x++) {
      for (let y = tileY - 1; y <= tileY + 1; y++) {
        tiles.push(`https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`);
      }
    }
    
    return tiles;
  },

  /**
   * Setup network detection untuk auto-reload maps
   */
  setupNetworkDetection() {
    // Handle online/offline events
    window.addEventListener('online', () => {
      console.log('Network: Back online');
      this.handleNetworkChange(true);
    });
    
    window.addEventListener('offline', () => {
      console.log('Network: Gone offline');
      this.handleNetworkChange(false);
    });
  },

  /**
   * Handle perubahan status network
   * @param {boolean} isOnline - Status online
   */
  handleNetworkChange(isOnline) {
    const offlineMaps = document.querySelectorAll('.offline-map');
    
    if (isOnline) {
      // Reload maps yang sedang offline
      offlineMaps.forEach(mapElement => {
        const parentElement = mapElement.parentElement;
        const lat = parseFloat(parentElement.dataset.lat);
        const lng = parseFloat(parentElement.dataset.lng);
        const zoom = parseInt(parentElement.dataset.zoom) || 5;
        
        if (lat && lng) {
          // Reinitialize map
          const containerId = parentElement.id;
          this.initMap(containerId, { lat, lng, zoom });
        }
      });
    } else {
      // Convert existing maps to offline mode
      mapInstances.forEach((map, id) => {
        if (map && map.remove) {
          const center = map.getCenter();
          const zoom = map.getZoom();
          map.remove();
          
          const mapElement = document.getElementById(id);
          if (mapElement) {
            this.createOfflineMap(mapElement, {
              lat: center.lat,
              lng: center.lng,
              zoom: zoom
            });
          }
        }
      });
    }
  },

  addMarker(map, lat, lon, title, popupContent, customIcon = null) {
    // Skip jika offline map
    if (map && map.isOfflineMap) {
      console.log('Skipping marker addition for offline map');
      return null;
    }

    if (!map || typeof L === 'undefined') {
        console.error('Peta tidak valid atau Leaflet tidak tersedia untuk menambahkan marker.');
        return null;
    }
    if (lat === undefined || lon === undefined || lat === null || lon === null) {
        console.warn(`Melewatkan marker untuk ${title} karena koordinat tidak valid: lat=${lat}, lon=${lon}`);
        return null;
    }
    try {
      let marker;
      if (customIcon) { 
        marker = L.marker([lat, lon], { icon: customIcon });
      } else {
        marker = L.marker([lat, lon]); 
      }
      
      return marker
        .addTo(map)
        .bindPopup(popupContent);
    } catch (error) {
        console.error(`Error adding marker for ${title}:`, error);
        getGlobalMessageBoxFunctions().showModalMessageBox('Error Marker Peta', `Gagal menambahkan marker untuk ${title}: ${error.message}`);
        return null;
    }
  },

  getMapInstance(mapContainer) {
      const id = typeof mapContainer === 'string' ? mapContainer : mapContainer.id;
      return mapInstances.get(id);
  }
};

// Initialize network detection saat module dimuat
MapHelper.setupNetworkDetection();

export default MapHelper;