import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Card, CardContent,
  CardActionArea, IconButton, TextField, InputAdornment, Chip,
  CircularProgress, Alert, Tabs, Tab, Divider, Button,
  useTheme
} from '@mui/material';
import {
  Search, Favorite, FavoriteBorder, TrendingUp, Assessment,
  Timeline, PieChart, BarChart, ShowChart, Info
} from '@mui/icons-material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../services/apiConfig';
import { useNavigate } from 'react-router-dom';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ReportsPage = () => {
  const theme = useTheme();
  const [reports, setReports] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);
  
  const navigate = useNavigate();
  
  // Raporları getir
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await api.get('/reports/list');
        if (response.data.status === 'success') {
          setReports(response.data.reports || []);
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Raporlar yüklenirken bir hata oluştu');
      }
    };

    const fetchFavorites = async () => {
      try {
        const response = await api.get('/reports/favorites');
        if (response.data.status === 'success') {
          setFavorites(response.data.favorites || []);
        }
      } catch (err) {
        console.error('Error fetching favorites:', err);
      }
    };

    const fetchSummaryData = async () => {
      try {
        const response = await api.get('/reports/summary');
        if (response.data.status === 'success') {
          setSummaryData(response.data.summary);
        }
      } catch (err) {
        console.error('Error fetching summary data:', err);
      }
    };

    Promise.all([fetchReports(), fetchFavorites(), fetchSummaryData()])
      .finally(() => setLoading(false));
  }, []);

  // Raporları filtrele
  const filteredReports = reports.filter(report => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (report?.display_name?.toLowerCase() || '').includes(searchLower) ||
      (report?.description?.toLowerCase() || '').includes(searchLower) ||
      (report?.category?.toLowerCase() || '').includes(searchLower)
    );
  });

  // Özet grafik verileri
  const summaryChartData = {
    labels: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
    datasets: [
      {
        label: 'Haftalık Aktivite',
        data: summaryData?.weekly_activity || [0, 0, 0, 0, 0, 0, 0],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        fill: true,
      }
    ]
  };

  const pieChartData = {
    labels: ['Context Kullanılan', 'Context Kullanılmayan'],
    datasets: [
      {
        data: [
          summaryData?.context_usage?.used || 0,
          summaryData?.context_usage?.not_used || 0
        ],
        backgroundColor: [
          theme.palette.success.main,
          theme.palette.grey[300]
        ]
      }
    ]
  };

  const barChartData = {
    labels: ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24'],
    datasets: [
      {
        label: 'Saatlik Dağılım',
        data: summaryData?.hourly_distribution || [0, 0, 0, 0, 0, 0],
        backgroundColor: theme.palette.secondary.main,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };

  // Tab değişikliği
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Rapor seçimi
  const handleSelectReport = (report) => {
    setSelectedReport(report);
    if (report && report.id) {
      navigate(`/reports/${report.id}`);
    }
  };

  // Favori ekle/çıkar
  const handleToggleFavorite = async (report) => {
    try {
      const isFavorite = favorites.includes(report.report_name);
      const endpoint = isFavorite ? '/reports/remove-favorite' : '/reports/add-favorite';
      
      const response = await api.post(endpoint, { report_id: report.report_name });
      
      if (response.data && response.data.status === 'success') {
        // Favori listesini güncelle
        if (isFavorite) {
          setFavorites(favorites.filter(id => id !== report.report_name));
        } else {
          setFavorites([...favorites, report.report_name]);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError(err.message || 'Failed to update favorites');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%', bgcolor: 'primary.light' }}>
            <Typography variant="h6" gutterBottom>
              Toplam Oturum
            </Typography>
            <Typography variant="h3">
              {summaryData?.total_sessions || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Son 24 saat: +{summaryData?.new_sessions || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%', bgcolor: 'secondary.light' }}>
            <Typography variant="h6" gutterBottom>
              Toplam Mesaj
            </Typography>
            <Typography variant="h3">
              {summaryData?.total_messages || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ortalama: {summaryData?.avg_messages_per_session || 0}/oturum
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%', bgcolor: 'success.light' }}>
            <Typography variant="h6" gutterBottom>
              Context Kullanımı
            </Typography>
            <Typography variant="h3">
              %{summaryData?.context_usage_percentage || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Son 24 saat: %{summaryData?.recent_context_usage || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%', bgcolor: 'warning.light' }}>
            <Typography variant="h6" gutterBottom>
              Ortalama Yanıt Süresi
            </Typography>
            <Typography variant="h3">
              {summaryData?.avg_response_time || 0}s
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Son 1 saat: {summaryData?.recent_response_time || 0}s
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Grafikler */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<ShowChart />} label="Aktivite Trendi" />
          <Tab icon={<PieChart />} label="Context Analizi" />
          <Tab icon={<BarChart />} label="Saatlik Dağılım" />
        </Tabs>

        <Box sx={{ p: 3, height: 400 }}>
          {selectedTab === 0 && (
            <Line data={summaryChartData} options={chartOptions} />
          )}
          {selectedTab === 1 && (
            <Pie data={pieChartData} options={chartOptions} />
          )}
          {selectedTab === 2 && (
            <Bar data={barChartData} options={chartOptions} />
          )}
        </Box>
      </Paper>

      {/* Rapor Listesi */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Raporlar
          </Typography>
          <TextField
            size="small"
            placeholder="Rapor ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Grid container spacing={2}>
            {filteredReports.map((report) => (
              <Grid item xs={12} sm={6} md={4} key={report.id || report.report_name}>
                <Card>
                  <CardActionArea onClick={() => handleSelectReport(report)}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" gutterBottom>
                          {report.display_name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(report);
                          }}
                        >
                          {favorites.includes(report.report_name) ? (
                            <Favorite color="error" />
                          ) : (
                            <FavoriteBorder />
                          )}
                        </IconButton>
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {report.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          size="small"
                          label={report.category}
                          color="primary"
                          variant="outlined"
                        />
                        {report.is_active && (
                          <Chip
                            size="small"
                            label="Aktif"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default ReportsPage; 