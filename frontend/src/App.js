import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import axios from 'axios';

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

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kullanıcı bilgilerini local storage'dan kontrol et
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Kullanıcı bilgileri çözümlenirken hata oluştu:', error);
        // Hatalı veri varsa temizle
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    
    setLoading(false);
  }, []);

  // Giriş işlemi
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Çıkış işlemi
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Özel rota bileşeni (yetkilendirme kontrolü)
  const PrivateRoute = ({ element, requiredRole }) => {
    // Kullanıcı girişi yoksa login sayfasına yönlendir
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    // Rol kontrolü varsa ve kullanıcının gerekli rolü yoksa ana sayfaya yönlendir
    if (requiredRole && user.role !== requiredRole) {
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
  );
}

export default App; 