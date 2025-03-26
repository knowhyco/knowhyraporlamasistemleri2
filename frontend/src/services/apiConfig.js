import axios from 'axios';
// authUtils'in bulunamama sorunu için doğrudan burada tanımlıyoruz
// Asıl authUtils dosyasını daha sonra oluşturacağız

// Token kontrolü ve çıkış fonksiyonları
export const checkTokenExpiry = () => {
  const token = localStorage.getItem('token');
  if (!token) return true;
  
  // Basit bir kontrol: Token varsa ve geçerliyse false, aksi halde true döner
  // Gerçek implementasyonda JWT decode edilip expiry kontrol edilmeli
  return false;
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// API bağlantı ayarları
const currentHost = window.location.hostname;
const apiPort = 8000; // Sabit port 8000 kullan
const protocol = window.location.protocol;
// API için temel URL'yi oluştur
const baseUrl = `${protocol}//${currentHost}:${apiPort}/api`;

console.log(`API Base URL: ${baseUrl}`);

// Axios instance oluştur
const apiInstance = axios.create({
  baseURL: baseUrl,
  timeout: 30000, // 30 saniye
  headers: {
    'Content-Type': 'application/json',
  }
});

// Uzun sürebilecek işlemler için ayrı bir instance
export const longTimeoutApiInstance = axios.create({
  baseURL: baseUrl,
  timeout: 300000, // 5 dakika
  headers: {
    'Content-Type': 'application/json',
  }
});

// Talep interceptor - isteklere token ekle
apiInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API İsteği: ${config.method.toUpperCase()} ${config.url}`, config);
    return config;
  },
  error => {
    console.error('İstek hatası:', error);
    return Promise.reject(error);
  }
);

// Cevap interceptor - 401 hataları için
apiInstance.interceptors.response.use(
  response => {
    console.log(`API Cevabı: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  error => {
    if (error.response) {
      console.error(`API Hatası: ${error.response.status} ${error.config?.url}`, error.response.data);
      
      // Token geçersiz veya süresi dolmuş
      if (error.response.status === 401) {
        if (checkTokenExpiry()) {
          console.log('Token süresi dolmuş, kullanıcı çıkış yapıyor...');
          removeAuthToken();
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // İstek yapıldı ama cevap alınamadı
      console.error('API Bağlantı Hatası: Cevap alınamadı', error.request);
      if (error.code === 'ECONNABORTED') {
        return Promise.reject({
          response: {
            status: 408,
            data: { message: 'İstek zaman aşımına uğradı' }
          }
        });
      }
    } else {
      // İstek oluşturulurken bir hata oluştu
      console.error('İstek hatası:', error.message);
    }
    return Promise.reject(error);
  }
);

// API sağlık kontrolü
setTimeout(async () => {
  try {
    const response = await apiInstance.get('/health');
    console.log('API Sağlık Kontrolü: Başarılı', response.data);
  } catch (error) {
    console.error('API Sağlık Kontrolü: Başarısız', error);
  }
}, 1000);

// Hem named hem default export sağla
export { apiInstance as api };
export { apiInstance };
export default apiInstance; 