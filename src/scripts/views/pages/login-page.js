import LoginPresenter from '../../presenter/login-presenter';

// Fungsi untuk mendapatkan fungsi message box global
function getGlobalMessageBoxFunctions() {
    const showModalMessageBox = typeof window.showModalMessageBox === 'function' ? window.showModalMessageBox : (title, msg) => console.log(`[Modal: ${title}] ${msg}`);
    return { showModalMessageBox };
}

class LoginPage {
  constructor() {
    this._loginHandler = null;
    this._presenter = null;
  }

  render() {
    return `
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <h2>Login ke StoryShare</h2>
            <p>Bagikan cerita Anda dengan dunia</p>
          </div>
          <form id="loginForm" class="login-form">
            <div class="form-group">
              <label for="email">Email</label>
              <div class="input-with-icon">
                <i class="fas fa-envelope"></i>
                <input type="email" id="email" name="email" placeholder="Masukkan email Anda" required>
              </div>
            </div>
            
            <div class="form-group">
              <label for="password">Password</label>
              <div class="input-with-icon">
                <i class="fas fa-lock"></i>
                <input type="password" id="password" name="password" placeholder="Masukkan password Anda" required>
                <button type="button" id="togglePassword" class="toggle-password">
                    <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            
            <div class="form-options">
                <div class="remember-me">
                    <input type="checkbox" id="rememberMe">
                    <label for="rememberMe">Ingat saya</label>
                </div>
                <a href="#" class="forgot-password">Lupa Password?</a>
            </div>
            
            <button type="submit" id="loginButton" class="btn-login">Login</button>
            
            <div class="login-footer">
              Belum punya akun? <a href="#/register">Daftar di sini</a>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  afterRender() {
    // Inisialisasi presenter dengan view ini
    this._presenter = new LoginPresenter({
      view: this,
    });
    
    this._attachLoginFormListener();

    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.querySelector('i').classList.toggle('fa-eye');
            togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
  }

  _attachLoginFormListener() {
    const { showModalMessageBox } = getGlobalMessageBoxFunctions();
    const loginForm = document.querySelector('#loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const email = document.querySelector('#email').value;
        const password = document.querySelector('#password').value;
        
        if (this._loginHandler) {
          this._loginHandler({ email, password });
        } else {
          console.error('Login handler not set');
          showModalMessageBox('Login Error', 'Terjadi kesalahan saat login. Silakan coba lagi.'); // Menggunakan modal
        }
      });
    }
  }

  setLoginHandler(handler) {
    this._loginHandler = handler;
  }
  
  // Tambahkan method yang dibutuhkan presenter
  showLoading() {
    const loginButton = document.querySelector('#loginButton');
    if (loginButton) {
      loginButton.textContent = 'Loading...';
      loginButton.disabled = true;
    }
  }
  
  hideLoading() {
    const loginButton = document.querySelector('#loginButton');
    if (loginButton) {
      loginButton.textContent = 'Login';
      loginButton.disabled = false;
    }
  }
  
  showError(error) {
    const { showModalMessageBox } = getGlobalMessageBoxFunctions();
    showModalMessageBox('Login Gagal', `Login gagal: ${error.message}`); // Menggunakan modal
  }
  
  redirectToHome() {
    window.location.hash = '#/';
  }
}

export default LoginPage;