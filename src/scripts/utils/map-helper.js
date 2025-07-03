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

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

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
      
      return map;
    } catch (error) {
      console.error('MapHelper: Error initializing map:', error);
      showModalMessageBox('Error Peta', `Gagal menginisialisasi peta: ${error.message}`);
      return null;
    }
  },

  addMarker(map, lat, lon, title, popupContent, customIcon = null) {
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

export default MapHelper;
