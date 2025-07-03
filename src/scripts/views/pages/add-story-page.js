// src/scripts/views/pages/add-story-page.js
import AddStoryPresenter from '../../presenter/add-story-presenter';
import MapHelper from '../../utils/map-helper'; // Pastikan MapHelper diimpor
import L from 'leaflet'; // Pastikan Leaflet diimpor

// Fungsi untuk mendapatkan fungsi message box global
function getGlobalMessageBoxFunctions() {
    const showMessageBox = typeof window.showMessageBox === 'function' ? window.showMessageBox : (msg, type) => console.log(`[Message: ${type}] ${msg}`);
    const showModalMessageBox = typeof window.showModalMessageBox === 'function' ? window.showModalMessageBox : (title, msg) => console.log(`[Modal: ${title}] ${msg}`);
    return { showModalMessageBox, showMessageBox };
}

class AddStoryPage {
  constructor() {
    this._presenter = null;
    this._addStoryHandler = null;
    this._photoBlob = null;
    this._map = null; // Instance peta Leaflet
    this._marker = null; // Marker Leaflet
    
    this._form = null;
    this._photoPreview = null;
    this._cameraButton = null;
    this._fileButton = null;
    this._photoInput = null;
    this._camera = null;
    this._captureButton = null;
    this._canvas = null;
    this._selectedLocation = null;
    this._cancelButton = null;
    this._originalButtonText = null;
    this._stream = null;

    // Custom icon untuk marker (akan diatur via L.Icon.Default.mergeOptions di MapHelper)
    this._customIcon = null; 
  }

  async render() {
    return `
      <div class="add-story-container">
        <div class="add-story-card">
          <div class="add-story-header">
            <h2>Tambah Cerita Baru</h2>
            <p>Bagikan pengalamanmu dengan foto dan lokasi</p>
          </div>
          
          <form id="add-story-form">
            <div class="form-group">
              <label for="description">Cerita</label>
              <textarea id="description" rows="4" placeholder="Ceritakan pengalamanmu..." required></textarea>
            </div>
            
            <div class="form-group">
              <label>Foto</label>
              <div class="photo-container">
                <div id="photo-preview" class="photo-preview">
                  <div class="photo-placeholder">
                    <i class="fa fa-image"></i>
                    <p>Pratinjau foto akan muncul di sini</p>
                  </div>
                </div>
                <div class="photo-actions">
                  <button type="button" id="camera-button" class="btn-photo">
                    <i class="fa fa-camera"></i> Kamera
                  </button>
                  <button type="button" id="file-button" class="btn-photo">
                    <i class="fa fa-file-image"></i> Pilih File
                  </button>
                  <input type="file" id="photo-input" accept="image/*" style="display: none;">
                </div>
              </div>
            </div>
            
            <div id="camera-container" style="display: none;">
              <video id="camera" autoplay playsinline class="camera"></video>
              <button type="button" id="capture-button" class="btn-capture">
                <i class="fa fa-camera"></i> Ambil Foto
              </button>
              <canvas id="canvas" style="display: none;"></canvas>
            </div>
            
            <div class="form-group">
              <label>Lokasi (Klik pada peta)</label>
              <div id="location-map" class="map" style="height: 350px;"></div> 
              <div id="selected-location" class="selected-location">
                <i class="fa fa-map-marker-alt"></i>
                <span>Belum ada lokasi dipilih</span>
              </div>
              <input type="hidden" id="lat" name="lat">
              <input type="hidden" id="lon" name="lon">
            </div>
            
            <div class="form-actions">
              <button type="button" id="cancel-button" class="btn-secondary">Batal</button>
              <button type="submit" class="btn-primary">Bagikan Cerita</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async afterRender() {
    try {
      const { showModalMessageBox } = getGlobalMessageBoxFunctions();
      this._initializeElements();
      
      this._presenter = new AddStoryPresenter({
        view: this,
      });
      
      // Pastikan elemen peta ada sebelum inisialisasi
      const locationMapElement = document.getElementById('location-map');
      if (locationMapElement) {
        this._initializeMap(); 
        this._attachEventListeners();
      } else {
        console.error('AddStoryPage: Elemen peta (#location-map) tidak ditemukan di DOM.');
        showModalMessageBox('Error Halaman', 'Elemen peta tidak ditemukan. Halaman mungkin tidak berfungsi dengan baik.');
      }
    } catch (error) {
      console.error('Error pada afterRender AddStoryPage:', error);
      showModalMessageBox('Error Render Halaman', 'Gagal memuat halaman tambah cerita.');
    }
  }
  
  _initializeElements() {
    this._form = document.getElementById('add-story-form');
    this._photoPreview = document.getElementById('photo-preview');
    this._cameraButton = document.getElementById('camera-button');
    this._fileButton = document.getElementById('file-button');
    this._photoInput = document.getElementById('photo-input');
    this._camera = document.getElementById('camera');
    this._captureButton = document.getElementById('capture-button');
    this._canvas = document.getElementById('canvas');
    this._selectedLocation = document.getElementById('selected-location');
    this._cancelButton = document.getElementById('cancel-button');
    
    if (!this._form) console.error('Form add-story-form tidak ditemukan');
    if (!this._photoPreview) console.error('Photo preview tidak ditemukan');
    if (!this._cameraButton) console.error('Camera button tidak ditemukan');
    if (!this._fileButton) console.error('File button tidak ditemukan');
    if (!this._photoInput) console.error('Photo input tidak ditemukan');
    if (!this._camera) console.error('Camera video element tidak ditemukan');
    if (!this._captureButton) console.error('Capture button tidak ditemukan');
    if (!this._canvas) console.error('Canvas element tidak ditemukan');
    if (!this._selectedLocation) console.error('Selected location element tidak ditemukan');
    if (!this._cancelButton) console.error('Cancel button tidak ditemukan');
  }
  
  _initializeMap() {
    const { showModalMessageBox } = getGlobalMessageBoxFunctions();
    try {
      const locationMap = document.getElementById('location-map');
      if (!locationMap) {
        console.error('Element location-map tidak ditemukan. Tidak dapat menginisialisasi peta.');
        showModalMessageBox('Error Peta', 'Elemen peta tidak ditemukan di halaman tambah cerita.');
        return;
      }
      
      if (typeof L === 'undefined') {
        console.error('Leaflet JS tidak tersedia. Tidak dapat menginisialisasi peta.');
        showModalMessageBox('Error Peta', 'Library peta tidak ditemukan. Pastikan Leaflet dimuat dengan benar.');
        return;
      }

      this._map = MapHelper.initMap('location-map', { // Gunakan ID string 'location-map'
        lat: -2.5489, 
        lng: 118.0149,
        zoom: 5
      });
      
      if (this._map) {
        // Force redraw map
        setTimeout(() => {
          this._map.invalidateSize();
        }, 100);
        
        // Custom icon akan diatur secara global di MapHelper, jadi tidak perlu di sini lagi
        // this._customIcon = L.icon({ ... }); 
        
        this._map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          
          document.getElementById('lat').value = lat;
          document.getElementById('lon').value = lng;
          
          this._selectedLocation.innerHTML = `
            <i class="fa fa-map-marker-alt"></i>
            <span>Lokasi dipilih: ${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
            <button type="button" id="reset-location" class="btn-reset">
              <i class="fa fa-times"></i>
            </button>
          `;
          
          const resetBtn = document.getElementById('reset-location');
          if (resetBtn) {
            resetBtn.addEventListener('click', (event) => {
              event.stopPropagation();
              document.getElementById('lat').value = '';
              document.getElementById('lon').value = '';
              this._selectedLocation.innerHTML = `
                <i class="fa fa-map-marker-alt"></i>
                <span>Belum ada lokasi dipilih</span>
              `;
              
              if (this._marker) {
                this._map.removeLayer(this._marker);
                this._marker = null;
              }
            });
          }
          
          if (this._marker) {
            this._map.removeLayer(this._marker);
          }
          
          this._marker = L.marker([lat, lng]).addTo(this._map); // Gunakan marker default
        });
      } else {
        locationMap.innerHTML = '<div class="error-message">Map tidak dapat dimuat.</div>';
        showModalMessageBox('Error Peta', 'Gagal menginisialisasi peta. Pastikan Leaflet dimuat dengan benar.');
      }
    } catch (error) {
      console.error('Error initializing map in AddStoryPage:', error);
      const locationMap = document.getElementById('location-map');
      if (locationMap) {
        locationMap.innerHTML = '<div class="error-message">Map tidak dapat dimuat</div>';
      }
      showModalMessageBox('Error Peta', 'Gagal memuat peta lokasi: ' + error.message);
    }
  }
  
  _attachEventListeners() {
    const { showMessageBox } = getGlobalMessageBoxFunctions();
    try {
      this._cameraButton?.addEventListener('click', this._activateCamera.bind(this));
      this._captureButton?.addEventListener('click', this._captureImage.bind(this));
      this._fileButton?.addEventListener('click', () => this._photoInput?.click());
      this._photoInput?.addEventListener('change', this._handleFileUpload.bind(this));
      this._cancelButton?.addEventListener('click', this._handleCancel.bind(this));
      
      this._form?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const description = document.getElementById('description').value;
        const lat = document.getElementById('lat').value;
        const lon = document.getElementById('lon').value;
        
        if (!description) {
          showMessageBox('Cerita tidak boleh kosong', 'error');
          return;
        }
        
        if (!this._photoBlob) {
          showMessageBox('Silakan pilih atau ambil foto', 'error');
          return;
        }
        
        const formData = new FormData();
        formData.append('description', description);
        formData.append('photo', this._photoBlob);
        
        if (lat && lon) {
          formData.append('lat', lat);
          formData.append('lon', lon);
        }
        
        if (this._addStoryHandler) {
          this._addStoryHandler(formData);
        } else {
            console.error('Add story handler not set in presenter.');
            showMessageBox('Terjadi kesalahan saat memproses cerita.', 'error');
        }
      });
    } catch (error) {
      console.error('Error attaching event listeners:', error);
      showMessageBox('Gagal menginisialisasi interaksi halaman.', 'error');
    }
  }
  
  async _activateCamera() {
    const { showMessageBox } = getGlobalMessageBoxFunctions();
    try {
      const cameraContainer = document.getElementById('camera-container');
      if (!cameraContainer) return;
      
      cameraContainer.style.display = 'block';
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this._camera.srcObject = stream;
      this._stream = stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      showMessageBox('Tidak dapat mengakses kamera. Pastikan browser memiliki izin.', 'error');
    }
  }
  
  _captureImage() {
    const { showMessageBox } = getGlobalMessageBoxFunctions();
    try {
      if (!this._camera || !this._canvas) {
        showMessageBox('Kamera atau canvas tidak siap.', 'error');
        return;
      }
      
      const width = this._camera.videoWidth;
      const height = this._camera.videoHeight;
      
      this._canvas.width = width;
      this._canvas.height = height;
      
      const context = this._canvas.getContext('2d');
      context.drawImage(this._camera, 0, 0, width, height);
      
      this._canvas.toBlob((blob) => {
        this._photoBlob = blob;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          if (this._photoPreview) {
              this._photoPreview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="btn-remove-photo">
                  <i class="fa fa-trash"></i>
                </button>
              `;
              
              const removeBtn = this._photoPreview.querySelector('.btn-remove-photo');
              if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                  this._photoBlob = null;
                  this._photoInput.value = '';
                  this._photoPreview.innerHTML = `
                    <div class="photo-placeholder">
                      <i class="fa fa-image"></i>
                      <p>Pratinjau foto akan muncul di sini</p>
                    </div>
                  `;
                });
              }
          }
        };
        reader.readAsDataURL(blob);
        
        this._stopCamera();
        
        document.getElementById('camera-container').style.display = 'none';
      }, 'image/jpeg', 0.8);
    } catch (error) {
      console.error('Error capturing image:', error);
      showMessageBox('Gagal mengambil gambar', 'error');
    }
  }
  
  _stopCamera() {
    if (this._stream) {
      const tracks = this._stream.getTracks();
      tracks.forEach(track => track.stop());
      this._stream = null;
      
      if (this._camera) {
        this._camera.srcObject = null;
      }
    }
  }
  
  _handleFileUpload(e) {
    const { showMessageBox } = getGlobalMessageBoxFunctions();
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      if (!file.type.match('image.*')) {
        showMessageBox('Hanya file gambar yang diperbolehkan', 'error');
        return;
      }
      
      this._photoBlob = file;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this._photoPreview) {
          this._photoPreview.innerHTML = `
            <img src="${e.target.result}" alt="Preview">
            <button type="button" class="btn-remove-photo">
              <i class="fa fa-trash"></i>
            </button>
          `;
          
          const removeBtn = this._photoPreview.querySelector('.btn-remove-photo');
          if (removeBtn) {
            removeBtn.addEventListener('click', () => {
              this._photoBlob = null;
              this._photoInput.value = '';
              this._photoPreview.innerHTML = `
                <div class="photo-placeholder">
                  <i class="fa fa-image"></i>
                  <p>Pratinjau foto akan muncul di sini</p>
                </div>
              `;
            });
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling file upload:', error);
      showMessageBox('Gagal mengunggah file', 'error');
    }
  }
  
  _handleCancel() {
    const { showModalMessageBox } = getGlobalMessageBoxFunctions();
    this._stopCamera();

    showModalMessageBox('Konfirmasi Batal', 'Apakah Anda yakin ingin membatalkan?', (result) => {
        if (result) {
            window.location.hash = '/';
        }
    }, true);
  }
  
  setAddStoryHandler(handler) {
    this._addStoryHandler = handler;
  }
  
  showLoading() {
    try {
      if (!this._form) return;
      
      const submitButton = this._form.querySelector('button[type="submit"]');
      if (submitButton) {
        this._originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Mengirim...';
        submitButton.disabled = true;
      }
    } catch (error) {
      console.error('Error showing loading:', error);
    }
  }
  
  hideLoading() {
    try {
      if (!this._form) return;
      
      const submitButton = this._form.querySelector('button[type="submit"]');
      if (submitButton && this._originalButtonText) {
        submitButton.innerHTML = this._originalButtonText;
        submitButton.disabled = false;
      }
    } catch (error) {
      console.error('Error hiding loading:', error);
    }
  }
  
  showSuccessMessage(message) {
    const { showMessageBox } = getGlobalMessageBoxFunctions();
    showMessageBox(message, 'success');
    
    try {
      if (this._form) {
        const submitButton = this._form.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.innerHTML = '<i class="fa fa-check"></i> Berhasil!';
        }
      }
      
      setTimeout(() => {
        window.location.hash = '/';
      }, 2000);
    } catch (error) {
      console.error('Error showing success message:', error);
      setTimeout(() => {
        window.location.hash = '/';
      }, 2000);
    }
  }
  
  showError(error) {
    const { showMessageBox } = getGlobalMessageBoxFunctions();
    showMessageBox(`Error: ${error.message || 'Terjadi kesalahan'}`, 'error');
  }
  
  resetForm() {
    try {
      if (this._form) this._form.reset();
      this._photoBlob = null;
      
      if (this._photoPreview) {
        this._photoPreview.innerHTML = `
          <div class="photo-placeholder">
            <i class="fa fa-image"></i>
            <p>Pratinjau foto akan muncul di sini</p>
          </div>
        `;
      }
      
      if (this._marker && this._map) {
        this._map.removeLayer(this._marker);
        this._marker = null;
      }
      
      if (this._selectedLocation) {
        this._selectedLocation.innerHTML = `
          <i class="fa fa-map-marker-alt"></i>
          <span>Belum ada lokasi dipilih</span>
        `;
      }
      
      const latInput = document.getElementById('lat');
      const lonInput = document.getElementById('lon');
      if (latInput) latInput.value = '';
      if (lonInput) lonInput.value = '';
    } catch (error) {
      console.error('Error resetting form:', error);
    }
  }
}

export default AddStoryPage;
