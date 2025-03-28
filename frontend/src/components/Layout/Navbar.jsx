import React, { useState } from 'react';
import { 
  Box, Flex, HStack, IconButton, Text, Avatar, 
  Menu, MenuButton, MenuList, MenuItem, MenuDivider,
  useColorModeValue, Tooltip, Button, Badge
} from '@chakra-ui/react';
import { 
  ChevronDownIcon, HamburgerIcon, SettingsIcon,
  InfoIcon, ChatIcon, BellIcon, SearchIcon
} from '@chakra-ui/icons';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = ({ user, onToggleSidebar, isSidebarOpen, onLogout }) => {
  const navigate = useNavigate();
  const isAdmin = user && user.role === 'admin';

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleGoToAdmin = () => {
    navigate('/admin');
  };

  const handleGoToDashboard = () => {
    navigate('/');
  };

  return (
    <Box className="app-navbar">
      <Flex alignItems="center" justifyContent="space-between" width="100%">
        {/* Sol Taraf - Logo ve Menü Toggle */}
        <HStack spacing={3}>
          <IconButton
            aria-label="Open sidebar"
            variant="ghost"
            icon={<HamburgerIcon />}
            onClick={onToggleSidebar}
            size="md"
            color="gray.400"
            _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
          />
          
          <Link to="/">
            <Text 
              fontWeight="bold" 
              fontSize="lg" 
              letterSpacing="tight"
              bgGradient="linear(to-r, blue.400, teal.400)"
              bgClip="text"
            >
              Knowhy Raporlama
            </Text>
          </Link>
        </HStack>

        {/* Orta Kısım - Arama */}
        <Box 
          display={{ base: 'none', md: 'flex' }} 
          width="40%" 
          maxW="500px"
          className="input-group"
        >
          <SearchIcon className="input-icon" />
          <input
            type="text"
            placeholder="Raporlarda ara..."
            className="custom-input input-with-icon"
          />
        </Box>
        
        {/* Sağ Taraf - İşlevsel Butonlar ve Kullanıcı Menüsü */}
        <HStack spacing={3}>
          {/* Bildirim */}
          <Tooltip hasArrow label="Bildirimler" placement="bottom">
            <IconButton
              aria-label="Notifications"
              variant="ghost"
              icon={
                <Box position="relative">
                  <BellIcon fontSize="xl" color="gray.400" />
                  <Badge 
                    position="absolute" 
                    top="-6px" 
                    right="-6px" 
                    className="badge-primary"
                    borderRadius="full"
                    minW="18px"
                    minH="18px"
                    p="2px"
                    fontSize="xs"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    3
                  </Badge>
                </Box>
              }
              _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
            />
          </Tooltip>
          
          {/* Yardım */}
          <Tooltip hasArrow label="Yardım" placement="bottom">
            <IconButton
              aria-label="Help"
              variant="ghost"
              icon={<InfoIcon fontSize="md" color="gray.400" />}
              _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
            />
          </Tooltip>

          {/* Kullanıcı Menüsü */}
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              rightIcon={<ChevronDownIcon />}
              _hover={{ bg: 'whiteAlpha.100' }}
              px={2}
            >
              <HStack spacing={2}>
                <Avatar 
                  size="sm" 
                  name={user?.username || 'User'} 
                  bg={isAdmin ? 'purple.500' : 'blue.500'} 
                  color="white" 
                />
                <Box display={{ base: 'none', md: 'block' }}>
                  <Text fontSize="sm" fontWeight="medium">{user?.username || 'Kullanıcı'}</Text>
                  <Text fontSize="xs" color="gray.400">
                    {isAdmin ? 'Admin' : 'Kullanıcı'}
                  </Text>
                </Box>
              </HStack>
            </MenuButton>
            
            <MenuList
              className="dropdown-menu"
              zIndex={999}
            >
              <Box px={3} py={2} mb={2}>
                <Text fontWeight="medium">{user?.username || 'Kullanıcı'}</Text>
                <Text fontSize="xs" color="gray.400">
                  {user?.email || 'kullanici@ornek.com'}
                </Text>
              </Box>
              
              <MenuDivider />
              
              <MenuItem className="dropdown-item" onClick={handleGoToDashboard}>
                <ChatIcon />
                Raporlar
              </MenuItem>
              
              {isAdmin && (
                <MenuItem className="dropdown-item" onClick={handleGoToAdmin}>
                  <SettingsIcon />
                  Admin Paneli
                </MenuItem>
              )}
              
              <MenuDivider />
              
              <MenuItem className="dropdown-item" onClick={handleLogout}>
                Çıkış Yap
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar; 