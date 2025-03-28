import "../custom-force.css";
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
  ButtonGroup,
  Progress,
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
  ChatIcon,
  ArrowUpIcon,
  ArrowDownIcon,
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
    contextUsage: {
      used: 0,
      notUsed: 0,
      percentage: 0
    },
    messageTrend: 0, // Yüzdelik artış/azalış 
    sessionTrend: 0, // Yüzdelik artış/azalış
    avgResponseTime: 0,
    avgSessionDuration: 0,
    messagesByHour: [],
    topTopics: [],
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0], // Haftanın günlerine göre
    recentActivities: []
  });

  // Tema renkleri
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Son Aktiviteler kartında kullanılan hover background değerini burada tanımlayalım
  const activityHoverBg = useColorModeValue('gray.50', 'gray.700');

  // Responsive değerler
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const gridColumns = useBreakpointValue({ base: 1, md: 2, lg: 3 }) ?? 1;
  
  // Dashboard verilerini getir
  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      
      // Son 24 saatte toplam session, mesaj vs sayıları
      const summaryResponse = await api.get('/reports/summary');
      
      // Rapor listesini al
      const reportsResponse = await api.get('/reports/list');
      
      // Favori raporlar
      const favoritesResponse = await api.get('/reports/favorites');
      
      // Saatlik Aktivite raporu için çağrı
      try {
        // GET metodu ile rapor çalıştır
        const hourlyActivityResponse = await api.get('/reports/run/14_Saatlik_Aktivite_Analizi');
        
        if (hourlyActivityResponse.data.status === 'success') {
          setHourlyActivity(hourlyActivityResponse.data.results);
        }
      } catch (error) {
        console.error('Error fetching hourly activity data:', error);
        // Hata durumunda sessizce devam et
      }
      
      // UI state'i güncelle
      setReports(reportsResponse.data.reports);
      console.log('Reports fetched:', reportsResponse.data.reports);
      
      setFavorites(favoritesResponse.data.favorites);
      console.log('Favorites fetched:', favoritesResponse.data.favorites);
      
      setSummaryData(summaryResponse.data);
      console.log('Summary data fetched:', summaryResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      
      // Toast notification ile kullanıcıya bilgi ver
      toast({
        title: 'Veri yükleme hatası',
        description: `${error.response?.data?.message || 'Veriler yüklenirken bir sorun oluştu'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Sayfa yüklendiğinde veri çek
  useEffect(() => {
    fetchDashboardData();
    
    // Opsiyonel otomatik yenileme
    let refreshTimer;
    if (autoRefresh) {
      refreshTimer = setInterval(fetchDashboardData, refreshInterval);
    }
    
    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, [autoRefresh, refreshInterval]);
  
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
          contextUsage: {
            used: 30,
            notUsed: 12,
            percentage: 70
          },
          messageTrend: 5.2,
          sessionTrend: -2.8,
          avgResponseTime: 12.5,
          avgSessionDuration: 12.5,
          messagesByHour: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            values: Array.from({length: 24}, (_, i) => i * 25)
          },
          topTopics: {
            labels: ['Çalışma Saatleri', 'Bilet Fiyatları', 'Osmanlı Dönemi', 'Deniz Araçları', 'Atatürk'],
            values: [245, 198, 156, 134, 112]
          },
          weeklyActivity: [25, 40, 35, 50, 49, 60, 70],
          recentActivities: Array.from({length: 5}, (_, i) => ({
            id: i + 1,
            activity: i % 2 === 0 ? 'Yeni oturum başlatıldı' : 'Rapor çalıştırıldı',
            date: new Date(Date.now() - i * 3600000).toLocaleString()
          }))
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
      // Rapor adına göre favoriye ekle/çıkar
      const response = await api.post(`/reports/favorite/${report.report_name}`);
      
      // UI'ı güncelle
      setReports(prevReports => 
        prevReports.map(r => 
          r.id === report.id ? { ...r, is_favorite: response.data.is_favorite } : r
        )
      );
      
      // Favori listesini güncelle
      fetchFavorites();
      
      // Kullanıcıya bilgi ver
      toast({
        title: response.data.message,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      toast({
        title: 'İşlem Hatası',
        description: `Favori durumu değiştirilemedi: ${error.response?.data?.message || 'Bilinmeyen hata'}`,
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

  // Ana dashboard gösterimi
  const renderDashboard = () => (
    <Box className="page-container">
      {/* Dashboard Başlık */}
      <Flex justifyContent="space-between" alignItems="center" mb={5}>
        <Box>
          <Heading as="h1" fontSize="2xl" fontWeight="700" mb={1}>
            Knowhy Raporlama Sistemi
          </Heading>
          <Text color="gray.400" fontSize="sm">
            Son güncelleme: {new Date().toLocaleString('tr-TR')}
          </Text>
        </Box>
        <HStack spacing={3}>
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              variant="outline"
              className="btn-outline"
              size="sm"
            >
              {timeRange === '24h' && 'Son 24 Saat'}
              {timeRange === '7d' && 'Son 7 Gün'}
              {timeRange === '30d' && 'Son 30 Gün'}
              {timeRange === 'custom' && 'Özel Aralık'}
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => setTimeRange('24h')}>Son 24 Saat</MenuItem>
              <MenuItem onClick={() => setTimeRange('7d')}>Son 7 Gün</MenuItem>
              <MenuItem onClick={() => setTimeRange('30d')}>Son 30 Gün</MenuItem>
              <MenuItem onClick={() => setTimeRange('custom')}>Özel Aralık</MenuItem>
            </MenuList>
          </Menu>
          <Button
            className="custom-button btn-primary"
            size="sm"
            leftIcon={<RepeatIcon />}
            onClick={() => {
              setLoading(true);
              fetchDashboardData();
            }}
          >
            Yenile
          </Button>
        </HStack>
      </Flex>

      {/* İstatistik Kartları */}
      <Box className="dashboard-grid" mb={6}>
        <Box className="stat-card">
          <Box className="stat-icon-container">
            <ChatIcon />
          </Box>
          <Box className="stat-value">{dashboardData.totalSessions.toLocaleString()}</Box>
          <Box className="stat-label">Toplam Oturum</Box>
          <Box className={`stat-trend ${dashboardData.sessionTrend > 0 ? 'trend-up' : 'trend-down'}`}>
            {dashboardData.sessionTrend > 0 ? <ArrowUpIcon mr={1} /> : <ArrowDownIcon mr={1} />}
            {Math.abs(dashboardData.sessionTrend)}% {dashboardData.sessionTrend > 0 ? 'artış' : 'azalış'}
          </Box>
        </Box>

        <Box className="stat-card success">
          <Box className="stat-icon-container">
            <InfoIcon />
          </Box>
          <Box className="stat-value">{dashboardData.totalMessages.toLocaleString()}</Box>
          <Box className="stat-label">Toplam Mesaj</Box>
          <Box className={`stat-trend ${dashboardData.messageTrend > 0 ? 'trend-up' : 'trend-down'}`}>
            {dashboardData.messageTrend > 0 ? <ArrowUpIcon mr={1} /> : <ArrowDownIcon mr={1} />}
            {Math.abs(dashboardData.messageTrend)}% {dashboardData.messageTrend > 0 ? 'artış' : 'azalış'}
          </Box>
        </Box>

        <Box className="stat-card warning">
          <Box className="stat-icon-container">
            <TimeIcon />
          </Box>
          <Box className="stat-value">{dashboardData.avgResponseTime.toFixed(2)}s</Box>
          <Box className="stat-label">Ortalama Yanıt Süresi</Box>
          <Box className="stat-trend trend-up">
            <ArrowUpIcon mr={1} />
            5.2% daha hızlı
          </Box>
        </Box>

        <Box className="stat-card info">
          <Box className="stat-icon-container">
            <ViewIcon />
          </Box>
          <Box className="stat-value">{dashboardData.contextUsage.percentage}%</Box>
          <Box className="stat-label">Context Kullanım Oranı</Box>
          <Box className="progress-container" mt={2}>
            <Box 
              className="progress-bar" 
              width={`${dashboardData.contextUsage.percentage}%`}
            ></Box>
          </Box>
        </Box>
      </Box>

      {/* Üst Ana Grafikler */}
      <Box className="dashboard-grid">
        {/* Saatlik Aktivite Grafiği - 2 kolon genişliğinde */}
        <Box className="dashboard-card dashboard-grid-col-2">
          <Box className="card-header">
            <Heading as="h3" fontSize="md">Saatlik Mesaj Aktivitesi</Heading>
            <HStack>
              <Menu>
                <MenuButton
                  as={IconButton}
                  size="sm"
                  variant="ghost"
                  icon={<SettingsIcon />}
                  aria-label="Grafik ayarları"
                />
                <MenuList>
                  <MenuItem icon={<DownloadIcon />}>CSV olarak indir</MenuItem>
                  <MenuItem icon={<RepeatIcon />}>Yenile</MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Box>
          <Box className="card-body">
            <Box className="chart-container" height="300px">
              {loading ? (
                <Skeleton height="100%" />
              ) : (
                <Line
                  data={{
                    labels: dashboardData.messagesByHour.labels,
                    datasets: [
                      {
                        label: 'Mesaj Sayısı',
                        data: dashboardData.messagesByHour.values,
                        fill: true,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderColor: '#3b82f6',
                        tension: 0.4,
                        pointBackgroundColor: '#3b82f6',
                        pointRadius: 3,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: 'rgba(248, 250, 252, 0.95)',
                        bodyColor: 'rgba(248, 250, 252, 0.95)',
                        cornerRadius: 8,
                        padding: 12,
                        displayColors: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(203, 213, 225, 0.1)',
                        },
                        ticks: {
                          color: 'rgba(203, 213, 225, 0.8)',
                        }
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          color: 'rgba(203, 213, 225, 0.8)',
                        }
                      },
                    },
                    interaction: {
                      intersect: false,
                      mode: 'index',
                    },
                    elements: {
                      line: {
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* En Çok Konuşulan Konular - 1 kolon genişliğinde */}
        <Box className="glass-card">
          <Box className="card-header">
            <Heading as="h3" fontSize="md">En Çok Konuşulan Konular</Heading>
          </Box>
          <Box className="card-body">
            <Box className="chart-container" height="220px">
              {loading ? (
                <Skeleton height="100%" width="100%" />
              ) : (
                <Doughnut
                  data={{
                    labels: dashboardData.topTopics.labels,
                    datasets: [
                      {
                        data: dashboardData.topTopics.values,
                        backgroundColor: [
                          'rgba(37, 99, 235, 0.8)',
                          'rgba(16, 185, 129, 0.8)', 
                          'rgba(239, 68, 68, 0.8)',
                          'rgba(245, 158, 11, 0.8)',
                          'rgba(99, 102, 241, 0.8)',
                        ],
                        borderColor: [
                          'rgba(37, 99, 235, 1)',
                          'rgba(16, 185, 129, 1)',
                          'rgba(239, 68, 68, 1)',
                          'rgba(245, 158, 11, 1)',
                          'rgba(99, 102, 241, 1)',
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          pointStyle: 'circle',
                          color: 'rgba(203, 213, 225, 0.9)',
                          font: {
                            size: 11
                          }
                        },
                      },
                      tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: 'rgba(248, 250, 252, 0.95)',
                        bodyColor: 'rgba(248, 250, 252, 0.95)',
                        cornerRadius: 8,
                        padding: 12,
                      },
                    },
                    cutout: '70%',
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Haftalık Aktivite - 1 kolon genişliğinde */}
        <Box className="dashboard-card">
          <Box className="card-header">
            <Heading as="h3" fontSize="md">Haftalık Aktivite Dağılımı</Heading>
          </Box>
          <Box className="card-body">
            <Box className="chart-container" height="220px">
              {loading ? (
                <Skeleton height="100%" />
              ) : (
                <Bar
                  data={{
                    labels: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
                    datasets: [
                      {
                        label: 'Oturum Sayısı',
                        data: dashboardData.weeklyActivity,
                        backgroundColor: 'rgba(14, 165, 233, 0.7)',
                        borderColor: 'rgba(14, 165, 233, 1)',
                        borderWidth: 1,
                        borderRadius: 6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: 'rgba(248, 250, 252, 0.95)',
                        bodyColor: 'rgba(248, 250, 252, 0.95)',
                        cornerRadius: 8,
                        padding: 12,
                        displayColors: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(203, 213, 225, 0.1)',
                        },
                        ticks: {
                          color: 'rgba(203, 213, 225, 0.8)',
                        }
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          color: 'rgba(203, 213, 225, 0.8)',
                        }
                      },
                    },
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Son Aktiviteler - 1 kolon genişliğinde */}
        <Box className="dashboard-card dashboard-grid-row-2">
          <Box className="card-header">
            <Heading as="h3" fontSize="md">Son Aktiviteler</Heading>
            <HStack>
              <Badge className="badge-primary">Canlı</Badge>
            </HStack>
          </Box>
          <Box className="card-body" overflowY="auto" maxHeight="480px">
            {loading ? (
              Array(5).fill(0).map((_, index) => (
                <Skeleton height="80px" mb={3} key={index} />
              ))
            ) : (
              dashboardData.recentActivities.map((activity, index) => (
                <Box key={index} className="activity-item">
                  <Box className="activity-icon">
                    <ChatIcon />
                  </Box>
                  <Box className="activity-content">
                    <Box className="activity-title">{activity.session_id}</Box>
                    <Box className="activity-subtitle">
                      {activity.message_count} mesaj • {activity.session_duration}
                    </Box>
                  </Box>
                  <Box className="activity-time">
                    {new Date(activity.last_message).toLocaleTimeString('tr-TR')}
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>

        {/* SQL Raporları - 2 kolon genişliğinde */}
        <Box className="dashboard-card dashboard-grid-col-2">
          <Box className="card-header">
            <Heading as="h3" fontSize="md">SQL Raporları</Heading>
            <Button 
              size="sm" 
              className="custom-button btn-primary"
              onClick={() => setSelectedTab(1)}
            >
              Tüm Raporlar
            </Button>
          </Box>
          <Box className="card-body">
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {reports.slice(0, 6).map((report) => (
                <Box 
                  key={report.id} 
                  className="report-card"
                  onClick={() => handleReportClick(report)}
                  cursor="pointer"
                >
                  <Box className="report-card-header">
                    <Text fontWeight="600" fontSize="sm" noOfLines={1}>{report.name}</Text>
                    <IconButton
                      aria-label="Favori"
                      icon={favorites.includes(report.id) ? <StarIcon color="yellow.400" /> : <StarOutlineIcon />}
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(report);
                      }}
                    />
                  </Box>
                  <Box className="report-card-body">
                    <Text fontSize="xs" color="gray.400" noOfLines={2}>
                      {report.description || "Bu rapor için açıklama bulunmamaktadır."}
                    </Text>
                  </Box>
                  <Box className="report-card-footer">
                    <Badge className="badge-primary">{report.category}</Badge>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  // Rapor listesi render ediliyor
  const renderReportList = () => (
    <Box>
      {/* Filtre ve arama bar */}
      <Card className="stat-card" mb={6} borderRadius="xl">
        <CardBody>
          <Grid templateColumns="repeat(12, 1fr)" gap={4}>
            <GridItem colSpan={{ base: 12, md: 5 }}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input 
                  type="text" 
                  placeholder="Rapor ara..."
                  borderRadius="lg"
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </InputGroup>
            </GridItem>
            
            <GridItem colSpan={{ base: 6, md: 3 }}>
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  width="100%"
                  borderRadius="lg"
                  variant="outline"
                  className="modern-button"
                >
                  Kategori
                </MenuButton>
                <MenuList>
                  <MenuItem>Tüm Kategoriler</MenuItem>
                  <MenuItem>Zaman Bazlı Analizler</MenuItem>
                  <MenuItem>İçerik Analizleri</MenuItem>
                  <MenuItem>Performans Metrikleri</MenuItem>
                  <MenuItem>Detaylı Görünümler</MenuItem>
                </MenuList>
              </Menu>
            </GridItem>
            
            <GridItem colSpan={{ base: 6, md: 2 }}>
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  width="100%"
                  borderRadius="lg" 
                  variant="outline"
                  className="modern-button"
                >
                  Sırala
                </MenuButton>
                <MenuList>
                  <MenuItem>İsme Göre (A-Z)</MenuItem>
                  <MenuItem>İsme Göre (Z-A)</MenuItem>
                  <MenuItem>En Sık Kullanılan</MenuItem>
                  <MenuItem>En Son Eklenen</MenuItem>
                </MenuList>
              </Menu>
            </GridItem>
            
            <GridItem colSpan={{ base: 12, md: 2 }}>
              <ButtonGroup isAttached width="100%">
                <Button 
                  flex="1"
                  borderRadius="lg 0 0 lg"
                  colorScheme={viewMode === 'grid' ? 'blue' : 'gray'}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className="modern-button"
                >
                  <Icon as={HamburgerIcon} />
                </Button>
                <Button 
                  flex="1"
                  borderRadius="0 lg lg 0"
                  colorScheme={viewMode === 'list' ? 'blue' : 'gray'}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className="modern-button"
                >
                  <Icon as={ViewIcon} />
                </Button>
              </ButtonGroup>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
      
      {/* Rapor kartları grid */}
      <SimpleGrid columns={{base: 1, md: 2, lg: viewMode === 'grid' ? 3 : 1}} spacing={5}>
      {filteredReports.map(report => (
        <Card className="stat-card" 
          key={report.report_name}
          cursor="pointer"
          transition="all 0.3s"
          borderWidth="1px"
          borderRadius="xl"
          onClick={() => handleReportClick(report)}
        >
          <CardHeader className="card-header" pb={0}>
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
                className="modern-button"
              />
            </Flex>
          </CardHeader>
          <CardBody>
            <Text noOfLines={2} mb={4}>{report.description}</Text>
            <HStack spacing={2}>
                <Badge colorScheme="blue" borderRadius="full" className="custom-badge">Güncel</Badge>
              {report.parameters && Object.keys(report.parameters).length > 0 && (
                  <Badge colorScheme="purple" borderRadius="full" className="custom-badge">Parametreli</Badge>
              )}
              {report.is_registered && (
                  <Badge colorScheme="green" borderRadius="full" className="custom-badge">Kayıtlı</Badge>
              )}
            </HStack>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
    </Box>
  );

  // Ana render
    return (
    <Box p={4}>
      <Flex mb={6} alignItems="center" className="navbar">
        <Heading size="lg">Knowhy Raporlama</Heading>
        <Spacer />
        <HStack spacing={4}>
          <Button
            leftIcon={<RepeatIcon />}
            colorScheme="blue"
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData()}
            isLoading={loading}
            className="modern-button"
          >
            Son 24 Saat
          </Button>
          <IconButton
            aria-label="Ayarlar"
            icon={<SettingsIcon />}
            variant="ghost"
            className="modern-button"
          />
          <Avatar
            size="sm"
            name="Knowhy Admin"
            bg="blue.500"
          />
        </HStack>
      </Flex>

      {/* Tab navigasyonu */}
      <Tabs 
        colorScheme="blue" 
        variant="enclosed" 
        index={selectedTab}
        onChange={setSelectedTab}
        mb={6}
        className="tabs-container"
      >
        <TabList>
          <Tab className="tab-button">Dashboard</Tab>
          <Tab className="tab-button">Raporlar</Tab>
          <Tab className="tab-button">Favoriler</Tab>
        </TabList>
        
        <TabPanels mt={4}>
          <TabPanel p={0}>
            {renderDashboard()}
          </TabPanel>
          
          <TabPanel p={0}>
            {renderReportList()}
          </TabPanel>
          
          <TabPanel p={0}>
            <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={5}>
            {favorites.length === 0 ? (
                <Alert status="info" borderRadius="md">
              <AlertIcon />
                  <AlertTitle>Henüz favori raporunuz yok</AlertTitle>
                  <AlertDescription>
                    Raporlar bölümünden sık kullandığınız raporları favorilere ekleyebilirsiniz.
                  </AlertDescription>
            </Alert>
          ) : (
                filteredReports
                  .filter(report => favorites.includes(report.report_name))
                  .map(report => (
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
                      borderRadius="xl"
                      onClick={() => handleReportClick(report)}
                    >
                      <CardHeader className="card-header" pb={0}>
                        <Flex>
                          <Heading size="md" isTruncated>{report.display_name}</Heading>
                          <Spacer />
                            <IconButton
                            icon={<StarIcon />}
                              variant="ghost"
                            aria-label="Remove from favorites"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(report);
                            }}
                            color="yellow.500"
                          />
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <Text noOfLines={2} mb={4}>{report.description}</Text>
                        <HStack spacing={2}>
                          <Badge colorScheme="blue" borderRadius="full">Güncel</Badge>
                          {report.parameters && Object.keys(report.parameters).length > 0 && (
                            <Badge colorScheme="purple" borderRadius="full">Parametreli</Badge>
                          )}
                          {report.is_registered && (
                            <Badge colorScheme="green" borderRadius="full">Kayıtlı</Badge>
                          )}
                        </HStack>
                    </CardBody>
                  </Card>
                  ))
          )}
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Rapor detay modalı */}
      {selectedReport && (
      <ReportDetailModal
        report={selectedReport}
        isOpen={isOpen}
          onClose={() => {
            onClose();
            setSelectedReport(null);
          }}
      />
      )}
    </Box>
  );
};

export default ReportsPage; 