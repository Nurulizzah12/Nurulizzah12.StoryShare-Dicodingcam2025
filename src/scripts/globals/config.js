// src/scripts/globals/config.js
const CONFIG = {
  BASE_URL: 'https://story-api.dicoding.dev/v1',
  API_ENDPOINTS: {
    REGISTER: '/register',
    LOGIN: '/login',
    STORIES: '/stories',
    STORIES_GUEST: '/stories?size=10&location=1',
    UPLOAD_STORY: '/stories',
    SUBSCRIBE_NOTIFICATION: '/notifications/subscribe',
  },
  CACHE_NAME: 'story-app-v1',
  DATABASE_NAME: 'story-app-database',
  DATABASE_VERSION: 1,
  OBJECT_STORE_NAME: 'stories',
};

// VAPID Public Key yang benar dari review
export const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

export default CONFIG;