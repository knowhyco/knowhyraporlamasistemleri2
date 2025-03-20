import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Typography, Button, IconButton, 
  Menu, MenuItem, Avatar, Divider, Box, Tooltip
} from '@mui/material';
import { 
  ExitToApp, AccountCircle, Dashboard, Assessment, 
  AdminPanelSettings, Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const isAdmin = user && user.role === 'admin';

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
    navigate('/login');
  };

  const handleGoToAdmin = () => {
    handleClose();
    navigate('/admin');
  };

  const handleGoToDashboard = () => {
    handleClose();
    navigate('/');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'white' }}>
          Knowhy Raporlama
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Hızlı erişim butonları */}
          <Tooltip title="Raporlar">
            <IconButton 
              color="inherit" 
              onClick={handleGoToDashboard}
            >
              <Assessment />
            </IconButton>
          </Tooltip>
          
          {isAdmin && (
            <Tooltip title="Admin Paneli">
              <IconButton 
                color="inherit" 
                onClick={handleGoToAdmin}
              >
                <AdminPanelSettings />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Kullanıcı menüsü */}
          <Box sx={{ ml: 2 }}>
            <Tooltip title="Kullanıcı Menüsü">
              <IconButton
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: isAdmin ? 'secondary.main' : 'primary.dark',
                    fontSize: '1rem' 
                  }}
                >
                  {user.username ? user.username[0].toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  mt: 1.5,
                  minWidth: 180,
                }
              }}
            >
              <MenuItem disabled>
                <Typography variant="subtitle2" component="div">
                  {user.username}
                  {isAdmin && (
                    <Box component="span" sx={{ 
                      bgcolor: 'secondary.main', 
                      color: 'white', 
                      fontSize: '0.7rem', 
                      px: 1, 
                      borderRadius: 1,
                      ml: 1
                    }}>
                      Admin
                    </Box>
                  )}
                </Typography>
              </MenuItem>
              
              <Divider />
              
              <MenuItem onClick={handleGoToDashboard}>
                <Dashboard fontSize="small" sx={{ mr: 1 }} />
                Raporlar
              </MenuItem>
              
              {isAdmin && (
                <MenuItem onClick={handleGoToAdmin}>
                  <AdminPanelSettings fontSize="small" sx={{ mr: 1 }} />
                  Admin Paneli
                </MenuItem>
              )}
              
              <MenuItem onClick={handleLogout}>
                <ExitToApp fontSize="small" sx={{ mr: 1 }} />
                Çıkış Yap
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 