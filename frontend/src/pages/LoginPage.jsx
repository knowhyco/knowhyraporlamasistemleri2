import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Paper, Typography, TextField, Button, 
  Alert, CircularProgress, Link, Grid
} from '@mui/material';
import { Lock, Person } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/apiConfig';

const LoginPage = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(false);
  
  const navigate = useNavigate();
  
  // Kurulum kontrolü
  useEffect(() => {
    checkSetupStatus();
  }, []);
  
  const checkSetupStatus = async () => {
    try {
      // Merkezi API kullanarak doğrudan endpoint'e istek yolla
      const response = await api.get("/admin/setup-status");
      setIsSetupMode(!response.data.is_completed);
      
      // Eğer kurulum tamamlanmadıysa varsayılan admin bilgilerini yerleştir
      if (!response.data.is_completed) {
        setUsername('admin');
        setPassword('admin123');
      }
    } catch (err) {
      console.error('Kurulum durumu kontrol hatası:', err);
      // API henüz hazır değilse veya bağlantı kurulamıyorsa, varsayılan değer
      setIsSetupMode(false);
    }
  };
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Form doğrulama
    if (!username || !password) {
      setError('Kullanıcı adı ve şifre gerekli');
      return;
    }
    
    try {
      setLoading(true);
      
      // Login isteği
      const response = await api.post('/auth/login', { username, password });
      
      if (response.data && response.data.token) {
        // JWT token'ı kaydet
        const token = response.data.token;
        localStorage.setItem('token', token);
        
        // Kullanıcı bilgilerini kaydet (varsa)
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        console.log('Login başarılı:', response.data);
        
        // onLogin callback fonksiyonu varsa çağır
        if (onLogin) {
          onLogin(response.data.user, response.data.token);
        }
        
        // Kurulum modundaysa setup sayfasına, değilse kullanıcı rolüne göre yönlendir
        if (isSetupMode) {
          navigate('/setup');
        } else {
          // Kullanıcı rolüne göre yönlendirme
          if (response.data.user && response.data.user.role === 'admin') {
            console.log('Admin kullanıcısı için admin paneline yönlendiriliyor');
            navigate('/admin');
          } else {
            console.log('Normal kullanıcı için ana sayfaya yönlendiriliyor');
            navigate('/');
          }
        }
      } else {
        setError('Giriş başarısız: Geçersiz yanıt');
      }
    } catch (error) {
      console.error('Login hatası:', error);
      
      // Sunucu yanıtına göre hata mesajı göster
      if (error.response && error.response.data) {
        setError(`Giriş başarısız: ${error.response.data.message || 'Bir hata oluştu'}`);
      } else {
        setError('Giriş başarısız: Sunucuya bağlanırken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <Paper 
        sx={{ 
          p: 4, 
          width: '100%',
          maxWidth: 400,
          mx: 'auto',
          borderRadius: 2,
          boxShadow: 3
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Knowhy Raporlama
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {isSetupMode 
              ? 'Kurulum için giriş yapın' 
              : 'Raporlama sistemine hoşgeldiniz'
            }
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {isSetupMode && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>İlk kurulum için:</strong> Admin kullanıcı adı ve şifre olarak varsayılan bilgiler girilmiştir.
            </Typography>
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Kullanıcı Adı"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            InputProps={{
              startAdornment: (
                <Person sx={{ color: 'text.secondary', mr: 1 }} />
              ),
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Şifre"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <Lock sx={{ color: 'text.secondary', mr: 1 }} />
              ),
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.2 }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              isSetupMode ? 'Kuruluma Başla' : 'Giriş Yap'
            )}
          </Button>
          
          {!isSetupMode && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Hesabınız yok mu?{' '}
                <Link 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    // Kayıt sayfasına yönlendirme yapılabilir veya modal açılabilir
                    alert('Kayıt işlemi için sistem yöneticisiyle iletişime geçin.');
                  }}
                >
                  Kayıt Ol
                </Link>
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage; 