import { openDB } from 'idb'; // Menggunakan library idb untuk kemudahan

const DB_NAME = 'story-app-db';
const DB_VERSION = 1; // Tingkatkan versi jika ada perubahan schema
const STORIES_STORE = 'stories'; // Untuk cerita utama (dari API atau lokal)
const SAVED_STORIES_STORE = 'saved_stories'; // Untuk cerita yang disimpan/favorit
const STORY_QUEUE_STORE = 'story-queue'; // Untuk background sync queue
const AUTH_STORE = 'auth'; // Untuk menyimpan token atau data auth jika perlu di IndexedDB

let db; // Variabel untuk menyimpan instance database

// Utility function to get global message boxes (assuming they are in window object)
function getGlobalMessageBoxFunctions() {
    const showMessageBox = typeof window.showMessageBox === 'function' ? window.showMessageBox : (msg, type) => console.log(`[Message: ${type}] ${msg}`);
    const showModalMessageBox = typeof window.showModalMessageBox === 'function' ? window.showModalMessageBox : (title, msg) => console.log(`[Modal: ${title}] ${msg}`);
    return { showMessageBox, showModalMessageBox };
}

async function openDatabase() {
    if (db) return db; // Jika sudah terbuka, kembalikan instance yang ada

    const { showModalMessageBox } = getGlobalMessageBoxFunctions();
    try {
        db = await openDB(DB_NAME, DB_VERSION, {
            upgrade(database, oldVersion, newVersion, transaction) {
                console.log(`IndexedDB upgrade needed from version ${oldVersion} to ${newVersion}`);
                if (!database.objectStoreNames.contains(STORIES_STORE)) {
                    database.createObjectStore(STORIES_STORE, { keyPath: 'id' });
                }
                if (!database.objectStoreNames.contains(SAVED_STORIES_STORE)) {
                    database.createObjectStore(SAVED_STORIES_STORE, { keyPath: 'id' });
                }
                if (!database.objectStoreNames.contains(STORY_QUEUE_STORE)) {
                    database.createObjectStore(STORY_QUEUE_STORE, { keyPath: 'id' }); // Atau gunakan 'timestamp' jika ID tidak unik
                }
                if (!database.objectStoreNames.contains(AUTH_STORE)) {
                    database.createObjectStore(AUTH_STORE); // Untuk menyimpan token, key bisa statis 'token'
                }
            },
            blocked() {
                showModalMessageBox('IndexedDB Terblokir', 'IndexedDB terblokir. Pastikan tidak ada tab lain yang membuka aplikasi.');
            },
            blocking() {
                showModalMessageBox('IndexedDB Diblokir', 'IndexedDB diblokir. Pastikan tidak ada tab lain yang membuka aplikasi.');
            }
        });
        console.log('IndexedDB opened successfully.');
        return db;
    } catch (error) {
        console.error('Failed to open IndexedDB:', error);
        showModalMessageBox('Error Database', 'Gagal membuka database lokal. Fitur offline mungkin terbatas.');
        throw error; // Lempar error agar bisa ditangani di App.js
    }
}

async function putStory(storeName, story) {
    if (!db) await openDatabase();
    const { showMessageBox, showModalMessageBox } = getGlobalMessageBoxFunctions();
    try {
        await db.put(storeName, story);
        if (storeName === STORIES_STORE) {
            showMessageBox('Cerita berhasil disimpan lokal!', 'success');
        } else if (storeName === SAVED_STORIES_STORE) {
            showMessageBox('Cerita berhasil disimpan ke daftar tersimpan!', 'success');
        } else if (storeName === STORY_QUEUE_STORE) {
             showMessageBox('Cerita ditambahkan ke antrean sinkronisasi!', 'info');
        }
    } catch (error) {
        console.error(`Error putting story in ${storeName}:`, error);
        showModalMessageBox('Error Simpan Data', `Gagal menyimpan cerita ke ${storeName}.`);
        throw error;
    }
}

async function getAllStories(storeName) {
    if (!db) await openDatabase();
    const { showModalMessageBox } = getGlobalMessageBoxFunctions();
    try {
        return await db.getAll(storeName);
    } catch (error) {
        console.error(`Error getting all stories from ${storeName}:`, error);
        showModalMessageBox('Error Ambil Data', `Gagal mengambil cerita dari ${storeName}.`);
        throw error;
    }
}

async function getStoryById(storeName, id) {
    if (!db) await openDatabase();
    const { showModalMessageBox } = getGlobalMessageBoxFunctions();
    try {
        return await db.get(storeName, id);
    } catch (error) {
        console.error(`Error getting story by ID from ${storeName}:`, error);
        showModalMessageBox('Error Ambil Detail', `Gagal mengambil detail cerita dari ${storeName}.`);
        throw error;
    }
}

async function deleteStoryFromDb(storeName, id) {
    if (!db) await openDatabase();
    const { showMessageBox, showModalMessageBox } = getGlobalMessageBoxFunctions();
    try {
        await db.delete(storeName, id);
        showMessageBox('Cerita berhasil dihapus!', 'success');
    } catch (error) {
        console.error(`Error deleting story from ${storeName}:`, error);
        showModalMessageBox('Error Hapus Data', `Gagal menghapus cerita dari ${storeName}.`);
        throw error;
    }
}

// Fungsi tambahan untuk auth token di IndexedDB (jika diperlukan)
async function putAuthToken(token) {
    if (!db) await openDatabase();
    try {
        await db.put(AUTH_STORE, token, 'current_user_token'); // Simpan dengan key statis
        console.log('Auth token saved to IndexedDB.');
    } catch (error) {
        console.error('Error saving auth token to IndexedDB:', error);
    }
}

async function getAuthToken() {
    if (!db) await openDatabase();
    try {
        return await db.get(AUTH_STORE, 'current_user_token');
    } catch (error) {
        console.error('Error getting auth token from IndexedDB:', error);
        return null;
    }
}

async function deleteAuthToken() {
    if (!db) await openDatabase();
    try {
        await db.delete(AUTH_STORE, 'current_user_token');
        console.log('Auth token deleted from IndexedDB.');
    } catch (error) {
        console.error('Error deleting auth token from IndexedDB:', error);
    }
}

export {
    openDatabase,
    putStory,
    getAllStories,
    getStoryById,
    deleteStoryFromDb,
    putAuthToken,
    getAuthToken,
    deleteAuthToken,
    STORIES_STORE,
    SAVED_STORIES_STORE,
    STORY_QUEUE_STORE,
    AUTH_STORE
};