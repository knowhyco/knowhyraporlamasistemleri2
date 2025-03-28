import React, { useState, useEffect } from 'react';
import { 
  Box, Flex, VStack, Text, Icon, Divider, 
  Collapse, Badge, Image, Tooltip, IconButton
} from '@chakra-ui/react';
import {
  ChevronDownIcon, ChevronRightIcon, SettingsIcon, InfoIcon,
  AddIcon, StarIcon, HamburgerIcon, ViewIcon, TimeIcon,
  SearchIcon, ChatIcon, QuestionIcon, WarningIcon
} from '@chakra-ui/icons';
import { Link, useLocation } from 'react-router-dom';

// SQL rapor kategorileri
const REPORT_CATEGORIES = [
  { id: 'time', name: 'Zaman Bazlı Analizler', icon: TimeIcon },
  { id: 'content', name: 'İçerik Analizleri', icon: ChatIcon },
  { id: 'performance', name: 'Performans Metrikleri', icon: ViewIcon },
  { id: 'detail', name: 'Detaylı Görünümler', icon: SearchIcon },
];

const Sidebar = ({ isOpen, user }) => {
  const location = useLocation();
  const [openCategories, setOpenCategories] = useState([]);
  const isAdmin = user && user.role === 'admin';

  // Kategori açma/kapama işlevi
  const toggleCategory = (categoryId) => {
    if (openCategories.includes(categoryId)) {
      setOpenCategories(openCategories.filter(id => id !== categoryId));
    } else {
      setOpenCategories([...openCategories, categoryId]);
    }
  };

  // Aktif menü öğesini belirleme
  const isActive = (path) => location.pathname === path;
  
  return (
    <Box 
      className={`app-sidebar ${isOpen ? 'open' : ''}`}
      transition="all 0.3s ease"
      boxShadow="md"
    >
      {/* Logo ve Başlık */}
      <Box className="sidebar-header">
        <Flex alignItems="center" mb={4}>
          <Text 
            fontWeight="bold" 
            fontSize="xl" 
            bgGradient="linear(to-r, blue.400, teal.400)"
            bgClip="text"
          >
            Knowhy
          </Text>
        </Flex>
        
        <Text fontSize="xs" color="gray.400">
          Rapor kategorilerini keşfedin
        </Text>
      </Box>

      {/* Ana Menü */}
      <VStack align="stretch" spacing={1}>
        <Link to="/">
          <Box 
            className={`sidebar-item ${isActive('/') ? 'active' : ''}`}
          >
            <Icon as={ViewIcon} className="sidebar-icon" />
            <Text>Dashboard</Text>
          </Box>
        </Link>

        <Link to="/reports">
          <Box 
            className={`sidebar-item ${isActive('/reports') ? 'active' : ''}`}
          >
            <Icon as={QuestionIcon} className="sidebar-icon" />
            <Text>Tüm Raporlar</Text>
          </Box>
        </Link>

        <Link to="/favorites">
          <Box 
            className={`sidebar-item ${isActive('/favorites') ? 'active' : ''}`}
          >
            <Icon as={StarIcon} className="sidebar-icon" />
            <Text>Favoriler</Text>
            <Badge
              ml="auto"
              className="badge-primary"
              borderRadius="full"
              fontSize="xs"
            >
              3
            </Badge>
          </Box>
        </Link>

        <Divider my={3} borderColor="gray.700" />
      
        {/* Rapor Kategorileri */}
        <Text px={4} fontSize="xs" textTransform="uppercase" color="gray.500" fontWeight="medium" mb={2}>
          Rapor Kategorileri
        </Text>

        {REPORT_CATEGORIES.map((category) => (
          <Box key={category.id}>
            <Box 
              className="sidebar-item"
              onClick={() => toggleCategory(category.id)}
              cursor="pointer"
            >
              <Icon as={category.icon} className="sidebar-icon" />
              <Text>{category.name}</Text>
              <Icon 
                as={openCategories.includes(category.id) ? ChevronDownIcon : ChevronRightIcon} 
                ml="auto"
                fontSize="sm"
              />
            </Box>
            
            <Collapse in={openCategories.includes(category.id)} animateOpacity>
              <VStack align="stretch" pl={8} mt={1} mb={2} spacing={1}>
                {category.id === 'time' && (
                  <>
                    <Link to={`/reports/category/${category.id}/18_Son_24_saatteki_aktif_oturumlar`}>
                      <Text fontSize="sm" py={2} px={4} color="gray.400" _hover={{ color: "gray.200" }}>
                        Son 24 Saatteki Aktif Oturumlar
                      </Text>
                    </Link>
                    <Link to={`/reports/category/${category.id}/14_Saatlik_Aktivite_Analizi`}>
                      <Text fontSize="sm" py={2} px={4} color="gray.400" _hover={{ color: "gray.200" }}>
                        Saatlik Aktivite Analizi
                      </Text>
                    </Link>
                    <Link to={`/reports/category/${category.id}/5_Gunluk_Aktivite_ve_Etkin_Konusma_Saatleri`}>
                      <Text fontSize="sm" py={2} px={4} color="gray.400" _hover={{ color: "gray.200" }}>
                        Günlük Aktivite ve Etkin Konuşma Saatleri
                      </Text>
                    </Link>
                  </>
                )}
                
                {category.id === 'content' && (
                  <>
                    <Link to={`/reports/category/${category.id}/8_Kelime_Kullanim_Matriksi`}>
                      <Text fontSize="sm" py={2} px={4} color="gray.400" _hover={{ color: "gray.200" }}>
                        Kelime Kullanım Matrisi
                      </Text>
                    </Link>
                    <Link to={`/reports/category/${category.id}/4_En_Sik_Sorulan_Sorular_Konular`}>
                      <Text fontSize="sm" py={2} px={4} color="gray.400" _hover={{ color: "gray.200" }}>
                        En Sık Sorulan Sorular/Konular
                      </Text>
                    </Link>
                    <Link to={`/reports/category/${category.id}/3_Context_kullanim_istatistikleri`}>
                      <Text fontSize="sm" py={2} px={4} color="gray.400" _hover={{ color: "gray.200" }}>
                        Context Kullanım İstatistikleri
                      </Text>
                    </Link>
                  </>
                )}
                
                {category.id === 'performance' && (
                  <>
                    <Link to={`/reports/category/${category.id}/24_Yanit_Suresi_Analizi`}>
                      <Text fontSize="sm" py={2} px={4} color="gray.400" _hover={{ color: "gray.200" }}>
                        Yanıt Süresi Analizi
                      </Text>
                    </Link>
                    <Link to={`/reports/category/${category.id}/11_Konusma_Derinligi_Analizi`}>
                      <Text fontSize="sm" py={2} px={4} color="gray.400" _hover={{ color: "gray.200" }}>
                        Konuşma Derinliği Analizi
                      </Text>
                    </Link>
                    <Link to={`/reports/category/${category.id}/16_Session_Uzunlugu_ve_Kullanici_Sorulari_Arasindaki_İliski`}>
                      <Text fontSize="sm" py={2} px={4} color="gray.400" _hover={{ color: "gray.200" }}>
                        Oturum Uzunluğu Analizi
                      </Text>
                    </Link>
                  </>
                )}
                
                {category.id === 'detail' && (
                  <>
                    <Link to={`/reports/category/${category.id}/15_Secilen_oturumdaki_tüm_mesajlari_kronolojik_sirayla_listele`}>
                      <Text fontSize="sm" py={2} px={4} color="gray.400" _hover={{ color: "gray.200" }}>
                        Seçilen Oturumdaki Tüm Mesajlar
                      </Text>
                    </Link>
                    <Link to={`/reports/category/${category.id}/2_Context_kullanan_yanitlar_dahil_detayli_oturum_gorunumu`}>
                      <Text fontSize="sm" py={2} px={4} color="gray.400" _hover={{ color: "gray.200" }}>
                        Context Kullanan Yanıtlar
                      </Text>
                    </Link>
                    <Link to={`/reports/category/${category.id}/23_Trend_Analizi_Konularin_Zaman_İcinde_Degisimi`}>
                      <Text fontSize="sm" py={2} px={4} color="gray.400" _hover={{ color: "gray.200" }}>
                        Trend Analizi
                      </Text>
              </Link>
                  </>
                )}
              </VStack>
            </Collapse>
          </Box>
        ))}

        {/* Admin Özellikleri */}
        {isAdmin && (
          <>
            <Divider my={3} borderColor="gray.700" />
            
            <Text px={4} fontSize="xs" textTransform="uppercase" color="gray.500" fontWeight="medium" mb={2}>
              Yönetim
            </Text>
            
            <Link to="/admin">
              <Box 
                className={`sidebar-item ${isActive('/admin') ? 'active' : ''}`}
              >
                <Icon as={SettingsIcon} className="sidebar-icon" />
                <Text>Sistem Ayarları</Text>
              </Box>
            </Link>
            
            <Link to="/admin/users">
              <Box 
                className={`sidebar-item ${isActive('/admin/users') ? 'active' : ''}`}
              >
                <Icon as={InfoIcon} className="sidebar-icon" />
                <Text>Kullanıcı Yönetimi</Text>
              </Box>
            </Link>
            
            <Link to="/admin/reports">
              <Box 
                className={`sidebar-item ${isActive('/admin/reports') ? 'active' : ''}`}
              >
                <Icon as={AddIcon} className="sidebar-icon" />
                <Text>Rapor Yönetimi</Text>
              </Box>
            </Link>
          </>
        )}
      </VStack>

      {/* Alt Bilgi */}
      <Box position="absolute" bottom="0" width="100%" p={4}>
        <Divider mb={4} borderColor="gray.700" />
        <Flex alignItems="center" justifyContent="space-between">
          <Text fontSize="xs" color="gray.500">v1.0.0</Text>
          <Tooltip label="Yardım ve Destek" placement="top">
            <IconButton
              aria-label="Yardım"
              icon={<QuestionIcon />}
              size="sm"
              variant="ghost"
            />
          </Tooltip>
        </Flex>
      </Box>
    </Box>
  );
};

export default Sidebar; 