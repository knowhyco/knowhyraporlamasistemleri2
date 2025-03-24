import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Paper, Typography, TextField, Button, 
  Stepper, Step, StepLabel, Alert, CircularProgress,
  FormControlLabel, Checkbox, Grid
} from '@mui/material';
import { 
  AdminPanelSettings, Storage, Dashboard, Check, 
  Fingerprint, ArrowBack, ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api, { getApiBaseUrl, longTimeoutApi } from '../services/apiConfig';

const SetupPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);
  
  // Form alanları
  const [systemId, setSystemId] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tableName, setTableName] = useState('');
  const [reportSelections, setReportSelections] = useState({});
  
  const navigate = useNavigate();
  
  const steps = [
    'Sistem ID Belirleme',
    'Admin Kullanıcısı Oluştur',
    'Veritabanı Tablosu Seç',
    'Raporları Seç',
    'Kurulumu Tamamla'
  ];
  
  // Sayfa yüklendiğinde token kontrolü
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    
    if (!storedToken) {
      navigate('/login');
      return;
    }
    
    setToken(storedToken);
    
    // Kurulumun tamamlanmış olup olmadığını kontrol et
    checkSetupStatus();
  }, [navigate]);
  
  // Kurulum durumunu kontrol et
  const checkSetupStatus = async () => {
    try {
      const response = await api.get('/admin/setup-status');
      
      if (response.data.is_completed) {
        setSetupComplete(true);
        navigate('/admin');
      }
    } catch (err) {
      // İsteğin başarısız olması kurulumun tamamlanmadığı anlamına gelebilir
      console.log("Kurulum kontrol hatası:", err);
    }
  };
  
  // Kurulumu tamamla
  const completeSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Şifre eşleşme kontrolü
      if (adminPassword !== confirmPassword) {
        setError('Şifreler eşleşmiyor');
        setLoading(false);
        return;
      }
      
      const response = await longTimeoutApi.post(
        '/admin/setup',
        {
          system_id: systemId,
          admin_username: adminUsername,
          admin_password: adminPassword,
          table_name: tableName,
          selected_reports: Object.keys(reportSelections).filter(key => reportSelections[key])
        }
      );
      
      if (response.data.status === 'success') {
        setSetupComplete(true);
        setActiveStep(steps.length);
        
        // 2 saniye sonra admin paneline yönlendir
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
      } else {
        setError(response.data.message || 'Kurulum işlemi sırasında bir hata oluştu');
      }
    } catch (err) {
      console.error('Kurulum hatası:', err);
      
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Kurulum sırasında bir hata oluştu');
      } else {
        setError('Sunucuya bağlanırken bir hata oluştu. Kurulum işlemi uzun sürebilir, lütfen sayfayı yenileyip tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Mevcut SQL raporlarını getir
  const [availableReports, setAvailableReports] = useState([]);
  
  useEffect(() => {
    if (activeStep === 3 && token) {
      fetchAvailableReports();
    }
  }, [activeStep, token]);
  
  const fetchAvailableReports = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/reports/list');
      
      const reports = response.data.reports || [];
      setAvailableReports(reports);
      
      // Varsayılan olarak tüm raporları işaretle
      const initialSelections = {};
      reports.forEach(report => {
        initialSelections[report.report_name] = true;
      });
      setReportSelections(initialSelections);
      
    } catch (err) {
      console.error('Rapor listesi alınamadı:', err);
      // Hata durumunda boş bir liste kullan ve devam et
      setError('Rapor listesi yüklenemedi. Kurulum sonrasında raporları manuel ekleyebilirsiniz.');
      setAvailableReports([]);
      setReportSelections({});
    } finally {
      setLoading(false);
    }
  };
  
  // Form validasyonu
  const validateCurrentStep = () => {
    switch (activeStep) {
      case 0:
        // Sistem ID doğrulama (alfanumerik ve en az 4 karakter)
        return systemId.trim().length >= 4 && /^[a-zA-Z0-9]+$/.test(systemId);
      case 1:
        return (
          adminUsername.trim() !== '' && 
          adminPassword.trim() !== '' && 
          confirmPassword.trim() !== '' &&
          adminPassword === confirmPassword
        );
      case 2:
        return tableName.trim() !== '';
      case 3:
        return Object.values(reportSelections).some(selected => selected);
      default:
        return true;
    }
  };
  
  // İleri adıma geç
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      completeSetup();
    } else {
      setActiveStep(activeStep + 1);
    }
  };
  
  // Önceki adıma git
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };
  
  // Adım içeriği
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box component="form" noValidate autoComplete="off">
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Fingerprint sx={{ mr: 1 }} />
              Sistem ID Belirleme
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Sisteminiz için benzersiz bir ID belirleyin. Bu ID, veritabanında oluşturulacak tablolar için kullanılacaktır.
              Farklı sunucularda kurulum yapıyorsanız, farklı ID'ler kullanmanız önerilir.
            </Typography>
            
            <TextField
              label="Sistem ID"
              variant="outlined"
              fullWidth
              margin="normal"
              value={systemId}
              onChange={(e) => setSystemId(e.target.value)}
              helperText="En az 4 karakter, sadece harf ve rakam kullanabilirsiniz (ör. abc123, kurum01)"
              error={systemId.trim() !== '' && (systemId.length < 4 || !/^[a-zA-Z0-9]+$/.test(systemId))}
              required
            />
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Önemli:</strong> Bu ID sistem genelinde kullanılacaktır ve değiştirilemez. 
                Lütfen hatırlaması kolay bir ID seçin ve not alın.
              </Typography>
            </Alert>
          </Box>
        );
      
      case 1:
        return (
          <Box component="form" noValidate autoComplete="off">
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AdminPanelSettings sx={{ mr: 1 }} />
              Admin Bilgileri
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Sistem yöneticisi için kullanıcı adı ve şifre belirleyin.
            </Typography>
            
            <TextField
              label="Admin Kullanıcı Adı"
              variant="outlined"
              fullWidth
              margin="normal"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              required
            />
            
            <TextField
              label="Admin Şifresi"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />
            
            <TextField
              label="Şifre Tekrar"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              error={confirmPassword.trim() !== '' && adminPassword !== confirmPassword}
              helperText={confirmPassword.trim() !== '' && adminPassword !== confirmPassword ? 'Şifreler eşleşmiyor' : ''}
            />
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Storage sx={{ mr: 1 }} />
              Veritabanı Tablosu
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Analizlerin yapılacağı veritabanı tablosunun adını girin. Bu tablo Supabase'de bulunmalıdır.
            </Typography>
            
            <TextField
              label="Tablo Adı"
              variant="outlined"
              fullWidth
              margin="normal"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="örnek: customer_denizmuzesi"
              required
            />
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Sistemimiz sadece tablodaki verileri <strong>okuma</strong> amaçlı kullanacaktır, tablo içeriği değiştirilmeyecektir.
              </Typography>
            </Alert>
          </Box>
        );
      
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Dashboard sx={{ mr: 1 }} />
              Raporları Seç
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Dashboard'da görmek istediğiniz raporları seçin.
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {availableReports.map((report) => (
                  <Grid item xs={12} sm={6} md={4} key={report.report_name}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!reportSelections[report.report_name]}
                          onChange={(e) => {
                            setReportSelections({
                              ...reportSelections,
                              [report.report_name]: e.target.checked
                            });
                          }}
                        />
                      }
                      label={report.display_name || report.report_name}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );
      
      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Check sx={{ mr: 1 }} />
              Kurulum Özeti
            </Typography>
            <Typography variant="body2" paragraph>
              Aşağıdaki bilgilerle kurulum yapılacaktır:
            </Typography>
            
            <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Sistem ID:</strong> {systemId}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Admin Kullanıcı Adı:</strong> {adminUsername}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Tablo Adı:</strong> {tableName}
              </Typography>
              <Typography variant="body2">
                <strong>Seçilen Rapor Sayısı:</strong> {Object.values(reportSelections).filter(Boolean).length}
              </Typography>
            </Box>
          </Box>
        );
      
      default:
        return 'Bilinmeyen adım';
    }
  };
  
  // Kurulum Tamamlandı
  if (setupComplete) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ 
            width: 60, 
            height: 60, 
            borderRadius: '50%', 
            bgcolor: 'success.main', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mx: 'auto',
            mb: 2
          }}>
            <Check sx={{ color: 'white', fontSize: 30 }} />
          </Box>
          
          <Typography variant="h5" gutterBottom>
            Kurulum Tamamlandı!
          </Typography>
          
          <Typography variant="body1" paragraph>
            Sistem başarıyla kuruldu. Admin paneline yönlendiriliyorsunuz...
          </Typography>
          
          <CircularProgress size={24} sx={{ mt: 2 }} />
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          Knowhy Raporlama Kurulum Sihirbazı
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ py: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ p: 2 }}>
          {getStepContent(activeStep)}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
            startIcon={<ArrowBack />}
          >
            Geri
          </Button>
          
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!validateCurrentStep() || loading}
            endIcon={activeStep === steps.length - 1 ? <Check /> : <ArrowForward />}
          >
            {loading ? <CircularProgress size={24} /> : 
             activeStep === steps.length - 1 ? 'Kurulumu Tamamla' : 'İleri'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SetupPage; 