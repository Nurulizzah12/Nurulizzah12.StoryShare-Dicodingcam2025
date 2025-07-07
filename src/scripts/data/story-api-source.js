// src/scripts/data/story-api-source.js
import { getAccessToken } from '../utils/auth';
import CONFIG from '../globals/config';

// Fungsi untuk mendapatkan fungsi message box global
function getGlobalMessageBoxFunctions() {
    const showModalMessageBox = typeof window.showModalMessageBox === 'function'
        ? window.showModalMessageBox
        : (title, msg) => console.log(`[Modal: ${title}] ${msg}`);
    return { showModalMessageBox };
}

const StoryApiSource = {
    _BASE_URL: 'https://story-api.dicoding.dev/v1',

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
            throw error;
        }
    },

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
            console.error('Error fetching all stories:', error);
            throw error;
        }
    },

    async getStoryDetail(id) {
        const { showModalMessageBox } = getGlobalMessageBoxFunctions();
        try {
            console.log('🐛 StoryApiSource getStoryDetail:', {
                id: id,
                idType: typeof id,
                idLength: id?.length,
                finalUrl: `${this._BASE_URL}/stories/${id}`
            });

            if (!id || id === 'undefined' || id === 'null' || id.trim() === '') {
                throw new Error('ID cerita tidak valid untuk API call');
            }

            const accessToken = getAccessToken();
            const headers = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};

            const finalUrl = `${this._BASE_URL}/stories/${id}`;
            console.log('StoryApiSource: Mengambil detail cerita dari URL:', finalUrl);

            const response = await fetch(finalUrl, { headers });

            console.log('🐛 API Response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                url: response.url
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('StoryApiSource: Gagal memuat detail cerita:', response.status, errorData);

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

            return responseData.data?.story || responseData;
        } catch (error) {
            console.error('Error adding story:', error);
            showModalMessageBox('Error Upload', error.message || 'Terjadi kesalahan saat menambahkan cerita.');
            throw error;
        }
    },

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
    },

    // ✅ NEW METHOD: Subscribe to Push Notification
    async subscribePushNotification(subscriptionData) {
        const { showModalMessageBox } = getGlobalMessageBoxFunctions();
        try {
            const accessToken = getAccessToken(); // Get access token
            if (!accessToken) {
                showModalMessageBox('Unauthorized', 'Anda harus login untuk mengaktifkan notifikasi.');
                throw new Error('No access token found. User must be logged in.');
            }

            console.log('StoryApiSource: Sending push subscription to server:', CONFIG.BASE_URL + CONFIG.API_ENDPOINTS.SUBSCRIBE_NOTIFICATION);
            const response = await fetch(CONFIG.BASE_URL + CONFIG.API_ENDPOINTS.SUBSCRIBE_NOTIFICATION, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`, // Include the access token
                },
                body: JSON.stringify(subscriptionData), // Send the subscription data
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('StoryApiSource: Failed to subscribe to push notifications:', response.status, errorData);
                if (response.status === 401) {
                    showModalMessageBox('Session Expired', 'Sesi Anda telah berakhir. Silakan login kembali.');
                    localStorage.removeItem('token');
                    window.location.hash = '#/login';
                }
                throw new Error(errorData.message || 'Failed to subscribe to notifications.');
            }

            const responseData = await response.json();
            console.log('StoryApiSource: Push subscription successful:', responseData);
            return response; // Return the full response object
        } catch (error) {
            console.error('Error in subscribePushNotification:', error);
            throw error;
        }
    },

    // ✅ NEW METHOD: Unsubscribe from Push Notification
    async unsubscribePushNotification(endpoint) {
        const { showModalMessageBox } = getGlobalMessageBoxFunctions();
        try {
            const accessToken = getAccessToken(); // Get access token
            if (!accessToken) {
                showModalMessageBox('Unauthorized', 'Anda harus login untuk menonaktifkan notifikasi.');
                throw new Error('No access token found. User must be logged in.');
            }

            console.log('StoryApiSource: Sending push unsubscription to server:', CONFIG.BASE_URL + CONFIG.API_ENDPOINTS.SUBSCRIBE_NOTIFICATION);
            const response = await fetch(CONFIG.BASE_URL + CONFIG.API_ENDPOINTS.SUBSCRIBE_NOTIFICATION, {
                method: 'DELETE', // Use DELETE method for unsubscription
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ endpoint }), // Send only the endpoint for unsubscription
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('StoryApiSource: Failed to unsubscribe from push notifications:', response.status, errorData);
                if (response.status === 401) {
                    showModalMessageBox('Session Expired', 'Sesi Anda telah berakhir. Silakan login kembali.');
                    localStorage.removeItem('token');
                    window.location.hash = '#/login';
                }
                throw new Error(errorData.message || 'Failed to unsubscribe from notifications.');
            }

            const responseData = await response.json();
            console.log('StoryApiSource: Push unsubscription successful:', responseData);
            return response; // Return the full response object
        } catch (error) {
            console.error('Error in unsubscribePushNotification:', error);
            throw error;
        }
    }
};

export default StoryApiSource;