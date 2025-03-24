import axios from 'axios';

// API URL'sini belirle - Docker ve tarayıcı uyumluluğu için
function getApiBaseUrl() {
  // Tarayıcıdan API'ye erişirken her zaman localhost kullanılmalı
  // Docker container içinde "backend:8000" kullanılsa da, tarayıcı bu host adını çözemez
  return 'http://localhost:8000/api';
}

console.log('Using API URL:', getApiBaseUrl());

// Create an Axios instance with default config
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Uzun süren istekler için ayrı bir instance (60 saniye timeout)
const longTimeoutApi = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 60000, // 60 saniye
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to include the token in every request
const setupRequestInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// Add a response interceptor to handle common errors
const setupResponseInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.message === 'Network Error') {
        console.error('Network error detected. API server may be unreachable.');
        console.error('Current API URL:', getApiBaseUrl());
        console.error('Please ensure the backend service is running at port 8000.');
      }
      
      if (error.response) {
        // Server responded with an error status
        if (error.response.status === 401) {
          // Token expired or invalid, clear localStorage and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error);
    }
  );
};

// Her iki API instance için interceptor'ları ayarla
setupRequestInterceptor(api);
setupResponseInterceptor(api);
setupRequestInterceptor(longTimeoutApi);
setupResponseInterceptor(longTimeoutApi);

// Hem named export hem de default export sağla
export { api, getApiBaseUrl, longTimeoutApi };
export default api; 