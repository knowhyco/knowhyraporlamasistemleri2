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

  // Tema renkleri
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  // Responsive değerler
  const isMobile = useBreakpointValue({ base: true, md: false });
  const gridColumns = useBreakpointValue({ base: 1, md: 2, lg: 3 });
  
  // Raporları getir
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, favoritesRes, summaryRes] = await Promise.all([
          api.get('/reports/list'),
          api.get('/reports/favorites'),
          api.get('/reports/summary')
        ]);

        if (reportsRes.data.status === 'success') {
          setReports(reportsRes.data.reports || []);
        }
        if (favoritesRes.data.status === 'success') {
          setFavorites(favoritesRes.data.favorites || []);
        }
        if (summaryRes.data.status === 'success') {
          setSummaryData(summaryRes.data.summary);
      }
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
    return reports.filter(report => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (report?.display_name?.toLowerCase() || '').includes(searchLower) ||
        (report?.description?.toLowerCase() || '').includes(searchLower) ||
        (report?.category?.toLowerCase() || '').includes(searchLower)
      );
    });
  }, [reports, searchTerm]);

  // Özet grafik verileri
  const summaryChartData = useMemo(() => ({
    labels: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
    datasets: [
      {
        label: 'Haftalık Aktivite',
        data: summaryData?.weekly_activity || [0, 0, 0, 0, 0, 0, 0],
        borderColor: accentColor,
        backgroundColor: `${accentColor}20`,
        fill: true,
        tension: 0.4,
      }
    ]
  }), [summaryData, accentColor]);

  const pieChartData = useMemo(() => ({
    labels: ['Context Kullanılan', 'Context Kullanılmayan'],
    datasets: [
      {
        data: [
          summaryData?.context_usage?.used || 0,
          summaryData?.context_usage?.not_used || 0
        ],
        backgroundColor: [accentColor, `${accentColor}40`],
        borderWidth: 0,
      }
    ]
  }), [summaryData, accentColor]);

  const barChartData = useMemo(() => ({
    labels: ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24'],
    datasets: [
      {
        label: 'Saatlik Dağılım',
        data: summaryData?.hourly_distribution || [0, 0, 0, 0, 0, 0],
        backgroundColor: accentColor,
        borderRadius: 4,
      }
    ]
  }), [summaryData, accentColor]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        padding: 10,
        backgroundColor: cardBg,
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: borderColor,
        borderWidth: 1,
        cornerRadius: 8,
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };
  
  // Favori ekle/çıkar
  const handleToggleFavorite = async (report) => {
    try {
      const isFavorite = favorites.includes(report.report_name);
      const endpoint = isFavorite ? '/reports/remove-favorite' : '/reports/add-favorite';
      
      const response = await api.post(endpoint, { report_id: report.report_name });
      
      if (response.data && response.data.status === 'success') {
        if (isFavorite) {
          setFavorites(favorites.filter(id => id !== report.report_name));
        } else {
          setFavorites([...favorites, report.report_name]);
        }
        toast({
          title: isFavorite ? 'Favorilerden Çıkarıldı' : 'Favorilere Eklendi',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
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
            <VStack spacing={4} align="stretch">
              <Text color={textColor}>{report.description}</Text>
              <HStack spacing={2}>
                <Badge colorScheme="blue">{report.category}</Badge>
                {report.is_active && (
                  <Badge colorScheme="green">Aktif</Badge>
                )}
              </HStack>
              <Button
                colorScheme="blue"
                onClick={() => {
                  onClose();
                  navigate(`/reports/${report.report_name}`);
                }}
              >
                Raporu Görüntüle
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  };

  // Mobil menü
  const MobileMenu = () => (
    <Drawer
      isOpen={isMobileMenuOpen}
      placement="left"
      onClose={() => setIsMobileMenuOpen(false)}
      size="xs"
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Menü</DrawerHeader>
        <DrawerBody>
          <VStack spacing={4} align="stretch">
            <Button
              leftIcon={<ViewIcon />}
              onClick={() => {
                setViewMode(viewMode === 'grid' ? 'list' : 'grid');
                setIsMobileMenuOpen(false);
              }}
            >
              {viewMode === 'grid' ? 'Liste Görünümü' : 'Grid Görünümü'}
            </Button>
            <Button
              leftIcon={<RepeatIcon />}
              onClick={() => {
                setAutoRefresh(!autoRefresh);
                setIsMobileMenuOpen(false);
              }}
            >
              Otomatik Yenileme: {autoRefresh ? 'Açık' : 'Kapalı'}
            </Button>
            <Button
              leftIcon={<CalendarIcon />}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Zaman Aralığı: {timeRange}
            </Button>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
    
    return (
    <Container maxW="container.xl" py={8}>
      {/* Üst Bar */}
      <Flex mb={8} align="center" justify="space-between">
        <HStack spacing={4}>
          {isMobile && (
            <IconButton
              icon={<HamburgerIcon />}
              aria-label="Menu"
              onClick={() => setIsMobileMenuOpen(true)}
              variant="ghost"
            />
          )}
          <Heading size="lg">Raporlar</Heading>
        </HStack>
        <HStack spacing={4}>
          {!isMobile && (
            <>
              <Button
                leftIcon={viewMode === 'grid' ? <ViewIcon /> : <ViewOffIcon />}
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                variant="ghost"
              >
                {viewMode === 'grid' ? 'Liste' : 'Grid'}
              </Button>
              <Button
                leftIcon={<RepeatIcon />}
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant="ghost"
                colorScheme={autoRefresh ? 'green' : 'gray'}
              >
                Otomatik Yenileme
              </Button>
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  leftIcon={<CalendarIcon />}
                  variant="ghost"
                >
                  {timeRange}
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => setTimeRange('1h')}>Son 1 Saat</MenuItem>
                  <MenuItem onClick={() => setTimeRange('24h')}>Son 24 Saat</MenuItem>
                  <MenuItem onClick={() => setTimeRange('7d')}>Son 7 Gün</MenuItem>
                  <MenuItem onClick={() => setTimeRange('30d')}>Son 30 Gün</MenuItem>
                </MenuList>
              </Menu>
            </>
          )}
        </HStack>
      </Flex>

      {/* Özet Kartları */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} _hover={{ shadow: 'lg' }}>
            <CardBody>
              <Stat>
                <StatLabel>Toplam Oturum</StatLabel>
                <StatNumber>{summaryData?.total_sessions || 0}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Son 24 saat: +{summaryData?.new_sessions || 0}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} _hover={{ shadow: 'lg' }}>
            <CardBody>
              <Stat>
                <StatLabel>Toplam Mesaj</StatLabel>
                <StatNumber>{summaryData?.total_messages || 0}</StatNumber>
                <StatHelpText>
                  Ortalama: {summaryData?.avg_messages_per_session || 0}/oturum
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} _hover={{ shadow: 'lg' }}>
            <CardBody>
              <Stat>
                <StatLabel>Context Kullanımı</StatLabel>
                <StatNumber>%{summaryData?.context_usage_percentage || 0}</StatNumber>
                <StatHelpText>
                  Son 24 saat: %{summaryData?.recent_context_usage || 0}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} _hover={{ shadow: 'lg' }}>
            <CardBody>
              <Stat>
                <StatLabel>Ortalama Yanıt Süresi</StatLabel>
                <StatNumber>{summaryData?.avg_response_time || 0}s</StatNumber>
                <StatHelpText>
                  Son 1 saat: {summaryData?.recent_response_time || 0}s
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </MotionBox>
      </SimpleGrid>

      {/* Grafikler */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={8}>
        <CardHeader>
          <Tabs onChange={(index) => setSelectedTab(index)}>
            <TabList>
              <Tab>
                <Icon as={LineChartIcon} mr={2} />
                Aktivite Trendi
              </Tab>
              <Tab>
                <Icon as={PieChartIcon} mr={2} />
                Context Analizi
              </Tab>
              <Tab>
                <Icon as={BarChartIcon} mr={2} />
                Saatlik Dağılım
              </Tab>
            </TabList>
          </Tabs>
        </CardHeader>
        <CardBody>
          <Box h="400px">
            <AnimatePresence mode="wait">
              {selectedTab === 0 && (
                <ScaleFade in={true}>
                  <Line data={summaryChartData} options={chartOptions} />
                </ScaleFade>
              )}
              {selectedTab === 1 && (
                <ScaleFade in={true}>
                  <Doughnut data={pieChartData} options={chartOptions} />
                </ScaleFade>
              )}
              {selectedTab === 2 && (
                <ScaleFade in={true}>
                  <Bar data={barChartData} options={chartOptions} />
                </ScaleFade>
              )}
            </AnimatePresence>
          </Box>
        </CardBody>
      </Card>

      {/* Rapor Listesi */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardHeader>
          <Flex align="center" mb={4}>
            <Heading size="md">Raporlar</Heading>
            <Spacer />
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Rapor ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Flex>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Stack spacing={4}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height="100px" />
              ))}
            </Stack>
          ) : error ? (
            <Alert status="error">
              <AlertIcon />
              <AlertTitle>Hata!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Grid
              templateColumns={
                viewMode === 'grid'
                  ? { base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }
                  : '1fr'
              }
              gap={6}
            >
              {filteredReports.map((report, index) => (
                <MotionBox
                  key={report.id || report.report_name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                    transition="all 0.2s"
                  >
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        <Flex justify="space-between" align="center">
                          <Heading size="sm">{report.display_name}</Heading>
                          <Tooltip label={favorites.includes(report.report_name) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}>
                            <IconButton
                              icon={favorites.includes(report.report_name) ? <StarIcon /> : <StarOutlineIcon />}
                              aria-label="Toggle favorite"
                              variant="ghost"
                              colorScheme={favorites.includes(report.report_name) ? 'yellow' : 'gray'}
                              onClick={() => handleToggleFavorite(report)}
                            />
                          </Tooltip>
                        </Flex>
                        <Text color={textColor} noOfLines={2}>
                          {report.description}
                        </Text>
                        <HStack spacing={2}>
                          <Badge colorScheme="blue">{report.category}</Badge>
                          {report.is_active && (
                            <Badge colorScheme="green">Aktif</Badge>
                          )}
                        </HStack>
                        <Button
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => {
                            setSelectedReport(report);
                            onOpen();
                          }}
                        >
                          Detayları Gör
                  </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                </MotionBox>
              ))}
            </Grid>
          )}
        </CardBody>
      </Card>

      <ReportDetailModal
        report={selectedReport}
        isOpen={isOpen}
        onClose={onClose}
      />

      <MobileMenu />
    </Container>
  );
};

export default ReportsPage; 