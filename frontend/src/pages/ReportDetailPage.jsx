import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Container, Paper, Typography, TextField, Button, 
  Grid, MenuItem, FormControl, InputLabel, Select,
  CircularProgress, Alert, Chip, Divider, IconButton,
  Tabs, Tab, Card, CardContent, Tooltip, Skeleton
} from '@mui/material';
import { 
  FilterAlt, PlayArrow, BarChart, PieChart, TableChart,
  ArrowBack, Download, Refresh, Share, Favorite, FavoriteBorder,
  CalendarToday, DateRange, Today
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { toPng } from 'html-to-image';

// Chart.js kayıt
Chart.register(...registerables);

// Tarih seçici bileşeni
const DateSelector = ({ label, value, onChange, fullWidth = false }) => {
  return (
    <TextField
      label={label}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputLabelProps={{ shrink: true }}
      fullWidth={fullWidth}
      sx={{ minWidth: 200 }}
    />
  );
};

// Rapor detay sayfası
const ReportDetailPage = () => {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  
  const chartRefs = {
    bar: useRef(null),
    line: useRef(null),
    pie: useRef(null)
  };
  
  const navigate = useNavigate();
  
  // Rapor bilgilerini getir
  useEffect(() => {
    if (reportId) {
      fetchReportDetails();
      fetchFavorites();
    }
  }, [reportId]);
  
  // Rapor detaylarını getir
  const fetchReportDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // API URL'yi doğru şekilde ayarlayalım
      const apiUrl = process.env.REACT_APP_API_URL || window.location.origin + '/api';
      const token = localStorage.getItem('token');
      
      console.log(`Rapor detayları getiriliyor: ${apiUrl}/reports/${reportId}`);
      
      // Fetch API ile istek yap - credentials ayarını tamamen kaldıralım
      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await fetch(`${apiUrl}/reports/${reportId}`, requestOptions);
      
      const responseData = await response.json();
      
      console.log('Rapor detayları:', responseData);
      
      if (responseData.status === 'success') {
        const reportData = responseData.report;
        setReport(reportData);
        
        // Form değerlerini parametrelere göre başlat
        if (reportData.parameters) {
          const initialValues = {};
          
          reportData.parameters.forEach(param => {
            // Varsayılan değerleri ayarla
            if (param.type === 'date' || param.type === 'datetime') {
              // Bugünün tarihini YYYY-MM-DD formatında al
              const today = new Date().toISOString().split('T')[0];
              
              if (param.name.includes('START')) {
                const lastWeek = new Date();
                lastWeek.setDate(lastWeek.getDate() - 7);
                initialValues[param.name] = lastWeek.toISOString().split('T')[0];
              } else if (param.name.includes('END')) {
                initialValues[param.name] = today;
              } else {
                initialValues[param.name] = today;
              }
            } else if (param.default_value) {
              initialValues[param.name] = param.default_value;
            } else {
              initialValues[param.name] = '';
            }
          });
          
          setFormValues(initialValues);
        }
        
      } else {
        setError(responseData.message || 'Rapor detayları alınamadı');
      }
    } catch (err) {
      console.error('Rapor detayları getirme hatası:', err);
      setError('Rapor detayları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  // Favori raporları getir
  const fetchFavorites = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || window.location.origin + '/api';
      const token = localStorage.getItem('token');
      
      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await fetch(`${apiUrl}/reports/favorites`, requestOptions);
      
      const responseData = await response.json();
      
      if (responseData.status === 'success') {
        setFavorites(responseData.favorites || []);
      }
    } catch (err) {
      console.error('Favori raporlar getirilirken hata:', err);
      setFavorites([]);
    }
  };
  
  // Form değerini güncelle
  const handleFormChange = (name, value) => {
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Raporu çalıştır
  const runReport = async () => {
    try {
      setRunning(true);
      setError(null);
      setSuccess(null);
      setReportData(null);
      
      // Form değerlerinin doğruluğunu kontrol et
      if (report.parameters) {
        for (const param of report.parameters) {
          if (param.required && (!formValues[param.name] || formValues[param.name].trim() === '')) {
            setError(`"${param.label}" alanı zorunludur`);
            setRunning(false);
            return;
          }
        }
      }
      
      // API URL'yi alın - Burada URL'yi doğru şekilde ayarlayalım
      const apiUrl = process.env.REACT_APP_API_URL || window.location.origin + '/api';
      const token = localStorage.getItem('token');
      
      console.log(`Rapor çalıştırılıyor: ${apiUrl}/reports/${reportId}/run`);
      
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ params: formValues })
      };
      
      // Yeni API endpoint'ini kullan - /<report_name>/run
      const response = await fetch(`${apiUrl}/reports/${reportId}/run`, requestOptions);
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setReportData(data.data || []);
        setSuccess('Rapor başarıyla çalıştırıldı');
        
        // Sonuç boş ise kullanıcıya bildir
        if (data.data.length === 0) {
          setSuccess('Rapor çalıştırıldı, ancak sonuç bulunamadı');
        }
      } else {
        setError(data.message || 'Rapor çalıştırılırken bir hata oluştu');
      }
    } catch (err) {
      console.error('Rapor çalıştırma hatası:', err);
      setError('Sunucuya bağlanırken bir hata oluştu');
    } finally {
      setRunning(false);
    }
  };
  
  // Favori ekle/çıkar
  const toggleFavorite = async () => {
    if (!report) return;
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || window.location.origin + '/api';
      const token = localStorage.getItem('token');
      const isFavorite = favorites.includes(reportId);
      
      const endpoint = isFavorite ? 'unfavorite' : 'favorite';
      console.log(`Favori durumu değiştiriliyor: ${apiUrl}/reports/${endpoint}/${reportId}`);
      
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await fetch(`${apiUrl}/reports/${endpoint}/${reportId}`, requestOptions);
      
      const responseData = await response.json();
      
      if (responseData.status === 'success') {
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
  
  // CSV İndir
  const downloadCSV = () => {
    if (!reportData || reportData.length === 0) return;
    
    // Sütun başlıklarını al
    const headers = Object.keys(reportData[0]);
    
    // CSV içeriği oluştur
    let csvContent = headers.join(',') + '\n';
    
    // Veri satırlarını ekle
    reportData.forEach(row => {
      const values = headers.map(header => {
        // Değer virgül içeriyorsa çift tırnak içine al
        const value = String(row[header] !== null ? row[header] : '');
        return value.includes(',') ? `"${value}"` : value;
      });
      csvContent += values.join(',') + '\n';
    });
    
    // Dosyayı indir
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${report.report_name}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Grafik indir
  const downloadChart = (chartType) => {
    const ref = chartRefs[chartType].current;
    if (!ref) return;
    
    toPng(ref)
      .then(dataUrl => {
        const link = document.createElement('a');
        link.download = `${report.report_name}_${chartType}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch(err => {
        console.error('Grafik indirme hatası:', err);
      });
  };
  
  // Grafik verilerini hazırla
  const prepareChartData = () => {
    if (!reportData || reportData.length === 0) return null;
    
    // Veri sütunlarını al
    const keys = Object.keys(reportData[0]);
    
    // Sayısal olmayan ilk sütunu etiket olarak kullan
    const labelKey = keys.find(key => typeof reportData[0][key] === 'string') || keys[0];
    
    // Sayısal değerleri içeren sütunları bul
    const valueKeys = keys.filter(key => 
      typeof reportData[0][key] === 'number' && 
      !['id', 'row_num'].includes(key.toLowerCase())
    );
    
    // Renk paleti oluştur
    const generateColors = (count) => {
      const colors = [];
      for (let i = 0; i < count; i++) {
        const hue = (i * 137) % 360; // Altın oran ile renk dağılımı
        colors.push(`hsl(${hue}, 70%, 60%)`);
      }
      return colors;
    };
    
    // Etiketleri al
    const labels = reportData.map(row => row[labelKey]);
    
    // Veri setlerini oluştur
    const datasets = valueKeys.map((key, index) => {
      const colors = generateColors(valueKeys.length);
      return {
        label: key.replace(/_/g, ' '),
        data: reportData.map(row => row[key]),
        backgroundColor: colors[index],
        borderColor: colors[index],
        borderWidth: 1
      };
    });
    
    return { labels, datasets };
  };
  
  // Grafik seçenekleri
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: report?.display_name || 'Rapor Grafiği'
      }
    }
  };
  
  // Grafik verisi
  const chartData = prepareChartData();
  
  // Sayfa yükleniyor
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // Rapor bulunamadı
  if (!report) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
        <Alert severity="error">
          Rapor bulunamadı veya bu raporu görüntüleme yetkiniz yok.
        </Alert>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/reports')} 
          sx={{ mt: 2 }}
        >
          Raporlar Listesine Dön
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
      {/* Üst Başlık */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/reports')} 
          sx={{ mr: 2 }}
        >
          Geri
        </Button>
        
        <Typography variant="h4" component="h1">
          {report.display_name}
        </Typography>
        
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Tooltip title={favorites.includes(reportId) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}>
            <IconButton onClick={toggleFavorite}>
              {favorites.includes(reportId) ? (
                <Favorite color="error" />
              ) : (
                <FavoriteBorder />
              )}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Paylaş">
            <IconButton>
              <Share />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Açıklama */}
      {report.description && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="body1">
            {report.description}
          </Typography>
        </Paper>
      )}
      
      {/* Hata Mesajı */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Başarı Mesajı */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {/* Filtre Formu */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterAlt sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Rapor Filtreleri
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          {report.parameters?.map((param) => (
            <Grid item xs={12} sm={6} md={4} key={param.name}>
              {param.type === 'date' ? (
                <DateSelector
                  label={param.label}
                  value={formValues[param.name] || ''}
                  onChange={(value) => handleFormChange(param.name, value)}
                  fullWidth
                />
              ) : param.type === 'select' ? (
                <FormControl fullWidth>
                  <InputLabel id={`param-${param.name}-label`}>{param.label}</InputLabel>
                  <Select
                    labelId={`param-${param.name}-label`}
                    value={formValues[param.name] || ''}
                    onChange={(e) => handleFormChange(param.name, e.target.value)}
                    label={param.label}
                  >
                    {param.options?.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  label={param.label}
                  value={formValues[param.name] || ''}
                  onChange={(e) => handleFormChange(param.name, e.target.value)}
                  fullWidth
                  type={param.type === 'number' ? 'number' : 'text'}
                  required={param.required}
                />
              )}
            </Grid>
          ))}
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={running ? <CircularProgress size={20} /> : <PlayArrow />}
                onClick={runReport}
                disabled={running}
              >
                Raporu Çalıştır
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Sonuç Bölümü */}
      {reportData && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Rapor Sonuçları
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  startIcon={<Download />} 
                  onClick={downloadCSV}
                  variant="outlined"
                  size="small"
                  disabled={!reportData || reportData.length === 0}
                >
                  CSV
                </Button>
                
                <Tooltip title="Yenile">
                  <IconButton onClick={runReport} disabled={running}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            <Divider />
            
            {/* Görünüm Sekmeleri */}
            <Tabs 
              value={viewMode} 
              onChange={(e, newValue) => setViewMode(newValue)}
              sx={{ mb: 2, mt: 1 }}
            >
              <Tab icon={<TableChart />} label="Tablo" value="table" />
              <Tab icon={<BarChart />} label="Çubuk Grafik" value="bar" />
              <Tab icon={<PieChart />} label="Pasta Grafik" value="pie" />
            </Tabs>
            
            {/* Sonuç verileri */}
            {reportData.length === 0 ? (
              <Alert severity="info">
                Bu filtrelerle eşleşen sonuç bulunmadı.
              </Alert>
            ) : (
              <>
                {/* Tablo Görünümü */}
                {viewMode === 'table' && (
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {Object.keys(reportData[0]).map((key) => (
                            <th key={key} style={{ 
                              padding: '12px 16px', 
                              textAlign: 'left', 
                              borderBottom: '2px solid #e0e0e0',
                              fontWeight: 600,
                              backgroundColor: '#f5f5f5'
                            }}>
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.map((row, rowIndex) => (
                          <tr key={rowIndex} style={{ 
                            backgroundColor: rowIndex % 2 === 0 ? 'white' : '#fafafa' 
                          }}>
                            {Object.entries(row).map(([key, value], colIndex) => (
                              <td key={colIndex} style={{ 
                                padding: '8px 16px', 
                                borderBottom: '1px solid #e0e0e0'
                              }}>
                                {value !== null ? value : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                )}
                
                {/* Çubuk Grafik */}
                {viewMode === 'bar' && chartData && (
                  <Box sx={{ height: 400, position: 'relative' }}>
                    <Box ref={chartRefs.bar} sx={{ height: '100%' }}>
                      <Bar data={chartData} options={chartOptions} />
                    </Box>
                    <Tooltip title="Grafiği İndir">
                      <IconButton 
                        sx={{ position: 'absolute', top: 0, right: 0 }}
                        onClick={() => downloadChart('bar')}
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
                
                {/* Pasta Grafik */}
                {viewMode === 'pie' && chartData && (
                  <Box sx={{ height: 400, position: 'relative' }}>
                    <Box ref={chartRefs.pie} sx={{ height: '100%' }}>
                      <Pie data={chartData} options={chartOptions} />
                    </Box>
                    <Tooltip title="Grafiği İndir">
                      <IconButton 
                        sx={{ position: 'absolute', top: 0, right: 0 }}
                        onClick={() => downloadChart('pie')}
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default ReportDetailPage; 