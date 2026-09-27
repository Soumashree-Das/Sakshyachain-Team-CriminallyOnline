import axios from 'axios';

// Dynamically resolve API URL based on current browser hostname (e.g. 192.168.102.99 or localhost)
const hostname = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${hostname}:5000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Bearer JWT Token automatically
api.interceptors.request.use(config => {
  // If request explicitly passed an empty Authorization header (fresh login), remove header completely
  if (config.headers && config.headers['Authorization'] === '') {
    delete config.headers['Authorization'];
    return config;
  }

  const token = sessionStorage.getItem('sakshya_jwt_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

let refreshInFlight = null;

api.interceptors.response.use(response => response, async error => {
  const originalRequest = error.config;
  const isAuthEndpoint = /\/auth\/(login|verify-login-otp|refresh)(?:\?|$)/.test(originalRequest?.url || '');
  const isExpiredToken = error.response?.status === 403 && error.response?.data?.error === 'FORBIDDEN_INVALID_TOKEN';
  const shouldRefresh = (error.response?.status === 401 || isExpiredToken) && originalRequest && !originalRequest._retry && !isAuthEndpoint;

  if (shouldRefresh) {
    originalRequest._retry = true;
    const refreshToken = sessionStorage.getItem('sakshya_refresh_token');
    if (!refreshToken) {
      sessionStorage.removeItem('sakshya_jwt_token');
      window.dispatchEvent(new CustomEvent('sakshya-auth-expired'));
      return Promise.reject(error);
    }

    try {
      if (!refreshInFlight) {
        refreshInFlight = axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
          .then(response => {
            sessionStorage.setItem('sakshya_jwt_token', response.data.accessToken);
            sessionStorage.setItem('sakshya_refresh_token', response.data.refreshToken);
            return response.data.accessToken;
          })
          .finally(() => { refreshInFlight = null; });
      }
      const accessToken = await refreshInFlight;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      sessionStorage.removeItem('sakshya_jwt_token');
      sessionStorage.removeItem('sakshya_refresh_token');
      window.dispatchEvent(new CustomEvent('sakshya-auth-expired'));
      return Promise.reject(refreshError);
    }
  }

  if (error.response?.status === 423 && error.response?.data?.error === 'ACCOUNT_FROZEN') {
    sessionStorage.removeItem('sakshya_jwt_token');
    sessionStorage.removeItem('sakshya_refresh_token');
    window.dispatchEvent(new CustomEvent('sakshya-account-frozen', { detail: error.response.data.message }));
  }
  return Promise.reject(error);
});

export default api;
