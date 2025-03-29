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
  Star, StarBorder, Dashboard, DataUsage, DonutLarge, Today
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
    
    const chartHeight = 450; // Biraz daha yüksek
    
    // Chart.js için özel animasyon konfigürasyonu
    const customAnimation = {
      tension: {
        duration: 1000,
        easing: 'easeOutQuart',
        from: 0.4,
        to: 0.2,
        loop: false
      },
      x: {
        type: 'number',
        easing: 'easeOutElastic',
        duration: 1000,
        from: 0,
        delay: function(ctx) {
          return ctx.dataIndex * 100 + ctx.datasetIndex * 50;
        }
      },
      y: {
        type: 'number',
        easing: 'easeOutBounce',
        duration: 1000,
        from: 0,
        delay: function(ctx) {
          return ctx.dataIndex * 100 + ctx.datasetIndex * 50;
        }
      }
    };
    
    // Her grafik tipi için güncellenen konfigürasyon
    const updatedChartOptions = {
      ...chartOptions,
      responsive: true,
      maintainAspectRatio: false,
      animation: customAnimation,
      plugins: {
        ...chartOptions?.plugins,
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12,
              family: "'Poppins', sans-serif",
              weight: 500
            }
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(17, 25, 40, 0.9)',
          titleFont: { 
            size: 14,
            weight: 'bold',
            family: "'Poppins', sans-serif"
          },
          bodyFont: { 
            size: 13,
            family: "'Poppins', sans-serif"
          },
          padding: 12,
          cornerRadius: 8,
          caretSize: 6,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          usePointStyle: true,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('tr-TR').format(context.parsed.y);
              }
              return label;
            }
          }
        },
        datalabels: {
          display: chartType === 'pie' || chartType === 'doughnut',
          color: '#fff',
          font: {
            weight: 'bold',
            size: 11,
            family: "'Poppins', sans-serif"
          },
          formatter: (value) => {
            return value > 5 ? new Intl.NumberFormat('tr-TR').format(value) : '';
          }
        }
      },
      scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          },
          ticks: {
            padding: 10,
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 11,
              family: "'Poppins', sans-serif"
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          },
          ticks: {
            padding: 10,
            font: {
              size: 11,
              family: "'Poppins', sans-serif"
            },
            callback: function(value) {
              return new Intl.NumberFormat('tr-TR').format(value);
            }
          }
        }
      } : undefined
    };
    
    const chartComponents = {
      bar: (
        <Box ref={chartRefs.bar} sx={{ height: chartHeight, marginTop: 2, position: 'relative' }}>
          <Bar 
            data={chartData} 
            options={updatedChartOptions} 
            plugins={[{
              id: 'chartAreaBorder',
              beforeDraw(chart) {
                const { ctx, chartArea } = chart;
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.lineWidth = 1;
                ctx.strokeRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
                ctx.restore();
              }
            }]}
          />
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              right: 0,
              zIndex: 9,
              p: 1,
              borderRadius: '50%',
              backdropFilter: 'blur(4px)',
              background: 'rgba(255, 255, 255, 0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <Tooltip title="Grafiği İndir" placement="left">
              <IconButton 
                size="small"
                onClick={() => downloadChart('bar')}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    color: '#fff',
                  }
                }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ),
      line: (
        <Box ref={chartRefs.line} sx={{ height: chartHeight, marginTop: 2, position: 'relative' }}>
          <Line 
            data={chartData} 
            options={updatedChartOptions}
            plugins={[{
              id: 'chartAreaBorder',
              beforeDraw(chart) {
                const { ctx, chartArea } = chart;
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.lineWidth = 1;
                ctx.strokeRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
                ctx.restore();
              }
            }]}
          />
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              right: 0,
              zIndex: 9,
              p: 1,
              borderRadius: '50%',
              backdropFilter: 'blur(4px)',
              background: 'rgba(255, 255, 255, 0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <Tooltip title="Grafiği İndir" placement="left">
              <IconButton 
                size="small"
                onClick={() => downloadChart('line')}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    color: '#fff',
                  }
                }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ),
      pie: (
        <Box ref={chartRefs.pie} sx={{ height: chartHeight, marginTop: 2, position: 'relative' }}>
          <Pie 
            data={chartData} 
            options={updatedChartOptions}
          />
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              right: 0,
              zIndex: 9,
              p: 1,
              borderRadius: '50%',
              backdropFilter: 'blur(4px)',
              background: 'rgba(255, 255, 255, 0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <Tooltip title="Grafiği İndir" placement="left">
              <IconButton 
                size="small"
                onClick={() => downloadChart('pie')}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    color: '#fff',
                  }
                }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ),
      doughnut: (
        <Box ref={chartRefs.doughnut} sx={{ height: chartHeight, marginTop: 2, position: 'relative' }}>
          <Doughnut 
            data={chartData} 
            options={updatedChartOptions}
          />
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              right: 0,
              zIndex: 9,
              p: 1,
              borderRadius: '50%',
              backdropFilter: 'blur(4px)',
              background: 'rgba(255, 255, 255, 0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <Tooltip title="Grafiği İndir" placement="left">
              <IconButton 
                size="small"
                onClick={() => downloadChart('doughnut')}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    color: '#fff',
                  }
                }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )
    };
    
    return (
      <Box sx={{ animation: 'fadeIn 0.5s ease-in-out' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 2, 
          borderRadius: 3, 
          p: 1.5, 
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(17, 25, 40, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px -5px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <Tabs 
            value={chartType} 
            onChange={(_, newValue) => setChartType(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              minHeight: 56,
              '& .MuiTab-root': { 
                minHeight: 48,
                borderRadius: '12px', 
                mx: 0.8,
                px: 2.5,
                transition: 'all 0.3s ease',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.6)',
                '&.Mui-selected': {
                  background: 'linear-gradient(90deg, rgba(66, 165, 245, 0.2) 0%, rgba(100, 181, 246, 0.1) 100%)',
                  color: '#90caf9',
                  boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.2)'
                },
                '&:hover:not(.Mui-selected)': {
                  backgroundColor: 'rgba(255, 255, 255, 0.07)',
                  color: 'rgba(255, 255, 255, 0.8)'
                }
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 1.5,
                background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'
              }
            }}
          >
            <Tab 
              value="bar" 
              label="Çubuk Grafik" 
              icon={<BarChart fontSize="small" />} 
              iconPosition="start"
            />
            <Tab 
              value="line" 
              label="Çizgi Grafik" 
              icon={<Timeline fontSize="small" />} 
              iconPosition="start"
            />
            <Tab 
              value="pie" 
              label="Pasta Grafik" 
              icon={<PieChart fontSize="small" />} 
              iconPosition="start"
            />
            <Tab 
              value="doughnut" 
              label="Halka Grafik" 
              icon={<DonutLarge fontSize="small" />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        <Card 
          elevation={0} 
          sx={{ 
            mb: 3, 
            overflow: 'hidden',
            borderRadius: 3,
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(17, 25, 40, 0.8) 100%)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 40px -12px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 15px 50px -12px rgba(0, 0, 0, 0.5)',
              transform: 'translateY(-3px)'
            }
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
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    
    // Tablo verilerini filtrele
    const filteredResults = searchQuery 
      ? results.filter(row => 
          Object.values(row).some(
            value => String(value).toLowerCase().includes(searchQuery.toLowerCase())
          )
        ) 
      : results;
      
    // Tablo verilerini sırala
    const sortedResults = React.useMemo(() => {
      if (!sortConfig.key) return filteredResults;
      
      return [...filteredResults].sort((a, b) => {
        if (a[sortConfig.key] === null) return 1;
        if (b[sortConfig.key] === null) return -1;
        
        const valA = typeof a[sortConfig.key] === 'string' 
          ? a[sortConfig.key].toLowerCase() 
          : a[sortConfig.key];
        const valB = typeof b[sortConfig.key] === 'string' 
          ? b[sortConfig.key].toLowerCase() 
          : b[sortConfig.key];
          
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }, [filteredResults, sortConfig]);
    
    // Sıralama fonksiyonu
    const requestSort = (key) => {
      let direction = 'ascending';
      if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
      }
      setSortConfig({ key, direction });
    };
    
    // Sıralama gösterge ikonu
    const getSortIcon = (key) => {
      if (sortConfig.key !== key) {
        return <Box sx={{ width: 16, height: 16, opacity: 0.3 }}>⇅</Box>;
      }
      return sortConfig.direction === 'ascending' 
        ? <Box sx={{ width: 16, height: 16, color: '#90caf9' }}>↑</Box>
        : <Box sx={{ width: 16, height: 16, color: '#90caf9' }}>↓</Box>;
    };
    
    return (
      <Card
        elevation={0}
        sx={{
          mb: 3,
          overflow: 'hidden',
          borderRadius: 3,
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(17, 25, 40, 0.8) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 40px -12px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          animation: 'fadeIn 0.5s ease-in-out',
          '&:hover': {
            boxShadow: '0 15px 50px -12px rgba(0, 0, 0, 0.5)',
            transform: 'translateY(-3px)'
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#90caf9' }}>
              <TableChart sx={{ mr: 1, fontSize: 20, verticalAlign: 'text-bottom' }} />
              Rapor Sonuçları
              <Chip 
                label={`${filteredResults.length} satır`} 
                size="small" 
                sx={{ 
                  ml: 1, 
                  bgcolor: 'rgba(66, 165, 245, 0.2)',
                  color: '#90caf9',
                  border: '1px solid rgba(66, 165, 245, 0.3)',
                  height: 20,
                  fontSize: 12
                }} 
              />
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="CSV Olarak İndir">
                <IconButton 
                  size="small"
                  onClick={downloadCSV}
                  sx={{ 
                    bgcolor: 'rgba(66, 165, 245, 0.1)', 
                    color: '#90caf9',
                    '&:hover': { 
                      bgcolor: 'rgba(66, 165, 245, 0.2)',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.3s'
                  }}
                >
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Tabloyu Yenile">
                <IconButton 
                  size="small"
                  onClick={runReport}
                  disabled={loading}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.05)', 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { 
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.3s'
                  }}
                >
                  {loading ? 
                    <CircularProgress size={16} sx={{ color: '#90caf9' }} /> : 
                    <Refresh fontSize="small" />
                  }
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <TextField
            placeholder="Tabloda ara..."
            variant="outlined"
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <Box component="span" sx={{ color: 'rgba(255, 255, 255, 0.5)', mr: 1 }}>
                  🔍
                </Box>
              ),
              sx: {
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                }
              }
            }}
          />
        </Box>
        
        <Box ref={tableRef} sx={{ overflowX: 'auto', position: 'relative' }}>
          {loading && (
            <Box sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              backdropFilter: 'blur(4px)'
            }}>
              <CircularProgress />
            </Box>
          )}
          
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell 
                      key={column}
                      onClick={() => requestSort(column)}
                      sx={{ 
                        fontWeight: 'bold', 
                        bgcolor: 'rgba(17, 25, 40, 0.9)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(66, 165, 245, 0.2)',
                          color: '#90caf9'
                        },
                        px: 2,
                        py: 1.5,
                        position: 'relative',
                        '&::after': sortConfig.key === column ? {
                          content: '""',
                          position: 'absolute',
                          height: 3,
                          bottom: 0,
                          left: 0,
                          right: 0,
                          bgcolor: '#4facfe',
                          borderRadius: '3px 3px 0 0'
                        } : {}
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {column.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </Typography>
                        {getSortIcon(column)}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedResults.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={columns.length} 
                      sx={{ 
                        textAlign: 'center', 
                        py: 4,
                        color: 'rgba(255, 255, 255, 0.6)'
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <FilterAlt sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                        <Typography variant="h6">Sonuç Bulunamadı</Typography>
                        <Typography variant="body2">
                          Arama kriterlerinizi değiştirmeyi deneyin.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedResults.map((row, rowIndex) => {
                    // Satır geçiş animasyonu için gecikme hesapla
                    const delay = Math.min(rowIndex * 30, 500);
                    
                    return (
                  <TableRow 
                    key={rowIndex}
                    hover
                    sx={{ 
                          animation: `fadeIn 0.5s ease forwards ${delay}ms`,
                          opacity: 0,
                          '@keyframes fadeIn': {
                            '0%': { opacity: 0 },
                            '100%': { opacity: 1 }
                          },
                      '&:nth-of-type(odd)': { 
                            bgcolor: 'rgba(255, 255, 255, 0.02)'
                          },
                          '&:hover': {
                            bgcolor: 'rgba(66, 165, 245, 0.08) !important'
                          },
                          transition: 'background-color 0.2s'
                        }}
                      >
                        {columns.map((column, colIndex) => {
                          let cellValue = row[column];
                          let cellComponent;
                          
                          // Özel hücre formatlaması
                          if (typeof cellValue === 'number') {
                            // Sayısal değerler için
                            cellComponent = (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: column.includes('id') ? 500 : 400,
                                  fontFamily: column.includes('id') ? 'monospace' : 'inherit'
                                }}
                              >
                                {new Intl.NumberFormat('tr-TR').format(cellValue)}
                              </Typography>
                            );
                          } else if (typeof cellValue === 'string' && (column.includes('date') || column.includes('time'))) {
                            // Tarih/zaman değerleri için
                            cellComponent = (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Today fontSize="small" sx={{ mr: 0.5, fontSize: 14, color: 'rgba(255, 255, 255, 0.4)' }} />
                                <Typography variant="body2">{cellValue}</Typography>
                              </Box>
                            );
                          } else if (cellValue === true || cellValue === false) {
                            // Boolean değerler için
                            cellComponent = (
                              <Chip 
                                label={cellValue ? 'Evet' : 'Hayır'} 
                                size="small"
                                sx={{ 
                                  bgcolor: cellValue 
                                    ? 'rgba(76, 175, 80, 0.1)' 
                                    : 'rgba(244, 67, 54, 0.1)',
                                  color: cellValue 
                                    ? 'rgba(76, 175, 80, 0.9)' 
                                    : 'rgba(244, 67, 54, 0.9)',
                                  border: `1px solid ${cellValue 
                                    ? 'rgba(76, 175, 80, 0.2)' 
                                    : 'rgba(244, 67, 54, 0.2)'}`,
                                  fontWeight: 500,
                                  fontSize: 11,
                                  height: 20
                                }}
                              />
                            );
                          } else {
                            // Diğer değerler için
                            cellComponent = (
                              <Typography variant="body2">
                                {cellValue !== null && cellValue !== undefined ? String(cellValue) : '-'}
                              </Typography>
                            );
                          }
                          
                          // Aranılan terim varsa vurgula
                          if (searchQuery && cellValue !== null && String(cellValue).toLowerCase().includes(searchQuery.toLowerCase())) {
                            const parts = String(cellValue).split(new RegExp(`(${searchQuery})`, 'gi'));
                            cellComponent = (
                              <Typography variant="body2">
                                {parts.map((part, i) => 
                                  part.toLowerCase() === searchQuery.toLowerCase() ? 
                                    <Box 
                                      component="span" 
                                      key={i} 
                                      sx={{ 
                                        bgcolor: 'rgba(255, 235, 59, 0.3)', 
                                        px: 0.3,
                                        borderRadius: 0.5
                                      }}
                                    >
                                      {part}
                                    </Box> : part
                                )}
                              </Typography>
                            );
                          }

                          return (
                            <TableCell 
                              key={colIndex}
                              sx={{ 
                                px: 2, 
                                py: 1.2,
                                borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                                color: column.includes('name') || column.includes('title') 
                                  ? '#90caf9' 
                                  : 'rgba(255, 255, 255, 0.8)',
                                fontWeight: column.includes('name') || column.includes('title') ? 500 : 400
                              }}
                            >
                              {cellComponent}
                            </TableCell>
                          );
                        })}
                  </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        
        {sortedResults.length > 10 && (
          <Box sx={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {`Toplam ${results.length} satırdan ${sortedResults.length} satır gösteriliyor ${searchQuery ? `(Filtre: "${searchQuery}")` : ''}`}
            </Typography>
            
            <Button
              size="small"
              startIcon={<Download />}
              onClick={downloadCSV}
              sx={{ 
                textTransform: 'none',
                color: '#90caf9',
                '&:hover': {
                  bgcolor: 'rgba(66, 165, 245, 0.1)'
                }
              }}
            >
              Tümünü İndir
            </Button>
          </Box>
        )}
      </Card>
    );
  };

  // Parametre sayfasını renderla
  const renderParameterForm = () => {
    if (!parameters || Object.keys(parameters).length === 0) {
    return (
        <Alert 
          severity="info" 
          variant="filled"
          icon={<InfoOutlined />}
          sx={{ 
            mb: 3,
            background: 'linear-gradient(145deg, rgba(66, 165, 245, 0.2) 0%, rgba(25, 118, 210, 0.15) 100%)',
            color: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            border: '1px solid rgba(66, 165, 245, 0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            animation: 'fadeIn 0.5s ease-in-out',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'translateY(-10px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' }
            }
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          Bu rapor için parametre tanımlanmamış
          </Typography>
        </Alert>
    );
  }

  return (
      <Card 
        elevation={0}
        sx={{ 
          p: 0, 
          mb: 3, 
          borderRadius: 3,
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(17, 25, 40, 0.8) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 40px -12px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          animation: 'slideIn 0.5s ease-out',
          '@keyframes slideIn': {
            '0%': { opacity: 0, transform: 'translateY(10px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          },
          '&:hover': {
            boxShadow: '0 15px 50px -12px rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
          background: 'linear-gradient(90deg, rgba(66, 165, 245, 0.15) 0%, rgba(25, 118, 210, 0.05) 100%)',
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              fontWeight: 600,
              color: '#90caf9'
            }}
          >
            <FilterAlt sx={{ mr: 1.5, color: '#90caf9' }} />
          Rapor Parametreleri
        </Typography>
        
          <Tooltip title="Parametreler Hakkında">
            <IconButton 
              size="small" 
              color="primary"
              sx={{ 
                bgcolor: 'rgba(66, 165, 245, 0.1)', 
                '&:hover': { 
                  bgcolor: 'rgba(66, 165, 245, 0.2)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.3s'
              }}
            >
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
            {Object.entries(parameters).map(([key, defaultValue], index) => (
              <Grid 
                item 
                xs={12} 
                sm={6} 
                md={4} 
                key={key}
                sx={{
                  animation: `fadeSlideIn 0.5s ease-out forwards ${index * 0.1}s`,
                  opacity: 0,
                  '@keyframes fadeSlideIn': {
                    '0%': { opacity: 0, transform: 'translateY(20px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' }
                  }
                }}
              >
                <Box 
                  sx={{ 
                    mb: 2, 
                    position: 'relative',
                    '&:hover .param-helper': {
                      opacity: 1,
                      visibility: 'visible'
                    }
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      mb: 1, 
                      fontWeight: 500, 
                      color: 'rgba(255, 255, 255, 0.8)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    {key.includes('DATE') && <Today fontSize="small" sx={{ ml: 1, color: '#90caf9', opacity: 0.7 }} />}
                    {key.includes('ID') && <DataUsage fontSize="small" sx={{ ml: 1, color: '#90caf9', opacity: 0.7 }} />}
                  </Typography>
                  
                <TextField
                  id={`param-${key}`}
                  value={paramValues[key] || ''}
                  onChange={(e) => handleParameterChange(key, e.target.value)}
              variant="outlined"
                    placeholder={key.includes('DATE') ? 'YYYY-MM-DD' : 'Değer girin'}
                  fullWidth
                    type={key.includes('DATE') ? 'date' : 'text'}
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        bgcolor: 'rgba(30, 41, 59, 0.4)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.3s',
                        color: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': {
                          border: '1px solid rgba(66, 165, 245, 0.5)',
                          boxShadow: '0 0 15px rgba(66, 165, 245, 0.2)'
                        },
                        '&.Mui-focused': {
                          border: '1px solid rgba(66, 165, 245, 0.8)',
                          boxShadow: '0 0 15px rgba(66, 165, 245, 0.3)'
                        }
                      }
                    }}
                  />
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      mt: 0.5, 
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontStyle: 'italic'
                    }}
                  >
                  {`Varsayılan: ${defaultValue || 'Yok'}`}
                  </Typography>
                  
                  <Tooltip 
                    title={
                      <>
                        <Typography variant="subtitle2">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </Typography>
                        <Typography variant="body2">
                          {key.includes('DATE') 
                            ? 'Tarih formatında değer girin (YYYY-MM-DD)' 
                            : key.includes('ID') 
                              ? 'Sayısal bir ID değeri girin'
                              : 'Bu parametre için değer girin'}
                        </Typography>
                      </>
                    }
                    placement="top"
                    arrow
                  >
                    <Box 
                      className="param-helper"
                      sx={{ 
                        position: 'absolute', 
                        right: -8, 
                        top: -8,
                        bgcolor: 'rgba(66, 165, 245, 0.2)',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'help',
                        opacity: 0,
                        visibility: 'hidden',
                        transition: 'all 0.3s',
                        zIndex: 1
                      }}
                    >
                      <InfoOutlined sx={{ fontSize: 14, color: '#90caf9' }} />
                    </Box>
                  </Tooltip>
                </Box>
            </Grid>
          ))}
        </Grid>
        
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            mt: 3,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -20,
              left: 0,
              right: 0,
              height: 1,
              background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)'
            }
          }}>
          <Button 
            variant="outlined"
            onClick={() => setParamValues(parameters)}
            startIcon={<Refresh />}
              sx={{ 
                mr: 2,
                borderRadius: 2,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.8)',
                px: 3,
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  bgcolor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
          >
            Varsayılanlara Dön
          </Button>
          
          <Button
            variant="contained"
            onClick={runReport}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
            disabled={loading}
            sx={{ 
                px: 4,
                py: 1.2,
                borderRadius: 2,
                background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)',
                color: '#fff',
                fontWeight: 600,
                transition: 'all 0.3s',
                textTransform: 'none',
              '&:hover': {
                  boxShadow: '0 8px 25px rgba(79, 172, 254, 0.6)',
                  transform: 'translateY(-2px)'
                },
                '&:active': {
                  boxShadow: '0 2px 10px rgba(79, 172, 254, 0.4)',
                  transform: 'translateY(1px)'
              },
              '&.Mui-disabled': {
                  background: 'linear-gradient(90deg, rgba(79, 172, 254, 0.3) 0%, rgba(0, 242, 254, 0.3) 100%)',
                  color: 'rgba(255, 255, 255, 0.6)'
              }
            }}
          >
              {loading ? 'Çalıştırılıyor...' : 'Raporu Çalıştır'}
          </Button>
          </Box>
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
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(17, 25, 40, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 600,
                background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'fadeIn 0.5s ease-in-out',
                '@keyframes fadeIn': {
                  '0%': { opacity: 0, transform: 'translateY(-10px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' }
                }
              }}
            >
              {reportDetails.display_name || selectedReport.report_name}
            </Typography>
            
            <Box sx={{ display: 'flex' }}>
              <Tooltip title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}>
              <IconButton 
                color={isFavorite ? 'warning' : 'default'} 
                onClick={toggleFavorite}
                sx={{ 
                  mr: 1,
                    transition: 'all 0.3s',
                    animation: isFavorite ? 'pulse 1.5s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.2)' },
                      '100%': { transform: 'scale(1)' }
                    },
                  '&:hover': {
                      transform: 'scale(1.2) rotate(10deg)',
                    color: theme.palette.warning.main
                  }
                }}
              >
                {isFavorite ? <Star /> : <StarBorder />}
              </IconButton>
              </Tooltip>
              
              <Tooltip title="SQL Kodunu Görüntüle">
              <IconButton 
                color="primary" 
                onClick={() => setShowSqlDialog(true)}
                sx={{ 
                    transition: 'all 0.3s',
                  '&:hover': {
                      transform: 'scale(1.2) rotate(-10deg)',
                      color: theme.palette.primary.main,
                      background: 'rgba(66, 165, 245, 0.1)',
                  }
                }}
              >
                <Code />
              </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 2, opacity: 0.6, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 300,
              lineHeight: 1.6,
              mb: 2
            }}
          >
            {reportDetails.description || 'Bu rapor için açıklama bulunmuyor.'}
                </Typography>
          
          <Box 
            sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1, 
              mt: 2,
              animation: 'slideUp 0.6s ease-out',
              '@keyframes slideUp': {
                '0%': { opacity: 0, transform: 'translateY(10px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          >
            <Chip 
              label={`Kategori: ${reportDetails.category || 'Genel'}`} 
              variant="outlined" 
              size="small"
              sx={{ 
                bgcolor: 'rgba(66, 165, 245, 0.15)',
                borderColor: 'rgba(66, 165, 245, 0.5)',
                color: '#90caf9',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s',
                '&:hover': {
                  bgcolor: 'rgba(66, 165, 245, 0.25)',
                  transform: 'scale(1.05)'
                }
              }}
            />
            
            {reportDetails.tags && reportDetails.tags.map((tag, index) => (
              <Chip 
                key={index} 
                label={tag} 
                size="small"
                sx={{ 
                  bgcolor: `rgba(${66 + index * 30}, ${165 - index * 20}, ${245 - index * 30}, 0.15)`,
                  borderColor: `rgba(${66 + index * 30}, ${165 - index * 20}, ${245 - index * 30}, 0.5)`,
                  color: '#90caf9',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    bgcolor: `rgba(${66 + index * 30}, ${165 - index * 20}, ${245 - index * 30}, 0.25)`,
                    transform: 'scale(1.05)'
                  }
                }}
              />
            ))}
            
            <Chip 
              icon={<InfoOutlined sx={{ fontSize: 16 }} />}
              label={`Son Güncellenme: ${new Date().toLocaleDateString('tr-TR')}`} 
              size="small"
              sx={{ 
                ml: 'auto',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Ana içerik alanını renderla
  const renderMainContent = () => {
    // Yükleme durumu
    if (loading && !results) {
      return (
        <Card
          elevation={0} 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            py: 6,
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(17, 25, 40, 0.8) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            animation: 'pulse 2s infinite ease-in-out',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)' },
              '50%': { boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)' },
              '100%': { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)' }
            }
          }}
        >
          <Box sx={{ position: 'relative', mb: 3 }}>
            <CircularProgress 
              size={60}
              thickness={4} 
              sx={{ 
                color: '#4facfe',
                animation: 'spin 1.5s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} 
            />
            <Box 
              sx={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30
              }}
            >
              <InsertChart 
                sx={{ 
                  fontSize: 22, 
                  color: '#4facfe', 
                  animation: 'fadeInOut 1.5s ease infinite',
                  '@keyframes fadeInOut': {
                    '0%': { opacity: 0.4 },
                    '50%': { opacity: 1 },
                    '100%': { opacity: 0.4 }
                  }
                }} 
              />
        </Box>
          </Box>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 500,
              textAlign: 'center',
              animation: 'fadeInOut 1.5s ease infinite',
              '@keyframes fadeInOut': {
                '0%': { opacity: 0.6 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.6 }
              }
            }}
          >
            Rapor Yükleniyor
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              mt: 1,
              maxWidth: 400
            }}
          >
            Verilerin hazırlanması ve analizi birkaç saniye sürebilir...
          </Typography>
        </Card>
      );
    }
    
    // Hata durumu
    if (error && !results) {
      return (
        <Card
          elevation={0}
          sx={{ 
            overflow: 'hidden',
            borderRadius: 3,
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(17, 25, 40, 0.8) 100%)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(244, 67, 54, 0.2)',
            animation: 'shake 0.5s ease-in-out',
            '@keyframes shake': {
              '0%, 100%': { transform: 'translateX(0)' },
              '20%, 60%': { transform: 'translateX(-5px)' },
              '40%, 80%': { transform: 'translateX(5px)' }
            }
          }}
        >
          <Box sx={{ 
            p: 3,
            borderBottom: '1px solid rgba(244, 67, 54, 0.2)',
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(90deg, rgba(244, 67, 54, 0.1) 0%, rgba(17, 25, 40, 0.8) 100%)',
          }}>
            <Box 
              sx={{ 
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(244, 67, 54, 0.2)',
                color: 'rgba(244, 67, 54, 0.9)',
                mr: 2,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.4)' },
                  '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)' },
                  '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)' }
                }
              }}
            >
              <Close />
            </Box>
            
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'rgba(244, 67, 54, 0.9)' }}>
                Rapor Yüklenirken Hata Oluştu
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5 }}>
                Aşağıdaki hatayı inceleyip tekrar deneyebilirsiniz
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ p: 3 }}>
            <Box sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(244, 67, 54, 0.2)',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.8)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              mb: 3
            }}>
          {error}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                startIcon={<Refresh />} 
                onClick={runReport}
                sx={{ 
                  borderRadius: 2,
                  borderColor: 'rgba(66, 165, 245, 0.5)',
                  color: '#90caf9',
                  '&:hover': {
                    borderColor: '#90caf9',
                    bgcolor: 'rgba(66, 165, 245, 0.1)'
                  }
                }}
              >
                Tekrar Dene
              </Button>
            </Box>
          </Box>
        </Card>
      );
    }
    
    // Henüz rapor sonucu yoksa
    if (!results) {
      return (
        <Card 
          elevation={0}
          sx={{ 
            textAlign: 'center',
            py: 6,
            px: 3,
            borderRadius: 3,
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(17, 25, 40, 0.8) 100%)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            animation: 'fadeIn 0.5s ease-in-out',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'translateY(10px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' }
            }
          }}
        >
          <Box 
            sx={{ 
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(66, 165, 245, 0.1)',
              color: '#90caf9',
            mb: 3, 
              mx: 'auto',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '2px solid rgba(66, 165, 245, 0.3)',
                animation: 'ripple 2s infinite ease-in-out',
                '@keyframes ripple': {
                  '0%': { transform: 'scale(0.8)', opacity: 1 },
                  '100%': { transform: 'scale(1.5)', opacity: 0 }
                }
              }
            }}
          >
            <FilterAlt sx={{ fontSize: 40 }} />
          </Box>
          
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 2, 
              background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 600
            }}
          >
            Rapor Parametrelerini Ayarlayın
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              mb: 4,
              maxWidth: 600,
              mx: 'auto' 
            }}
          >
            Rapor sonuçlarını görmek için yukarıdaki parametre formunu doldurun ve "Raporu Çalıştır" butonuna tıklayın.
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            gap: 3, 
            mb: 2,
            maxWidth: 600,
            mx: 'auto'
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(66, 165, 245, 0.1)',
              width: 170,
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: 'rgba(66, 165, 245, 0.15)',
                transform: 'translateY(-3px)'
              }
            }}>
              <TableChart sx={{ mb: 1, color: '#90caf9', fontSize: 28 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#90caf9' }}>
                Tablo Görünümü
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Detaylı veri analizi
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(66, 165, 245, 0.1)',
              width: 170,
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: 'rgba(66, 165, 245, 0.15)',
                transform: 'translateY(-3px)'
              }
            }}>
              <BarChart sx={{ mb: 1, color: '#90caf9', fontSize: 28 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#90caf9' }}>
                Grafik Görünümü
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Görsel veri sunumu
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(66, 165, 245, 0.1)',
              width: 170,
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: 'rgba(66, 165, 245, 0.15)',
                transform: 'translateY(-3px)'
              }
            }}>
              <PlayCircleOutline sx={{ mb: 1, color: '#90caf9', fontSize: 28 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#90caf9' }}>
                Canlı Güncelleme
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Gerçek zamanlı veri
              </Typography>
            </Box>
          </Box>
        </Card>
      );
    }
    
    // Sonuçlar mevcut
    return (
      <Box 
        sx={{ 
          animation: 'fadeIn 0.5s ease-in-out',
          '@keyframes fadeIn': {
            '0%': { opacity: 0, transform: 'translateY(10px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          }
        }}
      >
            {results && (
          <Box sx={{ mb: 3 }}>
            <Card
              elevation={0}
              sx={{
                mb: 2,
                borderRadius: 3,
                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(17, 25, 40, 0.8) 100%)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s',
                overflow: 'hidden',
                '&:hover': {
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.3)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <Box sx={{ 
                p: 2, 
                display: 'flex',
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      display: 'flex', 
                alignItems: 'center',
                      color: '#90caf9',
                      fontWeight: 600
                    }}
                  >
                    <InsertChart sx={{ mr: 1.5, color: '#4facfe' }} />
                  Rapor Sonuçları 
                          <Chip 
                    label={`${results.length} satır`} 
                            size="small"
                      sx={{ 
                        ml: 2, 
                        bgcolor: 'rgba(66, 165, 245, 0.15)',
                        color: '#90caf9',
                        border: '1px solid rgba(66, 165, 245, 0.3)',
                        height: 20,
                        fontSize: 12
                      }}
                    />
                  </Typography>
                  
                  {realTimeEnabled && (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mt: 0.5,
                        color: 'rgba(255, 255, 255, 0.6)'
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: '#4caf50',
                          mr: 1,
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%': { opacity: 0.6, transform: 'scale(0.8)' },
                            '50%': { opacity: 1, transform: 'scale(1.2)' },
                            '100%': { opacity: 0.6, transform: 'scale(0.8)' }
                          }
                        }} 
                      />
                      <Typography variant="caption">
                        Canlı mod aktif - 30 saniyede bir güncelleniyor
                </Typography>
                    </Box>
                  )}
              </Box>
              
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant={realTimeEnabled ? "contained" : "outlined"}
                    size="small"
                  onClick={toggleRealTimeUpdates}
                    sx={{ 
                      borderRadius: 2,
                      px: 2,
                      background: realTimeEnabled ? 'linear-gradient(90deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.3) 100%)' : 'transparent',
                      borderColor: realTimeEnabled ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 255, 255, 0.2)',
                      color: realTimeEnabled ? '#81c784' : 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        background: realTimeEnabled ? 'linear-gradient(90deg, rgba(76, 175, 80, 0.3) 0%, rgba(76, 175, 80, 0.4) 100%)' : 'rgba(255, 255, 255, 0.05)',
                        borderColor: realTimeEnabled ? 'rgba(76, 175, 80, 0.6)' : 'rgba(255, 255, 255, 0.3)',
                      }
                    }}
                  >
                    {realTimeEnabled ? "Canlı" : "Canlı İzle"}
                  </Button>
                  
                  <Box 
                  sx={{ 
                      display: 'flex',
                      p: 0.5,
                    borderRadius: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <Button
                      variant={viewMode === 'table' ? "contained" : "text"}
                      onClick={() => setViewMode('table')}
                      sx={{ 
                        minWidth: 'auto',
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: viewMode === 'table' ? 'rgba(66, 165, 245, 0.2)' : 'transparent',
                        color: viewMode === 'table' ? '#90caf9' : 'rgba(255, 255, 255, 0.6)',
                        '&:hover': {
                          bgcolor: viewMode === 'table' ? 'rgba(66, 165, 245, 0.3)' : 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    >
                      <TableChart fontSize="small" />
                    </Button>
                    
                    <Button
                      variant={viewMode === 'chart' ? "contained" : "text"}
                      onClick={() => setViewMode('chart')}
                    disabled={!chartData}
                      sx={{ 
                        minWidth: 'auto',
                        p: 1,
                        borderRadius: 1.5,
                        ml: 0.5,
                        bgcolor: viewMode === 'chart' ? 'rgba(66, 165, 245, 0.2)' : 'transparent',
                        color: viewMode === 'chart' ? '#90caf9' : 'rgba(255, 255, 255, 0.6)',
                        '&:hover': {
                          bgcolor: viewMode === 'chart' ? 'rgba(66, 165, 245, 0.3)' : 'rgba(255, 255, 255, 0.1)'
                        },
                        '&.Mui-disabled': {
                          color: 'rgba(255, 255, 255, 0.2)'
                        }
                      }}
                    >
                      <BarChart fontSize="small" />
                    </Button>
                        </Box>
                      </Box>
              </Box>
            </Card>
            
            {/* Tablo veya Grafik Görünümü */}
            {viewMode === 'table' ? renderTableView() : renderChartView()}
                      </Box>
        )}
      </Box>
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