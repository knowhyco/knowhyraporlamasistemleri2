import axios from 'axios';

// Tarayıcının erişebileceği API URL'sini oluştur
const getApiBaseUrl = () => {
  // Container adı yerine window.location.hostname kullan
  return `http://${window.location.hostname}:8000/api`;
};

// Axios instance oluştur
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

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
    return Promise.reject(error);
  }
);

export default api;
export { getApiBaseUrl }; 