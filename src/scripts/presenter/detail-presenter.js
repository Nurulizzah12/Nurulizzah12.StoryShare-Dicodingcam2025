// src/scripts/presenter/detail-presenter.js
import StoryRepository from '../data/story-repository';
import StoryApiSource from '../data/story-api-source';

class DetailPresenter {
  constructor({ view, storyRepository, id }) {
    this._view = view;
    this._storyRepository = storyRepository;
    this._id = id;
    
    // 🔍 DEBUG: Log constructor parameters
    console.log('🐛 DetailPresenter constructor:', {
      id: this._id,
      idType: typeof this._id,
      view: !!this._view,
      repository: !!this._storyRepository
    });
  }

  async init() {
    await this._showStory();
  }

  async _showStory() {
    this._view.showLoading();
    try {
      // 🔍 DEBUG: Log lebih detail
      console.log('🐛 DetailPresenter: ID info:', {
        originalId: this._id,
        idType: typeof this._id,
        idLength: this._id?.length,
        currentUrl: window.location.hash,
        parsedUrl: window.location.hash.split('/')
      });
      
      // 🔧 VALIDASI ID
      if (!this._id || this._id === 'undefined' || this._id === 'null') {
        throw new Error('ID cerita tidak valid');
      }
      
      console.log('DetailPresenter: Mencoba mengambil cerita dengan ID:', this._id);
      
      // 🔧 PERBAIKAN UTAMA: Gunakan this._id bukan id
      const story = await this._storyRepository.getStoryDetail(this._id);
      
      if (!story) {
        console.error('DetailPresenter: Cerita dengan ID', this._id, 'tidak ditemukan dari repository.');
        throw new Error('Cerita tidak ditemukan atau gagal dimuat.');
      }
      
      console.log('DetailPresenter: Cerita berhasil diambil:', story);
      this._view.showStoryDetail(story);
    } catch (error) {
      console.error('DetailPresenter: Error saat menampilkan cerita:', error);
      this._view.showError(error);
    } finally {
      this._view.hideLoading();
    }
  }
}

export default DetailPresenter;