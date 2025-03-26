import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { ChakraProvider } from '@chakra-ui/react';

// Sayfalar
import LoginPage from './pages/LoginPage';
import ReportsPage from './pages/ReportsPage';
import SetupPage from './pages/SetupPage';
import AdminPage from './pages/AdminPage';
import ReportDetailPage from './pages/ReportDetailPage';

// Bileşenler
import Navbar from './components/Layout/Navbar';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1b254f',
    },
    secondary: {
      main: '#ff6b6b',
    },
    background: {
      default: '#f5f7fa',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600, 
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

// Chakra UI tema ayarları
const chakraTheme = {
  breakpoints: {
    base: "0em",
    sm: "30em",
    md: "48em",
    lg: "62em",
    xl: "80em",
    "2xl": "96em",
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kullanıcı bilgilerini local storage'dan kontrol et
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken) {
      try {
        // JWT token'dan kullanıcı bilgilerini çıkar
        const tokenData = jwt_decode(storedToken);
        
        // Saklanmış kullanıcı bilgilerini de kontrol et
        let userData = null;
        if (storedUser) {
          try {
            userData = JSON.parse(storedUser);
          } catch (error) {
            console.error('Kullanıcı bilgileri çözümlenirken hata oluştu:', error);
            localStorage.removeItem('user');
          }
        }
        
        // Token verisinden kullanıcı bilgilerini güncelle veya oluştur
        // JWT'deki 'role' bilgisini öncelikli kullan
        const mergedUser = {
          ...userData,
          id: tokenData.sub,
          username: tokenData.username,
          role: tokenData.role // JWT'deki rol bilgisini kullan
        };
        
        console.log('JWT token data:', tokenData);
        console.log('Merged user data:', mergedUser);
        
        setUser(mergedUser);
        
        // LocalStorage'daki kullanıcı bilgilerini güncelle
        localStorage.setItem('user', JSON.stringify(mergedUser));
      } catch (error) {
        console.error('Token çözümlenirken hata oluştu:', error);
        // Hatalı token varsa temizle
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      // Token yoksa kullanıcı verisini de temizle
      localStorage.removeItem('user');
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Özel rota bileşeni (yetkilendirme kontrolü)
  const PrivateRoute = ({ element, requiredRole }) => {
    // Kullanıcı girişi yoksa login sayfasına yönlendir
    if (loading) {
      return <div>Yükleniyor...</div>;
    }
    
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    // Debugging için rol bilgilerini logla
    console.log('PrivateRoute - User:', user);
    console.log('PrivateRoute - Required Role:', requiredRole);
    
    // Rol kontrolü varsa ve kullanıcının gerekli rolü yoksa ana sayfaya yönlendir
    if (requiredRole && user.role !== requiredRole) {
      console.log(`Role mismatch: User role is ${user.role}, required role is ${requiredRole}`);
      return <Navigate to="/" replace />;
    }
    
    // Header ile içeriği sarmala
    return (
      <>
        <Navbar user={user} onLogout={handleLogout} />
        {element}
      </>
    );
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <ChakraProvider theme={chakraTheme}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Public rotalar */}
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />} 
            />
            
            {/* Özel rotalar */}
            <Route 
              path="/setup" 
              element={<PrivateRoute element={<SetupPage />} requiredRole="admin" />} 
            />
            
            <Route 
              path="/admin/*" 
              element={<PrivateRoute element={<AdminPage />} requiredRole="admin" />} 
            />
            
            <Route 
              path="/" 
              element={<PrivateRoute element={<ReportsPage />} />} 
            />
            
            <Route 
              path="/reports" 
              element={<PrivateRoute element={<ReportsPage />} />} 
            />
            
            <Route 
              path="/reports/:reportId" 
              element={<PrivateRoute element={<ReportDetailPage />} />} 
            />
            
            {/* Diğer tüm rotaları ana sayfaya yönlendir */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </ChakraProvider>
  );
}

export default App; 