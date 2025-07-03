// src/scripts/presenter/add-story-presenter.js

// ✅ Ini adalah import yang benar untuk StoryApiSource dari presenter ke data.
// Asumsi StoryApiSource ada di src/scripts/data/story-api-source.js
import StoryApiSource from '../data/story-api-source'; 

// ✅ Ini adalah import yang benar untuk auth.js dari presenter ke utils.
// add-story-presenter.js ada di 'src/scripts/presenter/'
// auth.js ada di 'src/scripts/utils/auth.js'
// Jadi, jalurnya naik satu tingkat (..) lalu masuk ke 'utils/auth'.
import { getAccessToken } from '../utils/auth'; 

class AddStoryPresenter {
  constructor({ view }) {
    this._view = view;
    // Menggunakan StoryApiSource yang telah diimpor.
    // Jika Anda memiliki mekanisme injection dependency, sesuaikan baris ini.
    this._storyApiSource = StoryApiSource; 
    
    this._initListeners();
  }

  _initListeners() {
    if (typeof this._view.setAddStoryHandler === 'function') {
      this._view.setAddStoryHandler(this._addStory.bind(this));
    } else {
      console.error('View passed to AddStoryPresenter is missing setAddStoryHandler method.');
    }
  }

  async _addStory(storyData) {
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        if (typeof this._view.showError === 'function') {
          this._view.showError(new Error('Anda harus login untuk menambahkan cerita.'));
        }
        window.location.hash = '#/login'; 
        return;
      }

      if (typeof this._view.showLoading === 'function') {
        this._view.showLoading(true);
      }

      await this._storyApiSource.addStory(storyData);

      if (typeof this._view.showLoading === 'function') {
        this._view.showLoading(false);
      }
      if (typeof this._view.showSuccess === 'function') {
        this._view.showSuccess();
      } else {
        console.log('Cerita berhasil ditambahkan! Mengarahkan ke halaman utama.');
        window.location.hash = '/'; 
      }
    } catch (error) {
      if (typeof this._view.showLoading === 'function') {
        this._view.showLoading(false);
      }
      if (typeof this._view.showError === 'function') {
        this._view.showError(error);
      } else {
        console.error('Terjadi kesalahan saat menambahkan cerita:', error);
        alert('Terjadi kesalahan saat menambahkan cerita: ' + error.message);
      }
    }
  }
}

export default AddStoryPresenter;