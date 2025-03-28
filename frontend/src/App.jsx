import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  ChakraProvider,
  Box,
  Flex,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  IconButton,
  HStack,
  VStack,
  Text,
  useColorMode,
  useColorModeValue,
  Divider,
  Tooltip,
  Button,
  Icon,
} from '@chakra-ui/react';
import { 
  HamburgerIcon, 
  MoonIcon, 
  SunIcon, 
  ViewIcon, 
  SettingsIcon, 
  StarIcon,
  RepeatIcon,
  InfoIcon,
  ChatIcon,
  QuestionOutlineIcon,
  ChevronRightIcon,
  ChevronLeftIcon
} from '@chakra-ui/icons';
import ReportsPage from './pages/ReportsPage';
import theme from './theme';
import "./custom.css";

// Tema renkleri
const primaryColor = "#3182CE"; // Ana mavi renk

const App = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const sidebarBg = useColorModeValue("gray.50", "gray.900");
  const activeBg = useColorModeValue("blue.50", "blue.900");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  const navItems = [
    { name: 'Dashboard', icon: ViewIcon, path: '/' },
    { name: 'Raporlar', icon: InfoIcon, path: '/reports' },
    { name: 'Favoriler', icon: StarIcon, path: '/favorites' },
    { name: 'Ayarlar', icon: SettingsIcon, path: '/settings' },
    { name: 'Yardım', icon: QuestionOutlineIcon, path: '/help' },
  ];

  // Aktif sayfa
  const [activePage, setActivePage] = React.useState('/');

  // Sidebar öğesi tıklaması
  const handleNavItemClick = (path) => {
    setActivePage(path);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Flex h="100vh">
          {/* Desktop Sidebar */}
          <Box
            display={{ base: 'none', md: 'block' }}
            w={sidebarCollapsed ? "80px" : "240px"}
            bg={sidebarBg}
            borderRight="1px"
            borderColor={borderColor}
            transition="width 0.3s"
            overflow="hidden"
          >
            <Flex 
              h="80px" 
              alignItems="center" 
              px={sidebarCollapsed ? 2 : 6}
              borderBottom="1px"
              borderColor={borderColor}
              justifyContent={sidebarCollapsed ? "center" : "space-between"}
            >
              {!sidebarCollapsed && (
                <Text 
                  fontSize="xl" 
                  fontWeight="bold" 
                  color={primaryColor}
                >
                  Knowhy
                </Text>
              )}
              <IconButton
                aria-label={sidebarCollapsed ? "Genişlet" : "Daralt"}
                icon={sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                variant="ghost"
                size="sm"
              />
            </Flex>

            <VStack align="stretch" spacing={1} py={4}>
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  onClick={() => handleNavItemClick(item.path)}
                  variant="ghost"
                  justifyContent={sidebarCollapsed ? "center" : "flex-start"}
                  py={4}
                  px={sidebarCollapsed ? 2 : 6}
                  borderRadius={0}
                  bg={activePage === item.path ? activeBg : "transparent"}
                  leftIcon={
                    <Icon 
                      as={item.icon} 
                      color={activePage === item.path ? primaryColor : undefined}
                    />
                  }
                  _hover={{ bg: hoverBg }}
                >
                  {!sidebarCollapsed && item.name}
                </Button>
              ))}
            </VStack>

            <Divider my={4} />

            <VStack px={sidebarCollapsed ? 2 : 6} align={sidebarCollapsed ? "center" : "flex-start"}>
              <Tooltip label="Tema Değiştir" placement="right" isDisabled={!sidebarCollapsed}>
                <IconButton
                  icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                  onClick={toggleColorMode}
                  aria-label="Tema değiştir"
                  variant="ghost"
                  mb={2}
                />
              </Tooltip>
              {!sidebarCollapsed && (
                <Text fontSize="xs" color="gray.500" mt={2}>
                  Knowhy Raporlama v1.0.1
                </Text>
              )}
            </VStack>
          </Box>

          {/* Mobile Sidebar (Drawer) */}
          <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader borderBottomWidth="1px">
                <Text color={primaryColor} fontWeight="bold">Knowhy Raporlama</Text>
              </DrawerHeader>
              <DrawerBody p={0}>
                <VStack align="stretch" spacing={0}>
                  {navItems.map((item) => (
                    <Button
                      key={item.name}
                      onClick={() => handleNavItemClick(item.path)}
                      variant="ghost"
                      justifyContent="flex-start"
                      py={5}
                      px={6}
                      borderRadius={0}
                      leftIcon={<Icon as={item.icon} />}
                      bg={activePage === item.path ? activeBg : "transparent"}
                      _hover={{ bg: hoverBg }}
                    >
                      {item.name}
                    </Button>
                  ))}
                  <Divider my={2} />
                  <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    py={5}
                    px={6}
                    borderRadius={0}
                    leftIcon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                    onClick={toggleColorMode}
                  >
                    {colorMode === "light" ? "Karanlık Mod" : "Aydınlık Mod"}
                  </Button>
                </VStack>
              </DrawerBody>
            </DrawerContent>
          </Drawer>

          {/* Main Content */}
          <Box flex="1" overflow="auto" bg={bgColor}>
            {/* Top Bar - only visible on mobile */}
            <Flex
              h="60px"
              px={4}
              alignItems="center"
              borderBottom="1px"
              borderColor={borderColor}
              display={{ base: 'flex', md: 'none' }}
            >
              <IconButton
                aria-label="Open menu"
                icon={<HamburgerIcon />}
                onClick={onOpen}
                size="md"
                variant="ghost"
              />
              <Text ml={4} fontSize="xl" fontWeight="bold" color={primaryColor}>
                Knowhy
              </Text>
            </Flex>

            {/* Page Content */}
            <Box p={{ base: 2, md: 4 }} overflow="auto">
              <Routes>
                <Route path="/" element={<ReportsPage />} />
                <Route path="/reports" element={<ReportsPage selectedTab={1} />} />
                <Route path="/favorites" element={<ReportsPage selectedTab={2} />} />
                <Route path="/settings" element={<Text p={8}>Ayarlar Sayfası</Text>} />
                <Route path="/help" element={<Text p={8}>Yardım Sayfası</Text>} />
              </Routes>
            </Box>
          </Box>
        </Flex>
      </Router>
    </ChakraProvider>
  );
};

export default App; 