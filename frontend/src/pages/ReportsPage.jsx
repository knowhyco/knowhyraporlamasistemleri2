import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  Stack,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Skeleton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  HStack,
  VStack,
  useToast,
  Button,
  Flex,
  Spacer,
  Tooltip,
  useDisclosure,
  IconButton,
  Divider,
  useBreakpointValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  BoxProps,
  Fade,
  ScaleFade,
  SlideFade,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { 
  SearchIcon,
  StarIcon,
  InfoIcon,
  WarningIcon,
  CheckIcon,
  TimeIcon,
  HamburgerIcon,
  ChevronDownIcon,
  DownloadIcon,
  SettingsIcon,
  ViewIcon,
  ViewOffIcon,
  RepeatIcon,
  CalendarIcon,
  ChevronRightIcon,
  AddIcon,
  MinusIcon,
  QuestionIcon,
  SpinnerIcon,
} from '@chakra-ui/icons';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import api from '../services/apiConfig';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const MotionBox = motion(Box);

// Özel ikon komponentleri
const StarOutlineIcon = () => (
  <Icon viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M12,15.39L8.24,17.66L9.23,13.38L5.91,10.5L10.29,10.13L12,6.09L13.71,10.13L18.09,10.5L14.77,13.38L15.76,17.66M22,9.24L14.81,8.63L12,2L9.19,8.63L2,9.24L7.45,13.97L5.82,21L12,17.27L18.18,21L16.54,13.97L22,9.24Z"
    />
  </Icon>
);

const LineChartIcon = () => (
  <Icon viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M3.5,18.49L9.5,12.48L13.5,16.48L22,6.92L20.59,5.5L13.5,13.48L9.5,9.48L2,16.99L3.5,18.49Z"
    />
  </Icon>
);

const BarChartIcon = () => (
  <Icon viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z"
    />
  </Icon>
);

const PieChartIcon = () => (
  <Icon viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M21,12V13C21,16.87 17.87,20 14,20H10C6.13,20 3,16.87 3,13V12H21M21,11H3C3,7.13 6.13,4 10,4H14C17.87,4 21,7.13 21,11Z"
    />
  </Icon>
);

const FilterIcon = () => (
  <Icon viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3H19C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z"
    />
  </Icon>
);

const ReportsPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 saniye
  const [dashboardData, setDashboardData] = useState({
    totalSessions: 0,
    totalMessages: 0,
    activeSessions: 0,
    contextRate: 0,
    sessionDuration: 0,
    messageByTime: [],
    topTopics: []
  });

  // Tema renkleri
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  // Responsive değerler
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const gridColumns = useBreakpointValue({ base: 1, md: 2, lg: 3 }) ?? 1;
  
  // Raporları getir
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching dashboard data...");
        setLoading(true);
        
        const [reportsRes, favoritesRes, summaryRes] = await Promise.all([
          api.get('/reports/list'),
          api.get('/reports/favorites'),
          api.get('/reports/summary')
        ]);

        if (reportsRes.data.status === 'success') {
          console.log("Reports fetched:", reportsRes.data.reports);
          setReports(reportsRes.data.reports || []);
        }
        
        if (favoritesRes.data.status === 'success') {
          console.log("Favorites fetched:", favoritesRes.data.favorites);
          setFavorites(favoritesRes.data.favorites || []);
        }
        
        if (summaryRes.data.status === 'success') {
          console.log("Summary data fetched:", summaryRes.data.summary);
          setSummaryData(summaryRes.data.summary);
      }
        
        // Örnek dashboard verisi
        setDashboardData({
          totalSessions: 1208,
          totalMessages: 15789,
          activeSessions: 42,
          contextRate: 68,
          sessionDuration: 12.5,
          messageByTime: [25, 40, 35, 50, 49, 60, 70, 91, 125, 130, 101, 90, 85, 100, 120, 85, 75, 80, 85, 70, 65, 45, 30, 20],
          topTopics: [
            { name: 'Çalışma Saatleri', count: 245 },
            { name: 'Bilet Fiyatları', count: 198 },
            { name: 'Osmanlı Dönemi', count: 156 },
            { name: 'Deniz Araçları', count: 134 },
            { name: 'Atatürk', count: 112 }
          ]
        });
    } catch (err) {
        console.error('Error fetching data:', err);
        setError('Veriler yüklenirken bir hata oluştu');
        toast({
          title: 'Hata',
          description: 'Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
    } finally {
      setLoading(false);
    }
  };
  
    fetchData();

    // Otomatik yenileme
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [toast, autoRefresh, refreshInterval]);

  // Raporları filtrele
  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return reports;
    
    return reports.filter(report => 
      report.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reports, searchTerm]);

  // Rapor detayına git
  const handleReportClick = (report) => {
    navigate(`/reports/${report.report_name}`);
  };

  // Favorilere ekle/çıkar
  const handleToggleFavorite = async (report) => {
    try {
      const isFavorite = favorites.includes(report.report_name);
      
      // Favorilere ekle veya çıkar
        if (isFavorite) {
          setFavorites(favorites.filter(id => id !== report.report_name));
        } else {
          setFavorites([...favorites, report.report_name]);
        }
      
      // API isteği
      await api.post(`/reports/${isFavorite ? 'unfavorite' : 'favorite'}/${report.report_name}`);
      
    } catch (err) {
      console.error('Error toggling favorite:', err);
      toast({
        title: 'Hata',
        description: 'Favori işlemi sırasında bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Rapor detay modalı
  const ReportDetailModal = ({ report, isOpen, onClose }) => {
    if (!report) return null;

    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{report.display_name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4}>{report.description}</Text>
            <Divider my={3} />
            <Heading size="sm" mb={2}>Parametreler</Heading>
            {report.parameters && Object.keys(report.parameters).length > 0 ? (
              <SimpleGrid columns={2} spacing={4}>
                {Object.entries(report.parameters).map(([key, value]) => (
                  <Box key={key}>
                    <Text fontWeight="bold">{key}</Text>
                    <Text>{value || 'Varsayılan'}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            ) : (
              <Text>Bu rapor parametre gerektirmez.</Text>
            )}
            
              <Button
              mt={6} 
                colorScheme="blue"
                onClick={() => {
                  onClose();
                handleReportClick(report);
                }}
              width="full"
              >
                Raporu Görüntüle
              </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  };

  // Saatlik mesaj aktivitesi grafik verisi
  const hourlyActivityData = {
    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Mesaj Sayısı',
        data: dashboardData.messageByTime,
        fill: true,
        backgroundColor: 'rgba(66, 153, 225, 0.2)',
        borderColor: 'rgba(66, 153, 225, 1)',
        tension: 0.4
      }
    ]
  };

  // En çok konuşulan konular pasta grafik verisi
  const topTopicsData = {
    labels: dashboardData.topTopics.map(t => t.name),
    datasets: [
      {
        data: dashboardData.topTopics.map(t => t.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Dashboard özet widgetleri
  const renderDashboardSummary = () => (
    <SimpleGrid columns={{base: 1, md: 2, lg: 4}} spacing={5} mb={8}>
      <Card>
            <CardBody>
              <Stat>
                <StatLabel>Toplam Oturum</StatLabel>
            <StatNumber>{dashboardData.totalSessions.toLocaleString()}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
              23% son haftada
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
      
      <Card>
            <CardBody>
              <Stat>
                <StatLabel>Toplam Mesaj</StatLabel>
            <StatNumber>{dashboardData.totalMessages.toLocaleString()}</StatNumber>
                <StatHelpText>
              <StatArrow type="increase" />
              18% son haftada
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
      
      <Card>
            <CardBody>
              <Stat>
            <StatLabel>Aktif Oturumlar</StatLabel>
            <StatNumber>{dashboardData.activeSessions}</StatNumber>
                <StatHelpText>
              <HStack>
                <Icon as={TimeIcon} />
                <Text>Son 24 saatte</Text>
              </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
      
      <Card>
            <CardBody>
              <Stat>
            <StatLabel>Context Kullanımı</StatLabel>
            <StatNumber>{dashboardData.contextRate}%</StatNumber>
                <StatHelpText>
              <StatArrow type="increase" />
              12% önceki aya göre
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
      </SimpleGrid>
  );

  // Dashboard grafikleri
  const renderDashboardCharts = () => (
    <Grid templateColumns={{base: "1fr", lg: "1fr 1fr"}} gap={6} mb={8}>
      <Card>
        <CardHeader>
          <Heading size="md">Saatlik Mesaj Aktivitesi</Heading>
        </CardHeader>
        <CardBody>
          <Box h="300px">
            <Line 
              data={hourlyActivityData} 
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }} 
            />
          </Box>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading size="md">En Çok Konuşulan Konular</Heading>
        </CardHeader>
        <CardBody>
          <Box h="300px" display="flex" alignItems="center" justifyContent="center">
            <Box maxWidth="250px" width="100%">
              <Doughnut 
                data={topTopicsData} 
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right'
                    }
                  }
                }} 
              />
            </Box>
          </Box>
        </CardBody>
      </Card>
    </Grid>
  );

  // Son aktiviteler
  const renderRecentActivity = () => (
    <Card mb={8}>
      <CardHeader>
        <Heading size="md">Son Aktiviteler</Heading>
      </CardHeader>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          {Array.from({length: 5}).map((_, i) => (
            <HStack key={i} p={2} borderWidth="1px" borderRadius="md">
              <Icon as={i % 2 === 0 ? CheckIcon : InfoIcon} color={i % 2 === 0 ? "green.500" : "blue.500"} />
              <Box>
                <Text fontWeight="bold">
                  {i % 2 === 0 ? "Yeni oturum başlatıldı" : "Rapor çalıştırıldı"}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {new Date(Date.now() - i * 3600000).toLocaleString()}
                </Text>
              </Box>
              <Spacer />
              <Badge colorScheme={i % 2 === 0 ? "green" : "blue"}>
                {i % 2 === 0 ? "Oturum" : "Rapor"}
              </Badge>
            </HStack>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );

  // Rapor listesi
  const renderReportList = () => (
    <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={5}>
      {filteredReports.map(report => (
        <Card 
          key={report.report_name}
          cursor="pointer"
          _hover={{ 
            transform: 'translateY(-5px)', 
            boxShadow: 'xl',
            borderColor: accentColor
          }}
          transition="all 0.3s"
          borderWidth="1px"
          onClick={() => handleReportClick(report)}
        >
          <CardHeader pb={0}>
            <Flex>
              <Heading size="md" isTruncated>{report.display_name}</Heading>
              <Spacer />
              <IconButton
                icon={favorites.includes(report.report_name) ? <StarIcon /> : <StarOutlineIcon />}
                variant="ghost"
                aria-label="Favorite"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(report);
                }}
                color={favorites.includes(report.report_name) ? "yellow.500" : "gray.400"}
              />
            </Flex>
          </CardHeader>
          <CardBody>
            <Text noOfLines={2} mb={4}>{report.description}</Text>
            <HStack spacing={2}>
              <Badge colorScheme="blue">Güncel</Badge>
              {report.parameters && Object.keys(report.parameters).length > 0 && (
                <Badge colorScheme="purple">Parametreli</Badge>
              )}
              {report.is_registered && (
                <Badge colorScheme="green">Kayıtlı</Badge>
              )}
            </HStack>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );

  // Yükleniyor göstergesi
  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Heading mb={6}>Dashboard</Heading>
        <SimpleGrid columns={{base: 1, md: 2, lg: 4}} spacing={5} mb={8}>
          {Array.from({length: 4}).map((_, i) => (
            <Skeleton key={i} height="100px" borderRadius="md" />
          ))}
        </SimpleGrid>
        <Grid templateColumns={{base: "1fr", lg: "1fr 1fr"}} gap={6} mb={8}>
          <Skeleton height="300px" borderRadius="md" />
          <Skeleton height="300px" borderRadius="md" />
        </Grid>
        <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={5}>
          {Array.from({length: 6}).map((_, i) => (
            <Skeleton key={i} height="200px" borderRadius="md" />
          ))}
        </SimpleGrid>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <HStack mb={6}>
        <Heading>Knowhy Raporlama</Heading>
            <Spacer />
        <HStack spacing={4}>
          <IconButton
            icon={<RepeatIcon />}
            aria-label="Yenile"
            onClick={() => window.location.reload()}
          />
          <Menu>
            <MenuButton 
              as={Button} 
              rightIcon={<ChevronDownIcon />}
              variant="outline"
            >
              {timeRange === '24h' ? 'Son 24 Saat' : 
               timeRange === '7d' ? 'Son 7 Gün' : 
               timeRange === '30d' ? 'Son 30 Gün' : 'Özel'}
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => setTimeRange('24h')}>Son 24 Saat</MenuItem>
              <MenuItem onClick={() => setTimeRange('7d')}>Son 7 Gün</MenuItem>
              <MenuItem onClick={() => setTimeRange('30d')}>Son 30 Gün</MenuItem>
              <MenuItem onClick={() => setTimeRange('custom')}>Özel Aralık</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </HStack>

      <Tabs 
        variant="enclosed" 
        colorScheme="blue" 
        index={selectedTab}
        onChange={setSelectedTab}
        mb={6}
      >
        <TabList>
          <Tab>Dashboard</Tab>
          <Tab>Raporlar</Tab>
          <Tab>Favoriler</Tab>
        </TabList>
        
        <TabPanels mt={4}>
          {/* Dashboard Paneli */}
          <TabPanel p={0}>
            {renderDashboardSummary()}
            {renderDashboardCharts()}
            {renderRecentActivity()}
          </TabPanel>
          
          {/* Raporlar Paneli */}
          <TabPanel p={0}>
            <InputGroup mb={6}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Rapor ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            {filteredReports.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                <AlertTitle>Rapor bulunamadı</AlertTitle>
                <AlertDescription>Arama kriterlerinize uygun rapor bulunmamaktadır.</AlertDescription>
              </Alert>
            ) : renderReportList()}
          </TabPanel>
          
          {/* Favoriler Paneli */}
          <TabPanel p={0}>
            {favorites.length === 0 ? (
              <Alert status="info">
              <AlertIcon />
                <AlertTitle>Favori rapor yok</AlertTitle>
                <AlertDescription>Henüz favori rapor eklemediniz. Raporlar sekmesinden favori ekleyebilirsiniz.</AlertDescription>
            </Alert>
          ) : (
              <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={5}>
                {filteredReports
                  .filter(report => favorites.includes(report.report_name))
                  .map(report => (
                  <Card
                      key={report.report_name}
                      cursor="pointer"
                      _hover={{ 
                        transform: 'translateY(-5px)', 
                        boxShadow: 'xl',
                        borderColor: 'yellow.500'
                      }}
                      transition="all 0.3s"
                    borderWidth="1px"
                      borderColor="yellow.500"
                      onClick={() => handleReportClick(report)}
                    >
                      <CardHeader pb={0}>
                        <Flex>
                          <Heading size="md" isTruncated>{report.display_name}</Heading>
                          <Spacer />
                            <IconButton
                            icon={<StarIcon />}
                              variant="ghost"
                            color="yellow.500"
                            aria-label="Remove favorite"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(report);
                            }}
                          />
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <Text noOfLines={2} mb={4}>{report.description}</Text>
                        <HStack spacing={2}>
                          <Badge colorScheme="blue">Güncel</Badge>
                          {report.parameters && Object.keys(report.parameters).length > 0 && (
                            <Badge colorScheme="purple">Parametreli</Badge>
                          )}
                        </HStack>
                    </CardBody>
                  </Card>
              ))}
              </SimpleGrid>
          )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Rapor Detay Modalı */}
      <ReportDetailModal
        report={selectedReport}
        isOpen={isOpen}
        onClose={onClose}
      />
    </Container>
  );
};

export default ReportsPage; 