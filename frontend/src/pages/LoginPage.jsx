import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Paper, Typography, TextField, Button, 
  Alert, CircularProgress, Link, Grid, useTheme, alpha,
  InputAdornment, Card, CardContent
} from '@mui/material';
import { Lock, Person, Analytics, VpnKey } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiInstance as api } from '../services/apiConfig';
import { saveAuthToken } from '../utils/authUtils';

const LoginPage = ({ onLogin }) => {
  const theme = useTheme();
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
        saveAuthToken(token, response.data.user);
        
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
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: 3
      }}
    >
      <Card
        elevation={8}
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            bgcolor: theme.palette.primary.main,
            p: 3,
            textAlign: 'center'
          }}
        >
          <Analytics sx={{ fontSize: 48, color: 'white', mb: 1 }} />
          <Typography variant="h4" component="h1" fontWeight="bold" color="white">
            Knowhy Raporlama
          </Typography>
        </Box>
        
        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 2 
              }}
            >
              {error}
            </Alert>
          )}
          
          {isSetupMode && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.info.light, 0.1),
                color: theme.palette.info.dark
              }}
            >
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
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
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
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 4,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <VpnKey />}
              sx={{ 
                py: 1.5, 
                borderRadius: 2,
                fontSize: '1rem',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {isSetupMode ? 'Kuruluma Başla' : 'Giriş Yap'}
            </Button>
            
            {!isSetupMode && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Yardıma mı ihtiyacınız var?{' '}
                  <Link 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Yardım için sistem yöneticinizle iletişime geçin.');
                    }}
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      fontWeight: 'medium',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Yönetici ile iletişime geçin
                  </Link>
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;