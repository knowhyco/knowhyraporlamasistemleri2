import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Paper, Button, TextField, Divider, 
  CircularProgress, Alert, IconButton, Chip, Grid,
  Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Tooltip, Stack, Snackbar
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { 
  ExpandMore, PlayArrow, Save, Code, BarChart,
  Close, Settings, InfoOutlined,
  TableChart, PieChart, Download, Refresh, Share, Fullscreen,
  FilterAlt, Timeline, InsertChart, PlayCircleOutline
} from '@mui/icons-material';
import { Line, Bar, Pie } from 'react-chartjs-2';
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
  const [reportDetails, setReportDetails] = useState(null);
  const [parameters, setParameters] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [chartOptions, setChartOptions] = useState(null);
  const [chartType, setChartType] = useState('bar'); // bar, line, pie
  const [showSqlDialog, setShowSqlDialog] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [paramValues, setParamValues] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [realTimeInterval, setRealTimeInterval] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const chartRefs = {
    bar: useRef(null),
    pie: useRef(null)
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
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/reports/details/${selectedReport.report_name}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setReportDetails(response.data);
        setParameters(response.data.parameters || {});
        
        // Rapor tipini tahmin et
        let type = 'bar';
        if (selectedReport.report_name.includes('Dagilim')) {
          type = 'pie';
        } else if (selectedReport.report_name.includes('Trend') || 
                  selectedReport.report_name.includes('Analiz')) {
          type = 'line';
        }
        setChartType(type);
        
      } catch (err) {
        console.error('Rapor detayları alınamadı:', err);
        setError('Rapor detayları yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [selectedReport]);

  // Parametre değişikliğini işle
  const handleParameterChange = (paramKey, value) => {
    setParameters({
      ...parameters,
      [paramKey]: value
    });
  };

  // Raporu çalıştır
  const runReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/reports/run`,
        {
          report_name: selectedReport.report_name,
          parameters: paramValues
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResults(response.data.results);
      
      // Grafik verilerini hazırla
      prepareChartData(response.data.results);
      
    } catch (err) {
      console.error('Rapor çalıştırma hatası:', err);
      setError('Rapor çalıştırılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Raporu kaydet
  const registerReport = async () => {
    if (!selectedReport) return;
    
    try {
      setLoading(true);
      
      await onRegisterReport(selectedReport.report_name, reportDetails.display_name, reportDetails.description);
      
    } catch (err) {
      setError('Rapor kaydedilirken bir hata oluştu.');
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
      k.toLowerCase().includes('category')
    ) || keys[0];
    
    // Y ekseni için kullanılacak anahtarlar (sayısal değerler)
    const yAxisKeys = keys.filter(k => 
      k !== xAxisKey && 
      typeof results[0][k] === 'number'
    );
    
    // Veri setlerini oluştur
    const datasets = yAxisKeys.map((key, index) => {
      const colors = [
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(153, 102, 255, 0.6)'
      ];
      
      return {
        label: key,
        data: results.map(item => item[key]),
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace('0.6', '1'),
        borderWidth: 1
      };
    });
    
    // Grafik verisi
    const chartData = {
      labels: results.map(item => item[xAxisKey]),
      datasets
    };
    
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
          text: reportDetails.display_name
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: chartType !== 'pie' ? {
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
    
    setChartData(chartData);
    setChartOptions(chartOpts);
  };

  // Görüntüleme modunu değiştir
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };
  
  // CSV, PDF ve Excel indirme fonksiyonları
  const downloadCSV = () => {
    if (!results.length) return;

    try {
      // Header'ları al
      const headers = Object.keys(results[0]);
      
      // CSV içeriği oluştur
      let csvContent = headers.join(',') + '\n';
      
      results.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // Değer içinde virgül varsa çift tırnak içine al
          return value === null ? '' : 
                 (typeof value === 'string' && value.includes(',')) ? 
                 `"${value}"` : String(value);
        });
        csvContent += values.join(',') + '\n';
      });
      
      // Dosya oluştur ve indir
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedReport.report_name}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnackbar({
        open: true,
        message: 'CSV dosyası indirildi',
        severity: 'success'
      });
    } catch (error) {
      console.error('CSV indirme hatası:', error);
      setSnackbar({
        open: true,
        message: 'CSV dosyası indirilirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const downloadExcel = () => {
    if (!results.length) return;
    
    try {
      import('xlsx').then(XLSX => {
        // Worksheet oluştur
        const worksheet = XLSX.utils.json_to_sheet(results);
        
        // Workbook oluştur ve worksheet'i ekle
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapor');
        
        // Excel dosyası olarak indir
        XLSX.writeFile(workbook, `${selectedReport.report_name}_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        setSnackbar({
          open: true,
          message: 'Excel dosyası indirildi',
          severity: 'success'
        });
      });
    } catch (error) {
      console.error('Excel indirme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Excel dosyası indirilirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const downloadPDF = () => {
    if (!results.length) return;
    
    try {
      import('jspdf').then(jsPDF => {
        import('jspdf-autotable').then(() => {
          const { jsPDF } = require('jspdf');
          const doc = new jsPDF();
          
          // Rapor başlığı
          doc.setFontSize(18);
          doc.text(selectedReport.display_name || selectedReport.report_name, 14, 22);
          
          // Rapor açıklaması
          if (selectedReport.description) {
            doc.setFontSize(11);
            doc.text(selectedReport.description, 14, 30);
          }
          
          // Tarih
          doc.setFontSize(10);
          doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}`, 14, 40);
          
          // Tablo
          doc.autoTable({
            startY: 45,
            head: [Object.keys(results[0])],
            body: results.map(row => Object.values(row)),
            theme: 'striped',
            headStyles: { fillColor: [66, 139, 202] }
          });
          
          // İndir
          doc.save(`${selectedReport.report_name}_${new Date().toISOString().split('T')[0]}.pdf`);
          
          setSnackbar({
            open: true,
            message: 'PDF dosyası indirildi',
            severity: 'success'
          });
        });
      });
    } catch (error) {
      console.error('PDF indirme hatası:', error);
      setSnackbar({
        open: true,
        message: 'PDF dosyası indirilirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  // Grafik olarak indir
  const downloadChart = (chartType) => {
    const ref = chartRefs[chartType]?.current;
    if (!ref) return;
    
    toPng(ref)
      .then(dataUrl => {
        const link = document.createElement('a');
        link.download = `${reportDetails.display_name.replace(/\s+/g, '_').toLowerCase()}_${chartType}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch(err => {
        console.error('Grafik indirme hatası:', err);
      });
  };

  // Gerçek zamanlı güncelleme
  useEffect(() => {
    if (realTimeEnabled) {
      // 30 saniyede bir raporu çalıştır
      const interval = setInterval(() => {
        runReport();
      }, 30000);
      
      setRealTimeInterval(interval);
      
      // Temizleme fonksiyonu
      return () => clearInterval(interval);
    } else if (realTimeInterval) {
      clearInterval(realTimeInterval);
      setRealTimeInterval(null);
    }
  }, [realTimeEnabled]);

  // Tab değişimi
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Grafik tipini değiştir
  const handleChartTypeChange = (type) => {
    setChartType(type);
  };

  // Grafik tipine göre bileşeni seç
  const renderChart = () => {
    if (!chartData) return <Typography>Grafik için veri bulunamadı</Typography>;
    
    switch (chartType) {
      case 'bar':
        return <Bar data={chartData} options={chartOptions} ref={chartRefs[chartType]} />;
      case 'line':
        return <Line data={chartData} options={chartOptions} ref={chartRefs[chartType]} />;
      case 'pie':
        return <Pie data={chartData} options={chartOptions} ref={chartRefs[chartType]} />;
      default:
        return <Bar data={chartData} options={chartOptions} ref={chartRefs[chartType]} />;
    }
  };

  if (!selectedReport) {
    return (
      <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <InfoOutlined sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Lütfen sol panelden bir rapor seçin
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0 }}>
      <Box sx={{ p: 2, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {reportDetails?.display_name || selectedReport.display_name}
        </Typography>
        <Box>
          {!selectedReport.is_registered && (
            <Button 
              startIcon={<Save />} 
              onClick={registerReport} 
              disabled={loading}
              color="secondary"
              variant="outlined"
              size="small"
              sx={{ mr: 1 }}
            >
              Kaydet
            </Button>
          )}
          <Button 
            startIcon={<Code />} 
            onClick={() => setShowSqlDialog(true)}
            color="info"
            variant="outlined"
            size="small"
          >
            SQL
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
      )}
      
      <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {/* Rapor Açıklaması */}
            {reportDetails?.description && (
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  {reportDetails.description}
                </Typography>
                <Divider />
              </Grid>
            )}
            
            {/* Parametreler */}
            {Object.keys(parameters).length > 0 && (
              <Grid item xs={12}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Settings sx={{ mr: 1, fontSize: 20 }} />
                      Rapor Parametreleri
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {Object.entries(parameters).map(([key, value]) => (
                        <Grid item xs={12} sm={6} md={4} key={key}>
                          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
                            <DatePicker
                              label={key.replace('_', ' ').toLowerCase()}
                              value={value ? new Date(value) : null}
                              onChange={(newValue) => {
                                setParamValues({
                                  ...paramValues,
                                  [key]: newValue ? format(newValue, 'yyyy-MM-dd') : null
                                });
                              }}
                              renderInput={(params) => <TextField {...params} fullWidth variant="outlined" size="small" />}
                            />
                          </LocalizationProvider>
                        </Grid>
                      ))}
                      <Grid item xs={12}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          startIcon={<PlayArrow />}
                          onClick={runReport}
                          disabled={loading}
                          sx={{ mt: 1 }}
                        >
                          Raporu Çalıştır
                        </Button>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            )}
            
            {/* Sonuçlar */}
            {results && (
              <>
                {/* Grafik */}
                {chartData && (
                  <Grid item xs={12}>
                    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                          <BarChart sx={{ mr: 1, fontSize: 20 }} />
                          Grafik Görünümü
                        </Typography>
                        <Box>
                          <Chip 
                            label="Çubuk" 
                            variant={chartType === 'bar' ? 'filled' : 'outlined'} 
                            color="primary"
                            onClick={() => setChartType('bar')}
                            size="small"
                            sx={{ mr: 0.5 }}
                          />
                          <Chip 
                            label="Çizgi" 
                            variant={chartType === 'line' ? 'filled' : 'outlined'} 
                            color="primary"
                            onClick={() => setChartType('line')}
                            size="small"
                            sx={{ mr: 0.5 }}
                          />
                          <Chip 
                            label="Pasta" 
                            variant={chartType === 'pie' ? 'filled' : 'outlined'} 
                            color="primary"
                            onClick={() => setChartType('pie')}
                            size="small"
                          />
                        </Box>
                      </Box>
                      <Box sx={{ height: 300 }}>
                        {renderChart()}
                      </Box>
                    </Paper>
                  </Grid>
                )}
                
                {/* Tablo */}
                <Grid item xs={12}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Tablo Görünümü ({results.length} sonuç)
                    </Typography>
                    <TableContainer sx={{ maxHeight: 400 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            {results.length > 0 && Object.keys(results[0]).map((key) => (
                              <TableCell key={key}>{key}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {results.map((row, index) => (
                            <TableRow key={index} hover>
                              {Object.values(row).map((value, idx) => (
                                <TableCell key={idx}>{value !== null ? value.toString() : ''}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              </>
            )}
          </Grid>
        )}
      </Box>
      
      {/* SQL Sorgusu Dialog */}
      <Dialog 
        open={showSqlDialog} 
        onClose={() => setShowSqlDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          SQL Sorgusu
          <IconButton onClick={() => setShowSqlDialog(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <pre style={{ overflow: 'auto', maxHeight: 400, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {reportDetails?.sql_query || 'SQL sorgusu bulunamadı.'}
            </pre>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSqlDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
      
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
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Paper>
  );
};

export default ReportViewer; 