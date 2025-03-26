// JWT token yönetimi için yardımcı fonksiyonlar

/**
 * Token'ın süresinin dolup dolmadığını kontrol eder
 * @returns {boolean} Token'ın süresi dolmuşsa true, aksi halde false döner
 */
export const checkTokenExpiry = () => {
  const token = localStorage.getItem('token');
  if (!token) return true;
  
  try {
    // JWT'nin base64 kısmını decode et
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    // Expiry timestamp kontrolü
    if (payload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      return currentTime > payload.exp;
    }
    
    return false;
  } catch (error) {
    console.error('Token kontrolü sırasında hata:', error);
    return true; // Hata varsa token'ı geçersiz say
  }
};

/**
 * Token ve kullanıcı bilgilerini localStorage'dan kaldırır
 */
export const removeAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Token'ı localStorage'a kaydeder
 * @param {string} token - JWT token
 * @param {Object} user - Kullanıcı bilgileri
 */
export const saveAuthToken = (token, user) => {
  localStorage.setItem('token', token);
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

/**
 * Token'dan kullanıcı bilgilerini çıkarır
 * @returns {Object|null} Kullanıcı bilgileri veya null
 */
export const getUserFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch (error) {
    console.error('Token decode hatası:', error);
    return null;
  }
};

/**
 * Kullanıcının login durumunu kontrol eder
 * @returns {boolean} Kullanıcı giriş yapmışsa true
 */
export const isUserLoggedIn = () => {
  const token = localStorage.getItem('token');
  return !!token && !checkTokenExpiry();
};

/**
 * Kullanıcının admin olup olmadığını kontrol eder
 * @returns {boolean} Kullanıcı admin ise true
 */
export const isAdmin = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return false;
  
  try {
    const user = JSON.parse(userStr);
    return user.role === 'admin';
  } catch (error) {
    return false;
  }
}; 