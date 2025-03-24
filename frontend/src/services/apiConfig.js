import axios from 'axios';

// Tarayıcının erişebileceği API URL'sini oluştur
const getApiBaseUrl = () => {
  // Tarayıcının mevcut adresinden alınan hostname
  const hostname = window.location.hostname;
  
  // Doğrudan IP adresi ile geliyorsa (ör: 100.26.61.207)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return `http://${hostname}:8000/api`;
  }
  
  // 'localhost' veya '127.0.0.1' gibi yerel bir adres ise
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  
  // Diğer tüm durumlar için (domain adı vb.)
  return `http://${hostname}:8000/api`;
};

// API URL'i konsola yaz (debug için)
const apiBaseUrl = getApiBaseUrl();
console.log('API URL:', apiBaseUrl);

// Axios instance oluştur (normal API istekleri için - 20 saniye timeout)
const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20000, // 20 saniye
  headers: {
    'Content-Type': 'application/json',
  }
});

// Uzun süren istekler için ayrı bir instance (60 saniye timeout)
const longTimeoutApi = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60000, // 60 saniye
  headers: {
    'Content-Type': 'application/json',
  }
});

// İstek interceptor - tüm isteklere JWT token ekler
const setupRequestInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
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
};

// Yanıt interceptor - hata yönetimi için
const setupResponseInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response && error.response.status === 401) {
        // Token süresi dolmuş olabilir
        console.warn('Yetkilendirme hatası (401). Oturum süresi dolmuş olabilir.');
        // Aşağıdaki satırları aktif hale getirerek otomatik logout ekleyebilirsiniz
        // localStorage.removeItem('token');
        // window.location.href = '/login';
      }
      console.error('API Hatası:', error.message, error.config?.url);
      return Promise.reject(error);
    }
  );
};

// Her iki API instance için interceptor'ları ayarla
setupRequestInterceptor(api);
setupResponseInterceptor(api);
setupRequestInterceptor(longTimeoutApi);
setupResponseInterceptor(longTimeoutApi);

export default api;
export { getApiBaseUrl, longTimeoutApi }; 