// src/pages/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPortfolio, getPortfolioLiveValue, getTransactions, getDiversificationScore, getWatchlist } from '../api/portfolio';
import { searchStocks } from '../api/stocks';
import StockCard from '../components/StockCard';
import { formatCurrency } from '../utils/format';
import { Pie, Line } from 'react-chartjs-2'; // --- ADDED: Line
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import Badges from '../components/Badges';
import NewsTicker from '../components/NewsTicker';
import Joyride, { STATUS } from 'react-joyride';
import { useWebSocket } from '../context/WebSocketContext';
import {
  Box, Container, Flex, Heading, Text, SimpleGrid,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  Input, List, ListItem, Spinner, Skeleton
} from '@chakra-ui/react';

// --- ADDED: Register Line Chart components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const DiversificationScoreCard = ({ scoreData }) => {
    if (!scoreData) {
        return <Skeleton height="120px" mb={8} borderRadius="lg" />;
    }
    const { score, feedback, color, suggestions } = scoreData;

    return (
        <Box
            bg="var(--bg-primary-dynamic, var(--bg-dark-primary))"
            p={6}
            borderRadius="lg"
            mb={8}
            borderLeftWidth="5px"
            borderLeftColor={color || 'gray.500'}
            boxShadow="md"
        >
            <Flex justify="space-between" align="start" wrap="wrap" gap={4}>
                <Box flex="1">
                    <Heading size="md" mb={1}>Portfolio Health: <span style={{color: color}}>{feedback}</span></Heading>
                    <Text fontSize="3xl" fontWeight="bold" color={color || 'gray.500'} mb={2}>
                        {score !== 'N/A' ? `${score}/100` : 'N/A'}
                    </Text>
                    
                    {suggestions && suggestions.length > 0 && (
                        <Box mt={3}>
                            <Text fontWeight="bold" fontSize="sm" color="var(--text-secondary-dynamic)" mb={1}>AI Suggestions:</Text>
                            <List spacing={1}>
                                {suggestions.map((s, i) => (
                                    <ListItem key={i} fontSize="sm" display="flex" alignItems="center">
                                        <span style={{marginRight: '8px'}}>•</span> {s}
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </Box>
            </Flex>
        </Box>
    );
};

const DashboardSkeleton = () => (
    <Container maxW="container.xl">
        <Skeleton height="200px" mb={8} borderRadius="lg"/>
        <SimpleGrid columns={[1, null, 2]} spacing={6}>
           <Skeleton height="250px" borderRadius="lg"/>
           <Skeleton height="250px" borderRadius="lg"/>
        </SimpleGrid>
    </Container>
);

function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { livePrices } = useWebSocket();
    
    const [portfolio, setPortfolio] = useState([]);
    const [watchlist, setWatchlist] = useState([]); 
    const [chartData, setChartData] = useState(null);
    const [historyChartData, setHistoryChartData] = useState(null); // --- ADDED: History Data
    const [livePortfolioValue, setLivePortfolioValue] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [investmentDetails, setInvestmentDetails] = useState({});
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [portfolioError, setPortfolioError] = useState('');
    const [symbol, setSymbol] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
    const [runTour, setRunTour] = useState(false);
    const [diversificationScore, setDiversificationScore] = useState(null);

    const tourSteps = [
        { target: '#cash-balance', content: 'This is your starting cash balance.' },
        { target: '#portfolio-history', content: 'Track your total net worth growth over time here.' }, // --- ADDED
        { target: '#stock-checker-box', content: 'Search for any stock here.' },
        { target: '#holdings-section', content: 'Your purchased investments appear here.' },
    ];

    useEffect(() => {
        const hasTakenTour = localStorage.getItem('benstocks_tour_complete');
        if (!hasTakenTour && !isInitialLoading) {
            setRunTour(true);
        }
    }, [isInitialLoading]);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            setRunTour(false);
            localStorage.setItem('benstocks_tour_complete', 'true');
        }
    };

    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) return;
        setIsInitialLoading(true);
        
        try {
            const [portfolioRes, liveValueRes, transactionsRes, diversificationRes, watchlistRes] = await Promise.all([
                getPortfolio(user.id), 
                getPortfolioLiveValue(user.id),
                getTransactions(user.id), 
                getDiversificationScore(user.id),
                getWatchlist(user.id)
            ]);

            // Process Portfolio & Allocation Chart
            if (portfolioRes && portfolioRes.investments) {
                 const holdings = {};
                 portfolioRes.investments.forEach(inv => {
                     if (holdings[inv.symbol]) {
                         holdings[inv.symbol].quantity += inv.quantity;
                         holdings[inv.symbol].buy_cost_inr += inv.buy_cost_inr;
                         holdings[inv.symbol].total_cost_original += (inv.quantity * inv.buy_price);
                     } else { 
                        holdings[inv.symbol] = { ...inv, total_cost_original: inv.quantity * inv.buy_price }; 
                    }
                 });
                 const consolidatedPortfolio = Object.values(holdings).map(holding => {
                     const average_buy_price = holding.quantity > 0 ? holding.total_cost_original / holding.quantity : 0;
                     return { ...holding, buy_price: average_buy_price };
                 });
                 setPortfolio(consolidatedPortfolio);

                 if (consolidatedPortfolio.length > 0) {
                     const labels = consolidatedPortfolio.map(inv => inv.symbol);
                     const data = consolidatedPortfolio.map(inv => inv.buy_cost_inr || 0);
                     const backgroundColors = labels.map(() => `hsla(${Math.random() * 360}, 70%, 70%, 0.6)`);
                     setChartData({ labels, datasets: [{ label: 'Allocation (Cost)', data, backgroundColor: backgroundColors }] });
                 } else { setChartData(null); }
            }

            // --- ADDED: Process History Chart ---
            // Check if liveValueRes has history (it should from our backend update)
            const historyData = liveValueRes.history || [];
            if (historyData.length > 0) {
                setHistoryChartData({
                    labels: historyData.map(h => h.date),
                    datasets: [
                        {
                            label: 'Net Worth (INR)',
                            data: historyData.map(h => h.total_net_worth),
                            borderColor: '#48BB78',
                            backgroundColor: 'rgba(72, 187, 120, 0.2)',
                            fill: true,
                            tension: 0.3
                        }
                    ]
                });
            }

            if (liveValueRes) { setLivePortfolioValue(liveValueRes); setInvestmentDetails(liveValueRes.investment_details || {}); }
            if (transactionsRes) { setTransactions(transactionsRes); }
            setDiversificationScore(diversificationRes);
            if (watchlistRes) { setWatchlist(watchlistRes); }

        } catch (error) {
            console.error("Failed fetch dashboard data:", error);
            setPortfolioError("Error fetching dashboard data.");
        } finally { setIsInitialLoading(false); }
    }, [user]);

    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

    useEffect(() => {
        if (symbol.trim() === '') { setSuggestions([]); return; }
        const fetchSuggestions = async () => {
            setIsSearching(true);
            const results = await searchStocks(symbol);
            setSuggestions(results); setIsSearching(false);
        };
        const debounceTimer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounceTimer);
    }, [symbol]);

    const handleSuggestionClick = (selectedSymbol) => {
        setSymbol(selectedSymbol); setSuggestions([]); setIsSuggestionsVisible(false);
        navigate(`/stock/${selectedSymbol}`);
    };

    if (isInitialLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <Container maxW="container.xl">
            <Joyride steps={tourSteps} run={runTour} callback={handleJoyrideCallback} continuous showProgress showSkipButton styles={{ options: { arrowColor: '#2d3748', backgroundColor: '#2d3748', primaryColor: '#4299e1', textColor: '#edf2f7' } }}/>

            <Flex justify="space-between" align="center" mb={8} wrap="wrap" gap={4}>
                <Box>
                    <Heading as="h1" size="xl">Welcome, {user?.username || 'Investor'}!</Heading>
                    <Text id="cash-balance" color="var(--text-secondary-dynamic, var(--text-secondary))" fontSize="lg">
                        Cash Balance: <Text as="span" fontWeight="bold" color="var(--text-primary-dynamic, var(--text-primary))">{formatCurrency(user?.balance || 0, 'INR')}</Text>
                    </Text>
                </Box>
                <Box textAlign="right">
                    {livePortfolioValue ? (
                        <>
                            <Text color="var(--text-secondary-dynamic, var(--text-secondary))">
                                Investments Value: <Text as="span" fontWeight="bold" color="var(--text-primary-dynamic, var(--text-primary))">{formatCurrency(livePortfolioValue.total_investment_value_inr, 'INR')}</Text>
                            </Text>
                            <Text fontSize="2xl" color="var(--text-primary-dynamic, var(--text-primary))" fontWeight="bold">
                                Total Assets: {formatCurrency(livePortfolioValue.total_portfolio_value_inr, 'INR')}
                            </Text>
                        </>
                    ) : <Spinner size="sm" />}
                </Box>
            </Flex>

            <DiversificationScoreCard scoreData={diversificationScore} />

            {/* --- ADDED: History Chart Section --- */}
            <Box 
                id="portfolio-history"
                bg="var(--bg-primary-dynamic, var(--bg-dark-primary))" 
                p={6} 
                borderRadius="lg" 
                boxShadow="md"
                mb={8}
                height="350px"
            >
                <Heading size="md" mb={4}>Portfolio Performance</Heading>
                {historyChartData ? (
                     <Line data={historyChartData} options={{ maintainAspectRatio: false }} />
                ) : (
                    <Flex justify="center" align="center" h="100%">
                        <Text color="gray.500">Graph will appear after 24 hours of activity.</Text>
                    </Flex>
                )}
            </Box>

            <SimpleGrid columns={[1, null, 2]} spacing={8} mb={8}>
                <Box id="news-ticker"><NewsTicker /></Box>
                <Box><Badges transactions={transactions} /></Box>
            </SimpleGrid>

            <Box id="stock-checker-box" mb={6} bg="var(--bg-primary-dynamic, var(--bg-dark-primary))" p={6} borderRadius="lg" boxShadow="md">
                <Heading size="md" mb={4}>Stock Checker</Heading>
                <Box position="relative" zIndex={50}> 
                    <Input
                        id="stock-checker-form"
                        placeholder="e.g., AAPL or Reliance"
                        value={symbol}
                        onChange={(e) => { setSymbol(e.target.value); setIsSuggestionsVisible(true); }}
                        onBlur={() => setTimeout(() => setIsSuggestionsVisible(false), 200)}
                    />
                    {isSuggestionsVisible && (suggestions.length > 0 || isSearching) && (
                        <Box
                            position="absolute" top="100%" left={0} right={0}
                            bg="var(--bg-primary-dynamic, var(--bg-dark-primary))"
                            borderWidth="1px" borderColor="var(--border-dynamic, var(--border-color))" borderRadius="0 0 8px 8px"
                            mt="-1px" zIndex={1000} maxHeight="300px" overflowY="auto" boxShadow="lg"
                        >
                            {isSearching && <Flex justify="center" p={4}><Spinner size="md"/></Flex>}
                            {!isSearching && (
                                <List spacing={0}>
                                    {suggestions.map((s) => (
                                        <ListItem
                                            key={s.symbol}
                                            onMouseDown={() => handleSuggestionClick(s.symbol)}
                                            px={4} py={2} cursor="pointer"
                                            borderBottomWidth="1px" borderColor="var(--border-dynamic, var(--border-color))"
                                            _hover={{ background: 'var(--bg-secondary-dynamic, var(--bg-dark-secondary))' }}
                                        >
                                            <Text as="strong">{s.symbol}</Text> <Text as="span" fontSize="sm">{s.name}</Text>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>

            <Box id="watchlist-section" mb={6}>
                <Heading size="md" mb={4}>Your Watchlist</Heading>
                {watchlist.length === 0 ? (
                    <Text color="gray.500">No stocks in watchlist.</Text>
                ) : (
                    <SimpleGrid columns={[2, 3, 4, 5]} spacing={4}>
                        {watchlist.map((symbol) => {
                            const price = livePrices[symbol]; 
                            return (
                                <Box 
                                    key={symbol} 
                                    bg="var(--bg-secondary-dynamic, var(--bg-dark-secondary))" 
                                    p={4} 
                                    borderRadius="lg" 
                                    border="1px solid var(--border-dynamic, var(--border-color))"
                                    cursor="pointer"
                                    _hover={{ borderColor: 'var(--brand-primary-dynamic, var(--brand-primary))', transform: 'translateY(-2px)' }}
                                    transition="all 0.2s"
                                    onClick={() => navigate(`/stock/${symbol}`)}
                                >
                                    <Text fontWeight="bold">{symbol}</Text>
                                    <Text fontSize="lg" mt={1}>{price ? formatCurrency(price, symbol.includes('.NS') ? 'INR' : 'USD') : <Spinner size="xs" />}</Text>
                                </Box>
                            );
                        })}
                    </SimpleGrid>
                )}
            </Box>

            <Accordion allowMultiple defaultIndex={[0, 1]}>
                <AccordionItem mb={6} border="none">
                    <h2><AccordionButton bg="var(--bg-primary-dynamic, var(--bg-dark-primary))" p={4} borderRadius="lg"><Box flex="1" textAlign="left"><Heading size="md">Portfolio Allocation</Heading></Box><AccordionIcon /></AccordionButton></h2>
                    <AccordionPanel pb={4} bg="var(--bg-secondary-dynamic, var(--bg-dark-secondary))" pt={4}>
                         {chartData ? <Box maxW="350px" mx="auto"><Pie data={chartData} /></Box> : <Text>No data.</Text>}
                    </AccordionPanel>
                </AccordionItem>

                <AccordionItem border="none">
                    <h2 id="holdings-section"><AccordionButton bg="var(--bg-primary-dynamic, var(--bg-dark-primary))" p={4} borderRadius="lg"><Box flex="1" textAlign="left"><Heading size="md">Your Holdings</Heading></Box><AccordionIcon /></AccordionButton></h2>
                    <AccordionPanel pb={4} bg="var(--bg-secondary-dynamic, var(--bg-dark-secondary))" pt={4}>
                        {portfolio.length === 0 ? <Text>No investments.</Text> : (
                            <SimpleGrid columns={[1, null, 2, 3]} spacing={6}>
                                {portfolio.map((inv) => <StockCard key={inv.symbol} investment={inv} fetchPortfolio={fetchDashboardData} liveDetails={investmentDetails[inv.id]} />)}
                            </SimpleGrid>
                        )}
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </Container>
    );
}

export default Dashboard;