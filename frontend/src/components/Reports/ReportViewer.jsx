import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Paper, Button, TextField, Divider, 
  CircularProgress, Alert, IconButton, Chip, Grid,
  Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Tooltip, Stack, Snackbar, Card, CardContent,
  useTheme, alpha, Container, MenuItem, Select, FormControl,
  InputLabel, FormHelperText, ListItemIcon, ListItemText
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { 
  ExpandMore, PlayArrow, Save, Code, BarChart,
  Close, Settings, InfoOutlined,
  TableChart, PieChart, Download, Refresh, Share, Fullscreen,
  FilterAlt, Timeline, InsertChart, PlayCircleOutline,
  Star, StarBorder, Dashboard, DataUsage, DonutLarge
} from '@mui/icons-material';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import { toPng } from 'html-to-image';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import trLocale from 'date-fns/locale/tr';
import { format } from 'date-fns';

// Chart.js modüllerini kaydet
Chart.register(...registerables);

const ReportViewer = ({ selectedReport, onRegisterReport }) => {
  const theme = useTheme();
  const [reportDetails, setReportDetails] = useState(null);
  const [parameters, setParameters] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [chartOptions, setChartOptions] = useState(null);
  const [chartType, setChartType] = useState('bar'); // bar, line, pie, doughnut
  const [showSqlDialog, setShowSqlDialog] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [paramValues, setParamValues] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [realTimeInterval, setRealTimeInterval] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isFavorite, setIsFavorite] = useState(false);
  const chartRefs = {
    bar: useRef(null),
    line: useRef(null),
    pie: useRef(null),
    doughnut: useRef(null)
  };
  const tableRef = useRef(null);

  // Snackbar'ı kapat
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Rapor değiştiğinde detayları getir
  useEffect(() => {
    if (!selectedReport) return;
    
    const fetchReportDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setResults(null);
        setChartData(null);
        
        const token = localStorage.getItem('token');
        console.log('Fetching report details:', selectedReport);
        
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/reports/details/${selectedReport.report_name}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('Report details response:', response.data);
        setReportDetails(response.data);
        
        // Parametreleri ayarla
        if (response.data && response.data.parameters) {
        setParameters(response.data.parameters || {});
          
          // Parametre değerlerini başlat
          const initialValues = {};
          Object.entries(response.data.parameters).forEach(([key, defaultValue]) => {
            initialValues[key] = defaultValue || '';
          });
          setParamValues(initialValues);
        }
        
        // Rapor tipini tahmin et
        let type = 'bar';
        if (selectedReport.report_name.includes('Dagilim') || 
            selectedReport.report_name.includes('Dağılım') ||
            selectedReport.report_name.includes('Topik')) {
          type = 'pie';
        } else if (selectedReport.report_name.includes('Trend') || 
                  selectedReport.report_name.includes('Analiz') ||
                  selectedReport.report_name.includes('Zaman')) {
          type = 'line';
        }
        setChartType(type);

        // Favori durumunu kontrol et
        const favorites = JSON.parse(localStorage.getItem('favoriteReports') || '[]');
        setIsFavorite(favorites.some(fav => fav.report_name === selectedReport.report_name));
        
      } catch (err) {
        console.error('Rapor detayları alınamadı:', err);
        setError('Rapor detayları yüklenirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
    
    // Cleanup - real-time interval'i temizle
    return () => {
      if (realTimeInterval) {
        clearInterval(realTimeInterval);
      }
    };
  }, [selectedReport]);
  
  // Favori durumunu değiştir
  const toggleFavorite = () => {
    if (!selectedReport) return;
    
    const favorites = JSON.parse(localStorage.getItem('favoriteReports') || '[]');
    
    if (isFavorite) {
      // Favorilerden kaldır
      const updatedFavorites = favorites.filter(fav => fav.report_name !== selectedReport.report_name);
      localStorage.setItem('favoriteReports', JSON.stringify(updatedFavorites));
      setIsFavorite(false);
      
      setSnackbar({
        open: true,
        message: 'Rapor favorilerden kaldırıldı',
        severity: 'info'
      });
    } else {
      // Favorilere ekle
      const updatedFavorites = [
        ...favorites, 
        { 
          report_name: selectedReport.report_name, 
          display_name: reportDetails?.display_name || selectedReport.report_name,
          description: reportDetails?.description || ''
        }
      ];
      localStorage.setItem('favoriteReports', JSON.stringify(updatedFavorites));
      setIsFavorite(true);
      
      setSnackbar({
        open: true,
        message: 'Rapor favorilere eklendi',
        severity: 'success'
      });
    }
  };

  // Parametre değişikliğini işle
  const handleParameterChange = (paramKey, value) => {
    setParamValues({
      ...paramValues,
      [paramKey]: value
    });
  };

  // Raporu çalıştır
  const runReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('Running report with params:', paramValues);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/reports/run`,
        {
          report_name: selectedReport.report_name,
          parameters: paramValues
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Report run response:', response.data);
      
      if (response.data.status === 'success') {
        setResults(response.data.results || []);
        
        // Sonuç boş ise bildir
        if (!response.data.results || response.data.results.length === 0) {
          setSnackbar({
            open: true,
            message: 'Sorgu çalıştırıldı, ancak sonuç döndürmedi.',
            severity: 'info'
          });
        } else {
      // Grafik verilerini hazırla
      prepareChartData(response.data.results);
      
          setSnackbar({
            open: true,
            message: `Rapor başarıyla çalıştırıldı. ${response.data.results.length} satır döndü.`,
            severity: 'success'
          });
        }
      } else {
        setError(response.data.message || 'Rapor çalıştırılırken bir hata oluştu');
        setSnackbar({
          open: true,
          message: response.data.message || 'Rapor çalıştırılırken bir hata oluştu',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error('Rapor çalıştırma hatası:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Bilinmeyen bir hata oluştu';
      setError(`Rapor çalıştırılırken bir hata oluştu: ${errorMessage}`);
      
      setSnackbar({
        open: true,
        message: `Rapor çalıştırılırken bir hata oluştu: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Grafik verilerini hazırla
  const prepareChartData = (results) => {
    if (!results || results.length === 0) {
      setChartData(null);
      return;
    }
    
    // Veri anahtarlarını bul
    const keys = Object.keys(results[0]);
    
    // X ekseni için kullanılacak anahtar (genellikle tarih veya kategori)
    const xAxisKey = keys.find(k => 
      k.toLowerCase().includes('date') || 
      k.toLowerCase().includes('time') || 
      k.toLowerCase().includes('name') || 
      k.toLowerCase().includes('day') || 
      k.toLowerCase().includes('hour') || 
      k.toLowerCase().includes('category') ||
      k.toLowerCase().includes('id')
    ) || keys[0];
    
    // Y ekseni için kullanılacak anahtarlar (sayısal değerler)
    const yAxisKeys = keys.filter(k => 
      k !== xAxisKey && 
      (typeof results[0][k] === 'number' || !isNaN(parseFloat(results[0][k])))
    );
    
    // Çok az sayısal değer varsa veya hiç yoksa, sayısal olmayan sütunları da ekle
    let selectedYAxisKeys = yAxisKeys;
    if (yAxisKeys.length <= 1) {
      // İlk sayısal olmayan sütunu ekle (ID ve tarih sütunları hariç)
      const nonNumericKeys = keys.filter(k => 
        k !== xAxisKey && 
        !yAxisKeys.includes(k) &&
        !k.toLowerCase().includes('id') &&
        !k.toLowerCase().includes('date') &&
        !k.toLowerCase().includes('time')
      );
      
      if (nonNumericKeys.length > 0) {
        selectedYAxisKeys = [...yAxisKeys, nonNumericKeys[0]];
      }
    }
    
    // Renk paleti
      const colors = [
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 99, 132, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 205, 86, 0.7)',
      'rgba(201, 203, 207, 0.7)',
      'rgba(255, 99, 71, 0.7)',
      'rgba(50, 205, 50, 0.7)',
      'rgba(138, 43, 226, 0.7)'
    ];
    
    // Veri setlerini oluştur - line ve bar için
    const datasets = selectedYAxisKeys.map((key, index) => {
      return {
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Formatlanmış etiket
        data: results.map(item => typeof item[key] === 'number' ? item[key] : parseFloat(item[key]) || 0),
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace('0.7', '1'),
        borderWidth: 1,
        fill: chartType === 'line' ? 'start' : undefined,
        tension: chartType === 'line' ? 0.4 : undefined
      };
    });
    
    // Pie/Doughnut için farklı veri formatı
    if (chartType === 'pie' || chartType === 'doughnut') {
      // Tek bir sayısal sütun seç
      const valueKey = selectedYAxisKeys.length > 0 ? selectedYAxisKeys[0] : '';
      
      if (valueKey) {
        const pieData = {
          labels: results.map(item => String(item[xAxisKey])),
          datasets: [{
            data: results.map(item => typeof item[valueKey] === 'number' ? item[valueKey] : parseFloat(item[valueKey]) || 0),
            backgroundColor: results.map((_, i) => colors[i % colors.length]),
            borderColor: results.map((_, i) => colors[i % colors.length].replace('0.7', '1')),
            borderWidth: 1
          }]
        };
        
        setChartData(pieData);
      } else {
        setChartData(null);
      }
    } else {
      // Line/Bar için veri formatı
    const chartData = {
        labels: results.map(item => String(item[xAxisKey])),
      datasets
    };
      
      setChartData(chartData);
    }
    
    // Grafik ayarları
    const chartOpts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: selectedReport?.display_name || 'Rapor Sonuçları'
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          beginAtZero: true
        }
      } : undefined
    };
    
    setChartOptions(chartOpts);
  };

  // Gerçek zamanlı güncellemeleri etkinleştir/devre dışı bırak
  const toggleRealTimeUpdates = () => {
    if (realTimeEnabled) {
      // Devre dışı bırak
      if (realTimeInterval) {
        clearInterval(realTimeInterval);
        setRealTimeInterval(null);
      }
      setRealTimeEnabled(false);
      
      setSnackbar({
        open: true,
        message: 'Gerçek zamanlı güncellemeler devre dışı bırakıldı',
        severity: 'info'
      });
    } else {
      // Etkinleştir - her 30 saniyede bir raporu çalıştır
      runReport(); // İlk çalıştırma
      
      const interval = setInterval(() => {
        runReport();
      }, 30000); // 30 saniye
      
      setRealTimeInterval(interval);
      setRealTimeEnabled(true);
      
      setSnackbar({
        open: true,
        message: 'Gerçek zamanlı güncellemeler etkinleştirildi (30s)',
        severity: 'info'
      });
    }
  };

  // Raporu kaydet
  const registerReport = async () => {
    if (!selectedReport) return;
    
    try {
      setLoading(true);
      
      await onRegisterReport(selectedReport.report_name, reportDetails.display_name, reportDetails.description);
      
      setSnackbar({
        open: true,
        message: 'Rapor başarıyla kaydedildi',
        severity: 'success'
      });
    } catch (err) {
      setError('Rapor kaydedilirken bir hata oluştu');
      
      setSnackbar({
        open: true,
        message: 'Rapor kaydedilirken bir hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Grafik sayfalarını renderla
  const renderChartView = () => {
    if (!chartData) return null;
    
    const chartHeight = 400;
    
    const chartComponents = {
      bar: (
        <Box ref={chartRefs.bar} sx={{ height: chartHeight, marginTop: 2 }}>
          <Bar data={chartData} options={chartOptions} />
        </Box>
      ),
      line: (
        <Box ref={chartRefs.line} sx={{ height: chartHeight, marginTop: 2 }}>
          <Line data={chartData} options={chartOptions} />
        </Box>
      ),
      pie: (
        <Box ref={chartRefs.pie} sx={{ height: chartHeight, marginTop: 2 }}>
          <Pie data={chartData} options={chartOptions} />
        </Box>
      ),
      doughnut: (
        <Box ref={chartRefs.doughnut} sx={{ height: chartHeight, marginTop: 2 }}>
          <Doughnut data={chartData} options={chartOptions} />
        </Box>
      )
    };
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, borderRadius: 1, p: 1, bgcolor: alpha(theme.palette.primary.light, 0.1) }}>
          <Tabs 
            value={chartType} 
            onChange={(_, newValue) => setChartType(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              '& .MuiTab-root': { 
                minHeight: 48,
                borderRadius: '8px', 
                mx: 0.5,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main
                }
              }
            }}
          >
            <Tab 
              value="bar" 
              label="Çubuk Grafik" 
              icon={<BarChart />} 
              iconPosition="start"
            />
            <Tab 
              value="line" 
              label="Çizgi Grafik" 
              icon={<Timeline />} 
              iconPosition="start"
            />
            <Tab 
              value="pie" 
              label="Pasta Grafik" 
              icon={<PieChart />} 
              iconPosition="start"
            />
            <Tab 
              value="doughnut" 
              label="Halka Grafik" 
              icon={<DonutLarge />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        <Card 
          elevation={2} 
          sx={{ 
            mb: 3, 
            overflow: 'hidden',
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`  
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {chartComponents[chartType]}
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Tablo görünümü renderla
  const renderTableView = () => {
    if (!results || results.length === 0) return null;
    
    const columns = Object.keys(results[0]);
    
    return (
      <Card
        elevation={2}
        sx={{
          mb: 3,
          overflow: 'hidden',
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Box ref={tableRef} sx={{ overflowX: 'auto' }}>
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell 
                      key={column}
                      sx={{ 
                        fontWeight: 'bold', 
                        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.2) : alpha(theme.palette.primary.light, 0.2),
                        color: theme.palette.primary.main
                      }}
                    >
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((row, rowIndex) => (
                  <TableRow 
                    key={rowIndex}
                    hover
                    sx={{ 
                      '&:nth-of-type(odd)': { 
                        bgcolor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.action.hover, 0.05)
                          : alpha(theme.palette.action.hover, 0.05)
                      },
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell key={column}>{row[column]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Card>
    );
  };

  // Parametre sayfasını renderla
  const renderParameterForm = () => {
    if (!parameters || Object.keys(parameters).length === 0) {
    return (
        <Alert severity="info" sx={{ mb: 3 }}>
          Bu rapor için parametre tanımlanmamış
        </Alert>
    );
  }

  return (
      <Card 
        elevation={2}
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          bgcolor: alpha(theme.palette.background.paper, 0.7),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <FilterAlt sx={{ mr: 1, color: theme.palette.primary.main }} />
          Rapor Parametreleri
        </Typography>
        
        <Grid container spacing={3}>
          {Object.entries(parameters).map(([key, defaultValue]) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <InputLabel id={`param-${key}-label`}>{key}</InputLabel>
                <TextField
                  labelId={`param-${key}-label`}
                  id={`param-${key}`}
                  label={key}
                  value={paramValues[key] || ''}
                  onChange={(e) => handleParameterChange(key, e.target.value)}
              variant="outlined"
                  fullWidth
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  }}
                />
                <FormHelperText>
                  {`Varsayılan: ${defaultValue || 'Yok'}`}
                </FormHelperText>
              </FormControl>
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            variant="outlined"
            color="primary"
            onClick={() => setParamValues(parameters)}
            startIcon={<Refresh />}
            sx={{ mr: 2 }}
          >
            Varsayılanlara Dön
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={runReport}
            startIcon={<PlayArrow />}
            disabled={loading}
            sx={{ 
              px: 3,
              py: 1,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4
              },
              '&.Mui-disabled': {
                bgcolor: alpha(theme.palette.primary.main, 0.3)
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Raporu Çalıştır'}
          </Button>
        </Box>
      </Card>
    );
  };

  // Rapor detaylarını renderla
  const renderReportDetails = () => {
    if (!reportDetails) return null;
    
    return (
      <Card 
        sx={{ 
          mb: 3, 
          borderRadius: 2,
          boxShadow: theme.shadows[2],
          backgroundColor: alpha(theme.palette.background.paper, 0.7),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              {reportDetails.display_name || selectedReport.report_name}
            </Typography>
            
            <Box>
              <IconButton 
                color={isFavorite ? 'warning' : 'default'} 
                onClick={toggleFavorite}
                sx={{ 
                  mr: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    color: theme.palette.warning.main
                  }
                }}
              >
                {isFavorite ? <Star /> : <StarBorder />}
              </IconButton>
              
              <IconButton 
                color="primary" 
                onClick={() => setShowSqlDialog(true)}
                sx={{ 
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    color: theme.palette.primary.main
                  }
                }}
              >
                <Code />
              </IconButton>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="body1" color="text.secondary" paragraph>
            {reportDetails.description || 'Bu rapor için açıklama bulunmuyor.'}
                </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            <Chip 
              label={`Kategori: ${reportDetails.category || 'Genel'}`} 
              variant="outlined" 
              size="small"
              sx={{ 
                bgcolor: alpha(theme.palette.primary.light, 0.1),
                borderColor: theme.palette.primary.light
              }}
            />
            
            {reportDetails.tags && reportDetails.tags.map((tag, index) => (
              <Chip 
                key={index} 
                label={tag} 
                size="small"
                sx={{ 
                  bgcolor: alpha(theme.palette.secondary.light, 0.1),
                  borderColor: theme.palette.secondary.light,
                  color: theme.palette.secondary.dark
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Ana içerik alanını renderla
  const renderMainContent = () => {
    if (loading && !results) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Rapor yükleniyor...
          </Typography>
        </Box>
      );
    }
    
    if (error && !results) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      );
    }
    
    if (!results) {
      return (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.info.light, 0.1),
            border: `1px solid ${theme.palette.info.light}`,
            '& .MuiAlert-icon': {
              color: theme.palette.info.main
            }
          }}
        >
          <Typography variant="body1">
            Rapor sonuçlarını görmek için parametreleri ayarlayıp raporu çalıştırın.
          </Typography>
        </Alert>
      );
    }
    
    return (
      <>
            {results && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.paper, 0.7),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: 1
              }}
            >
                        <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <InsertChart sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Rapor Sonuçları 
                          <Chip 
                    label={`${results.length} satır`} 
                            size="small"
                    sx={{ ml: 2, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.dark }}
                  />
                </Typography>
              </Box>
              
              <Box>
                <IconButton 
                  color={realTimeEnabled ? 'primary' : 'default'} 
                  onClick={toggleRealTimeUpdates}
                  sx={{ mr: 1 }}
                >
                  <PlayCircleOutline />
                </IconButton>
                
                <Tabs
                  value={viewMode}
                  onChange={(_, newValue) => setViewMode(newValue)}
                  sx={{ 
                    display: 'inline-flex',
                    minHeight: 'auto',
                    bgcolor: alpha(theme.palette.background.paper, 0.7),
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    '& .MuiTab-root': {
                      minHeight: 40,
                      minWidth: 40,
                      p: 1,
                      m: 0.3,
                      borderRadius: 1,
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main
                      }
                    }
                  }}
                >
                  <Tab 
                    value="table" 
                    icon={<TableChart />} 
                    aria-label="Tablo Görünümü"
                    sx={{ borderRadius: 1 }}
                  />
                  <Tab 
                    value="chart" 
                    icon={<BarChart />}
                    aria-label="Grafik Görünümü" 
                    disabled={!chartData}
                    sx={{ borderRadius: 1 }}
                  />
                </Tabs>
                        </Box>
                      </Box>
            
            {viewMode === 'table' ? renderTableView() : renderChartView()}
                      </Box>
        )}
      </>
    );
  };

  // SQL Dialog'unu renderla
  const renderSqlDialog = () => {
    return (
      <Dialog 
        open={showSqlDialog} 
        onClose={() => setShowSqlDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 24
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <Code sx={{ mr: 1, color: theme.palette.primary.main }} />
          SQL Sorgusu
          </Typography>
          <IconButton onClick={() => setShowSqlDialog(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          {reportDetails?.sql ? (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: '#272822', 
                color: '#F8F8F2',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                overflow: 'auto',
                position: 'relative'
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {reportDetails.sql}
            </pre>
          </Paper>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Bu rapor için SQL sorgusu tanımlanmamış.
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setShowSqlDialog(false)} variant="outlined">
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Ana bileşen render'ı
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {renderReportDetails()}
      
      {renderParameterForm()}
      
      {renderMainContent()}
      
      {/* SQL Dialog */}
      {renderSqlDialog()}
      
      {/* Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity={snackbar.severity}
          onClose={handleCloseSnackbar}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default ReportViewer; 