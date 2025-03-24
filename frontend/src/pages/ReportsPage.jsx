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
import { api } from '../services/apiConfig';
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
  const [summaryError, setSummaryError] = useState(null);
  
  const navigate = useNavigate();
  
  // Rapor kategorileri
  const categories = {
    all: "Tüm Raporlar",
    time: "Zamana Dayalı Analizler",
    content: "İçerik Analizleri",
    performance: "Performans Metrikleri",
    detailed: "Detaylı Görünümler"
  };
  
  // Rapor seçimi
  const handleSelectReport = (report) => {
    setSelectedReport(report);
    if (report && report.id) {
      navigate(`/reports/${report.id}`);
    }
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
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/reports/list');
      
      if (response.data && Array.isArray(response.data.reports)) {
        setReports(response.data.reports);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };
  
  // Favori raporları getir
  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/reports/favorites');
      
      if (response.data && Array.isArray(response.data.favorites)) {
        setFavorites(response.data.favorites);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(err.message || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };
  
  // Sistem genel özetini getir
  const fetchSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const response = await api.get('/reports/summary');
      
      if (response.data) {
        setSummary(response.data);
      }
    } catch (err) {
      console.error('Error fetching summary data:', err);
      setSummaryError(err.message || 'Failed to load summary data');
    } finally {
      setSummaryLoading(false);
    }
  };
  
  // Favori ekle/çıkar
  const toggleFavorite = async (reportId) => {
    try {
      const isFavorite = favorites.includes(reportId);
      const endpoint = isFavorite ? '/reports/remove-favorite' : '/reports/add-favorite';
      
      const response = await api.post(endpoint, { report_id: reportId });
      
      if (response.data && response.data.status === 'success') {
        // Favori listesini güncelle
        if (isFavorite) {
          setFavorites(favorites.filter(id => id !== reportId));
        } else {
          setFavorites([...favorites, reportId]);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError(err.message || 'Failed to update favorites');
    }
  };
  
  // Rapor detay sayfasına git
  const goToReportDetail = (reportId) => {
    navigate(`/reports/${reportId}`);
  };
  
  // Raporları filtrele
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    
    if (summaryError) {
      return (
        <Alert severity="error">{summaryError}</Alert>
      );
    }
    
    if (!summary) {
      return (
        <Alert severity="info">Summary data not available</Alert>
      );
    }
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Toplam Mesaj</Typography>
              <Typography variant="h4">{summary.total_messages || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Toplam Oturum</Typography>
              <Typography variant="h4">{summary.total_sessions || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Bugünün Mesajları</Typography>
              <Typography variant="h4">{summary.today_messages || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Context Kullanımı</Typography>
              <Typography variant="h4">{summary.context_usage_percent || 0}%</Typography>
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