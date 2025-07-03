import StoryApiSource from '../data/story-api-source'; // Import StoryApiSource untuk registrasi

class RegisterPresenter {
  /**
   * Konstruktor untuk RegisterPresenter.
   * @param {Object} options - Objek opsi.
   * @param {Object} options.view - Objek view yang mengimplementasikan interface tampilan register.
   */
  constructor({ view }) { // Hapus userModel dari parameter constructor
    this._view = view;
    // Asumsi kita menggunakan StoryApiSource langsung untuk pendaftaran
    this._apiSource = StoryApiSource; // Langsung gunakan StoryApiSource
  }

  /**
   * Metode untuk menangani pendaftaran pengguna baru.
   * @param {Object} userData - Data pengguna untuk pendaftaran (name, email, password).
   * @returns {Promise<void>}
   */
  async registerUser(userData) {
    try {
      this._view.showLoading(); // Tampilkan indikator loading
      
      // Panggil API register dari StoryApiSource
      const response = await this._apiSource.register({ // Asumsi ada method register di StoryApiSource
        name: userData.name,
        email: userData.email,
        password: userData.password,
      });

      // Jika pendaftaran berhasil
      this._view.redirectToLogin(); // Redirect ke halaman login (dengan pesan sukses)
    } catch (error) {
      console.error('Error during registration:', error);
      this._view.showError(`Pendaftaran gagal: ${error.message || 'Terjadi kesalahan tidak dikenal.'}`); // Tampilkan error di view
    } finally {
      this._view.hideLoading(); // Sembunyikan indikator loading
    }
  }

  // Catatan: _attachEventHandlers dan _registerFormSubmitHandler
  // Seharusnya berada di View (RegisterPage), bukan di Presenter.
  // Presenter menerima event melalui handler yang diset di View.
  // Saya telah memindahkan logika event listener ke RegisterPage.js.
  // Method `init()` di presenter ini mungkin tidak diperlukan jika View memanggil `registerUser` langsung.
}

export default RegisterPresenter;