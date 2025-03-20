import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, CardActionArea, Typography, Grid, 
  TextField, InputAdornment, Chip, CircularProgress,
  Alert, Divider, IconButton, Tooltip
} from '@mui/material';
import { 
  Search, BarChart, TableChart, Timeline, Description,
  Favorite, FavoriteBorder, Category
} from '@mui/icons-material';
import axios from 'axios';

const ReportSelector = ({ onSelectReport }) => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Token alımı
  const token = localStorage.getItem('token');
  
  // Rapor listesini yükle
  useEffect(() => {
    fetchReports();
    // Favorileri localStorage'dan yükle
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);
  
  // Raporları getir
  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/reports/list`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        setReports(response.data.reports || []);
        setFilteredReports(response.data.reports || []);
        
        // Kategorileri çıkar
        const cats = ['all'];
        response.data.reports.forEach(report => {
          if (report.category && !cats.includes(report.category)) {
            cats.push(report.category);
          }
        });
        setCategories(cats);
      } else {
        setError(response.data.message || 'Rapor listesi alınamadı');
      }
    } catch (err) {
      console.error('Rapor listesi getirme hatası:', err);
      
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Rapor listesi alınamadı');
      } else {
        setError('Sunucuya bağlanırken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Arama ve filtreleme işlemi
  useEffect(() => {
    if (reports.length > 0) {
      let filtered = [...reports];
      
      // Metin araması
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(report => 
          report.display_name.toLowerCase().includes(term) || 
          report.description?.toLowerCase().includes(term)
        );
      }
      
      // Kategori filtresi
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(report => 
          report.category === selectedCategory
        );
      }
      
      setFilteredReports(filtered);
    }
  }, [searchTerm, reports, selectedCategory]);
  
  // Favori raporları işle
  const toggleFavorite = (reportName) => {
    let newFavorites;
    
    if (favorites.includes(reportName)) {
      newFavorites = favorites.filter(name => name !== reportName);
    } else {
      newFavorites = [...favorites, reportName];
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };
  
  // Rapor seçimi
  const handleSelectReport = (report) => {
    if (onSelectReport) {
      onSelectReport(report);
    }
  };
  
  // Rapor kategorisine göre ikon seç
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'zaman bazlı analizler':
        return <Timeline />;
      case 'içerik analizleri':
        return <Description />;
      case 'performans metrikleri':
        return <BarChart />;
      case 'detaylı görünümler':
        return <TableChart />;
      default:
        return <TableChart />;
    }
  };
  
  return (
    <Box>
      {/* Arama ve filtre */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rapor ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
          variant="outlined"
        />
      </Box>
      
      {/* Kategori butonları */}
      {categories.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {categories.map((category) => (
            <Chip
              key={category}
              label={category === 'all' ? 'Tüm Kategoriler' : category}
              color={selectedCategory === category ? 'primary' : 'default'}
              onClick={() => setSelectedCategory(category)}
              icon={category === 'all' ? <Category /> : getCategoryIcon(category)}
              variant={selectedCategory === category ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      )}
      
      {/* Hata mesajı */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Yükleniyor */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Rapor bulunamadı */}
      {!loading && filteredReports.length === 0 && (
        <Alert severity="info">
          Arama kriterlerinize uygun rapor bulunamadı.
        </Alert>
      )}
      
      {/* Rapor listesi */}
      <Grid container spacing={2}>
        {filteredReports.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.report_name}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardActionArea onClick={() => handleSelectReport(report)} sx={{ height: '100%' }}>
                <CardContent sx={{ position: 'relative', height: '100%' }}>
                  {/* Favori butonu */}
                  <IconButton 
                    size="small" 
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(report.report_name);
                    }}
                  >
                    <Tooltip title="Favorilere ekle/çıkar">
                      {favorites.includes(report.report_name) ? 
                        <Favorite color="error" /> : 
                        <FavoriteBorder />
                      }
                    </Tooltip>
                  </IconButton>
                  
                  {/* Rapor simgesi ve kategori bilgisi */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getCategoryIcon(report.category)}
                    <Chip 
                      size="small" 
                      label={report.category || 'Genel'} 
                      variant="outlined" 
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  
                  {/* Rapor adı */}
                  <Typography variant="h6" gutterBottom>
                    {report.display_name || report.report_name}
                  </Typography>
                  
                  {/* Rapor açıklaması */}
                  {report.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {report.description.length > 100
                        ? `${report.description.substr(0, 100)}...`
                        : report.description
                      }
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ReportSelector; 