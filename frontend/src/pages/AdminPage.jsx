import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Tabs, Tab, Paper, Button, 
  TextField, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Alert, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Chip, Switch, FormControlLabel, Grid, Divider, Card, CardContent,
  InputLabel, Select, MenuItem, FormControl
} from '@mui/material';
import { 
  Add, Edit, Delete, Refresh, PersonAdd, Settings, 
  Storage, Assessment, ViewList, Search, Check, Block,
  Save, Person, Dns, CloudUpload
} from '@mui/icons-material';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/apiConfig';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Raporları getir
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/reports/list');
      
      setReports(response.data.reports || []);
    } catch (err) {
      console.error('Rapor listesi getirme hatası:', err);
      setError('Rapor listesi yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    fetchReports();
  }, []);

  // Raporu sisteme ekle
  const handleRegisterReport = async (report) => {
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await api.post(
        '/reports/register',
        {
          report_name: report.report_name,
          display_name: report.display_name,
          description: report.description,
          category: report.category,
          parameters: report.parameters
        }
      );
      
      if (response.data && response.data.status === 'success') {
        // Rapor listesini güncelle
        fetchReports();
        setSuccess(`"${report.display_name}" raporu başarıyla eklendi`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Rapor eklerken hata:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Rapor eklenirken bir hata oluştu');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Rapor durumunu değiştir (aktif/pasif)
  const handleToggleReportStatus = async (report) => {
    try {
      setError(null);
      
      const response = await api.put(
        `/reports/toggle-active/${report.id}`,
        { is_active: !report.is_active }
      );
      
      if (response.data && response.data.status === 'success') {
        // Listeyi yenile
        fetchReports();
      }
    } catch (err) {
      console.error('Rapor durumu değiştirme hatası:', err);
      setError('Rapor durumu değiştirilirken bir hata oluştu');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Rapor Yönetimi
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>
      )}
      
      {loading && reports.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Rapor Adı</TableCell>
                <TableCell>Açıklama</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.report_name} hover>
                  <TableCell>{report.display_name}</TableCell>
                  <TableCell>{report.description || '-'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {report.is_registered ? (
                        <Chip 
                          label="Kayıtlı" 
                          color="success" 
                          size="small" 
                          variant="outlined"
                        />
                      ) : (
                        <Chip 
                          label="Kayıtsız" 
                          color="default" 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                      
                      {report.is_registered && (
                        <Chip 
                          label={report.is_active ? 'Aktif' : 'Pasif'} 
                          color={report.is_active ? 'primary' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {!report.is_registered && (
                      <Button 
                        size="small" 
                        variant="outlined"
                        color="primary"
                        onClick={() => handleRegisterReport(report)}
                        disabled={submitting}
                      >
                        {submitting ? 'Ekleniyor...' : 'Ekle'}
                      </Button>
                    )}
                    
                    {report.is_registered && (
                      <IconButton 
                        size="small" 
                        color={report.is_active ? 'error' : 'success'}
                        onClick={() => handleToggleReportStatus(report)}
                        disabled={submitting}
                      >
                        {report.is_active ? <Block /> : <Check />}
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
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