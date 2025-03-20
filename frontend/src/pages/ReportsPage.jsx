import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Grid, Paper, Typography, Card, CardContent, 
  CardActionArea, CardMedia, TextField, MenuItem, InputAdornment,
  Divider, CircularProgress, Chip, Button, Alert, Tab, Tabs, IconButton
} from '@mui/material';
import { 
  Dashboard, TrendingUp, Search, Refresh, Favorite, 
  FavoriteBorder, FilterList, BarChart, 
  TableChart, CalendarToday, ViewList, Assessment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReportSelector from '../components/Reports/ReportSelector';
import ReportViewer from '../components/Reports/ReportViewer';

// Raporlar ana sayfası
const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  
  const navigate = useNavigate();
  
  // Rapor kategorileri
  const categories = [
    { value: 'all', label: 'Tüm Raporlar' },
    { value: 'time', label: 'Zaman Bazlı Analizler' },
    { value: 'content', label: 'İçerik Analizleri' },
    { value: 'performance', label: 'Performans Metrikleri' },
    { value: 'detail', label: 'Detaylı Görünümler' }
  ];
  
  // Rapor seçimi
  const handleSelectReport = (report) => {
    setSelectedReport(report);
    setSelectedTab(1); // Otomatik olarak rapor görüntüleme tabına geç
  };
  
  // Sekme değişimi
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };
  
  // Rapor listesini getir
  useEffect(() => {
    fetchReports();
    fetchFavorites();
    fetchSummary();
  }, []);
  
  // Raporları getir
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/reports/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        setReports(response.data.reports || []);
      } else {
        setError(response.data.message || 'Rapor listesi alınamadı');
      }
    } catch (err) {
      console.error('Rapor listesi getirme hatası:', err);
      setError('Rapor listesi yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  // Favori raporları getir
  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/reports/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        setFavorites(response.data.favorites || []);
      }
    } catch (err) {
      console.error('Favori raporlar getirilirken hata:', err);
      // Başarısız olursa boş array kullan
      setFavorites([]);
    }
  };
  
  // Sistem genel özetini getir
  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/reports/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        setSummary(response.data.summary || null);
      }
    } catch (err) {
      console.error('Özet bilgiler getirilirken hata:', err);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };
  
  // Favori ekle/çıkar
  const toggleFavorite = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const isFavorite = favorites.includes(reportId);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/reports/${isFavorite ? 'unfavorite' : 'favorite'}/${reportId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        // Favori listesini güncelle
        if (isFavorite) {
          setFavorites(favorites.filter(id => id !== reportId));
        } else {
          setFavorites([...favorites, reportId]);
        }
      }
    } catch (err) {
      console.error('Favori işlemi sırasında hata:', err);
    }
  };
  
  // Rapor detay sayfasına git
  const goToReportDetail = (reportId) => {
    navigate(`/reports/${reportId}`);
  };
  
  // Raporları filtrele
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.display_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (report.description && report.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || report.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Favorilere göre filtrele
  const visibleReports = tabValue === 0 
    ? filteredReports 
    : filteredReports.filter(report => favorites.includes(report.id));
  
  // Özet kartları
  const SummaryCards = () => {
    if (summaryLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (!summary) {
      return (
        <Alert severity="info" sx={{ mb: 3 }}>
          Özet bilgiler yüklenemedi. Lütfen daha sonra tekrar deneyin.
        </Alert>
      );
    }
    
    return (
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Toplam Mesaj
              </Typography>
              <Typography variant="h4" component="div">
                {summary.total_messages || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Toplam Oturum
              </Typography>
              <Typography variant="h4" component="div">
                {summary.total_sessions || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Bugünkü Mesaj
              </Typography>
              <Typography variant="h4" component="div">
                {summary.today_messages || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Context Kullanım Oranı
              </Typography>
              <Typography variant="h4" component="div">
                %{summary.context_usage_percentage || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Raporlar
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Mevcut raporları görüntüleyebilir ve filtreleyebilirsiniz.
        </Typography>
        
        <Paper sx={{ mt: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab icon={<ViewList />} label="Rapor Listesi" />
            <Tab 
              icon={<Assessment />} 
              label="Rapor Görüntüleme" 
              disabled={!selectedReport}
            />
          </Tabs>
          
          <Divider />
          
          <Box sx={{ p: 3 }}>
            {selectedTab === 0 ? (
              <ReportSelector onSelectReport={handleSelectReport} />
            ) : (
              selectedReport ? (
                <ReportViewer 
                  reportName={selectedReport.report_name}
                  displayName={selectedReport.display_name}
                  description={selectedReport.description}
                  parameters={selectedReport.parameters}
                />
              ) : (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Henüz bir rapor seçilmedi
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={() => setSelectedTab(0)}
                    sx={{ mt: 2 }}
                  >
                    Rapor Seçin
                  </Button>
                </Box>
              )
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ReportsPage; 