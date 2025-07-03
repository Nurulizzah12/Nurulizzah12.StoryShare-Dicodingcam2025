// src/scripts/views/pages/register-page.js

import RegisterPresenter from '../../presenter/register-presenter';
import { getGlobalMessageBoxFunctions } from '../../utils/message-helpers'; // PASTIKAN PATH INI BENAR: ../../utils/message-helpers

const RegisterPage = {
    async render() {
        return `
            <div class="register-container">
                <h2 class="text-xl font-semibold mb-4 text-center text-gray-800">Daftar Akun Baru</h2>
                <form id="registerForm">
                    <div class="form-group">
                        <label for="name">Nama</label>
                        <input type="text" id="name" name="name" placeholder="Masukkan nama Anda" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" placeholder="Masukkan email Anda" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" placeholder="Masukkan password" required>
                    </div>
                    <button type="submit" class="register-button btn-primary">Daftar</button>
                </form>
                <p class="text-center mt-4 text-gray-600">Sudah punya akun? <a href="#/login" class="text-primary-600 hover:underline">Login di sini</a></p>
            </div>
        `;
    },

    async afterRender() {
        const registerForm = document.querySelector('#registerForm');
        const registerPresenter = new RegisterPresenter({ view: this });
        const { showModalMessageBox } = getGlobalMessageBoxFunctions(); // Panggil dari import

        if (registerForm) {
            registerForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const name = document.querySelector('#name').value;
                const email = document.querySelector('#email').value;
                const password = document.querySelector('#password').value;

                if (!name || !email || !password) {
                    showModalMessageBox('Error Pendaftaran', 'Semua kolom harus diisi!');
                    return;
                }

                try {
                    await registerPresenter.registerUser({ name, email, password });
                    // Pesan sukses dan redirect ditangani oleh presenter
                } catch (error) {
                    console.error('Register error:', error);
                    // Error ditampilkan oleh metode showError di view
                }
            });
        }
    },
    // Metode view yang mungkin dibutuhkan oleh RegisterPresenter
    showLoading() {
        const registerButton = document.querySelector('.register-button');
        if (registerButton) {
            registerButton.textContent = 'Mendaftar...';
            registerButton.disabled = true;
        }
    },
    hideLoading() {
        const registerButton = document.querySelector('.register-button');
        if (registerButton) {
            registerButton.textContent = 'Daftar';
            registerButton.disabled = false;
        }
    },
    showError(message) {
        const { showModalMessageBox } = getGlobalMessageBoxFunctions();
        showModalMessageBox('Error Pendaftaran', message);
    },
    redirectToLogin() {
        const { showModalMessageBox } = getGlobalMessageBoxFunctions();
        showModalMessageBox('Pendaftaran Berhasil', 'Akun Anda berhasil didaftarkan! Silakan login.', () => {
            window.location.hash = '#/login';
        });
    }
};

export default RegisterPage;