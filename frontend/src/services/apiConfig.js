import axios from 'axios';
// authUtils'in bulunamama sorunu için doğrudan burada tanımlıyoruz
// Asıl authUtils dosyasını daha sonra oluşturacağız

// Token kontrolü ve çıkış fonksiyonları
export const checkTokenExpiry = () => {
  const token = localStorage.getItem('token');
  if (!token) return true;
  
  try {
    // JWT token'ı decode et - base64 formatında
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    const expiryTime = payload.exp * 1000; // saniyeyi milisaniyeye çevir
    
    // Token süresi dolmuş mu kontrol et
    return Date.now() >= expiryTime;
  } catch (error) {
    console.error('Token decode hatası:', error);
    return true; // Hata durumunda token'ı geçersiz kabul et
  }
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// API bağlantı ayarları

// Önce çevre değişkenlerinden API URL'yi almaya çalış
let baseUrl = process.env.REACT_APP_API_URL;

// Eğer çevre değişkeni yoksa, dinamik olarak URL oluştur
if (!baseUrl) {
  const currentHost = window.location.hostname;
  const apiPort = 8000; // Sabit port 8000 kullan
  const protocol = window.location.protocol;
  baseUrl = `${protocol}//${currentHost}:${apiPort}/api`;
}

console.log(`API Base URL: ${baseUrl}`);

// Axios instance oluştur
const apiInstance = axios.create({
  baseURL: baseUrl,
  timeout: 30000, // 30 saniye
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false // CORS için false olarak ayarlıyoruz
});

// Uzun sürebilecek işlemler için ayrı bir instance
export const longTimeoutApiInstance = axios.create({
  baseURL: baseUrl,
  timeout: 300000, // 5 dakika
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false
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
      
      // Token geçersiz veya süresi dolmuş - doğrudan çıkış yapmak yerine hatayı ilet
      // Kullanıcı, içeriği görebilmeye devam etsin 
      if (error.response.status === 401) {
        console.warn('Yetkilendirme hatası. Login gerekebilir ama içeriği göstermeye devam ediyoruz.');
        // Sadece gerçekten token süresi dolduysa veya tamamen login olmamışsa sayfayı yönlendir
        if (!localStorage.getItem('token') || checkTokenExpiry()) {
          console.log('Token yok veya süresi dolmuş, otomatik yönlendirme yapılmıyor.');
          // window.location.href = '/login'; - Kullanıcı içeriği görebilsin diye yönlendirme kaldırıldı
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