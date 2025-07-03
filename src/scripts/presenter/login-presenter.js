// scripts/presenter/login-presenter.js
import StoryRepository from '../data/story-repository';
import StoryApiSource from '../data/story-api-source';
import { setAccessToken } from '../utils/auth';

class LoginPresenter {
  constructor({ view }) {
    this._view = view;
    // ✅ PERBAIKAN: Instansiasi dengan benar
    // StoryApiSource adalah object literal, bukan class
    this._storyRepository = new StoryRepository(StoryApiSource); 
    this._listenToLoginForm();
  }
  
  _listenToLoginForm() {
    this._view.setLoginHandler(this._login.bind(this));
  }
  
  async _login(loginData) {
    try {
      // Validasi input
      this._validateLoginData(loginData);
      
      this._view.showLoading();
      
      // ✅ PERBAIKAN: Gunakan method repository
      const response = await this._storyRepository.login(loginData);
      
      // ✅ PERBAIKAN: Pastikan response memiliki struktur yang benar
      if (!response || !response.loginResult || !response.loginResult.token) {
        throw new Error('Response login tidak valid');
      }
      
      // ✅ PERBAIKAN: Gunakan utility function
      setAccessToken(response.loginResult.token);
      
      console.log('Login berhasil, token disimpan');
      this._view.redirectToHome();
    } catch (error) {
      console.error('Error during login:', error);
      this._view.showError(error);
    } finally {
      this._view.hideLoading();
    }
  }

  _validateLoginData({ email, password }) {
    if (!email || !password) {
      throw new Error('Email dan password wajib diisi');
    }
    
    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Format email tidak valid');
    }
    
    // Validasi password
    if (password.length < 6) {
      throw new Error('Password minimal 6 karakter');
    }
  }
}

export default LoginPresenter;