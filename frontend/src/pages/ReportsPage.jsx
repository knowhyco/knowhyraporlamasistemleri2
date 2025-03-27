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
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  // Responsive değerler
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const gridColumns = useBreakpointValue({ base: 1, md: 2, lg: 3 }) ?? 1;
  
  // Dashboard verilerini getir
  const fetchDashboardData = async () => {
    console.log("Fetching dashboard data...");
    try {
      // Sistem özet bilgilerini getir
      const summaryResponse = await api.get('/reports/summary');
      
      // Saatlik aktivite verileri
      const hourlyResponse = await api.get('/reports/run/14_Saatlik_Aktivite_Analizi');
      
      // En çok konuşulan konular
      const topicsResponse = await api.get('/reports/run/4_En_Sik_Sorulan_Sorular_Konular');
      
      // Son aktiviteler
      const recentResponse = await api.get('/reports/run/18_Son_24_saatteki_aktif_oturumlar');
      
      // Haftalık aktivite
      const weeklyResponse = await api.get('/reports/run/7_Haftanin_Gunlerine_Gore_Aktivite_Dagilimi');
      
      // Tüm verileri birleştirip işle
      const summary = summaryResponse.data?.results?.[0] || {};
      
      // Saatlik verileri düzenle (grafik için)
      const hourlyData = hourlyResponse.data?.results || [];
      const hourlyLabels = hourlyData.map(item => `${item.hour_of_day}:00`);
      const hourlyValues = hourlyData.map(item => item.message_count);
      
      // Konuları düzenle (pie chart için)
      const topicsData = topicsResponse.data?.results || [];
      const topicsLabels = topicsData.map(item => item.question_category);
      const topicsValues = topicsData.map(item => item.question_count);
      
      // Son aktiviteleri düzenle (tablo için)
      const recentActivities = recentResponse.data?.results || [];
      
      // Haftalık aktivite verilerini düzenle
      const weeklyData = weeklyResponse.data?.results || [];
      const weeklyActivity = [0, 0, 0, 0, 0, 0, 0]; // Pazar'dan Cumartesi'ye
      
      weeklyData.forEach(item => {
        const dayIndex = parseInt(item.day_of_week);
        if (!isNaN(dayIndex) && dayIndex >= 0 && dayIndex < 7) {
          weeklyActivity[dayIndex] = parseInt(item.session_count);
        }
      });
      
      // Dashboard verilerini güncelle
      setDashboardData({
        totalSessions: summary.total_sessions || 0,
        totalMessages: summary.total_messages || 0,
        activeSessions: summary.active_sessions || 0,
        contextUsage: {
          used: summary.context_used_count || 0,
          notUsed: (summary.ai_messages || 0) - (summary.context_used_count || 0),
          percentage: summary.context_usage_percentage || 0
        },
        messageTrend: 5.2, // Örnek değer, gerçek veri yoksa
        sessionTrend: -2.8, // Örnek değer, gerçek veri yoksa
        avgResponseTime: summary.avg_response_time || 0,
        avgSessionDuration: summary.avg_session_duration || 0,
        messagesByHour: {
          labels: hourlyLabels,
          values: hourlyValues
        },
        topTopics: {
          labels: topicsLabels,
          values: topicsValues
        },
        weeklyActivity: weeklyActivity,
        recentActivities: recentActivities.slice(0, 5) // Son 5 aktivite
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error);
      setLoading(false);
      
      toast({
        title: "Veri yükleme hatası",
        description: "Dashboard verileri yüklenirken bir sorun oluştu.",
        status: "error",
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

  // Ana dashboard grafikleri
  const renderDashboardCharts = () => (
    <Grid templateColumns="repeat(12, 1fr)" gap={6} mb={6}>
      {/* Saatlik Aktivite Grafiği */}
      <GridItem colSpan={{ base: 12, lg: 8 }}>
        <Card 
          bg={cardBg} 
          borderRadius="xl" 
          boxShadow="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          h="100%"
          transition="all 0.2s"
          _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
          overflow="hidden"
        >
          <CardHeader pb={0}>
            <Flex justifyContent="space-between" alignItems="center">
              <Heading size="md" fontWeight="600">Saatlik Mesaj Aktivitesi</Heading>
              <Menu>
                <MenuButton
                  as={IconButton}
                  size="sm"
                  variant="ghost"
                  icon={<SettingsIcon />}
                  aria-label="Grafik ayarları"
                />
                <MenuList>
                  <MenuItem icon={<DownloadIcon />}>Dışa aktar</MenuItem>
                  <MenuItem icon={<RepeatIcon />}>Yenile</MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<CalendarIcon />}>Son 7 gün</MenuItem>
                  <MenuItem icon={<CalendarIcon />}>Son 30 gün</MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          </CardHeader>
          <CardBody pt={2}>
            <Box h="300px">
              {loading ? (
                <Skeleton h="100%" />
              ) : (
                <Line
                  data={{
                    labels: dashboardData.messagesByHour.labels,
                    datasets: [
                      {
                        label: 'Mesaj Sayısı',
                        data: dashboardData.messagesByHour.values,
                        fill: true,
                        backgroundColor: 'rgba(53, 162, 235, 0.2)',
                        borderColor: 'rgba(53, 162, 235, 1)',
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(53, 162, 235, 1)',
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
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'rgba(255, 255, 255, 0.9)',
                        bodyColor: 'rgba(255, 255, 255, 0.9)',
                        cornerRadius: 8,
                        padding: 12,
                        displayColors: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)',
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
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
          </CardBody>
        </Card>
      </GridItem>

      {/* En Çok Konuşulan Konular */}
      <GridItem colSpan={{ base: 12, md: 6, lg: 4 }}>
        <Card 
          bg={cardBg} 
          borderRadius="xl" 
          boxShadow="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          h="100%"
          transition="all 0.2s"
          _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
          overflow="hidden"
        >
          <CardHeader pb={0}>
            <Heading size="md" fontWeight="600">En Çok Konuşulan Konular</Heading>
          </CardHeader>
          <CardBody pt={2}>
            <Box h="300px" display="flex" alignItems="center" justifyContent="center">
              {loading ? (
                <Skeleton h="100%" w="100%" />
              ) : (
                <Doughnut
                  data={{
                    labels: dashboardData.topTopics.labels,
                    datasets: [
                      {
                        data: dashboardData.topTopics.values,
                        backgroundColor: [
                          'rgba(255, 99, 132, 0.7)',
                          'rgba(54, 162, 235, 0.7)',
                          'rgba(255, 206, 86, 0.7)',
                          'rgba(75, 192, 192, 0.7)',
                          'rgba(153, 102, 255, 0.7)',
                        ],
                        borderColor: [
                          'rgba(255, 99, 132, 1)',
                          'rgba(54, 162, 235, 1)',
                          'rgba(255, 206, 86, 1)',
                          'rgba(75, 192, 192, 1)',
                          'rgba(153, 102, 255, 1)',
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
                        },
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'rgba(255, 255, 255, 0.9)',
                        bodyColor: 'rgba(255, 255, 255, 0.9)',
                        cornerRadius: 8,
                        padding: 12,
                      },
                    },
                    cutout: '65%',
                  }}
                />
              )}
            </Box>
          </CardBody>
        </Card>
      </GridItem>

      {/* Haftalık Aktivite Dağılımı */}
      <GridItem colSpan={{ base: 12, md: 6, lg: 6 }}>
        <Card 
          bg={cardBg} 
          borderRadius="xl" 
          boxShadow="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          h="100%"
          transition="all 0.2s"
          _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
          overflow="hidden"
        >
          <CardHeader pb={0}>
            <Heading size="md" fontWeight="600">Haftalık Aktivite Dağılımı</Heading>
          </CardHeader>
          <CardBody pt={2}>
            <Box h="300px">
              {loading ? (
                <Skeleton h="100%" />
              ) : (
                <Bar
                  data={{
                    labels: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
                    datasets: [
                      {
                        label: 'Oturum Sayısı',
                        data: dashboardData.weeklyActivity,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        borderRadius: 8,
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
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'rgba(255, 255, 255, 0.9)',
                        bodyColor: 'rgba(255, 255, 255, 0.9)',
                        cornerRadius: 8,
                        padding: 12,
                        displayColors: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)',
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              )}
            </Box>
          </CardBody>
        </Card>
      </GridItem>

      {/* Son Aktiviteler */}
      <GridItem colSpan={{ base: 12, lg: 6 }}>
        <Card 
          bg={cardBg} 
          borderRadius="xl" 
          boxShadow="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          h="100%"
          transition="all 0.2s"
          _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
          overflow="hidden"
        >
          <CardHeader pb={0}>
            <Flex justifyContent="space-between" alignItems="center">
              <Heading size="md" fontWeight="600">Son Aktiviteler</Heading>
              <Button size="sm" variant="ghost" rightIcon={<ChevronRightIcon />}>
                Tümünü Gör
              </Button>
            </Flex>
          </CardHeader>
          <CardBody pt={4}>
            <VStack align="stretch" spacing={4}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} height="60px" />
                ))
              ) : (
                dashboardData.recentActivities.map((activity, idx) => (
                  <Flex
                    key={idx}
                    p={3}
                    borderWidth="1px"
                    borderRadius="lg"
                    alignItems="center"
                    transition="all 0.2s"
                    _hover={{ bg: useColorModeValue('gray.50', 'gray.700'), transform: 'translateY(-2px)' }}
                  >
                    <Box
                      p={2}
                      bg={idx % 2 === 0 ? 'green.50' : 'blue.50'}
                      color={idx % 2 === 0 ? 'green.500' : 'blue.500'}
                      borderRadius="full"
                      mr={3}
                    >
                      <Icon as={idx % 2 === 0 ? CheckIcon : InfoIcon} w={5} h={5} />
                    </Box>
                    <Box flex="1">
                      <Text fontWeight="semibold" fontSize="sm">
                        {activity.activity}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {activity.date}
                      </Text>
                    </Box>
                    <Badge
                      colorScheme={idx % 2 === 0 ? 'green' : 'blue'}
                      borderRadius="full"
                      px={2}
                    >
                      {idx % 2 === 0 ? 'Oturum' : 'Rapor'}
                    </Badge>
                  </Flex>
                ))
              )}
            </VStack>
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );

  // Dashboard sayfası render ediliyor (index/dashboard sayfası)
  const renderDashboard = () => (
    <Box>
      {/* Header filtreleme bölümü */}
      <Card mb={6} borderRadius="xl" boxShadow="sm">
        <CardBody>
          <Grid templateColumns="repeat(12, 1fr)" gap={4}>
            <GridItem colSpan={{ base: 12, md: 4 }}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input 
                  type="text" 
                  placeholder="Ara..."
                  borderRadius="lg"
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </InputGroup>
            </GridItem>
            
            <GridItem colSpan={{ base: 6, md: 2 }}>
              <Menu closeOnSelect={false}>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  width="100%"
                  borderRadius="lg"
                  variant="outline"
                >
                  Tarih
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => setTimeRange('24h')}>Son 24 Saat</MenuItem>
                  <MenuItem onClick={() => setTimeRange('7d')}>Son 7 Gün</MenuItem>
                  <MenuItem onClick={() => setTimeRange('30d')}>Son 30 Gün</MenuItem>
                  <MenuItem onClick={() => setTimeRange('custom')}>Özel Aralık</MenuItem>
                </MenuList>
              </Menu>
            </GridItem>
            
            <GridItem colSpan={{ base: 6, md: 2 }}>
              <Menu closeOnSelect={false}>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  width="100%"
                  borderRadius="lg"
                  variant="outline"
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
                  rightIcon={<SettingsIcon />}
                  width="100%"
                  borderRadius="lg"
                  variant="outline"
                >
                  Görünüm
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<RepeatIcon />} onClick={() => fetchDashboardData()}>
                    Yenile
                  </MenuItem>
                  <MenuItem
                    icon={autoRefresh ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={() => setAutoRefresh(!autoRefresh)}
                  >
                    {autoRefresh ? 'Otomatik Yenilemeyi Kapat' : 'Otomatik Yenileme'}
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<DownloadIcon />}>
                    PDF Olarak İndir
                  </MenuItem>
                </MenuList>
              </Menu>
            </GridItem>
            
            <GridItem colSpan={{ base: 6, md: 2 }}>
              <Button 
                leftIcon={<RepeatIcon />}
                width="100%"
                borderRadius="lg"
                colorScheme="blue"
                onClick={() => fetchDashboardData()}
              >
                Yenile
              </Button>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
      
      {/* Ana içerik alanı */}
      {renderDashboardSummary()}
      {renderDashboardCharts()}
    </Box>
  );
  
  // Rapor listesi render ediliyor
  const renderReportList = () => (
    <Box>
      {/* Filtre ve arama bar */}
      <Card mb={6} borderRadius="xl" boxShadow="sm">
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
                >
                  <Icon as={HamburgerIcon} />
                </Button>
                <Button 
                  flex="1"
                  borderRadius="0 lg lg 0"
                  colorScheme={viewMode === 'list' ? 'blue' : 'gray'}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
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
      ))}
    </SimpleGrid>
    </Box>
  );

  const renderDashboardSummary = () => (
    <Grid templateColumns="repeat(12, 1fr)" gap={6} mb={6}>
      {/* Toplam Oturum Sayısı */}
      <GridItem colSpan={{ base: 6, md: 3 }}>
        <Card 
          bg={cardBg} 
          borderRadius="xl" 
          boxShadow="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.2s"
          _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
          overflow="hidden"
        >
          <CardBody>
            <Flex align="center">
              <Box 
                p={3} 
                borderRadius="full" 
                bg="blue.50" 
                color="blue.500" 
                mr={4}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={ChatIcon} boxSize={6} />
              </Box>
              <Box>
                <Text fontWeight="medium" fontSize="sm" color="gray.500">Toplam Oturum</Text>
                {loading ? (
                  <Skeleton height="30px" width="90px" mt={1} />
                ) : (
                  <Flex align="center">
                    <Text fontWeight="bold" fontSize="2xl">{dashboardData.totalSessions.toLocaleString()}</Text>
                    <Flex align="center" ml={2} color={dashboardData.sessionTrend > 0 ? "green.500" : "red.500"}>
                      <Icon 
                        as={dashboardData.sessionTrend > 0 ? ArrowUpIcon : ArrowDownIcon} 
                        boxSize={3} 
                        mr={1} 
                      />
                      <Text fontSize="sm" fontWeight="medium">
                        {Math.abs(dashboardData.sessionTrend)}%
                      </Text>
                    </Flex>
                  </Flex>
                )}
                <Text fontSize="xs" color="gray.500" mt={1}>son haftada</Text>
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </GridItem>

      {/* Toplam Mesaj Sayısı */}
      <GridItem colSpan={{ base: 6, md: 3 }}>
        <Card 
          bg={cardBg} 
          borderRadius="xl" 
          boxShadow="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.2s"
          _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
          overflow="hidden"
        >
          <CardBody>
            <Flex align="center">
              <Box 
                p={3} 
                borderRadius="full" 
                bg="purple.50" 
                color="purple.500" 
                mr={4}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={InfoIcon} boxSize={6} />
              </Box>
              <Box>
                <Text fontWeight="medium" fontSize="sm" color="gray.500">Toplam Mesaj</Text>
                {loading ? (
                  <Skeleton height="30px" width="90px" mt={1} />
                ) : (
                  <Flex align="center">
                    <Text fontWeight="bold" fontSize="2xl">{dashboardData.totalMessages.toLocaleString()}</Text>
                    <Flex align="center" ml={2} color={dashboardData.messageTrend > 0 ? "green.500" : "red.500"}>
                      <Icon 
                        as={dashboardData.messageTrend > 0 ? ArrowUpIcon : ArrowDownIcon} 
                        boxSize={3} 
                        mr={1} 
                      />
                      <Text fontSize="sm" fontWeight="medium">
                        {Math.abs(dashboardData.messageTrend)}%
                      </Text>
                    </Flex>
                  </Flex>
                )}
                <Text fontSize="xs" color="gray.500" mt={1}>son haftada</Text>
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </GridItem>

      {/* Aktif Oturumlar */}
      <GridItem colSpan={{ base: 6, md: 3 }}>
        <Card 
          bg={cardBg} 
          borderRadius="xl" 
          boxShadow="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.2s"
          _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
          overflow="hidden"
        >
          <CardBody>
            <Flex align="center">
              <Box 
                p={3} 
                borderRadius="full" 
                bg="green.50" 
                color="green.500" 
                mr={4}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={TimeIcon} boxSize={6} />
              </Box>
              <Box>
                <Text fontWeight="medium" fontSize="sm" color="gray.500">Aktif Oturumlar</Text>
                {loading ? (
                  <Skeleton height="30px" width="90px" mt={1} />
                ) : (
                  <Text fontWeight="bold" fontSize="2xl">{dashboardData.activeSessions}</Text>
                )}
                <Text fontSize="xs" color="gray.500" mt={1}>Son 24 saatte</Text>
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </GridItem>

      {/* Context Kullanımı */}
      <GridItem colSpan={{ base: 6, md: 3 }}>
        <Card 
          bg={cardBg} 
          borderRadius="xl" 
          boxShadow="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.2s"
          _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
          overflow="hidden"
        >
          <CardBody>
            <Flex align="center">
              <Box 
                p={3} 
                borderRadius="full" 
                bg="teal.50" 
                color="teal.500" 
                mr={4}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={ViewIcon} boxSize={6} />
              </Box>
              <Box width="100%">
                <Text fontWeight="medium" fontSize="sm" color="gray.500">Context Kullanımı</Text>
                {loading ? (
                  <Skeleton height="30px" width="90px" mt={1} />
                ) : (
                  <Flex align="center">
                    <Text fontWeight="bold" fontSize="2xl">{dashboardData.contextUsage.percentage}%</Text>
                    <Flex align="center" ml={2} color="green.500">
                      <Icon as={ArrowUpIcon} boxSize={3} mr={1} />
                      <Text fontSize="sm" fontWeight="medium">12%</Text>
                    </Flex>
                  </Flex>
                )}
                <Progress 
                  value={dashboardData.contextUsage.percentage} 
                  size="xs" 
                  colorScheme="teal" 
                  borderRadius="full" 
                  mt={2}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>önceki aya göre</Text>
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );

  // Ana render
    return (
    <Box p={4}>
      <Flex mb={6} alignItems="center">
        <Heading size="lg">Knowhy Raporlama</Heading>
            <Spacer />
        <HStack spacing={2}>
          <Button
            leftIcon={<RepeatIcon />}
            colorScheme="blue"
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData()}
            isLoading={loading}
          >
            Son 24 Saat
          </Button>
          <IconButton
            aria-label="Ayarlar"
            icon={<SettingsIcon />}
            variant="ghost"
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
      >
        <TabList>
          <Tab>Dashboard</Tab>
          <Tab>Raporlar</Tab>
          <Tab>Favoriler</Tab>
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
                      <CardHeader pb={0}>
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