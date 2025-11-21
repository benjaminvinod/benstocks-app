// src/pages/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPortfolio, getPortfolioLiveValue, getTransactions, getDiversificationScore, getWatchlist } from '../api/portfolio';
import { searchStocks, getMarketSummary, getTopMovers } from '../api/stocks';
import client from '../api/client'; // Import client for email requests
import { formatCurrency } from '../utils/format';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler } from 'chart.js';
import NewsTicker from '../components/NewsTicker';
import Joyride, { STATUS } from 'react-joyride';
import { useWebSocket } from '../context/WebSocketContext';
import {
  Box, Container, Flex, Heading, Text, SimpleGrid, Grid, GridItem,
  Input, List, ListItem, Spinner, Skeleton, Button, IconButton, Badge,
  Table, Thead, Tbody, Tr, Th, Td, HStack, keyframes, useToast,
  Select, Switch, FormControl, FormLabel, Radio, RadioGroup, Stack
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, ArrowForwardIcon, EmailIcon, DownloadIcon } from '@chakra-ui/icons';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler);

// --- CHART CONFIGURATION ---
const chartOptions = {
  plugins: {
    legend: { display: false },
    tooltip: { 
      backgroundColor: '#1e293b', 
      titleColor: '#f8fafc', 
      bodyColor: '#cbd5e1',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#64748b' } },
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } }
  },
  maintainAspectRatio: false,
  elements: {
    line: { tension: 0.4 },
    point: { radius: 0, hitRadius: 10 }
  }
};

// --- ANIMATION KEYFRAMES ---
const marquee = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

// --- HELPER: CURRENCY DETECTION ---
const getCurrency = (symbol) => {
    const s = symbol?.toUpperCase() || '';
    if (s.endsWith('.NS') || s.endsWith('.BO')) return 'INR';
    if (s.endsWith('-USD')) return 'USD';
    if (s.includes('-') || s === 'UTINIFTY') return 'INR';
    return 'USD';
};

// --- COMPONENTS ---

const TickerTape = () => {
    const [indices, setIndices] = useState([]);
    
    useEffect(() => {
        getMarketSummary().then(data => setIndices(data || []));
    }, []);

    if (indices.length === 0) return null;

    return (
        <Box bg="blackAlpha.600" borderBottom="1px solid" borderColor="whiteAlpha.100" overflow="hidden" whiteSpace="nowrap" py={2} position="relative">
            <Box 
                as="div" 
                display="inline-block" 
                animation={`${marquee} 60s linear infinite`}
                minW="100%"
                _hover={{ animationPlayState: 'paused' }}
            >
                <HStack spacing={12} display="inline-flex" pr={12}>
                    {[...indices, ...indices].map((idx, i) => (
                        <HStack key={`${idx.symbol}-${i}`} spacing={3}>
                            <Text fontWeight="bold" fontSize="xs" color="gray.400" textTransform="uppercase">{idx.name}</Text>
                            <Text fontWeight="bold" fontSize="sm" color="white">
                                {formatCurrency(idx.price, 'USD').replace('$','')}
                            </Text>
                            <Badge colorScheme={idx.change_percent >= 0 ? 'green' : 'red'} fontSize="xs" variant="solid">
                                {idx.change_percent >= 0 ? '▲' : '▼'} {Math.abs(idx.change_percent).toFixed(2)}%
                            </Badge>
                        </HStack>
                    ))}
                </HStack>
            </Box>
        </Box>
    );
};

const BentoCard = ({ children, title, icon, colSpan = 1, rowSpan = 1, minH = "auto", id }) => (
  <GridItem id={id} colSpan={colSpan} rowSpan={rowSpan} className="glass-panel fade-in" display="flex" flexDirection="column" overflow="hidden">
    {title && (
      <Flex align="center" p={4} borderBottom="1px solid" borderColor="whiteAlpha.100" bg="blackAlpha.200">
        {icon && <Box mr={2} color="brand.400">{icon}</Box>}
        <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="widest">
          {title}
        </Text>
      </Flex>
    )}
    <Box p={5} flex="1" minH={minH} overflowY="auto">
      {children}
    </Box>
  </GridItem>
);

const MoversList = ({ title, items, type }) => (
    <Box mb={4}>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2} textTransform="uppercase">{title}</Text>
        {items.map(m => (
            <Flex key={m.symbol} justify="space-between" align="center" mb={2} p={2} borderRadius="md" _hover={{bg: 'whiteAlpha.50'}}>
                <Text fontWeight="bold" fontSize="sm">{m.symbol}</Text>
                <Badge colorScheme={type === 'gain' ? 'green' : 'red'}>
                    {type === 'gain' ? '+' : ''}{Math.abs(m.change).toFixed(2)}%
                </Badge>
            </Flex>
        ))}
    </Box>
);

const AllocationChart = ({ data }) => {
  if (!data) return <Flex justify="center" align="center" h="100%"><Text color="gray.500">No assets</Text></Flex>;
  return (
    <Box h="200px" position="relative">
      <Doughnut 
        data={data} 
        options={{ 
          cutout: '70%', 
          plugins: { legend: { display: false } },
          maintainAspectRatio: false 
        }} 
      />
      <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" textAlign="center">
        <Text fontSize="xs" color="gray.500">Assets</Text>
        <Text fontWeight="bold" color="white">{data.datasets[0].data.length}</Text>
      </Box>
    </Box>
  );
};

function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { livePrices } = useWebSocket();
    const toast = useToast();
    
    const [portfolio, setPortfolio] = useState([]);
    const [watchlist, setWatchlist] = useState([]); 
    const [chartData, setChartData] = useState(null);
    const [historyChartData, setHistoryChartData] = useState(null);
    const [livePortfolioValue, setLivePortfolioValue] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [diversificationScore, setDiversificationScore] = useState(null);
    const [movers, setMovers] = useState({ gainers: [], losers: [] });
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [fallbackPrices, setFallbackPrices] = useState({}); 
    
    const [symbol, setSymbol] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [runTour, setRunTour] = useState(false);

    // --- EMAIL REPORTS STATE ---
    const [emailSettings, setEmailSettings] = useState({
        frequency: 'MANUAL', 
        format: 'TEXT',      
        enabled: false
    });
    const [sendingEmail, setSendingEmail] = useState(false);

    const tourSteps = [
        { target: '#hero-stat', content: 'Your total simulated Net Worth.' },
        { target: '#market-movers', content: 'Check top gainers and losers.' },
        { target: '#holdings-table', content: 'Your current stock and mutual fund positions.' },
        { target: '#reports-section', content: 'Generate PDF Reports of your portfolio here!' }
    ];

    useEffect(() => {
        const hasTakenTour = localStorage.getItem('benstocks_tour_complete');
        if (!hasTakenTour && !isInitialLoading) setRunTour(true);
    }, [isInitialLoading]);

    const handleJoyrideCallback = (data) => {
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) {
            setRunTour(false);
            localStorage.setItem('benstocks_tour_complete', 'true');
        }
    };

    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) return;
        setIsInitialLoading(true);
        try {
            const [portfolioRes, liveValueRes, transactionsRes, diversificationRes, watchlistRes, moversRes] = await Promise.all([
                getPortfolio(user.id), 
                getPortfolioLiveValue(user.id),
                getTransactions(user.id), 
                getDiversificationScore(user.id),
                getWatchlist(user.id),
                getTopMovers()
            ]);

            if (liveValueRes?.investment_details && portfolioRes?.investments) {
                const calculatedPrices = {};
                portfolioRes.investments.forEach(inv => {
                    const details = liveValueRes.investment_details[inv.id];
                    if (details && details.live_value_inr && inv.quantity > 0) {
                        calculatedPrices[inv.symbol] = details.live_value_inr / inv.quantity;
                    }
                });
                setFallbackPrices(calculatedPrices);
            }

            if (portfolioRes?.investments) {
                 const holdingsMap = {};
                 portfolioRes.investments.forEach(inv => {
                    if (!holdingsMap[inv.symbol]) {
                        holdingsMap[inv.symbol] = { ...inv, total_cost: inv.quantity * inv.buy_price, total_qty: inv.quantity };
                    } else {
                        holdingsMap[inv.symbol].total_qty += inv.quantity;
                        holdingsMap[inv.symbol].total_cost += (inv.quantity * inv.buy_price);
                    }
                 });
                 
                 const consolidated = Object.values(holdingsMap).map(h => ({
                     ...h,
                     avg_price: h.total_cost / h.total_qty,
                     quantity: h.total_qty 
                 }));

                 setPortfolio(consolidated);

                 const labels = consolidated.map(inv => inv.symbol);
                 const data = consolidated.map(inv => inv.total_cost); 
                 setChartData({ 
                   labels, 
                   datasets: [{ 
                     data, 
                     backgroundColor: ['#0ea5e9', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1'],
                     borderWidth: 0
                   }] 
                 });
            }

            const historyData = liveValueRes.history || [];
            if (historyData.length > 0) {
                setHistoryChartData({
                    labels: historyData.map(h => h.date),
                    datasets: [{
                        label: 'Net Worth',
                        data: historyData.map(h => h.total_net_worth),
                        borderColor: '#0ea5e9',
                        backgroundColor: (context) => {
                          const ctx = context.chart.ctx;
                          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                          gradient.addColorStop(0, 'rgba(14, 165, 233, 0.5)');
                          gradient.addColorStop(1, 'rgba(14, 165, 233, 0.0)');
                          return gradient;
                        },
                        fill: true,
                    }]
                });
            }

            if (liveValueRes) setLivePortfolioValue(liveValueRes);
            if (transactionsRes) setTransactions(transactionsRes.slice(0, 5));
            if (diversificationRes) setDiversificationScore(diversificationRes);
            if (watchlistRes) setWatchlist(watchlistRes);
            if (moversRes) setMovers(moversRes);

        } catch (error) { console.error(error); } 
        finally { setIsInitialLoading(false); }
    }, [user]);

    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

    useEffect(() => {
        if (symbol.trim() === '') { setSuggestions([]); return; }
        const timer = setTimeout(async () => {
            setIsSearching(true);
            const results = await searchStocks(symbol);
            setSuggestions(results); setIsSearching(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [symbol]);

    // --- REPORT HANDLERS ---
    const handleManualEmail = async () => {
        setSendingEmail(true);
        try {
            await client.post(`/analytics/send-tax-report/${user.id}`, {
                format: emailSettings.format,
                frequency: 'MANUAL'
            });
            toast({ title: `Report Sent!`, description: `Check your inbox for the ${emailSettings.format} report.`, status: "success", duration: 5000 });
        } catch (error) {
            toast({ title: "Email Failed", description: "Could not send email. Check backend logs.", status: "error" });
        }
        setSendingEmail(false);
    };

    const handleFrequencyChange = (e) => {
        const newFreq = e.target.value;
        setEmailSettings({ ...emailSettings, frequency: newFreq });
        if (newFreq === 'MANUAL') {
            toast({ title: "Manual Mode Selected", description: "Use the 'Send Now' button to trigger emails.", status: "info", duration: 3000 });
        }
    };

    if (isInitialLoading) {
        return (
            <Container maxW="container.xl" pt={8}>
                <Skeleton height="200px" borderRadius="xl" mb={6} startColor="whiteAlpha.100" endColor="whiteAlpha.300"/>
                <SimpleGrid columns={[1, 2, 4]} spacing={6}>
                    <Skeleton height="150px" borderRadius="xl" />
                    <Skeleton height="150px" borderRadius="xl" />
                    <Skeleton height="150px" borderRadius="xl" />
                    <Skeleton height="150px" borderRadius="xl" />
                </SimpleGrid>
            </Container>
        );
    }

    const totalValue = livePortfolioValue?.total_portfolio_value_inr || 0;
    const totalInvested = livePortfolioValue?.total_investment_value_inr || 0;
    const cashBalance = user?.balance || 0;

    return (
        <Box>
            <TickerTape /> 
            <Container maxW="100%" px={[4, 6, 8]} py={8}>
                <Joyride steps={tourSteps} run={runTour} callback={handleJoyrideCallback} continuous showSkipButton 
                    styles={{ options: { primaryColor: '#0ea5e9', backgroundColor: '#1e293b', textColor: '#fff', arrowColor: '#1e293b' } }} 
                />

                <Flex justify="space-between" align="center" mb={8}>
                    <Box>
                        <Text fontSize="sm" color="gray.400">Command Center</Text>
                        <Heading size="lg">{user?.username || 'Trader'}</Heading>
                    </Box>
                    <Button leftIcon={<AddIcon />} colorScheme="brand" onClick={() => document.getElementById('stock-search').focus()}>
                        New Trade
                    </Button>
                </Flex>

                <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={6}>
                    
                    <BentoCard colSpan={{ base: 1, md: 2 }} title="Total Net Worth" id="hero-stat">
                        <Flex align="center" justify="space-between" h="100%">
                            <Box>
                                <Text fontSize="4xl" fontWeight="bold" className="mono-font">
                                    {formatCurrency(totalValue, 'INR')}
                                </Text>
                                <Badge colorScheme="green" mt={2}>Live Connected 🟢</Badge> 
                            </Box>
                            <Box textAlign="right">
                                <Text color="gray.400" fontSize="sm">Cash</Text>
                                <Text fontWeight="bold" fontSize="lg" className="mono-font">{formatCurrency(cashBalance, 'INR')}</Text>
                                <Text color="gray.400" fontSize="sm" mt={1}>Invested</Text>
                                <Text fontWeight="bold" fontSize="lg" className="mono-font">{formatCurrency(totalInvested, 'INR')}</Text>
                            </Box>
                        </Flex>
                    </BentoCard>

                    <BentoCard title="Market Movers (Today)" colSpan={1} id="market-movers">
                        {movers.gainers.length > 0 ? (
                            <>
                                <MoversList title="Top Gainers" items={movers.gainers} type="gain" />
                                <MoversList title="Top Losers" items={movers.losers} type="loss" />
                            </>
                        ) : <Spinner size="sm" />}
                    </BentoCard>

                    <BentoCard title="Quick Trade" colSpan={1} id="quick-actions">
                        <Box position="relative">
                            <Input 
                                id="stock-search" placeholder="Search Ticker (e.g. AAPL)" 
                                bg="blackAlpha.400" border="none" _focus={{ bg: 'blackAlpha.500', ring: 1, ringColor: 'brand.500' }}
                                value={symbol} onChange={(e) => setSymbol(e.target.value)}
                            />
                            <IconButton position="absolute" right={1} top={1} size="sm" icon={<SearchIcon />} variant="ghost" isLoading={isSearching} />
                            {suggestions.length > 0 && (
                                <List position="absolute" w="100%" mt={2} bg="bg.800" borderRadius="md" boxShadow="xl" zIndex={10} border="1px solid" borderColor="whiteAlpha.200">
                                    {suggestions.map(s => (
                                        <ListItem key={s.symbol} p={3} _hover={{ bg: 'whiteAlpha.100' }} cursor="pointer" onClick={() => navigate(`/stock/${s.symbol}`)}>
                                            <Flex justify="space-between"><Text fontWeight="bold">{s.symbol}</Text><Text fontSize="sm" color="gray.400">{s.name}</Text></Flex>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>
                        <Flex mt={4} gap={2} wrap="wrap">
                            {['AAPL', 'TSLA', 'RELIANCE.NS', 'NIFTYBEES.NS'].map(t => (
                                <Button key={t} size="xs" variant="outline" onClick={() => navigate(`/stock/${t}`)}>{t}</Button>
                            ))}
                        </Flex>
                    </BentoCard>

                    <BentoCard title="Performance History" colSpan={{ base: 1, md: 3 }} rowSpan={2} minH="300px" id="chart-section">
                         {historyChartData ? <Line data={historyChartData} options={chartOptions} /> : <Flex justify="center" align="center" h="100%"><Text color="gray.500">No history data available</Text></Flex>}
                    </BentoCard>

                    <BentoCard title="Allocation" colSpan={1} rowSpan={1}>
                        <AllocationChart data={chartData} />
                    </BentoCard>

                    <BentoCard title="Watchlist" colSpan={1} rowSpan={2}>
                        {watchlist.length === 0 ? <Text color="gray.500" fontSize="sm">No favorites yet.</Text> : (
                            <List spacing={3}>
                                {watchlist.slice(0, 5).map(sym => {
                                    const price = livePrices[sym];
                                    return (
                                        <ListItem key={sym} p={2} borderRadius="md" _hover={{ bg: 'whiteAlpha.50' }} cursor="pointer" onClick={() => navigate(`/stock/${sym}`)}>
                                            <Flex justify="space-between" align="center">
                                                <Box>
                                                    <Text fontWeight="bold" fontSize="sm">{sym}</Text>
                                                    <Text fontSize="xs" color="gray.500">Stock</Text>
                                                </Box>
                                                <Text className="mono-font" fontWeight="600">
                                                    {price ? formatCurrency(price, getCurrency(sym)) : <Spinner size="xs" />}
                                                </Text>
                                            </Flex>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        )}
                        <Button mt={4} w="full" size="xs" variant="ghost" rightIcon={<ArrowForwardIcon />}>View All</Button>
                    </BentoCard>
                    
                    <BentoCard title="Your Holdings" colSpan={{ base: 1, md: 3 }} id="holdings-table">
                        {portfolio.length === 0 ? (
                            <Text color="gray.500" fontSize="sm">You don't have any investments yet.</Text>
                        ) : (
                            <Table variant="simple" size="sm">
                                <Thead>
                                    <Tr>
                                        <Th color="gray.400">Ticker</Th>
                                        <Th color="gray.400" isNumeric>Qty</Th>
                                        <Th color="gray.400" isNumeric>Avg Buy</Th>
                                        <Th color="gray.400" isNumeric>Current</Th>
                                        <Th color="gray.400" isNumeric>Return</Th>
                                        <Th></Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {portfolio.map((inv) => {
                                        const currentPrice = livePrices[inv.symbol] || fallbackPrices[inv.symbol] || inv.buy_price;
                                        const pnl = ((currentPrice - inv.avg_price) / inv.avg_price) * 100;
                                        const isProfitable = pnl >= 0;
                                        const currency = getCurrency(inv.symbol);

                                        return (
                                            <Tr key={inv.symbol} _hover={{ bg: 'whiteAlpha.50' }} cursor="pointer" onClick={() => navigate(`/stock/${inv.symbol}`)}>
                                                <Td fontWeight="bold">{inv.symbol}</Td>
                                                <Td isNumeric className="mono-font">{inv.quantity.toFixed(2)}</Td>
                                                <Td isNumeric className="mono-font">{formatCurrency(inv.avg_price, currency)}</Td>
                                                <Td isNumeric className="mono-font">
                                                    {(livePrices[inv.symbol] || fallbackPrices[inv.symbol]) 
                                                        ? formatCurrency(currentPrice, currency) 
                                                        : <Spinner size="xs"/>}
                                                </Td>
                                                <Td isNumeric>
                                                    <Badge colorScheme={isProfitable ? 'green' : 'red'}>
                                                        {isProfitable ? '+' : ''}{pnl.toFixed(2)}%
                                                    </Badge>
                                                </Td>
                                                <Td><IconButton size="xs" icon={<ArrowForwardIcon />} variant="ghost" /></Td>
                                            </Tr>
                                        );
                                    })}
                                </Tbody>
                            </Table>
                        )}
                    </BentoCard>

                    {/* --- REPORTS & ALERTS CARD --- */}
                    <BentoCard title="Reports & Alerts" colSpan={{ base: 1, md: 4 }} id="reports-section" icon={<EmailIcon />}>
                        {/* Horizontal Stack for Layout */}
                        <HStack spacing={6} alignItems="center" width="100%" justifyContent="space-between">
                            
                            <FormControl display="flex" alignItems="center" maxW="150px">
                                <FormLabel htmlFor="email-alerts" mb="0" fontSize="sm" mr={2}>
                                    Auto-Send?
                                </FormLabel>
                                <Switch 
                                    id="email-alerts" 
                                    size="md"
                                    isChecked={emailSettings.enabled} 
                                    onChange={(e) => setEmailSettings({...emailSettings, enabled: e.target.checked})}
                                    colorScheme="green" 
                                />
                            </FormControl>

                            <Box flex="1" maxW="300px">
                                <Select 
                                    size="sm"
                                    value={emailSettings.frequency}
                                    onChange={handleFrequencyChange}
                                    bg="whiteAlpha.100"
                                    disabled={!emailSettings.enabled}
                                >
                                    <option value="DAILY" style={{color:'black'}}>Daily Brief</option>
                                    <option value="WEEKLY" style={{color:'black'}}>Weekly (Mon)</option>
                                    <option value="MONTHLY" style={{color:'black'}}>Monthly (1st)</option>
                                    <option value="MANUAL" style={{color:'black'}}>Manual Only</option>
                                </Select>
                            </Box>

                            <Box>
                                <RadioGroup 
                                    size="sm"
                                    value={emailSettings.format} 
                                    onChange={(val) => setEmailSettings({...emailSettings, format: val})}
                                >
                                    <Stack direction="row" spacing={4}>
                                        <Radio value="TEXT">Text</Radio>
                                        <Radio value="PDF">PDF</Radio>
                                    </Stack>
                                </RadioGroup>
                            </Box>

                            <Button 
                                size="sm"
                                leftIcon={<DownloadIcon />} 
                                colorScheme="brand" 
                                onClick={handleManualEmail}
                                isLoading={sendingEmail}
                                minW="120px"
                            >
                                Send Now
                            </Button>
                        </HStack>
                    </BentoCard>

                    {/* --- MARKET SENTIMENT (NEWS) --- */}
                    <BentoCard title="Global Market Sentiment" colSpan={{ base: 1, md: 4 }}>
                        <NewsTicker />
                    </BentoCard>

                </Grid>
            </Container>
        </Box>
    );
}

export default Dashboard;