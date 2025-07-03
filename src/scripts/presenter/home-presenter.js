// src/presenter/home-presenter.js
import { getAccessToken } from '../utils/auth';

class HomePresenter {
  constructor({ view, storyRepository }) {
    this._view = view;
    this._storyRepository = storyRepository;
    this._stories = [];
  }

  async init() {
    await this._showStories();
  }

  async _showStories() {
    try {
      this._view.showLoading();
      
      const token = getAccessToken();
      if (!token) {
        this._view.showLoginError();
        this._view.hideLoading();
        return;
      }
      
      // 🔍 DEBUG: Cek data mentah dari repository
      console.log('🔍 DEBUG: Fetching stories...');
      this._stories = await this._storyRepository.getStories();
      
      // 🔍 DEBUG: Cek data yang diterima
      console.log('🔍 DEBUG: Raw stories from repository:', this._stories);
      console.log('🔍 DEBUG: Stories length:', this._stories.length);
      if (this._stories.length > 0) {
        console.log('🔍 DEBUG: First story structure:', this._stories[0]);
        console.log('🔍 DEBUG: First story keys:', Object.keys(this._stories[0]));
      }
      
      if (this._stories.length === 0) {
        this._view.showEmptyStories();
      } else {
        this._view.showStories(this._stories);
        
        const storiesWithLocation = this._stories.filter(
          (story) => story.latitude && story.longitude
        );
        
        console.log('🔍 DEBUG: Stories with location:', storiesWithLocation.length);
        
        if (storiesWithLocation.length > 0) {
          this._view.renderMap(storiesWithLocation);
        }
      }
    } catch (error) {
      console.error('❌ HomePresenter Error:', error);
      this._view.showError(error);
    } finally {
      this._view.hideLoading();
    }
  }
}

export default HomePresenter;