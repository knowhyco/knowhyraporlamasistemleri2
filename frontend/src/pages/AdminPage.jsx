import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, Container, Typography, Tabs, Tab, Paper, Button, 
  TextField, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Alert, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Chip, Switch, FormControlLabel, Grid, Divider, Card, CardContent,
  InputLabel, Select, MenuItem, FormControl, InputAdornment,
  Accordion, AccordionSummary, AccordionDetails, Tooltip,
  Snackbar, Alert as MuiAlert,
  LinearProgress, FormHelperText
} from '@mui/material';
import { 
  Add, Edit, Delete, Refresh, PersonAdd, Settings, 
  Storage, Assessment, ViewList, Search, Check, Block,
  Save, Person, Dns, CloudUpload, Code, HelpOutline, ExpandMore, Clear,
  CheckCircleOutline as CheckCircleOutlineIcon
} from '@mui/icons-material';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/apiConfig';

// TabPanel bileşeni tanımlıyoruz
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Kullanıcı Yönetimi Bileşeni
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    username: '',
    password: '',
    email: '',
    role: 'user',
    is_active: true
  });

  // Kullanıcıları getir
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/admin/users');
      
      setUsers(response.data.users || []);
    } catch (err) {
      console.error('Kullanıcı listesi getirme hatası:', err);
      setError('Kullanıcı listesi yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    fetchUsers();
  }, []);

  // Dialog'u aç (yeni kullanıcı veya düzenleme)
  const handleOpenDialog = (user = null) => {
    if (user) {
      // Düzenleme modu
      setCurrentUser(user);
      setFormValues({
        username: user.username,
        password: '', // Şifre sadece güncelleme için boş bırakılabilir
        email: user.email || '',
        role: user.role || 'user',
        is_active: user.is_active !== false // Varsayılan olarak true
      });
    } else {
      // Yeni kullanıcı modu
      setCurrentUser(null);
      setFormValues({
        username: '',
        password: '',
        email: '',
        role: 'user',
        is_active: true
      });
    }
    setOpenDialog(true);
  };

  // Dialog'u kapat
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Form değişikliği
  const handleFormChange = (e) => {
    const { name, value, checked } = e.target;
    setFormValues({
      ...formValues,
      [name]: name === 'is_active' ? checked : value
    });
  };

  // Kullanıcı kaydet
  const handleSaveUser = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      if (currentUser) {
        // Mevcut kullanıcıyı güncelle
        const updateData = { ...formValues };
        
        if (!updateData.password || updateData.password.trim() === '') {
          // Şifre boş ise, güncelleme isteğinden çıkar
          delete updateData.password;
        }
        
        await api.put(
          `/admin/users/${currentUser.id}`,
          updateData
        );
      } else {
        // Yeni kullanıcı oluştur
        await api.post(
          `/admin/users`,
          formValues
        );
      }
      
      // Kullanıcı listesini güncelle
      fetchUsers();
      
      // Dialog'u kapat
      handleCloseDialog();
      
    } catch (err) {
      console.error('Kullanıcı kaydetme hatası:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
      setError('Kullanıcı kaydedilirken bir hata oluştu');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Kullanıcı durumunu değiştir (aktif/pasif)
  const handleToggleUserStatus = async (user) => {
    try {
      setError(null);
      
      await api.put(
        `/admin/users/${user.id}`,
        { is_active: !user.is_active }
      );
      
      // Listeyi yenile
      fetchUsers();
      
    } catch (err) {
      console.error('Kullanıcı durumu değiştirme hatası:', err);
      setError('Kullanıcı durumu değiştirilirken bir hata oluştu');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Kullanıcı Yönetimi
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<PersonAdd />}
          onClick={() => handleOpenDialog()}
        >
          Yeni Kullanıcı
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      
      {loading && users.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Kullanıcı Adı</TableCell>
                <TableCell>E-posta</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Son Giriş</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role === 'admin' ? 'Admin' : 'Kullanıcı'} 
                      color={user.role === 'admin' ? 'secondary' : 'primary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.is_active ? 'Aktif' : 'Pasif'} 
                      color={user.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.last_login ? new Date(user.last_login).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenDialog(user)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color={user.is_active ? 'error' : 'success'}
                      onClick={() => handleToggleUserStatus(user)}
                    >
                      {user.is_active ? <Block /> : <Check />}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Kullanıcı Ekleme/Düzenleme Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {currentUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Ekle'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          <TextField
            autoFocus
            margin="dense"
            name="username"
            label="Kullanıcı Adı"
            type="text"
            fullWidth
            variant="outlined"
            value={formValues.username}
            onChange={handleFormChange}
            disabled={submitting}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="password"
            label={currentUser ? "Şifre (boş bırakılırsa değişmez)" : "Şifre"}
            type="password"
            fullWidth
            variant="outlined"
            value={formValues.password}
            onChange={handleFormChange}
            disabled={submitting}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="email"
            label="E-posta"
            type="email"
            fullWidth
            variant="outlined"
            value={formValues.email}
            onChange={handleFormChange}
            disabled={submitting}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Rol</InputLabel>
            <Select
              name="role"
              value={formValues.role}
              onChange={handleFormChange}
              disabled={submitting}
            >
              <MenuItem value="user">Kullanıcı</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={formValues.is_active}
                    onChange={handleFormChange}
                name="is_active"
                disabled={submitting}
                  />
                }
                label="Aktif"
              />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>İptal</Button>
          <Button onClick={handleSaveUser} color="primary" disabled={submitting}>
            {submitting ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

// Tablo Adı Ayarları Bileşeni
const TableSettings = () => {
  const [tableName, setTableName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Tablo adını getir
  const fetchTableName = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/admin/config/table-name');
      
      if (response.data && response.data.table_name) {
        setTableName(response.data.table_name);
      }
    } catch (err) {
      console.error('Tablo adı getirme hatası:', err);
      setError('Tablo adı yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    fetchTableName();
  }, []);

  // Tablo adını kaydet
  const handleSaveTableName = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await api.put(
        '/admin/config/table-name',
        { table_name: tableName.trim() }
      );
      
      if (response.data && response.data.status === 'success') {
        setSuccess('Tablo adı başarıyla güncellendi');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Tablo adı güncellenirken bir hata oluştu');
      }
    } catch (err) {
      console.error('Tablo adı kaydetme hatası:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
      setError('Tablo adı kaydedilirken bir hata oluştu');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Veritabanı Tablo Ayarları
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Analizlerin yapılacağı veritabanı tablosunun adını girin. Bu tablo Supabase'de bulunmalıdır.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>
      )}
      
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 2 }}>
        <TextField
          label="Tablo Adı"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          placeholder="örnek: customer_denizmuzesi"
          fullWidth
          disabled={loading}
        />
        
        <Button 
          variant="contained" 
          onClick={handleSaveTableName}
          disabled={loading || submitting || !tableName.trim()}
          startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
          sx={{ mt: 1 }}
        >
          {submitting ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </Box>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          Sistem, belirtilen tablodaki verileri sadece <strong>okuma</strong> amaçlı kullanır. 
          Veri yapısının değişmesi durumunda raporlar etkilenebilir.
        </Typography>
      </Alert>
    </Paper>
  );
};

// Rapor Yönetimi Bileşeni
const ReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSqlDialog, setOpenSqlDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dialogTabValue, setDialogTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Rapor için form değerleri
  const [formValues, setFormValues] = useState({
    report_name: '',
    display_name: '',
    description: '',
    category: 'time',
    sql_code: '',
    parameters: []
  });

  const categories = [
    { value: 'time', label: 'Zaman Analizi' },
    { value: 'content', label: 'İçerik Analizi' },
    { value: 'performance', label: 'Performans Analizi' },
    { value: 'topics', label: 'Konu Analizi' },
    { value: 'user', label: 'Kullanıcı Analizi' },
    { value: 'detailed', label: 'Detaylı Raporlar' }
  ];

  const parameterTypes = [
    { value: 'date', label: 'Tarih', description: 'Tarih seçimi (GG/AA/YYYY formatında)' },
    { value: 'text', label: 'Metin', description: 'Serbest metin girişi' },
    { value: 'number', label: 'Sayı', description: 'Sayısal değer girişi' },
    { value: 'select', label: 'Seçim Listesi', description: 'Tek bir seçenek seçme imkanı sunar' },
    { value: 'multiselect', label: 'Çoklu Seçim Listesi', description: 'Birden fazla seçenek seçme imkanı sunar' }
  ];

  // SQL örnek şablonları
  const sqlTemplates = [
    {
      name: 'Temel Sorgu',
      description: 'Zaman aralığına göre basit filtreleme',
      code: `SELECT * FROM {TABLE_NAME} 
WHERE created_at BETWEEN '{START_DATE}' AND '{END_DATE}'
LIMIT 100`
    },
    {
      name: 'Gruplama Sorgusu',
      description: 'Kategoriye göre gruplama ve sayma',
      code: `SELECT 
  category, 
  COUNT(*) as total 
FROM {TABLE_NAME} 
WHERE created_at BETWEEN '{START_DATE}' AND '{END_DATE}'
GROUP BY category
ORDER BY total DESC
LIMIT 10`
    },
    {
      name: 'Zaman Analizi',
      description: 'Günlere göre veri analizi',
      code: `SELECT 
  DATE(created_at) as date, 
  COUNT(*) as count 
FROM {TABLE_NAME} 
WHERE created_at BETWEEN '{START_DATE}' AND '{END_DATE}'
GROUP BY DATE(created_at)
ORDER BY date ASC`
    }
  ];

  // Raporları getir
  const fetchReports = useCallback(async () => {
      setLoading(true);
      setError(null);
    try {
      const response = await api.get('/reports/list');
      if (response.data.status === 'success') {
        setReports(response.data.reports || []);
      } else {
        setError(response.data.message || 'Raporlar alınırken bir hata oluştu');
      }
    } catch (err) {
      console.error('Raporlar alınırken hata:', err);
      setError('Raporlar alınırken bir hata oluştu: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Rapor detayını getir
  const fetchReportDetail = useCallback(async (reportName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/reports/detail/${reportName}`);
      if (response.data.status === 'success') {
        const reportData = response.data;
        
        // Parametreleri doğru format ile hazırla
        let parameters = [];
        if (reportData.parameters) {
          if (Array.isArray(reportData.parameters)) {
            parameters = reportData.parameters;
          } else {
            parameters = Object.entries(reportData.parameters || {}).map(([key, value]) => ({
              name: key,
              type: value?.type || 'text',
              default: value?.default || '',
              options: Array.isArray(value?.options) ? value.options.join(', ') : ''
            }));
          }
        }
        
        // Kategori değeri veritabanında yoksa varsayılan değer kullan
        const safeCategory = reportData.category || 'time';
        
        setFormValues({
          report_name: reportData.report_name,
          display_name: reportData.display_name,
          description: reportData.description,
          category: safeCategory,
          sql_code: reportData.sql_code,
          parameters: parameters
        });
        setSelectedReport(reportData);
      } else {
        setError(response.data.message || 'Rapor detayı alınırken bir hata oluştu');
      }
    } catch (err) {
      console.error('Rapor detayı alınırken hata:', err);
      if (err.response && err.response.status === 500 && 
          err.response.data && err.response.data.message && 
          err.response.data.message.includes('column "category" does not exist')) {
        // Kategori sütunu sorunu - SQL kodunu doğrudan almayı dene
        try {
          const sqlResponse = await api.get(`/reports/sql-code/${reportName}`);
          if (sqlResponse.data.status === 'success') {
            const minimalReportData = {
              report_name: reportName,
              display_name: reportName,
              description: '',
              sql_code: sqlResponse.data.sql_code,
              category: 'time', // Varsayılan kategori
              parameters: {},
              is_active: true
            };
            
            setFormValues({
              report_name: minimalReportData.report_name,
              display_name: minimalReportData.display_name,
              description: minimalReportData.description,
              category: minimalReportData.category,
              sql_code: minimalReportData.sql_code,
              parameters: []
            });
            setSelectedReport(minimalReportData);
            
            setSnackbar({
              open: true,
              message: 'Kategori bilgisi eksik olduğu için sadece SQL kodu yüklendi',
              severity: 'warning'
            });
            return;
          }
        } catch (sqlErr) {
          console.error('SQL kodu alınırken hata:', sqlErr);
        }
      }
      
      setError('Rapor detayı alınırken bir hata oluştu: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Component yüklendiğinde raporları getir
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Dialog tab değişikliği
  const handleDialogTabChange = (event, newValue) => {
    setDialogTabValue(newValue);
  };

  // Arama terimine göre filtreleme
  const filteredReports = useMemo(() => {
    return reports.filter(report => 
      report.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.report_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.category && report.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [reports, searchTerm]);

  // Form değerlerini güncelle
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // SQL şablonu uygula
  const handleApplySqlTemplate = (templateCode) => {
    setFormValues(prev => ({
      ...prev,
      sql_code: templateCode
    }));
  };

  // Parametre ekle
  const handleAddParameter = () => {
    setFormValues(prev => ({
      ...prev,
      parameters: [...prev.parameters, { name: '', type: 'text', default: '', options: '' }]
    }));
  };

  // Parametre sil
  const handleRemoveParameter = (index) => {
    setFormValues(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  };

  // Parametre değerlerini güncelle
  const handleParameterChange = (index, field, value) => {
    setFormValues(prev => {
      const parameters = [...prev.parameters];
      parameters[index] = { ...parameters[index], [field]: value };
      return { ...prev, parameters };
    });
  };

  // Rapor düzenleme veya ekleme işlemi
  const handleSaveReport = async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      // Form doğrulama
      if (!formValues.report_name || !formValues.display_name || !formValues.sql_code) {
        setError('Lütfen gerekli alanları doldurun');
        setSubmitting(false);
        return;
      }

      // Parametreleri düzenle
      const parametersObj = formValues.parameters.reduce((obj, param) => {
        if (param.name) {
          obj[param.name] = {
            type: param.type || 'text',
            default: param.default || '',
            options: param.options ? param.options.split(',').map(o => o.trim()) : []
          };
        }
        return obj;
      }, {});

      // Raporu kaydet
      const endpoint = selectedReport 
        ? `/reports/update/${formValues.report_name}` 
        : '/reports/create';
      
      const response = await api.post(endpoint, {
        ...formValues,
        parameters: parametersObj
      });
      
      if (response.data.status === 'success') {
        setSnackbar({
          open: true,
          message: `Rapor başarıyla ${selectedReport ? 'güncellendi' : 'oluşturuldu'}`,
          severity: 'success'
        });
        setOpenDialog(false);
        fetchReports();
      } else {
        setError(response.data.message || `Rapor ${selectedReport ? 'güncellenirken' : 'oluşturulurken'} bir hata oluştu`);
      }
    } catch (err) {
      setError(`Rapor ${selectedReport ? 'güncellenirken' : 'oluşturulurken'} bir hata oluştu: ` + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  // Sadece SQL kodunu güncelle
  const handleSaveSqlCode = async () => {
    setSubmitting(true);
      setError(null);
    
    try {
      if (!selectedReport || !formValues.sql_code) {
        setError('SQL kodu boş olamaz');
        setSubmitting(false);
        return;
      }

      const response = await api.post(`/reports/update-sql/${selectedReport.report_name}`, {
        sql_code: formValues.sql_code
      });
      
      if (response.data.status === 'success') {
        setSnackbar({
          open: true,
          message: 'SQL kodu başarıyla güncellendi',
          severity: 'success'
        });
        setOpenSqlDialog(false);
      } else {
        setError(response.data.message || 'SQL kodu güncellenirken bir hata oluştu');
      }
    } catch (err) {
      setError('SQL kodu güncellenirken bir hata oluştu: ' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  // Rapor aktif/pasif durumunu değiştir
  const handleToggleActive = async (report, isActive) => {
    try {
      const response = await api.put(`/reports/toggle-active/${report.report_name}`, {
        is_active: isActive
      });

      if (response.data.status === 'success') {
        setSnackbar({
          open: true,
          message: response.data.message || `Rapor ${isActive ? 'aktifleştirildi' : 'pasifleştirildi'}`,
          severity: 'success'
        });
        fetchReports();
      } else {
        setError(response.data.message || 'Rapor durumu değiştirilirken bir hata oluştu');
      }
    } catch (err) {
      setError('Rapor durumu değiştirilirken bir hata oluştu: ' + (err.message || err));
    }
  };

  // Rapor silme
  const handleDeleteReport = async (report) => {
    if (!window.confirm(`"${report.display_name}" raporunu silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const response = await api.delete(`/reports/delete/${report.report_name}`);

      if (response.data.status === 'success') {
        setSnackbar({
          open: true,
          message: 'Rapor başarıyla silindi',
          severity: 'success'
        });
        fetchReports();
      } else {
        setError(response.data.message || 'Rapor silinirken bir hata oluştu');
      }
    } catch (err) {
      setError('Rapor silinirken bir hata oluştu: ' + (err.message || err));
    }
  };

  // Yeni rapor ekle
  const handleAddReport = () => {
    setSelectedReport(null);
    setFormValues({
      report_name: '',
      display_name: '',
      description: '',
      category: 'time',
      sql_code: '',
      parameters: []
    });
    setDialogTabValue(0);
    setOpenDialog(true);
  };

  // Rapor düzenle
  const handleEditReport = async (report) => {
    await fetchReportDetail(report.report_name);
    setDialogTabValue(0);
    setOpenDialog(true);
  };

  // SQL kodunu göster ve düzenle
  const handleViewSqlCode = async (report) => {
    await fetchReportDetail(report.report_name);
    setOpenSqlDialog(true);
  };

  // Dialogları kapat
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setOpenSqlDialog(false);
    setSelectedReport(null);
    setDialogTabValue(0);
  };

  // Snackbar'ı kapat
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // SQL kodundan parametreleri otomatik tespit et
  const extractParametersFromSql = () => {
    if (!formValues.sql_code) return;
    
    const paramRegex = /{([A-Z_]+)}/g;
    const matches = [...formValues.sql_code.matchAll(paramRegex)];
    
    // Sistem parametrelerini hariç tut (TABLE_NAME gibi)
    const systemParams = ['TABLE_NAME'];
    const extractedParams = matches
      .map(match => match[1])
      .filter(param => !systemParams.includes(param) && 
                        !formValues.parameters.some(p => p.name === param));
    
    // Benzersiz parametreleri al
    const uniqueParams = [...new Set(extractedParams)];
    
    // Yeni parametreleri ekle
    if (uniqueParams.length > 0) {
      const newParams = uniqueParams.map(param => ({
        name: param,
        type: param.includes('DATE') ? 'date' : 'text',
        default: '',
        options: ''
      }));
      
      setFormValues(prev => ({
        ...prev,
        parameters: [...prev.parameters, ...newParams]
      }));
      
      setSnackbar({
        open: true,
        message: `${newParams.length} yeni parametre otomatik olarak eklendi`,
        severity: 'info'
      });
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Rapor Yönetimi</Typography>
        <Box>
          <TextField
            size="small"
            placeholder="Rapor ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mr: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={handleAddReport}
          >
            Yeni Rapor
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress />}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {reports.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Sistemde toplam {reports.length} rapor tanımı bulunmaktadır. 
          {reports.filter(r => r.is_active).length} rapor aktif, {reports.filter(r => !r.is_active).length} rapor pasif durumdadır.
        </Alert>
      )}

      {/* Rapor Tablosu */}
        <TableContainer>
        <Table sx={{ minWidth: 650 }} size="small">
            <TableHead>
              <TableRow>
                <TableCell>Rapor Adı</TableCell>
                <TableCell>Açıklama</TableCell>
              <TableCell>Kategori</TableCell>
                <TableCell>Durum</TableCell>
              <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {loading && reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz rapor bulunmuyor'}
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map(report => (
                <TableRow key={report.id || report.report_name} hover>
                  <TableCell>{report.display_name}</TableCell>
                  <TableCell>
                    {report.description?.length > 50 
                      ? `${report.description.substring(0, 50)}...` 
                      : report.description}
                  </TableCell>
                  <TableCell>
                    {categories.find(cat => cat.value === report.category)?.label || 'Kategorisiz'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={report.is_active ? 'Rapor aktif, kullanıcılar bu raporu görebilir' : 'Rapor pasif, kullanıcılar bu raporu göremez'}>
                      <FormControlLabel
                        control={
                          <Switch
                          size="small" 
                            checked={report.is_active}
                            onChange={() => handleToggleActive(report, !report.is_active)}
                            color="success"
                        />
                        }
                        label={
                        <Chip 
                          size="small" 
                            label={report.is_active ? 'Aktif' : 'Pasif'} 
                            color={report.is_active ? 'success' : 'default'} 
                          variant="outlined"
                        />
                        }
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="SQL kodunu görüntüle ve düzenle">
                      <IconButton
                        size="small"
                        onClick={() => handleViewSqlCode(report)}
                      >
                        <Code />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Raporu düzenle">
                      <IconButton
                        size="small"
                        onClick={() => handleEditReport(report)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Raporu sil">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteReport(report)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Rapor Ekleme/Düzenleme Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedReport ? 'Raporu Düzenle' : 'Yeni Rapor Ekle'}
        </DialogTitle>
        <DialogContent>
          <Tabs 
            value={dialogTabValue} 
            onChange={handleDialogTabChange}
            sx={{ mb: 2 }}
          >
            <Tab label="Genel Bilgiler" />
            <Tab label="SQL Kodu" />
            <Tab label="Parametreler" />
          </Tabs>

          {/* Genel Bilgiler Tab */}
          <TabPanel value={dialogTabValue} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Rapor Adı (Teknik)"
                  name="report_name"
                  value={formValues.report_name}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  required
                  helperText="Rapor teknik adı (boşluk ve Türkçe karakter içermemeli, SQL sorgusunda ve sistemde kullanılır)"
                  disabled={!!selectedReport}
                  inputProps={{
                    pattern: '[a-zA-Z0-9_-]+',
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Görünen Ad"
                  name="display_name"
                  value={formValues.display_name}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  required
                  helperText="Kullanıcıya gösterilecek rapor adı (menülerde ve başlıklarda görünür)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Açıklama"
                  name="description"
                  value={formValues.description}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                  helperText="Rapor hakkında açıklayıcı bilgi (kullanıcı rapor listesinde bu açıklamayı görecektir)"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Kategori</InputLabel>
                  <Select
                    name="category"
                    value={formValues.category}
                    onChange={handleInputChange}
                    label="Kategori"
                  >
                    {categories.map(cat => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Rapor kategorisi (raporlar menüde bu kategorilere göre gruplandırılır)</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info" icon={<HelpOutline />}>
                  <Typography variant="subtitle2" gutterBottom>
                    Rapor Oluşturma İpuçları:
                  </Typography>
                  <Typography variant="body2">
                    1. Önce bu sayfada genel bilgileri girin, ardından "SQL Kodu" ve "Parametreler" sekmelerine geçin.
                  </Typography>
                  <Typography variant="body2">
                    2. Anlamlı bir rapor adı ve açıklama eklemek, kullanıcıların raporu daha kolay bulmasını sağlar.
                  </Typography>
                  <Typography variant="body2">
                    3. Sistem, SQL kodunuzdaki parametreleri otomatik olarak algılayabilir.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </TabPanel>

          {/* SQL Kodu Tab */}
          <TabPanel value={dialogTabValue} index={1}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                SQL Kodu Yazma Rehberi
              </Typography>
              <Typography variant="body2" paragraph>
                Veritabanınıza uygun SQL sorguları yazabilirsiniz. Aşağıdaki özel ifadeleri kullanabilirsiniz:
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Parametreler ve Özel Değişkenler:
                      </Typography>
                      <Typography variant="body2">
                        • <code>{'{TABLE_NAME}'}</code>: Sistemdeki ana veri tablosu
                      </Typography>
                      <Typography variant="body2">
                        • <code>{'{START_DATE}'}</code>, <code>{'{END_DATE}'}</code>: Tarih aralığı parametreleri
                      </Typography>
                      <Typography variant="body2">
                        • <code>{'{PARAMETER_NAME}'}</code>: Kendi tanımladığınız parametreler
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Örnek SQL Kullanımı:
                      </Typography>
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                        <code>
                          SELECT * FROM {'{TABLE_NAME}'}<br/>
                          WHERE created_at BETWEEN '{'{START_DATE}'}' AND '{'{END_DATE}'}'<br/>
                          AND category = '{'{CATEGORY}'}'
                        </code>
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* SQL Şablonları */}
              <Accordion variant="outlined">
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>SQL Şablonları (Hızlı Başlangıç)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {sqlTemplates.map((template, index) => (
                      <Grid item xs={12} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Box>
                                <Typography variant="subtitle2">{template.name}</Typography>
                                <Typography variant="body2" color="textSecondary">{template.description}</Typography>
                    </Box>
                      <Button 
                                variant="outlined" 
                        size="small" 
                                onClick={() => handleApplySqlTemplate(template.code)}
                              >
                                Uygula
                              </Button>
                            </Box>
                            <Box sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                {template.code}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Box>
            
            <TextField
              label="SQL Kodu"
              name="sql_code"
              value={formValues.sql_code}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
              multiline
              rows={10}
                        variant="outlined"
              sx={{ fontFamily: 'monospace' }}
              placeholder="SELECT * FROM {TABLE_NAME} WHERE created_at BETWEEN '{START_DATE}' AND '{END_DATE}'"
            />
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined" 
                startIcon={<Code />}
                onClick={extractParametersFromSql}
              >
                Parametreleri Otomatik Algıla
                      </Button>
              <Button 
                variant="outlined"
                onClick={() => setDialogTabValue(2)}
              >
                Parametrelere Git
              </Button>
            </Box>
          </TabPanel>

          {/* Parametreler Tab */}
          <TabPanel value={dialogTabValue} index={2}>
            <Box sx={{ mb: 3 }}>
              <Alert severity="info" icon={<HelpOutline />}>
                <Typography variant="subtitle2" gutterBottom>
                  Parametre Ekleme Rehberi:
                </Typography>
                <Typography variant="body2">
                  • Parametreler, kullanıcıların raporu çalıştırırken değiştirebileceği değerlerdir.
                </Typography>
                <Typography variant="body2">
                  • SQL kodunda <code>{'{PARAMETER_ADI}'}</code> şeklinde kullanın.
                </Typography>
                <Typography variant="body2">
                  • Her parametre için tip, varsayılan değer ve gerekiyorsa seçim listesi belirleyin.
                </Typography>
              </Alert>
            </Box>
            
            {formValues.parameters.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" gutterBottom>
                  Henüz parametre eklenmemiş.
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Add />} 
                  onClick={handleAddParameter}
                  sx={{ mt: 1 }}
                >
                  İlk Parametreyi Ekle
                </Button>
              </Box>
            ) : (
              <Box>
                {formValues.parameters.map((param, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <TextField
                            label="Parametre Adı"
                            value={param.name}
                            onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                            fullWidth
                            required
                        size="small" 
                            helperText="SQL kodunda {PARAMETRE_ADI} olarak kullanın"
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Veri Tipi</InputLabel>
                            <Select
                              value={param.type}
                              onChange={(e) => handleParameterChange(index, 'type', e.target.value)}
                              label="Veri Tipi"
                            >
                              {parameterTypes.map(type => (
                                <MenuItem key={type.value} value={type.value}>
                                  {type.label}
                                </MenuItem>
                              ))}
                            </Select>
                            <FormHelperText>
                              {parameterTypes.find(t => t.value === param.type)?.description}
                            </FormHelperText>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            label="Varsayılan Değer"
                            value={param.default}
                            onChange={(e) => handleParameterChange(index, 'default', e.target.value)}
                            fullWidth
                            size="small"
                            helperText="Raporun ilk açılışında kullanılacak değer"
                          />
                        </Grid>
                        <Grid item xs={12} sm={param.type === 'select' || param.type === 'multiselect' ? 2 : 3}>
                          {(param.type === 'select' || param.type === 'multiselect') && (
                            <TextField
                              label="Seçenekler"
                              value={param.options}
                              onChange={(e) => handleParameterChange(index, 'options', e.target.value)}
                              fullWidth
                              size="small"
                              helperText="Virgülle ayırarak seçenekleri belirtin"
                            />
                          )}
                        </Grid>
                        <Grid item xs={12} sm={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Tooltip title="Parametreyi Sil">
                            <IconButton 
                              color="error" 
                              onClick={() => handleRemoveParameter(index)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddParameter}
                  >
                    Yeni Parametre Ekle
                  </Button>
                </Box>
              </Box>
            )}
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button 
            onClick={handleSaveReport} 
            variant="contained" 
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : <Save />}
          >
            {submitting ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SQL Kodu Görüntüleme ve Düzenleme Dialog */}
      <Dialog open={openSqlDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          SQL Kodu: {selectedReport?.display_name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" icon={<HelpOutline />} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                SQL Düzenleme Rehberi - Bu ekranda yalnızca SQL kodunu düzenleyebilirsiniz.
              </Typography>
            </Alert>
            
            <Accordion defaultExpanded variant="outlined">
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>SQL Yazım Kuralları ve İpuçları</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" paragraph>
                      <strong>Parametreler:</strong>
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Parametreler <code>{'{PARAMETER_NAME}'}</code> formatında yazılmalıdır.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Tarih parametreleri için <code>{'{START_DATE}'}</code>, <code>{'{END_DATE}'}</code> gibi standart adlar kullanın.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • <code>{'{TABLE_NAME}'}</code> parametresi otomatik olarak müşteri tablosunu belirtir.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" paragraph>
                      <strong>Performans İpuçları:</strong>
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Tüm SQL sorgularınıza LIMIT ekleyin (özellikle büyük tablolarda).
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • Karmaşık sorgularda WHERE koşullarınıza dikkat edin.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      • İstatistiksel sorgularda GROUP BY kullanmayı unutmayın.
                    </Typography>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
          
          <TextField
            label="SQL Kodu"
            name="sql_code"
            value={formValues.sql_code}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
            multiline
            rows={15}
            variant="outlined"
            sx={{ fontFamily: 'monospace' }}
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              startIcon={<Code />}
              onClick={extractParametersFromSql}
            >
              Parametreleri Otomatik Algıla
            </Button>
            
            <Box>
              {selectedReport && (
                <Button
                  sx={{ mr: 1 }}
                  variant="outlined"
                  onClick={() => {
                    setOpenSqlDialog(false);
                    setOpenDialog(true);
                    setDialogTabValue(2);
                  }}
                >
                  Parametreleri Düzenle
                </Button>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button 
            onClick={handleSaveSqlCode} 
            variant="contained" 
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : <Save />}
          >
            {submitting ? 'Kaydediliyor...' : 'SQL Kodunu Güncelle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bildirim Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Paper>
  );
};

// Log Görüntüleme Bileşeni
const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 50;

  // Logları getir
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/admin/logs', {
        params: { offset: page * logsPerPage, limit: logsPerPage }
      });
      
        setLogs(response.data.logs || []);
      setTotalLogs(response.data.total_count || 0);
    } catch (err) {
      console.error('Log getirme hatası:', err);
      setError('Loglar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme ve sayfa değişimi
  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Sistem Logları
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<Refresh />}
          onClick={fetchLogs}
          disabled={loading}
        >
          Yenile
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      
      {loading && logs.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tarih/Saat</TableCell>
                <TableCell>Kullanıcı</TableCell>
                <TableCell>İşlem</TableCell>
                <TableCell>Detaylar</TableCell>
                <TableCell>IP Adresi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell>{log.user_username || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={log.action} 
                      color={
                        log.action.includes('login') ? 'primary' : 
                        log.action.includes('create') || log.action.includes('register') ? 'success' : 
                        log.action.includes('update') ? 'info' : 
                        'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {log.details ? (
                      <code style={{ fontSize: '0.8rem' }}>
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                      </code>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{log.ip_address || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Sayfalama */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Toplam {totalLogs} log
        </Typography>
        
        <Box>
          <Button 
            disabled={page === 0 || loading}
            onClick={() => setPage(page - 1)}
          >
            Önceki
          </Button>
          <Button 
            disabled={(page + 1) * logsPerPage >= totalLogs || loading}
            onClick={() => setPage(page + 1)}
          >
            Sonraki
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

// Ana Admin Sayfası
const AdminPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);

  // URL'ye göre aktif sekmeyi belirle
  useEffect(() => {
    const path = location.pathname;
    
    if (path.includes('/admin/users')) {
      setActiveTab(0);
    } else if (path.includes('/admin/table')) {
      setActiveTab(1);
    } else if (path.includes('/admin/reports')) {
      setActiveTab(2);
    } else if (path.includes('/admin/logs')) {
      setActiveTab(3);
    }
  }, [location]);

  // Sekme değişikliği
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    switch (newValue) {
      case 0:
        navigate('/admin/users');
        break;
      case 1:
        navigate('/admin/table');
        break;
      case 2:
        navigate('/admin/reports');
        break;
      case 3:
        navigate('/admin/logs');
        break;
      default:
        navigate('/admin');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<PersonAdd />} label="Kullanıcılar" />
          <Tab icon={<Storage />} label="Tablo Ayarları" />
          <Tab icon={<Assessment />} label="Raporlar" />
          <Tab icon={<ViewList />} label="Loglar" />
        </Tabs>
      </Paper>
      
      <Routes>
        <Route path="/" element={<UserManagement />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/table" element={<TableSettings />} />
        <Route path="/reports" element={<ReportManagement />} />
        <Route path="/logs" element={<LogViewer />} />
      </Routes>
    </Box>
  );
};

export default AdminPage; 