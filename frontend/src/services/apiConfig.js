import axios from 'axios';

// Tarayıcının erişebileceği API URL'sini oluştur
const getApiBaseUrl = () => {
  // Yaygın kullanım senaryolarına göre API URL oluştur
  const hostname = window.location.hostname;
  
  // Doğrudan IP adresi ile geliyorsa, aynı IP'yi kullan
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return `http://${hostname}:8000/api`;
  }
  
  // 'localhost' veya '127.0.0.1' gibi bir adres ise
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  
  // Docker tarafından çözümlenebilen 'backend' adı (tarayıcıda çalışmaz)
  // Tarayıcıda çalışabilmesi için gerçek hostname/IP kullanılmalı
  return `http://${hostname}:8000/api`;
};

// Axios instance oluştur
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Debug için API URL'i konsola yaz
console.log('API URL:', getApiBaseUrl());

// İstek interceptor - tüm isteklere JWT token ekler
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Yanıt interceptor - 401 hataları için işlem yapabilir
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token süresi dolmuş olabilir, kullanıcıyı logout yapmak için
      // localStorage.removeItem('token');
      // localStorage.removeItem('user');
      // window.location.href = '/login';
    }
    console.error('API Hatası:', error.message, error.config?.url);
    return Promise.reject(error);
  }
);

export default api;
export { getApiBaseUrl }; 