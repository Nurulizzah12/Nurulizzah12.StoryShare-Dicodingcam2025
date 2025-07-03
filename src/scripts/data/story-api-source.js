// src/scripts/data/story-api-source.js
import { getAccessToken } from '../utils/auth'; 

// Fungsi untuk mendapatkan fungsi message box global
function getGlobalMessageBoxFunctions() {
    const showModalMessageBox = typeof window.showModalMessageBox === 'function' 
        ? window.showModalMessageBox 
        : (title, msg) => console.log(`[Modal: ${title}] ${msg}`);
    return { showModalMessageBox };
}

const StoryApiSource = {
    _BASE_URL: 'https://story-api.dicoding.dev/v1',

    // ✅ TAMBAHKAN METHOD LOGIN
    async login(loginData) {
        const { showModalMessageBox } = getGlobalMessageBoxFunctions();
        try {
            console.log('StoryApiSource: Melakukan login ke:', `${this._BASE_URL}/login`);
            
            const response = await fetch(`${this._BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: loginData.email,
                    password: loginData.password
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('StoryApiSource: Login gagal:', response.status, errorData);
                throw new Error(errorData.message || 'Login gagal');
            }

            const responseData = await response.json();
            console.log('StoryApiSource: Login berhasil');
            return responseData;
        } catch (error) {
            console.error('Error during login:', error);
            // Jangan tampilkan modal di sini, biarkan presenter yang handle
            throw error;
        }
    },

    // ✅ TAMBAHKAN METHOD REGISTER (opsional)
    async register(registerData) {
        const { showModalMessageBox } = getGlobalMessageBoxFunctions();
        try {
            console.log('StoryApiSource: Melakukan registrasi ke:', `${this._BASE_URL}/register`);
            
            const response = await fetch(`${this._BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: registerData.name,
                    email: registerData.email,
                    password: registerData.password
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('StoryApiSource: Registrasi gagal:', response.status, errorData);
                throw new Error(errorData.message || 'Registrasi gagal');
            }

            const responseData = await response.json();
            console.log('StoryApiSource: Registrasi berhasil');
            return responseData;
        } catch (error) {
            console.error('Error during registration:', error);
            throw error;
        }
    },

    async getAllStories() {
        const { showModalMessageBox } = getGlobalMessageBoxFunctions();
        try {
            const accessToken = getAccessToken();
            const headers = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};

            console.log('StoryApiSource: Mengambil semua cerita dari:', `${this._BASE_URL}/stories`);
            const response = await fetch(`${this._BASE_URL}/stories`, { headers });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('StoryApiSource: Gagal memuat semua cerita:', response.status, errorData);
                
                // ✅ PERBAIKAN: Handle unauthorized (token expired)
                if (response.status === 401) {
                    showModalMessageBox('Session Expired', 'Sesi Anda telah berakhir. Silakan login kembali.');
                    // Clear token dan redirect ke login
                    localStorage.removeItem('token');
                    window.location.hash = '#/login';
                    return;
                }
                
                showModalMessageBox('Error API', `Gagal memuat cerita: ${errorData.message || response.statusText}`);
                throw new Error(`API error: ${errorData.message || response.statusText}`);
            }

            const { listStory } = await response.json();
            return listStory;
        } catch (error) {
            console.error('Error fetching all stories:', error);
            throw error;
        }
    },

    // Perbaikan untuk method getStoryDetail di StoryApiSource
    async getStoryDetail(id) {
        const { showModalMessageBox } = getGlobalMessageBoxFunctions();
        try {
            // 🔍 DEBUG: Log ID yang diterima
            console.log('🐛 StoryApiSource getStoryDetail:', {
                id: id,
                idType: typeof id,
                idLength: id?.length,
                finalUrl: `${this._BASE_URL}/stories/${id}`
            });
            
            // 🔧 VALIDASI ID
            if (!id || id === 'undefined' || id === 'null' || id.trim() === '') {
                throw new Error('ID cerita tidak valid untuk API call');
            }
            
            const accessToken = getAccessToken();
            const headers = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};

            const finalUrl = `${this._BASE_URL}/stories/${id}`;
            console.log('StoryApiSource: Mengambil detail cerita dari URL:', finalUrl);
            
            const response = await fetch(finalUrl, { headers });

            // 🔍 DEBUG: Log response details
            console.log('🐛 API Response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                url: response.url
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('StoryApiSource: Gagal memuat detail cerita:', response.status, errorData);
                
                // Handle specific error cases
                if (response.status === 404) {
                    throw new Error(`Cerita dengan ID "${id}" tidak ditemukan di server`);
                }
                
                if (response.status === 401) {
                    showModalMessageBox('Session Expired', 'Sesi Anda telah berakhir. Silakan login kembali.');
                    localStorage.removeItem('token');
                    window.location.hash = '#/login';
                    return;
                }
                
                throw new Error(`API error: ${errorData.message || response.statusText}`);
            }

            const responseData = await response.json();
            console.log('🐛 API Response Data:', responseData);
            
            const { story } = responseData;
            
            if (!story) {
                throw new Error('Data cerita tidak valid dari server');
            }
            
            return story;
        } catch (error) {
            console.error('Error fetching story detail:', error);
            throw error;
        }
    },
    async addStory(storyData) {
        const { showModalMessageBox } = getGlobalMessageBoxFunctions();
        try {
            const accessToken = getAccessToken();
            if (!accessToken) {
                throw new Error('Anda harus login untuk menambahkan cerita.');
            }

            console.log('StoryApiSource: Mengirim cerita baru ke:', `${this._BASE_URL}/stories`);
            const response = await fetch(`${this._BASE_URL}/stories`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: storyData, // FormData langsung di sini
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('StoryApiSource: Gagal menambahkan cerita:', response.status, errorData);
                
                // ✅ PERBAIKAN: Handle unauthorized
                if (response.status === 401) {
                    showModalMessageBox('Session Expired', 'Sesi Anda telah berakhir. Silakan login kembali.');
                    localStorage.removeItem('token');
                    window.location.hash = '#/login';
                    return;
                }
                
                showModalMessageBox('Error Upload', `Gagal mengunggah cerita: ${errorData.message || response.statusText}`);
                throw new Error(`API error: ${errorData.message || response.statusText}`);
            }

            const responseData = await response.json();
            console.log('StoryApiSource:', responseData.message);
            
            // ✅ PERBAIKAN: Handle response structure yang benar
            return responseData.data?.story || responseData;
        } catch (error) {
            console.error('Error adding story:', error);
            showModalMessageBox('Error Upload', error.message || 'Terjadi kesalahan saat menambahkan cerita.');
            throw error;
        }
    },

    // ✅ TAMBAHKAN METHOD UNTUK GET STORIES WITH LOCATION (jika diperlukan)
    async getStoriesWithLocation() {
        const { showModalMessageBox } = getGlobalMessageBoxFunctions();
        try {
            const accessToken = getAccessToken();
            const headers = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};

            console.log('StoryApiSource: Mengambil cerita dengan lokasi dari:', `${this._BASE_URL}/stories?location=1`);
            const response = await fetch(`${this._BASE_URL}/stories?location=1`, { headers });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('StoryApiSource: Gagal memuat cerita dengan lokasi:', response.status, errorData);
                
                if (response.status === 401) {
                    showModalMessageBox('Session Expired', 'Sesi Anda telah berakhir. Silakan login kembali.');
                    localStorage.removeItem('token');
                    window.location.hash = '#/login';
                    return;
                }
                
                showModalMessageBox('Error API', `Gagal memuat cerita: ${errorData.message || response.statusText}`);
                throw new Error(`API error: ${errorData.message || response.statusText}`);
            }

            const { listStory } = await response.json();
            return listStory;
        } catch (error) {
            console.error('Error fetching stories with location:', error);
            throw error;
        }
    }
};

export default StoryApiSource;