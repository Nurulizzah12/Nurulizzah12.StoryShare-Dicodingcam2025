// src/scripts/data/story-repository.js - PERBAIKAN
import { getAllStories, getStoryById as getStoryByIdFromDb, putStory, deleteStoryFromDb, STORIES_STORE, SAVED_STORIES_STORE, STORY_QUEUE_STORE } from '../database';

// Fungsi untuk mendapatkan fungsi message box global
function getGlobalMessageBoxFunctions() {
    const showMessageBox = typeof window.showMessageBox === 'function' 
        ? window.showMessageBox 
        : (msg, type) => console.log(`[${type?.toUpperCase() || 'INFO'}] ${msg}`);
    const showModalMessageBox = typeof window.showModalMessageBox === 'function' 
        ? window.showModalMessageBox 
        : (title, msg) => console.log(`[Modal: ${title}] ${msg}`);
    return { showMessageBox, showModalMessageBox };
}

class StoryRepository {
    constructor(apiSource) {
        this._apiSource = apiSource;
        this._locationCache = new Map();
    }

    // 🔧 FUNGSI HELPER: Reverse geocoding untuk mendapatkan nama lokasi
    async _getLocationName(lat, lon) {
        const cacheKey = `${lat},${lon}`;
        if (this._locationCache.has(cacheKey)) {
            return this._locationCache.get(cacheKey);
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
            );
            
            if (response.ok) {
                const data = await response.json();
                let locationName = 'Unknown Location';
                
                if (data && data.display_name) {
                    const address = data.address;
                    if (address) {
                        const parts = [];
                        if (address.village) parts.push(address.village);
                        if (address.town) parts.push(address.town);
                        if (address.city) parts.push(address.city);
                        if (address.county) parts.push(address.county);
                        if (address.state) parts.push(address.state);
                        
                        locationName = parts.length > 0 ? parts.slice(0, 2).join(', ') : data.display_name.split(',')[0];
                    } else {
                        locationName = data.display_name.split(',')[0];
                    }
                }
                
                this._locationCache.set(cacheKey, locationName);
                return locationName;
            }
        } catch (error) {
            console.warn('Error getting location name:', error);
        }
        
        return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }

    // 🔧 FUNGSI HELPER: Transform data dari API ke format yang diharapkan template
    async _transformStoryData(story) {
        if (!story) return null;
        
        console.log('🔧 Transforming story data:', story);
        
        let locationName = 'Unknown Location';
        if (story.lat && story.lon) {
            try {
                locationName = await this._getLocationName(story.lat, story.lon);
            } catch (error) {
                console.warn('Failed to resolve location:', error);
                locationName = `${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}`;
            }
        }
        
        const transformedStory = {
            id: story.id,
            title: story.name || story.title || 'Untitled Story',
            description: story.description || 'No description available',
            content: story.description || 'No content available',
            image: story.photoUrl || story.image || null,
            author: story.author || 'Unknown Author',
            date: story.createdAt || story.date || new Date().toISOString(),
            location: locationName,
            latitude: story.lat || story.latitude || null,
            longitude: story.lon || story.longitude || null,
            ...story
        };
        
        console.log('✅ Transformed story:', transformedStory);
        return transformedStory;
    }

    async _transformStoriesArray(stories) {
        if (!Array.isArray(stories)) return [];
        
        const transformPromises = stories.map(story => this._transformStoryData(story));
        const transformedStories = await Promise.all(transformPromises);
        
        return transformedStories.filter(story => story !== null);
    }

    // ✅ PERBAIKAN: Method untuk saved stories
    async getSavedStories() {
        const { showMessageBox } = getGlobalMessageBoxFunctions();
        try {
            console.log('📖 StoryRepository: Getting saved stories...');
            
            // Cek apakah database functions tersedia
            if (typeof getAllStories !== 'function') {
                console.warn('⚠️ Database function getAllStories not available, using localStorage fallback');
                return this._getSavedStoriesFromLocalStorage();
            }
            
            const savedStories = await getAllStories(SAVED_STORIES_STORE);
            console.log('📖 Raw saved stories from DB:', savedStories);
            
            const transformedStories = await this._transformStoriesArray(savedStories);
            console.log('📖 Transformed saved stories:', transformedStories);
            
            return transformedStories;
        } catch (error) {
            console.error('❌ Error fetching saved stories:', error);
            // Fallback ke localStorage
            return this._getSavedStoriesFromLocalStorage();
        }
    }

    // ✅ PERBAIKAN: Method untuk menyimpan cerita
    async saveStory(story) {
        const { showMessageBox } = getGlobalMessageBoxFunctions();
        try {
            console.log('💾 StoryRepository: Saving story:', story);
            
            if (!story || !story.id) {
                throw new Error('Data cerita tidak valid untuk disimpan');
            }
            
            // Transform data terlebih dahulu
            const transformedStory = await this._transformStoryData(story);
            console.log('💾 Transformed story for saving:', transformedStory);
            
            // Cek apakah cerita sudah tersimpan
            const existingSavedStories = await this.getSavedStories();
            const isAlreadySaved = existingSavedStories.some(savedStory => savedStory.id === story.id);
            
            if (isAlreadySaved) {
                showMessageBox('Cerita sudah tersimpan sebelumnya!', 'info');
                return;
            }
            
            // Cek apakah database functions tersedia
            if (typeof putStory !== 'function') {
                console.warn('⚠️ Database function putStory not available, using localStorage fallback');
                this._saveStoryToLocalStorage(transformedStory);
                showMessageBox('Cerita berhasil disimpan!', 'success');
                return;
            }
            
            await putStory(SAVED_STORIES_STORE, transformedStory);
            console.log('✅ Story saved to database successfully');
            showMessageBox('Cerita berhasil disimpan!', 'success');
            
        } catch (error) {
            console.error('❌ Error saving story:', error);
            throw error;
        }
    }

    // ✅ PERBAIKAN: Method untuk menghapus cerita tersimpan (nama yang benar)
    async deleteSavedStory(storyId) {
        const { showMessageBox } = getGlobalMessageBoxFunctions();
        try {
            console.log('🗑️ StoryRepository: Deleting saved story:', storyId);
            
            if (!storyId) {
                throw new Error('ID cerita tidak valid untuk dihapus');
            }
            
            // Cek apakah database functions tersedia
            if (typeof deleteStoryFromDb !== 'function') {
                console.warn('⚠️ Database function deleteStoryFromDb not available, using localStorage fallback');
                this._deleteSavedStoryFromLocalStorage(storyId);
                showMessageBox('Cerita berhasil dihapus dari daftar tersimpan!', 'success');
                return;
            }
            
            await deleteStoryFromDb(SAVED_STORIES_STORE, storyId);
            console.log('✅ Story deleted from database successfully');
            showMessageBox('Cerita berhasil dihapus dari daftar tersimpan!', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting saved story:', error);
            throw error;
        }
    }

    // ✅ FALLBACK: LocalStorage methods sebagai backup
    _getSavedStoriesFromLocalStorage() {
        try {
            const savedStories = localStorage.getItem('savedStories');
            return savedStories ? JSON.parse(savedStories) : [];
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    _saveStoryToLocalStorage(story) {
        try {
            const savedStories = this._getSavedStoriesFromLocalStorage();
            const isAlreadySaved = savedStories.some(savedStory => savedStory.id === story.id);
            
            if (!isAlreadySaved) {
                savedStories.push(story);
                localStorage.setItem('savedStories', JSON.stringify(savedStories));
            }
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            throw error;
        }
    }

    _deleteSavedStoryFromLocalStorage(storyId) {
        try {
            const savedStories = this._getSavedStoriesFromLocalStorage();
            const filteredStories = savedStories.filter(story => story.id !== storyId);
            localStorage.setItem('savedStories', JSON.stringify(filteredStories));
        } catch (error) {
            console.error('Error deleting from localStorage:', error);
            throw error;
        }
    }

    // ✅ Method lainnya tetap sama seperti sebelumnya...
    async login(loginData) {
        const { showModalMessageBox } = getGlobalMessageBoxFunctions();
        try {
            console.log('StoryRepository: Melakukan login...');
            
            if (!this._apiSource || typeof this._apiSource.login !== 'function') {
                throw new Error('API Source tidak tersedia atau tidak memiliki method login');
            }
            
            const response = await this._apiSource.login(loginData);
            
            if (!response || !response.loginResult || !response.loginResult.token) {
                throw new Error('Response login tidak valid dari server');
            }
            
            console.log('StoryRepository: Login berhasil');
            return response;
        } catch (error) {
            console.error('StoryRepository: Error during login:', error);
            throw error;
        }
    }

    async register(registerData) {
        const { showModalMessageBox } = getGlobalMessageBoxFunctions();
        try {
            console.log('StoryRepository: Melakukan registrasi...');
            
            if (!this._apiSource || typeof this._apiSource.register !== 'function') {
                throw new Error('API Source tidak tersedia atau tidak memiliki method register');
            }
            
            const response = await this._apiSource.register(registerData);
            console.log('StoryRepository: Registrasi berhasil');
            return response;
        } catch (error) {
            console.error('StoryRepository: Error during registration:', error);
            throw error;
        }
    }

    async getStories() {
        const { showMessageBox, showModalMessageBox } = getGlobalMessageBoxFunctions();
        try {
            console.log('🔍 StoryRepository: Fetching stories...');
            
            let cachedStories = [];
            
            if (typeof getAllStories === 'function') {
                cachedStories = await getAllStories(STORIES_STORE);
            }

            if (!navigator.onLine && cachedStories.length > 0) {
                showMessageBox('Memuat cerita dari cache (Anda offline)', 'info');
                const transformedCached = await this._transformStoriesArray(cachedStories);
                console.log('🔍 StoryRepository: Returning cached stories (offline):', transformedCached);
                return transformedCached;
            }

            const apiStories = await this._apiSource.getAllStories();
            console.log('🔍 StoryRepository: Raw API stories:', apiStories);

            if (apiStories && apiStories.length > 0) {
                const transformedStories = await this._transformStoriesArray(apiStories);
                console.log('🔍 StoryRepository: Transformed stories:', transformedStories);

                if (typeof putStory === 'function') {
                    for (const story of transformedStories) {
                        await putStory(STORIES_STORE, story);
                    }
                }
                
                showMessageBox('Memuat cerita dari server', 'success');
                return transformedStories;
            } else if (cachedStories.length > 0) {
                const transformedCached = await this._transformStoriesArray(cachedStories);
                showMessageBox('Memuat cerita dari cache (API tidak merespons atau kosong)', 'info');
                console.log('🔍 StoryRepository: Returning cached stories (API empty):', transformedCached);
                return transformedCached;
            } else {
                showMessageBox('Tidak ada cerita ditemukan.', 'info');
                return [];
            }
        } catch (error) {
            console.error('❌ StoryRepository: Error fetching stories:', error);
            
            let fallbackCachedStories = [];
            if (typeof getAllStories === 'function') {
                fallbackCachedStories = await getAllStories(STORIES_STORE);
            }
            
            if (fallbackCachedStories.length > 0) {
                const transformedFallback = await this._transformStoriesArray(fallbackCachedStories);
                showMessageBox('Gagal memuat dari server, memuat dari cache.', 'error');
                console.log('🔍 StoryRepository: Returning fallback cached stories:', transformedFallback);
                return transformedFallback;
            }
            
            showModalMessageBox('Error', `Gagal memuat cerita: ${error.message}`);
            return [];
        }
    }

    async getAllStories() {
        return await this.getStories();
    }

    async getStoryDetail(id) {
        const { showMessageBox, showModalMessageBox } = getGlobalMessageBoxFunctions();
        try {
            console.log(`🔍 StoryRepository: Mengambil detail cerita ID: ${id}`);
            
            let cachedStory = null;
            if (typeof getStoryByIdFromDb === 'function') {
                cachedStory = await getStoryByIdFromDb(STORIES_STORE, id);
            }
            
            if (!navigator.onLine && cachedStory) {
                showMessageBox('Memuat detail cerita dari cache (Anda offline)', 'info');
                const transformedCached = await this._transformStoryData(cachedStory);
                console.log('🔍 StoryRepository: Returning cached story detail (offline):', transformedCached);
                return transformedCached;
            }

            if (this._apiSource && typeof this._apiSource.getStoryDetail === 'function') {
                try {
                    const apiStory = await this._apiSource.getStoryDetail(id);
                    console.log('🔍 StoryRepository: Raw API story detail:', apiStory);
                    
                    if (apiStory) {
                        const transformedStory = await this._transformStoryData(apiStory);
                        console.log('🔍 StoryRepository: Transformed story detail:', transformedStory);
                        
                        if (typeof putStory === 'function') {
                            await putStory(STORIES_STORE, transformedStory);
                        }
                        return transformedStory;
                    }
                } catch (apiError) {
                    console.warn('⚠️ API error, falling back to cache:', apiError);
                }
            }

            if (cachedStory) {
                showMessageBox('Memuat detail cerita dari cache (API tidak merespons)', 'info');
                const transformedCached = await this._transformStoryData(cachedStory);
                console.log('🔍 StoryRepository: Returning cached story detail (API failed):', transformedCached);
                return transformedCached;
            }

            throw new Error('Cerita tidak ditemukan');
        } catch (error) {
            console.error('❌ StoryRepository: Error fetching story detail:', error);
            showModalMessageBox('Error', `Gagal memuat detail cerita: ${error.message}`);
            throw error;
        }
    }

    async addStory(storyData) {
        const { showMessageBox, showModalMessageBox } = getGlobalMessageBoxFunctions();
        try {
            console.log('StoryRepository: Menambahkan cerita baru...');
            
            if (!this._apiSource || typeof this._apiSource.addStory !== 'function') {
                throw new Error('API Source tidak tersedia atau tidak memiliki method addStory');
            }

            if (!navigator.onLine) {
                showMessageBox('Anda offline. Cerita akan diupload saat online kembali.', 'info');
                throw new Error('Tidak dapat menambahkan cerita saat offline');
            }

            const result = await this._apiSource.addStory(storyData);
            showMessageBox('Cerita berhasil ditambahkan!', 'success');
            
            if (result && result.id && typeof putStory === 'function') {
                const transformedResult = await this._transformStoryData(result);
                await putStory(STORIES_STORE, transformedResult);
            }
            
            return result;
        } catch (error) {
            console.error('StoryRepository: Error adding story:', error);
            showModalMessageBox('Error', `Gagal menambahkan cerita: ${error.message}`);
            throw error;
        }
    }

    async getStoriesWithLocation() {
        const { showMessageBox, showModalMessageBox } = getGlobalMessageBoxFunctions();
        try {
            if (!this._apiSource || typeof this._apiSource.getStoriesWithLocation !== 'function') {
                return await this.getStories();
            }

            const stories = await this._apiSource.getStoriesWithLocation();
            const transformedStories = await this._transformStoriesArray(stories || []);
            console.log('🔍 StoryRepository: Stories with location:', transformedStories);
            return transformedStories;
        } catch (error) {
            console.error('Error fetching stories with location:', error);
            showModalMessageBox('Error', `Gagal memuat cerita dengan lokasi: ${error.message}`);
            return [];
        }
    }

    async syncPendingStories() {
        console.log('Syncing pending stories...');
    }

    async getStoryById(id) {
        console.log('🔧 StoryRepository: getStoryById dipanggil, delegating ke getStoryDetail');
        return await this.getStoryDetail(id);
    }
}

export default StoryRepository;