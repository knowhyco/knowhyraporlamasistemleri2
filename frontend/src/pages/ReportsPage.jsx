import "../custom-force.css";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
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
import GridLayout from 'react-grid-layout';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  PieChart, 
  Pie as PieRecharts, 
  BarChart as RechartsBarChart, 
  ResponsiveContainer,
  Cell,
  Bar as RechartsBar
} from 'recharts';
import { 
  ChatBubbleLeftRightIcon, 
  InformationCircleIcon, 
  ClockIcon, 
  EyeIcon, 
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowPathIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

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

const MotionBox = motion.create(Box);

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
  const [hourlyActivity, setHourlyActivity] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [isCustomizing, setIsCustomizing] = useState(false);
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
  const [layouts, setLayouts] = useState({
    lg: [
      { i: 'totalSessions', x: 0, y: 0, w: 3, h: 1 },
      { i: 'totalMessages', x: 3, y: 0, w: 3, h: 1 },
      { i: 'responseTime', x: 6, y: 0, w: 3, h: 1 },
      { i: 'contextUsage', x: 9, y: 0, w: 3, h: 1 },
      { i: 'hourlyActivity', x: 0, y: 1, w: 8, h: 2 },
      { i: 'topTopics', x: 8, y: 1, w: 4, h: 2 },
      { i: 'weeklyActivity', x: 0, y: 3, w: 4, h: 2 },
      { i: 'recentActivities', x: 4, y: 3, w: 4, h: 4 },
      { i: 'sqlReports', x: 8, y: 3, w: 4, h: 2 }
    ],
    md: [
      { i: 'totalSessions', x: 0, y: 0, w: 3, h: 1 },
      { i: 'totalMessages', x: 3, y: 0, w: 3, h: 1 },
      { i: 'responseTime', x: 0, y: 1, w: 3, h: 1 },
      { i: 'contextUsage', x: 3, y: 1, w: 3, h: 1 },
      { i: 'hourlyActivity', x: 0, y: 2, w: 6, h: 2 },
      { i: 'topTopics', x: 0, y: 4, w: 6, h: 2 },
      { i: 'weeklyActivity', x: 0, y: 6, w: 6, h: 2 },
      { i: 'recentActivities', x: 0, y: 8, w: 6, h: 3 },
      { i: 'sqlReports', x: 0, y: 11, w: 6, h: 2 }
    ],
    sm: [
      { i: 'totalSessions', x: 0, y: 0, w: 2, h: 1 },
      { i: 'totalMessages', x: 2, y: 0, w: 2, h: 1 },
      { i: 'responseTime', x: 0, y: 1, w: 2, h: 1 },
      { i: 'contextUsage', x: 2, y: 1, w: 2, h: 1 },
      { i: 'hourlyActivity', x: 0, y: 2, w: 4, h: 2 },
      { i: 'topTopics', x: 0, y: 4, w: 4, h: 2 },
      { i: 'weeklyActivity', x: 0, y: 6, w: 4, h: 2 },
      { i: 'recentActivities', x: 0, y: 8, w: 4, h: 3 },
      { i: 'sqlReports', x: 0, y: 11, w: 4, h: 2 }
    ]
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
      
      // İlgili verileri almaya çalış
      const requests = [
        api.get('/reports/list').catch(e => ({ data: { reports: [] } })),
        api.get('/reports/favorites').catch(e => ({ data: { favorites: [] } })),
        api.get('/reports/summary').catch(e => ({ data: { summary: null } }))
      ];
      
      const [reportsResponse, favoritesResponse, summaryResponse] = await Promise.all(requests);
      
      // UI state'i güncelle
      if (reportsResponse.data && reportsResponse.data.reports) {
        setReports(reportsResponse.data.reports);
        console.log('Reports fetched:', reportsResponse.data.reports);
      }
      
      if (favoritesResponse.data && favoritesResponse.data.favorites) {
        setFavorites(favoritesResponse.data.favorites || []);
        console.log('Favorites fetched:', favoritesResponse.data.favorites);
      }
      
      if (summaryResponse.data && summaryResponse.data.summary) {
        setSummaryData(summaryResponse.data.summary);
        console.log('Summary data fetched:', summaryResponse.data.summary);
      }
      
      // Saatlik Aktivite raporu için çağrı
      try {
        // GET metodu ile rapor çalıştır
        const hourlyActivityResponse = await api.get('/reports/run/14_Saatlik_Aktivite_Analizi');
        
        if (hourlyActivityResponse.data && hourlyActivityResponse.data.status === 'success') {
          setHourlyActivity(hourlyActivityResponse.data.results || []);
        }
      } catch (error) {
        console.error('Error fetching hourly activity data:', error);
        // Hata durumunda sessizce devam et
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      
      // Toast notification ile kullanıcıya bilgi ver
      toast({
        title: 'Veri yükleme hatası',
        description: `${error.response?.data?.message || 'API isteği sırasında bir sorun oluştu'}${error.response?.status === 401 ? ' (Yetkilendirme hatası)' : ''}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Sayfa yüklendiğinde veri çek
  useEffect(() => {
    // Görünür verileri hemen ayarla
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
      messagesByHour: [
        { hour: '00:00', value: 25 },
        { hour: '01:00', value: 20 },
        { hour: '02:00', value: 15 },
        { hour: '03:00', value: 10 },
        { hour: '04:00', value: 5 },
        { hour: '05:00', value: 8 },
        { hour: '06:00', value: 12 },
        { hour: '07:00', value: 30 },
        { hour: '08:00', value: 50 },
        { hour: '09:00', value: 85 },
        { hour: '10:00', value: 120 },
        { hour: '11:00', value: 150 },
        { hour: '12:00', value: 180 },
        { hour: '13:00', value: 210 },
        { hour: '14:00', value: 190 },
        { hour: '15:00', value: 200 },
        { hour: '16:00', value: 180 },
        { hour: '17:00', value: 160 },
        { hour: '18:00', value: 140 },
        { hour: '19:00', value: 110 },
        { hour: '20:00', value: 90 },
        { hour: '21:00', value: 70 },
        { hour: '22:00', value: 50 },
        { hour: '23:00', value: 35 }
      ],
      topTopics: [
        { name: 'Çalışma Saatleri', value: 245 },
        { name: 'Bilet Fiyatları', value: 198 },
        { name: 'Osmanlı Dönemi', value: 156 },
        { name: 'Deniz Araçları', value: 134 },
        { name: 'Atatürk', value: 112 }
      ],
      weeklyActivity: [
        { day: 'Pazar', value: 25 },
        { day: 'Pazartesi', value: 40 },
        { day: 'Salı', value: 35 },
        { day: 'Çarşamba', value: 50 },
        { day: 'Perşembe', value: 49 },
        { day: 'Cuma', value: 60 },
        { day: 'Cumartesi', value: 70 }
      ],
      recentActivities: Array.from({length: 5}, (_, i) => ({
        id: i + 1,
        session_id: `SES-${Math.floor(1000 + Math.random() * 9000)}`,
        message_count: Math.floor(5 + Math.random() * 20),
        session_duration: `${Math.floor(5 + Math.random() * 15)} dakika`,
        last_message: new Date(Date.now() - i * 3600000).toISOString()
      }))
    });
    
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
  
  // Raporları filtrele
  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return reports;
    
    return reports.filter(report => 
      report.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
        description: `Favori durumu değiştirilemedi: ${error.response?.data?.message || 'Bilinmeyen hata'}${error.response?.status === 401 ? ' (Yetkilendirme hatası)' : ''}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Favori raporları getir
  const fetchFavorites = async () => {
    try {
      const response = await api.get('/reports/favorites');
      if (response.data && response.data.favorites) {
        setFavorites(response.data.favorites || []);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      // Hatada sessiz kal ve boş dizi ile devam et
      setFavorites([]);
    }
  };

  // Layout değişikliklerini kaydet
  const onLayoutChange = (layout, layouts) => {
    setLayouts(layouts);
    // Tercihleri localStorage'a kaydedebiliriz
    localStorage.setItem('dashboardLayouts', JSON.stringify(layouts));
  };

  // Layout'ları sıfırla
  const resetLayout = () => {
    // Varsayılan layout'u yükle
    setLayouts({
      lg: [
        { i: 'totalSessions', x: 0, y: 0, w: 3, h: 1 },
        { i: 'totalMessages', x: 3, y: 0, w: 3, h: 1 },
        { i: 'responseTime', x: 6, y: 0, w: 3, h: 1 },
        { i: 'contextUsage', x: 9, y: 0, w: 3, h: 1 },
        { i: 'hourlyActivity', x: 0, y: 1, w: 8, h: 2 },
        { i: 'topTopics', x: 8, y: 1, w: 4, h: 2 },
        { i: 'weeklyActivity', x: 0, y: 3, w: 4, h: 2 },
        { i: 'recentActivities', x: 4, y: 3, w: 4, h: 4 },
        { i: 'sqlReports', x: 8, y: 3, w: 4, h: 2 }
      ],
      md: [
        { i: 'totalSessions', x: 0, y: 0, w: 3, h: 1 },
        { i: 'totalMessages', x: 3, y: 0, w: 3, h: 1 },
        { i: 'responseTime', x: 0, y: 1, w: 3, h: 1 },
        { i: 'contextUsage', x: 3, y: 1, w: 3, h: 1 },
        { i: 'hourlyActivity', x: 0, y: 2, w: 6, h: 2 },
        { i: 'topTopics', x: 0, y: 4, w: 6, h: 2 },
        { i: 'weeklyActivity', x: 0, y: 6, w: 6, h: 2 },
        { i: 'recentActivities', x: 0, y: 8, w: 6, h: 3 },
        { i: 'sqlReports', x: 0, y: 11, w: 6, h: 2 }
      ],
      sm: [
        { i: 'totalSessions', x: 0, y: 0, w: 2, h: 1 },
        { i: 'totalMessages', x: 2, y: 0, w: 2, h: 1 },
        { i: 'responseTime', x: 0, y: 1, w: 2, h: 1 },
        { i: 'contextUsage', x: 2, y: 1, w: 2, h: 1 },
        { i: 'hourlyActivity', x: 0, y: 2, w: 4, h: 2 },
        { i: 'topTopics', x: 0, y: 4, w: 4, h: 2 },
        { i: 'weeklyActivity', x: 0, y: 6, w: 4, h: 2 },
        { i: 'recentActivities', x: 0, y: 8, w: 4, h: 3 },
        { i: 'sqlReports', x: 0, y: 11, w: 4, h: 2 }
      ]
    });
    localStorage.removeItem('dashboardLayouts');
    toast({
      title: 'Dashboard sıfırlandı',
      description: 'Düzen varsayılan haline getirildi',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Özelleştirme modunu aç/kapa
  const toggleCustomizeMode = () => {
    setIsCustomizing(!isCustomizing);
  };

  // İstatistik Kartı Bileşeni
  const StatCard = ({ title, value, icon, trend, trendDirection, color, id }) => {
    return (
      <div 
        className={`relative p-5 rounded-xl bg-opacity-80 backdrop-blur-lg border border-slate-700 transition-all duration-200 h-full
                   bg-slate-800 hover:bg-slate-700 hover:-translate-y-1 hover:shadow-xl
                   ${isCustomizing ? 'cursor-move' : 'cursor-default'}`} 
        id={id}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-gray-400 mb-1">{title}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
            
            {trend && (
              <div className={`inline-flex items-center px-2 py-0.5 mt-2 rounded-full text-xs font-medium
                             ${trendDirection > 0 
                               ? 'bg-green-900 bg-opacity-40 text-green-400' 
                               : 'bg-red-900 bg-opacity-40 text-red-400'}`}>
                {trendDirection > 0 ? (
                  <ArrowUpIcon className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3 mr-1" />
                )}
                {Math.abs(trend)}% {trendDirection > 0 ? 'artış' : 'azalış'}
              </div>
            )}
          </div>
          
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg 
                         ${color === 'blue' ? 'bg-blue-900 bg-opacity-30 text-blue-500' : 
                           color === 'green' ? 'bg-green-900 bg-opacity-30 text-green-500' : 
                           color === 'yellow' ? 'bg-yellow-900 bg-opacity-30 text-yellow-500' : 
                           color === 'purple' ? 'bg-purple-900 bg-opacity-30 text-purple-500' : 
                           'bg-slate-900 bg-opacity-30 text-slate-500'}`}>
            {icon}
          </div>
        </div>
        
        {color === 'purple' && (
          <div className="mt-3 w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500" 
              style={{ width: `${dashboardData.contextUsage.percentage}%` }}
            ></div>
          </div>
        )}
      </div>
    );
  };

  // Kart Bileşeni
  const DashboardCard = ({ title, children, className = '', actionButton = null, id }) => {
    return (
      <div 
        className={`relative rounded-xl bg-slate-800 bg-opacity-80 backdrop-blur-lg border border-slate-700 
                   overflow-hidden transition-all duration-200 h-full 
                   ${isCustomizing ? 'cursor-move' : 'cursor-default'} ${className}`}
        id={id}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-md font-semibold text-white">{title}</h3>
          {actionButton}
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    );
  };

  // Rapor Detay Modalı
  const ReportDetailModal = () => {
    if (!selectedReport) return null;

    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
        
        <div className="relative bg-slate-800 w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">{selectedReport.display_name}</h3>
            <button 
              className="text-gray-400 hover:text-white"
              onClick={() => setIsModalOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="px-6 py-4">
            <p className="text-gray-300 mb-4">{selectedReport.description}</p>
            
            <div className="border-t border-slate-700 my-4 pt-4">
              <h4 className="text-sm font-semibold text-white mb-2">Parametreler</h4>
              
              {selectedReport.parameters && Object.keys(selectedReport.parameters).length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedReport.parameters).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-sm font-medium text-white">{key}</div>
                      <div className="text-sm text-gray-400">{value || 'Varsayılan'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Bu rapor parametre gerektirmez.</p>
              )}
            </div>
          </div>
          
          <div className="px-6 py-4 bg-slate-900 flex justify-end">
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              onClick={() => {
                setIsModalOpen(false);
                handleReportClick(selectedReport);
              }}
            >
              Raporu Görüntüle
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Ana dashboard gösterimi
  const renderDashboard = () => (
    <div className="relative">
      {/* Customization Bar */}
      {isCustomizing && (
        <div className="mb-4 p-3 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-between">
          <div className="text-white">
            <span className="font-medium">Düzenleme Modu:</span> 
            <span className="ml-2 text-yellow-400">Widget'ları sürükleyip bırakarak dashboardı özelleştirebilirsiniz</span>
          </div>
          <div className="flex space-x-2">
            <button 
              className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-sm rounded"
              onClick={resetLayout}
            >
              Sıfırla
            </button>
            <button 
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm rounded"
              onClick={toggleCustomizeMode}
            >
              Tamamla
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Başlık */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Knowhy Raporlama Sistemi
          </h1>
          <p className="text-sm text-gray-400">
            Son güncelleme: {new Date().toLocaleString('tr-TR')}
          </p>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <button
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg border border-slate-700 flex items-center space-x-1"
              onClick={() => document.getElementById('timeRangeDropdown').classList.toggle('hidden')}
            >
              <span>
                {timeRange === '24h' && 'Son 24 Saat'}
                {timeRange === '7d' && 'Son 7 Gün'}
                {timeRange === '30d' && 'Son 30 Gün'}
                {timeRange === 'custom' && 'Özel Aralık'}
              </span>
              <ChevronDownIcon className="w-4 h-4" />
            </button>
            
            <div id="timeRangeDropdown" className="absolute right-0 mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 hidden">
              <ul className="py-1">
                <li>
                  <button 
                    className="px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 w-full text-left"
                    onClick={() => {
                      setTimeRange('24h');
                      document.getElementById('timeRangeDropdown').classList.add('hidden');
                    }}
                  >
                    Son 24 Saat
                  </button>
                </li>
                <li>
                  <button 
                    className="px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 w-full text-left"
                    onClick={() => {
                      setTimeRange('7d');
                      document.getElementById('timeRangeDropdown').classList.add('hidden');
                    }}
                  >
                    Son 7 Gün
                  </button>
                </li>
                <li>
                  <button 
                    className="px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 w-full text-left"
                    onClick={() => {
                      setTimeRange('30d');
                      document.getElementById('timeRangeDropdown').classList.add('hidden');
                    }}
                  >
                    Son 30 Gün
                  </button>
                </li>
                <li>
                  <button 
                    className="px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 w-full text-left"
                    onClick={() => {
                      setTimeRange('custom');
                      document.getElementById('timeRangeDropdown').classList.add('hidden');
                    }}
                  >
                    Özel Aralık
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          <button
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center space-x-1"
            onClick={() => {
              setLoading(true);
              fetchDashboardData();
            }}
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Yenile</span>
          </button>
          
          <button
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg flex items-center space-x-1"
            onClick={toggleCustomizeMode}
          >
            <CogIcon className="w-4 h-4" />
            <span>Özelleştir</span>
          </button>
        </div>
      </div>

      {/* Manual grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* İstatistik Kartları */}
        <div>
          <StatCard 
            id="totalSessions"
            title="Toplam Oturum" 
            value={dashboardData.totalSessions.toLocaleString()} 
            icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />}
            trend={Math.abs(dashboardData.sessionTrend)}
            trendDirection={dashboardData.sessionTrend}
            color="blue"
          />
        </div>
        
        <div>
          <StatCard 
            id="totalMessages"
            title="Toplam Mesaj" 
            value={dashboardData.totalMessages.toLocaleString()} 
            icon={<InformationCircleIcon className="w-6 h-6" />}
            trend={Math.abs(dashboardData.messageTrend)}
            trendDirection={dashboardData.messageTrend}
            color="green"
          />
        </div>
        
        <div>
          <StatCard 
            id="responseTime"
            title="Ortalama Yanıt Süresi" 
            value={`${dashboardData.avgResponseTime.toFixed(2)}s`} 
            icon={<ClockIcon className="w-6 h-6" />}
            trend={5.2}
            trendDirection={1}
            color="yellow"
          />
        </div>
        
        <div>
          <StatCard 
            id="contextUsage"
            title="Context Kullanım Oranı" 
            value={`${dashboardData.contextUsage.percentage}%`} 
            icon={<EyeIcon className="w-6 h-6" />}
            color="purple"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
        {/* Saatlik Aktivite Grafiği */}
        <div className="lg:col-span-8">
          <DashboardCard 
            id="hourlyActivity"
            title="Saatlik Mesaj Aktivitesi" 
            actionButton={
              <div className="relative">
                <button
                  className="text-gray-400 hover:text-white"
                  onClick={() => document.getElementById('hourlyDropdown').classList.toggle('hidden')}
                >
                  <CogIcon className="w-5 h-5" />
                </button>
                
                <div id="hourlyDropdown" className="absolute right-0 mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 hidden">
                  <ul className="py-1">
                    <li>
                      <button className="px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 w-full text-left flex items-center">
                        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                        CSV olarak indir
                      </button>
                    </li>
                    <li>
                      <button className="px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 w-full text-left flex items-center">
                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                        Yenile
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            }
          >
            <div className="h-[260px] w-full">
              {loading ? (
                <div className="animate-pulse h-full w-full bg-slate-700"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dashboardData.messagesByHour}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fill: '#9ca3af' }} 
                      axisLine={{ stroke: '#4b5563' }}
                    />
                    <YAxis 
                      tick={{ fill: '#9ca3af' }} 
                      axisLine={{ stroke: '#4b5563' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        borderColor: '#374151', 
                        color: '#f9fafb',
                        borderRadius: '0.375rem'
                      }}
                      labelStyle={{ color: '#f9fafb', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </DashboardCard>
        </div>
        
        {/* En Çok Konuşulan Konular - Pie Chart */}
        <div className="lg:col-span-4">
          <DashboardCard 
            id="topTopics" 
            title="En Çok Konuşulan Konular"
          >
            <div className="h-[260px] w-full">
              {loading ? (
                <div className="animate-pulse h-full w-full bg-slate-700"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <PieRecharts
                      data={dashboardData.topTopics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData.topTopics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={[
                          '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'
                        ][index % 5]} />
                      ))}
                    </PieRecharts>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        borderColor: '#374151', 
                        color: '#f9fafb',
                        borderRadius: '0.375rem'
                      }}
                      formatter={(value, name, props) => [`${value} mesaj`, props.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
        {/* Haftalık Aktivite Bar Chart */}
        <div className="lg:col-span-4">
          <DashboardCard 
            id="weeklyActivity" 
            title="Haftalık Aktivite Dağılımı"
          >
            <div className="h-[260px] w-full">
              {loading ? (
                <div className="animate-pulse h-full w-full bg-slate-700"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={dashboardData.weeklyActivity}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fill: '#9ca3af' }} 
                      axisLine={{ stroke: '#4b5563' }}
                    />
                    <YAxis 
                      tick={{ fill: '#9ca3af' }} 
                      axisLine={{ stroke: '#4b5563' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        borderColor: '#374151', 
                        color: '#f9fafb',
                        borderRadius: '0.375rem'
                      }}
                    />
                    <RechartsBar 
                      dataKey="value" 
                      fill="#0ea5e9"
                      radius={[4, 4, 0, 0]} 
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </div>
          </DashboardCard>
        </div>
        
        {/* Son Aktiviteler */}
        <div className="lg:col-span-4">
          <DashboardCard 
            id="recentActivities" 
            title="Son Aktiviteler"
            actionButton={
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                Canlı
              </span>
            }
            className="overflow-hidden"
          >
            <div className="overflow-y-auto max-h-[550px] -mx-4 px-4">
              {loading ? (
                Array(5).fill(0).map((_, index) => (
                  <div key={index} className="animate-pulse mb-4">
                    <div className="h-20 bg-slate-700 rounded-lg"></div>
                  </div>
                ))
              ) : (
                dashboardData.recentActivities.map((activity, index) => (
                  <div 
                    key={index} 
                    className="p-3 mb-3 bg-slate-700 bg-opacity-50 hover:bg-opacity-70 rounded-lg flex items-center transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-900 bg-opacity-40 flex items-center justify-center mr-4 text-blue-400">
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{activity.session_id}</div>
                      <div className="text-xs text-gray-400">
                        {activity.message_count} mesaj • {activity.session_duration}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.last_message).toLocaleTimeString('tr-TR')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>
        </div>
        
        {/* SQL Raporları */}
        <div className="lg:col-span-4">
          <DashboardCard 
            id="sqlReports" 
            title="SQL Raporları"
            actionButton={
              <button 
                className="text-xs font-medium px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
                onClick={() => setSelectedTab(1)}
              >
                Tüm Raporlar
              </button>
            }
          >
            <div className="grid grid-cols-2 gap-2 mt-2">
              {reports.slice(0, 4).map((report, index) => (
                <div 
                  key={report.id || index} 
                  className="p-3 bg-slate-700 bg-opacity-50 hover:bg-slate-600 rounded-lg cursor-pointer transition-colors"
                  onClick={() => handleReportClick(report)}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-medium text-white line-clamp-1">{report.name}</h4>
                    <button
                      className="text-gray-400 hover:text-yellow-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(report);
                      }}
                    >
                      {favorites.includes(report.id) 
                        ? <StarIconSolid className="w-4 h-4 text-yellow-400" />
                        : <StarIcon className="w-4 h-4" />
                      }
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {report.description || "Bu rapor için açıklama bulunmamaktadır."}
                  </p>
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-blue-900 text-blue-300 rounded-full">
                    {report.category || 'Genel'}
                  </span>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );

  // Rapor listesi render ediliyor
  const renderReportList = () => (
    <div>
      {/* Filtre ve arama bar */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 shadow-lg">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Rapor ara..."
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="col-span-6 md:col-span-3">
            <div className="relative">
              <button
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white flex items-center justify-between"
                onClick={() => document.getElementById('categoryDropdown').classList.toggle('hidden')}
              >
                <span>Kategori</span>
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              </button>
              
              <div id="categoryDropdown" className="absolute left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 hidden">
                <ul className="py-1">
                  <li>
                    <button className="px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 w-full text-left">
                      Tüm Kategoriler
                    </button>
                  </li>
                  <li>
                    <button className="px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 w-full text-left">
                      Zaman Bazlı Analizler
                    </button>
                  </li>
                  <li>
                    <button className="px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 w-full text-left">
                      İçerik Analizleri
                    </button>
                  </li>
                  <li>
                    <button className="px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 w-full text-left">
                      Performans Metrikleri
                    </button>
                  </li>
                  <li>
                    <button className="px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 w-full text-left">
                      Detaylı Görünümler
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="col-span-6 md:col-span-2">
            <div className="relative">
              <button
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white flex items-center justify-between"
                onClick={() => document.getElementById('sortDropdown').classList.toggle('hidden')}
              >
                <span>Sırala</span>
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              </button>
              
              <div id="sortDropdown" className="absolute left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 hidden">
                <ul className="py-1">
                  <li>
                    <button className="px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 w-full text-left">
                      İsme Göre (A-Z)
                    </button>
                  </li>
                  <li>
                    <button className="px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 w-full text-left">
                      İsme Göre (Z-A)
                    </button>
                  </li>
                  <li>
                    <button className="px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 w-full text-left">
                      En Sık Kullanılan
                    </button>
                  </li>
                  <li>
                    <button className="px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 w-full text-left">
                      En Son Eklenen
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="col-span-12 md:col-span-2">
            <div className="flex rounded-lg overflow-hidden border border-slate-600">
              <button
                className={`flex-1 px-3 py-2.5 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                onClick={() => setViewMode('grid')}
              >
                <Squares2X2Icon className="h-5 w-5 mx-auto" />
              </button>
              <button
                className={`flex-1 px-3 py-2.5 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                onClick={() => setViewMode('list')}
              >
                <ListBulletIcon className="h-5 w-5 mx-auto" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rapor kartları grid */}
      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid-cols-1 gap-4'}`}>
        {filteredReports.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-800 rounded-xl border border-slate-700">
            <div className="p-4 bg-slate-700 rounded-full mb-4">
              <InformationCircleIcon className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Rapor bulunamadı</h3>
            <p className="text-gray-400 text-center max-w-md">
              Arama kriterlerinize uygun rapor bulunamadı. Lütfen başka bir arama terimi deneyin veya filtreleri sıfırlayın.
            </p>
          </div>
        ) : (
          filteredReports.map((report, index) => (
            <motion.div
              key={report.report_name || index}
              className={`relative p-5 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-500 transition-all duration-200 cursor-pointer
                         group hover:-translate-y-1 hover:shadow-xl ${viewMode === 'list' ? 'flex items-start' : ''}`}
              whileHover={{ scale: viewMode === 'grid' ? 1.02 : 1.01 }}
              onClick={() => {
                setSelectedReport(report);
                setIsModalOpen(true);
              }}
            >
              <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div className="flex items-start justify-between">
                  <h3 className={`font-semibold text-white ${viewMode === 'list' ? 'text-base' : 'text-lg mb-3'}`}>
                    {report.display_name}
                  </h3>
                  <button
                    className={`text-gray-400 hover:text-yellow-400 transition-colors ${viewMode === 'list' ? 'ml-2' : 'ml-4'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(report);
                    }}
                  >
                    {favorites.includes(report.report_name) 
                      ? <StarIconSolid className="h-5 w-5 text-yellow-400" />
                      : <StarIcon className="h-5 w-5" />
                    }
                  </button>
                </div>
                
                <p className={`text-gray-400 ${viewMode === 'list' ? 'text-sm line-clamp-1 mt-1' : 'mt-2 mb-4'}`}>
                  {report.description || "Bu rapor için açıklama bulunmamaktadır."}
                </p>
                
                <div className={`flex flex-wrap gap-2 ${viewMode === 'list' ? 'mt-2' : 'mt-4'}`}>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                    Güncel
                  </span>
                  {report.parameters && Object.keys(report.parameters).length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-300">
                      Parametreli
                    </span>
                  )}
                  {report.is_registered && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
                      Kayıtlı
                    </span>
                  )}
                </div>
              </div>
              
              {viewMode === 'list' && (
                <button
                  className="ml-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReportClick(report);
                  }}
                >
                  Görüntüle
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );

  // Favori Raporları render etme
  const renderFavoriteReports = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.length === 0 ? (
        <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 bg-slate-700 rounded-full mb-4">
            <StarIcon className="h-8 w-8 text-yellow-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Henüz favori raporunuz yok</h3>
          <p className="text-gray-400 text-center max-w-md">
            Raporlar bölümünden sık kullandığınız raporları favorilere ekleyebilirsiniz.
          </p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            onClick={() => setSelectedTab(1)}
          >
            Raporları Görüntüle
          </button>
        </div>
      ) : (
        filteredReports
          .filter(report => favorites.includes(report.report_name))
          .map((report, index) => (
            <motion.div
              key={report.report_name || index}
              className="relative p-5 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-500 transition-all duration-200 cursor-pointer
                       group hover:-translate-y-1 hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setSelectedReport(report);
                setIsModalOpen(true);
              }}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-white text-lg mb-3">
                  {report.display_name}
                </h3>
                <button
                  className="text-yellow-400 ml-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(report);
                  }}
                >
                  <StarIconSolid className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-gray-400 mt-2 mb-4">
                {report.description || "Bu rapor için açıklama bulunmamaktadır."}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                  Güncel
                </span>
                {report.parameters && Object.keys(report.parameters).length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-300">
                    Parametreli
                  </span>
                )}
                {report.is_registered && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
                    Kayıtlı
                  </span>
                )}
              </div>
            </motion.div>
          ))
      )}
    </div>
  );

  // Ana render
  return (
    <div className="min-h-screen bg-slate-900 text-white p-5">
      {/* Üst Navbar */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold">Knowhy Raporlama</h1>
        
        <div className="flex items-center space-x-4">
          <button
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg border border-slate-700 flex items-center space-x-2"
            onClick={() => fetchDashboardData()}
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span className="hidden md:inline">{timeRange === '24h' ? 'Son 24 Saat' : timeRange === '7d' ? 'Son 7 Gün' : 'Son 30 Gün'}</span>
          </button>
          
          <button
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700"
          >
            <CogIcon className="h-5 w-5" />
          </button>
          
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-semibold">
            K
          </div>
        </div>
      </div>

      {/* Tab navigasyonu */}
      <div className="mb-8">
        <div className="flex border-b border-slate-700">
          <button 
            className={`px-6 py-3 text-sm font-medium ${
              selectedTab === 0 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setSelectedTab(0)}
          >
            Dashboard
          </button>
          <button 
            className={`px-6 py-3 text-sm font-medium ${
              selectedTab === 1 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setSelectedTab(1)}
          >
            Raporlar
          </button>
          <button 
            className={`px-6 py-3 text-sm font-medium ${
              selectedTab === 2 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setSelectedTab(2)}
          >
            Favoriler
          </button>
        </div>
      </div>
      
      {/* Tab içeriği */}
      <div>
        {selectedTab === 0 && renderDashboard()}
        {selectedTab === 1 && renderReportList()}
        {selectedTab === 2 && renderFavoriteReports()}
      </div>
      
      {/* Rapor Detay Modalı */}
      <ReportDetailModal />
      
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-white text-lg">Yükleniyor...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage; 