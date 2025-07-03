// api-endpoints.js
import CONFIG from './config';

const API_ENDPOINT = {
  LIST: `${CONFIG.BASE_URL}/stories`,
  DETAIL: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
  ADD: `${CONFIG.BASE_URL}/stories`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  REGISTER: `${CONFIG.BASE_URL}/register`,
};

export default API_ENDPOINT;