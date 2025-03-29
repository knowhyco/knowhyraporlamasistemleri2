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
  ModalFooter,
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

// StatCard bileşenini modern bir tasarımla güncelliyorum
const StatCard = ({ id, title, value, description, icon, color, trend, trendDirection }) => {
  // Renk şemaları
  const colorScheme = {
    blue: {
      bg: 'from-blue-900/30 to-blue-800/30',
      accentBg: 'bg-blue-600',
      iconBg: 'bg-blue-500/10',
      borderAccent: 'border-blue-500/20',
      text: 'text-blue-500',
    },
    green: {
      bg: 'from-green-900/30 to-green-800/30',
      accentBg: 'bg-green-600',
      iconBg: 'bg-green-500/10',
      borderAccent: 'border-green-500/20',
      text: 'text-green-500',
    },
    purple: {
      bg: 'from-purple-900/30 to-purple-800/30',
      accentBg: 'bg-purple-600',
      iconBg: 'bg-purple-500/10',
      borderAccent: 'border-purple-500/20',
      text: 'text-purple-500',
    },
    yellow: {
      bg: 'from-amber-900/30 to-amber-800/30',
      accentBg: 'bg-amber-600',
      iconBg: 'bg-amber-500/10',
      borderAccent: 'border-amber-500/20',
      text: 'text-amber-500',
    },
    red: {
      bg: 'from-red-900/30 to-red-800/30',
      accentBg: 'bg-red-600',
      iconBg: 'bg-red-500/10',
      borderAccent: 'border-red-500/20',
      text: 'text-red-500',
    }
  };
  
  const scheme = colorScheme[color] || colorScheme.blue;

  return (
    <div 
      id={id}
      className={`bg-gradient-to-br ${scheme.bg} rounded-xl border border-slate-700 ${scheme.borderAccent} shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden p-5`}
    >
      <div className="flex justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <h3 className="text-white text-2xl font-bold">{value}</h3>
          {description && <p className="text-gray-400 text-xs mt-1">{description}</p>}
          
          {trend !== undefined && (
            <div className={`flex items-center mt-3 ${trendDirection > 0 ? 'text-green-400' : trendDirection < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {trendDirection > 0 ? (
                <ArrowUpIcon className="h-3 w-3 mr-1" />
              ) : trendDirection < 0 ? (
                <ArrowDownIcon className="h-3 w-3 mr-1" />
              ) : null}
              <span className="text-xs font-medium">
                {trend}% {trendDirection > 0 ? 'artış' : trendDirection < 0 ? 'azalış' : ''}
              </span>
            </div>
          )}
        </div>
        
        <div className={`${scheme.iconBg} rounded-full p-3 h-12 w-12 flex items-center justify-center ${scheme.text}`}>
          {icon}
        </div>
      </div>
      
      {/* Alt kısımdaki dekoratif çizgi */}
      <div className="mt-4 -mx-5 -mb-5">
        <div className={`${scheme.accentBg} h-1.5 rounded-t-full opacity-30`}></div>
      </div>
    </div>
  );
};

// DashboardCard bileşenini güncelliyorum
const DashboardCard = ({ id, title, children, actionButton, className = '' }) => {
  return (
    <div 
      id={id} 
      className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden h-full ${className}`}
    >
      <div className="bg-slate-800/50 px-5 py-4 border-b border-slate-700/30 flex justify-between items-center">
        <h3 className="font-medium text-white flex items-center">
          {title}
        </h3>
        {actionButton && (
          <div>
            {actionButton}
          </div>
        )}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
};

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
  const [reportFilter, setReportFilter] = useState('all');
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

      {/* Modern Dashboard Header */}
      <div className="mb-6">
        {/* Üst Bilgi Kartı */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-800 rounded-xl shadow-lg overflow-hidden">
          {/* Üst Kısım - Logo ve Başlık */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 border-b border-slate-700/30">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl mr-3">
                K
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
                  Knowhy Raporlama Sistemi
                </h1>
                <div className="flex items-center text-blue-200 text-xs md:text-sm">
                  <span className="flex items-center mr-4">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    Son Güncelleme: {new Date().toLocaleString('tr-TR')}
                  </span>
                  
                  <span className="flex items-center">
                    <InformationCircleIcon className="w-4 h-4 mr-1" />
                    <span className="hidden md:inline">Aktif Oturum Sayısı:</span> 
                    <span className="ml-1 font-medium">{dashboardData.activeSessions || 0}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto">
              {/* Arama Kutusu */}
              <div className="relative w-full md:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-blue-300" />
                </div>
                <input
                  type="text"
                  className="bg-slate-800/50 border border-slate-600/50 rounded-lg pl-10 pr-3 py-2 text-sm text-white w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rapor Ara..."
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Hızlı Filtreler */}
              <div className="flex space-x-1">
                <button 
                  className={`px-3 py-2 text-xs rounded-lg border border-slate-600/50 ${timeRange === '24h' ? 'bg-blue-700' : 'bg-slate-800/50 hover:bg-slate-700/50'} text-white transition-colors`}
                  onClick={() => setTimeRange('24h')}
                >
                  24s
                </button>
                <button 
                  className={`px-3 py-2 text-xs rounded-lg border border-slate-600/50 ${timeRange === '7d' ? 'bg-blue-700' : 'bg-slate-800/50 hover:bg-slate-700/50'} text-white transition-colors`}
                  onClick={() => setTimeRange('7d')}
                >
                  7g
                </button>
                <button 
                  className={`px-3 py-2 text-xs rounded-lg border border-slate-600/50 ${timeRange === '30d' ? 'bg-blue-700' : 'bg-slate-800/50 hover:bg-slate-700/50'} text-white transition-colors`}
                  onClick={() => setTimeRange('30d')}
                >
                  30g
                </button>
                <button
                  className={`px-3 py-2 text-xs rounded-lg border border-slate-600/50 ${timeRange === 'custom' ? 'bg-blue-700' : 'bg-slate-800/50 hover:bg-slate-700/50'} text-white transition-colors`}
                  onClick={() => document.getElementById('customRangeModal').classList.toggle('hidden')}
                >
                  <CalendarIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Alt Kısım - İstatistikler ve Aksiyon Butonları */}
          <div className="p-3 bg-slate-800/30 flex flex-col md:flex-row justify-between">
            {/* Mini Stat Kartları */}
            <div className="flex flex-wrap gap-2 mb-3 md:mb-0">
              <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="text-xs text-gray-400">Toplam Oturum</div>
                <div className="text-sm font-semibold text-white flex items-center">
                  {dashboardData.totalSessions.toLocaleString()}
                  {dashboardData.sessionTrend !== 0 && (
                    <span className={`ml-2 text-xs ${dashboardData.sessionTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {dashboardData.sessionTrend > 0 ? '+' : ''}{dashboardData.sessionTrend}%
                    </span>
                  )}
                </div>
              </div>
              
              <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="text-xs text-gray-400">Toplam Mesaj</div>
                <div className="text-sm font-semibold text-white flex items-center">
                  {dashboardData.totalMessages.toLocaleString()}
                  {dashboardData.messageTrend !== 0 && (
                    <span className={`ml-2 text-xs ${dashboardData.messageTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {dashboardData.messageTrend > 0 ? '+' : ''}{dashboardData.messageTrend}%
                    </span>
                  )}
                </div>
              </div>
              
              <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="text-xs text-gray-400">Ort. Yanıt Süresi</div>
                <div className="text-sm font-semibold text-white">
                  {dashboardData.avgResponseTime.toFixed(1)}s
                </div>
              </div>
            </div>
            
            {/* Aksiyon Butonları */}
            <div className="flex items-center space-x-2">
              <div className="relative mr-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center px-3 py-2 rounded-lg text-white text-sm ${
                    autoRefresh ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'
                  } transition-colors`}
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Otomatik</span>
                </button>
              </div>
              
              <button
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center text-sm transition-colors"
                onClick={() => {
                  setLoading(true);
                  fetchDashboardData();
                }}
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Yenile</span>
              </button>
              
              <button
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center text-sm transition-colors"
                onClick={toggleCustomizeMode}
              >
                <CogIcon className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Özelleştir</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Tarih Aralığı Özel Seçim Modal */}
        <div 
          id="customRangeModal" 
          className="hidden fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target.id === 'customRangeModal') {
              document.getElementById('customRangeModal').classList.add('hidden');
            }
          }}
        >
          <div className="bg-slate-800 p-5 rounded-xl shadow-lg w-80">
            <h3 className="text-lg font-semibold text-white mb-4">Özel Tarih Aralığı</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Başlangıç Tarihi</label>
              <input 
                type="date" 
                className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Bitiş Tarihi</label>
              <input 
                type="date" 
                className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                onClick={() => document.getElementById('customRangeModal').classList.add('hidden')}
              >
                İptal
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                onClick={() => {
                  setTimeRange('custom');
                  document.getElementById('customRangeModal').classList.add('hidden');
                }}
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard İçeriği - İstatistik Kartları ve Diğer Bileşenler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
      
      {/* Grafikler Satırı */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* Saatlik Aktivite - 2/3 genişlikte */}
        <div className="lg:col-span-2">
          <DashboardCard 
            id="hourlyActivity" 
            title="Saatlik Aktivite"
            actionButton={
              <Tooltip label="Son 24 saatteki mesaj dağılımı" placement="top">
                <InfoIcon className="h-4 w-4 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              </Tooltip>
            }
          >
            <div className="h-[260px] w-full">
              {loading ? (
                <div className="animate-pulse h-full w-full bg-slate-700/50 rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dashboardData.messagesByHour}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
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
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorMessages)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </DashboardCard>
        </div>
        
        {/* Top Konular - 1/3 genişlikte */}
        <div className="lg:col-span-1">
          <DashboardCard 
            id="topTopics" 
            title="En Çok İşlenen Konular"
            actionButton={
              <Tooltip label="Son 7 gün içindeki en popüler konular" placement="top">
                <InfoIcon className="h-4 w-4 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              </Tooltip>
            }
          >
            <div className="h-[260px] w-full">
              {loading ? (
                <div className="animate-pulse h-full w-full bg-slate-700/50 rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.topTopics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {dashboardData.topTopics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={[
                          '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'
                        ][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        borderColor: '#374151', 
                        color: '#f9fafb',
                        borderRadius: '0.375rem'
                      }}
                      formatter={(value) => [`${value} mesaj`, 'Toplam']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
      
      {/* Alt Satır - 3 Kart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* Haftalık Aktivite */}
        <div>
          <DashboardCard 
            id="weeklyActivity" 
            title="Haftalık Aktivite"
            actionButton={
              <Tooltip label="Haftanın günlerine göre mesaj dağılımı" placement="top">
                <InfoIcon className="h-4 w-4 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              </Tooltip>
            }
          >
            <div className="h-[260px] w-full">
              {loading ? (
                <div className="animate-pulse h-full w-full bg-slate-700/50 rounded-lg"></div>
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
                      fill="#10b981"
                      radius={[4, 4, 0, 0]} 
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </div>
          </DashboardCard>
        </div>
        
        {/* Son Aktiviteler */}
        <div>
          <DashboardCard 
            id="recentActivities" 
            title="Son Aktiviteler"
            actionButton={
              <Badge colorScheme="blue" fontSize="xs" rounded="full" px="2">Canlı</Badge>
            }
            className="overflow-hidden"
          >
            <div className="overflow-y-auto max-h-[260px] pr-1 -mr-1">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center p-2">
                      <div className="rounded-full bg-slate-700 h-8 w-8"></div>
                      <div className="ml-4 flex-1">
                        <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {dashboardData.recentActivities.map((activity, index) => (
                    <div 
                      key={activity.id || index}
                      className="p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="rounded-full bg-blue-600/30 border border-blue-500/30 h-8 w-8 flex items-center justify-center">
                            <ChatIcon className="h-4 w-4 text-blue-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-white">{activity.session_id}</p>
                            <p className="text-xs text-gray-400">
                              {activity.message_count} mesaj • {activity.session_duration}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(activity.last_message).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DashboardCard>
        </div>
        
        {/* SQL Raporları */}
        <div>
          <DashboardCard 
            id="sqlReports" 
            title="SQL Raporları"
            actionButton={
              <Button 
                size="xs" 
                colorScheme="blue" 
                variant="ghost"
                onClick={() => setSelectedTab(1)}
              >
                Tümü
              </Button>
            }
          >
            <div className="overflow-y-auto max-h-[260px] pr-1 -mr-1">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse p-2">
                      <div className="h-5 bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-700 rounded-sm w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {reports.slice(0, 5).map((report, index) => (
                    <div 
                      key={report.id || index}
                      className="p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex justify-between items-center"
                      onClick={() => handleReportClick(report)}
                    >
                      <div>
                        <div className="flex items-center">
                          <ArrowDownTrayIcon className="h-3.5 w-3.5 text-blue-400 mr-2" />
                          <p className="text-sm text-white font-medium truncate">
                            {report.display_name}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 ml-5.5 truncate max-w-[180px]">
                          {report.description || 'Açıklama yok'}
                        </p>
                      </div>
                      <IconButton
                        icon={report.is_favorite ? <StarIcon /> : <StarIcon />}
                        aria-label="Favori Ekle/Çıkar"
                        size="xs"
                        colorScheme={report.is_favorite ? "yellow" : "gray"}
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(report);
                        }}
                      />
                    </div>
                  ))}
                  {reports.length === 0 && (
                    <div className="text-center p-6">
                      <p className="text-gray-400 text-sm">Henüz rapor bulunmuyor.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );

  // Rapor Detay Modalı güncellemesi
  const ReportDetailModal = () => {
    if (!selectedReport) return null;

    return (
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isCentered size="xl">
        <ModalOverlay backdropFilter="blur(4px)" backgroundColor="rgba(0, 0, 0, 0.7)" />
        <ModalContent bg="gray.800" borderColor="gray.700" borderWidth="1px" rounded="xl" boxShadow="xl">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.700" pb={4}>
            <Flex alignItems="center">
              <Box 
                rounded="md" 
                bg="blue.600" 
                color="white" 
                p={2}
                mr={3}
                boxShadow="md"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </Box>
              <Text>{selectedReport.display_name}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton color="gray.400" _hover={{ color: "white" }} />
          
          <ModalBody py={6}>
            <Text color="gray.300" mb={4}>{selectedReport.description || "Bu rapor için açıklama bulunmamaktadır."}</Text>
            
            <Box borderTopWidth="1px" borderColor="gray.700" pt={4} mt={4}>
              <Heading as="h4" size="sm" mb={3}>Rapor Detayları</Heading>
              
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.300">Kategori</Text>
                  <Badge colorScheme="blue" mt={1}>
                    {selectedReport.category || 'Genel'}
                  </Badge>
                </Box>
                
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.300">Oluşturulma Tarihi</Text>
                  <Text fontSize="sm" color="gray.400">
                    {selectedReport.created_at 
                      ? new Date(selectedReport.created_at).toLocaleDateString('tr-TR')
                      : 'Belirtilmemiş'
                    }
                  </Text>
                </Box>
              </Grid>
            </Box>
            
            <Box borderTopWidth="1px" borderColor="gray.700" pt={4} mt={4}>
              <Heading as="h4" size="sm" mb={3}>Parametreler</Heading>
              
              {selectedReport.parameters && Object.keys(selectedReport.parameters).length > 0 ? (
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  {Object.entries(selectedReport.parameters).map(([key, value]) => (
                    <Box key={key} p={3} bg="gray.700" rounded="md">
                      <Text fontSize="sm" fontWeight="medium" color="white">{key}</Text>
                      <Text fontSize="sm" color="gray.400">{value || 'Varsayılan'}</Text>
                    </Box>
                  ))}
                </Grid>
              ) : (
                <Alert status="info" variant="subtle" bg="blue.900" color="blue.100" rounded="md">
                  <AlertIcon color="blue.200" />
                  <Text fontSize="sm">Bu rapor parametre gerektirmez.</Text>
                </Alert>
              )}
            </Box>
          </ModalBody>
          
          <ModalFooter bg="gray.900" borderTopWidth="1px" borderColor="gray.700" rounded="0 0 xl xl">
            <ButtonGroup spacing={3}>
              <Button 
                variant="ghost" 
                colorScheme="gray" 
                onClick={() => setIsModalOpen(false)}
              >
                İptal
              </Button>
              <Button 
                colorScheme="blue" 
                leftIcon={<ViewIcon />}
                onClick={() => {
                  setIsModalOpen(false);
                  handleReportClick(selectedReport);
                }}
              >
                Raporu Görüntüle
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  // Rapor Listesi görünümü güncelleniyor
  const renderReportList = () => {
    const renderSkeletons = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-slate-800 rounded-xl p-5 animate-pulse border border-slate-700">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 bg-slate-700 rounded-md mr-3"></div>
              <div className="flex-1">
                <div className="h-5 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-16 bg-slate-700 rounded mb-4"></div>
            <div className="flex justify-between">
              <div className="h-8 w-20 bg-slate-700 rounded"></div>
              <div className="h-8 w-8 bg-slate-700 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );

    return (
      <div>
        {/* Arama ve Filtreler */}
        <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </InputLeftElement>
                <Input 
                  placeholder="Rapor ara..." 
                  bg="slate.900" 
                  borderColor="slate.700"
                  _hover={{ borderColor: "blue.500" }}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant={reportFilter === 'all' ? 'solid' : 'outline'} 
                colorScheme="blue" 
                leftIcon={<ListBulletIcon className="h-4 w-4" />}
                onClick={() => setReportFilter('all')}
              >
                Tümü
              </Button>
              <Button 
                size="sm" 
                variant={reportFilter === 'favorites' ? 'solid' : 'outline'} 
                colorScheme="yellow" 
                leftIcon={<StarIcon className="h-4 w-4" />}
                onClick={() => setReportFilter('favorites')}
              >
                Favoriler
              </Button>
              <Button 
                size="sm" 
                variant={reportFilter === 'recent' ? 'solid' : 'outline'} 
                colorScheme="purple" 
                leftIcon={<ClockIcon className="h-4 w-4" />}
                onClick={() => setReportFilter('recent')}
              >
                Son Görüntülenenler
              </Button>
            </div>
          </div>
        </div>

        {/* Rapor Listesi */}
        {loading ? renderSkeletons() : (
          <div>
            {/* Sonuç Sayısı */}
            <div className="flex justify-between items-center mb-4">
              <Text color="gray.400" fontSize="sm">
                {filteredReports.length} sonuç bulundu
              </Text>
              
              {/* Sıralama/Görünüm Seçenekleri */}
              <div className="flex space-x-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  colorScheme="gray"
                  borderRadius="md"
                  isActive={true}
                  _active={{ bg: 'blue.600', color: 'white' }}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  colorScheme="gray"
                  borderRadius="md"
                >
                  <ListBulletIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {filteredReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredReports.map((report, index) => (
                  <div 
                    key={report.id || index}
                    className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 hover:border-blue-600/50 overflow-hidden shadow-lg hover:shadow-blue-900/20 transition-all duration-300"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start">
                          <div className="bg-blue-600/20 border border-blue-500/20 rounded-md p-2 mr-3">
                            <ArrowDownTrayIcon className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-white truncate max-w-[180px]">
                              {report.display_name}
                            </h3>
                            <Text fontSize="xs" color="gray.400">
                              {report.category || 'Genel'}
                            </Text>
                          </div>
                        </div>
                        
                        <IconButton
                          aria-label="Favori Ekle/Çıkar"
                          icon={report.is_favorite ? 
                            <StarIcon className="h-5 w-5 text-yellow-400 fill-current" /> : 
                            <StarIcon className="h-5 w-5" />
                          }
                          size="sm"
                          variant="ghost"
                          colorScheme={report.is_favorite ? "yellow" : "gray"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(report);
                          }}
                        />
                      </div>
                      
                      <Text 
                        fontSize="sm" 
                        color="gray.300" 
                        mb={5}
                        noOfLines={3}
                      >
                        {report.description || "Bu rapor için açıklama bulunmamaktadır."}
                      </Text>
                      
                      <div className="flex justify-between items-center">
                        <Text fontSize="xs" color="gray.500">
                          Son çalıştırma: {report.last_run 
                            ? new Date(report.last_run).toLocaleDateString('tr-TR') 
                            : "Henüz çalıştırılmadı"
                          }
                        </Text>
                        
                        <ButtonGroup size="sm" spacing={3}>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            colorScheme="blue"
                            leftIcon={<InformationCircleIcon className="h-4 w-4" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(report);
                              setIsModalOpen(true);
                            }}
                          >
                            Detay
                          </Button>
                          <Button 
                            size="sm" 
                            colorScheme="blue" 
                            leftIcon={<ViewIcon className="h-4 w-4" />}
                            onClick={() => handleReportClick(report)}
                          >
                            Görüntüle
                          </Button>
                        </ButtonGroup>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
                <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-500 mb-3" />
                <Heading as="h3" size="md" mb={2}>Rapor Bulunamadı</Heading>
                <Text color="gray.400">
                  Arama kriterlerinize uygun rapor bulunamadı. Lütfen farklı anahtar kelimeler deneyin.
                </Text>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Favori Raporlar görünümü güncelleniyor
  const renderFavoriteReports = () => {
    return (
      <div>
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-5 mb-6 border border-purple-800/40">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-lg shadow-lg">
              <StarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <Heading as="h2" size="md" mb={1}>Favori Raporlarınız</Heading>
              <Text color="gray.300">
                En sık kullandığınız raporları burada bulabilirsiniz. Raporları favorilerinize eklemek için rapor kartındaki yıldız ikonuna tıklayın.
              </Text>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-slate-800 rounded-xl p-5 animate-pulse border border-slate-700">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 bg-slate-700 rounded-md mr-3"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-16 bg-slate-700 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-8 w-20 bg-slate-700 rounded"></div>
                  <div className="h-8 w-8 bg-slate-700 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {favorites.map((report, index) => (
              <div 
                key={report.id || index}
                className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-700/30 hover:border-purple-500/50 overflow-hidden shadow-lg hover:shadow-purple-900/20 transition-all duration-300"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start">
                      <div className="bg-purple-600/20 border border-purple-500/20 rounded-md p-2 mr-3">
                        <ArrowDownTrayIcon className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white truncate max-w-[180px]">
                          {report.display_name}
                        </h3>
                        <Text fontSize="xs" color="gray.400">
                          {report.category || 'Genel'}
                        </Text>
                      </div>
                    </div>
                    
                    <IconButton
                      aria-label="Favorilerden Çıkar"
                      icon={<StarIcon className="h-5 w-5 text-yellow-400 fill-current" />}
                      size="sm"
                      variant="ghost"
                      colorScheme="yellow"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(report);
                      }}
                    />
                  </div>
                  
                  <Text 
                    fontSize="sm" 
                    color="gray.300" 
                    mb={5}
                    noOfLines={3}
                  >
                    {report.description || "Bu rapor için açıklama bulunmamaktadır."}
                  </Text>
                  
                  <div className="flex justify-between items-center">
                    <Text fontSize="xs" color="gray.500">
                      Son çalıştırma: {report.last_run 
                        ? new Date(report.last_run).toLocaleDateString('tr-TR') 
                        : "Henüz çalıştırılmadı"
                      }
                    </Text>
                    
                    <ButtonGroup size="sm" spacing={3}>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        colorScheme="purple"
                        leftIcon={<InformationCircleIcon className="h-4 w-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(report);
                          setIsModalOpen(true);
                        }}
                      >
                        Detay
                      </Button>
                      <Button 
                        size="sm" 
                        colorScheme="purple" 
                        leftIcon={<ViewIcon className="h-4 w-4" />}
                        onClick={() => handleReportClick(report)}
                      >
                        Görüntüle
                      </Button>
                    </ButtonGroup>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
            <div className="bg-slate-700 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <StarIcon className="h-8 w-8 text-gray-500" />
            </div>
            <Heading as="h3" size="md" mb={2}>Henüz Favori Rapor Yok</Heading>
            <Text color="gray.400" mb={6}>
              Favori raporlarınız burada görüntülenecek. Rapor kartlarındaki yıldız ikonuna tıklayarak favori ekleyebilirsiniz.
            </Text>
            <Button 
              colorScheme="purple" 
              leftIcon={<ListBulletIcon className="h-4 w-4" />}
              onClick={() => setSelectedTab(1)}
            >
              Tüm Raporları Görüntüle
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Ana render
  return (
    <div className="min-h-screen bg-slate-900 text-white p-5">
      {/* Modern Üst Navbar */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-800 -mx-5 px-5 py-4 mb-8 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-semibold mr-3 shadow-lg">
              <span className="text-xl font-bold">K</span>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
              Knowhy Raporlama
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              className="flex items-center px-3 py-2 bg-slate-800/70 hover:bg-slate-700 text-white text-sm rounded-lg border border-slate-600/30 shadow transition-colors"
              onClick={() => fetchDashboardData()}
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Yenile</span>
            </button>
            
            <button
              className="flex items-center px-3 py-2 bg-slate-800/70 hover:bg-slate-700 text-white text-sm rounded-lg border border-slate-600/30 shadow transition-colors"
              onClick={() => {
                // Ayarlar modalı
              }}
            >
              <CogIcon className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Ayarlar</span>
            </button>
            
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                className="flex items-center p-1 rounded-full overflow-hidden bg-blue-600 hover:bg-blue-700 transition-colors shadow"
              >
                <Avatar 
                  size="sm" 
                  name="Kullanıcı" 
                  bg="blue.700"
                  color="white" 
                />
              </MenuButton>
              <MenuList 
                bg="gray.800" 
                borderColor="gray.700"
              >
                <MenuItem 
                  _hover={{ bg: 'gray.700' }} 
                  _focus={{ bg: 'gray.700' }}
                  icon={<Icon as={ViewIcon} />}
                >
                  Profilim
                </MenuItem>
                <MenuItem 
                  _hover={{ bg: 'gray.700' }} 
                  _focus={{ bg: 'gray.700' }}
                  icon={<Icon as={SettingsIcon} />}
                >
                  Hesap Ayarları
                </MenuItem>
                <MenuDivider borderColor="gray.700" />
                <MenuItem 
                  _hover={{ bg: 'gray.700' }} 
                  _focus={{ bg: 'gray.700' }}
                  icon={<Icon as={TimeIcon} />}
                >
                  Çıkış Yap
                </MenuItem>
              </MenuList>
            </Menu>
          </div>
        </div>
      </div>

      {/* Modern Tab Navigasyonu */}
      <div className="mb-8">
        <div className="flex flex-wrap bg-slate-800 rounded-xl p-1.5 shadow-lg">
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center ${
              selectedTab === 0 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
            onClick={() => setSelectedTab(0)}
          >
            <Squares2X2Icon className="w-4 h-4 mr-1.5" />
            Dashboard
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center ${
              selectedTab === 1 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
            onClick={() => setSelectedTab(1)}
          >
            <ListBulletIcon className="w-4 h-4 mr-1.5" />
            Raporlar
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center ${
              selectedTab === 2 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
            onClick={() => setSelectedTab(2)}
          >
            <StarIcon className="w-4 h-4 mr-1.5" />
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
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 relative">
              <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              <div className="absolute top-1 left-1 w-14 h-14 rounded-full border-4 border-t-transparent border-r-blue-400 border-b-transparent border-l-transparent animate-spin animation-delay-150"></div>
              <div className="absolute top-2 left-2 w-12 h-12 rounded-full border-4 border-t-transparent border-r-transparent border-b-blue-300 border-l-transparent animate-spin animation-delay-300"></div>
            </div>
            <p className="text-white text-lg mt-4 font-medium">Yükleniyor...</p>
            <p className="text-blue-300 text-sm">Veriler hazırlanıyor...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage; 