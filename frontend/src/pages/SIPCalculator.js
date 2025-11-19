// src/pages/SIPCalculator.js
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Box, Container, Heading, Text, Input, Slider, SliderTrack, 
    SliderFilledTrack, SliderThumb, Button, SimpleGrid, VStack, 
    Select, Tabs, TabList, TabPanels, Tab, TabPanel, List, ListItem, Spinner, Badge
} from '@chakra-ui/react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import BackButton from '../components/BackButton';
import { useNumberFormat } from '../context/NumberFormatContext'; // ✅ Uses the new hook
import axios from 'axios';
import { searchStocks } from '../api/stocksApi';
import { getStockHistory } from '../api/stocks';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const BASE_URL = "http://localhost:8000";

// Estimated returns for MF categories (Rule of thumb)
const MF_CATEGORY_RETURNS = {
    "Smallcap Funds": 18,
    "Midcap Funds": 15,
    "Contra & Value Funds": 14,
    "Flexicap Funds": 13,
    "Large & MidCap Funds": 13,
    "ELSS Funds": 12.5,
    "Index Funds": 12,
    "Debt Funds": 7,
    "Uncategorized": 10
};

// ✅ Categories list (Ensuring this is present)
const FUND_CATEGORIES = [
    "All Funds", "Index Funds", "Midcap Funds", "Smallcap Funds",
    "Flexicap Funds", "ELSS Funds", "Contra & Value Funds"
];

function SIPCalculator() {
    const [mode, setMode] = useState('mf'); 
    const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
    const [rateOfReturn, setRateOfReturn] = useState(12);
    const [timePeriod, setTimePeriod] = useState(10);
    const [chartData, setChartData] = useState(null);
    const [results, setResults] = useState({ invested: 0, gains: 0, total: 0 });

    // ✅ Global Number Formatter
    const { formatNumber } = useNumberFormat();

    // MF State
    const [funds, setFunds] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All Funds');
    const [selectedFund, setSelectedFund] = useState('');

    // Stock State
    const [symbol, setSymbol] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [stockLoading, setStockLoading] = useState(false);

    useEffect(() => {
        const fetchFunds = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/mutual-funds`);
                setFunds(res.data);
            } catch (err) {
                console.error("Failed to load funds");
            }
        };
        fetchFunds();
    }, []);

    // ✅ Filter Logic (Ensuring this is present)
    const filteredFunds = useMemo(() => {
        if (selectedCategory === 'All Funds') return funds;
        return funds.filter(f => f.category === selectedCategory);
    }, [funds, selectedCategory]);

    const calculateSIP = () => {
        const P = monthlyInvestment;
        const i = rateOfReturn / 12 / 100;
        const n = timePeriod * 12;

        const totalValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
        const investedAmount = P * n;
        const estimatedReturns = totalValue - investedAmount;

        setResults({
            invested: investedAmount,
            gains: estimatedReturns,
            total: totalValue
        });

        const labels = [];
        const investedData = [];
        const valueData = [];
        for (let year = 1; year <= timePeriod; year++) {
            labels.push(`Year ${year}`);
            const n_years = year * 12;
            const val = P * ((Math.pow(1 + i, n_years) - 1) / i) * (1 + i);
            investedData.push(P * n_years);
            valueData.push(val);
        }

        setChartData({
            labels,
            datasets: [
                {
                    label: 'Projected Value',
                    data: valueData,
                    borderColor: '#48BB78',
                    backgroundColor: 'rgba(72, 187, 120, 0.2)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Invested Amount',
                    data: investedData,
                    borderColor: '#4299E1',
                    backgroundColor: 'rgba(66, 153, 225, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        });
    };

    useEffect(() => {
        calculateSIP();
    }, [monthlyInvestment, rateOfReturn, timePeriod]);

    // ✅ Category Handler
    const handleCategoryChange = (e) => {
        const cat = e.target.value;
        setSelectedCategory(cat);
        setSelectedFund(''); 
        if (cat !== 'All Funds' && MF_CATEGORY_RETURNS[cat]) {
             setRateOfReturn(MF_CATEGORY_RETURNS[cat]);
        }
    };

    const handleFundChange = (e) => {
        const fundId = e.target.value;
        setSelectedFund(fundId);
        const fund = funds.find(f => f.id === fundId);
        if (fund) {
            const expectedReturn = MF_CATEGORY_RETURNS[fund.category] || 12;
            setRateOfReturn(expectedReturn);
            toast.info(`Set return rate to ${expectedReturn}% based on ${fund.category} historical averages.`);
        }
    };

    const handleStockSearch = async (query) => {
        setSymbol(query);
        if (!query) { setSuggestions([]); return; }
        setIsSearching(true);
        const results = await searchStocks(query);
        setSuggestions(results);
        setIsSearching(false);
    };

    const handleStockSelect = async (selectedSymbol) => {
        setSymbol(selectedSymbol);
        setSuggestions([]);
        setStockLoading(true);
        try {
            const history = await getStockHistory(selectedSymbol, '5y');
            if (history && history.length > 0) {
                const startPrice = history[0].Close;
                const endPrice = history[history.length - 1].Close;
                const years = 5;
                let cagr = (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100;
                if (cagr < 0) cagr = 0; 
                if (cagr > 35) cagr = 35; 
                setRateOfReturn(Number(cagr.toFixed(1)));
                toast.success(`Calculated 5-Year CAGR for ${selectedSymbol}: ${cagr.toFixed(1)}%`);
            } else {
                toast.warning("Not enough history to calculate CAGR. Defaulting to 15%.");
                setRateOfReturn(15);
            }
        } catch (err) {
            console.error(err);
            toast.error("Could not fetch stock history.");
        } finally {
            setStockLoading(false);
        }
    };

    return (
        <Container maxW="container.xl" className="container">
            <BackButton />
            <div className="page-header">
                <Heading>SIP Calculator</Heading>
                <Text>Project your wealth growth with Systematic Investment Plans.</Text>
            </div>

            <Tabs variant="soft-rounded" colorScheme="blue" mb={6} onChange={(index) => setMode(index === 0 ? 'mf' : 'stock')}>
                <TabList>
                    <Tab color="var(--text-primary)">Mutual Fund SIP</Tab>
                    <Tab color="var(--text-primary)">Stock SIP</Tab>
                </TabList>
            </Tabs>

            <SimpleGrid columns={[1, null, 2]} spacing={10}>
                <VStack spacing={6} align="stretch" bg="var(--bg-secondary-dynamic)" p={6} borderRadius="lg">
                    
                    {mode === 'mf' && (
                        <Box>
                            {/* ✅ Category Dropdown */}
                            <Text mb={2} fontWeight="bold">1. Select Fund Category</Text>
                            <Select 
                                value={selectedCategory} 
                                onChange={handleCategoryChange}
                                bg="var(--bg-dark-primary)"
                                borderColor="var(--border-dynamic)"
                                mb={4}
                            >
                                {FUND_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat} style={{color: 'black'}}>{cat}</option>
                                ))}
                            </Select>

                            {/* ✅ Fund Dropdown (Filtered) */}
                            <Text mb={2} fontWeight="bold">2. Select Mutual Fund</Text>
                            <Select 
                                value={selectedFund} 
                                onChange={handleFundChange}
                                bg="var(--bg-dark-primary)"
                                borderColor="var(--border-dynamic)"
                                disabled={filteredFunds.length === 0}
                            >
                                <option value="">-- Choose a Fund ({filteredFunds.length}) --</option>
                                {filteredFunds.map(f => (
                                    <option key={f.id} value={f.id} style={{color: 'black'}}>
                                        {f.name}
                                    </option>
                                ))}
                            </Select>
                        </Box>
                    )}

                    {mode === 'stock' && (
                        <Box>
                             <Text mb={2} fontWeight="bold">Select Stock</Text>
                            <Box position="relative">
                                <Input 
                                    value={symbol}
                                    onChange={(e) => handleStockSearch(e.target.value)}
                                    placeholder="Search e.g., RELIANCE, TATAMOTORS"
                                    bg="var(--bg-dark-primary)"
                                />
                                {isSearching && <Spinner size="sm" position="absolute" right={3} top={3} />}
                                {suggestions.length > 0 && (
                                    <List 
                                        position="absolute" top="100%" left={0} right={0} 
                                        bg="var(--bg-dark-primary)" zIndex={10} 
                                        border="1px solid var(--border-dynamic)" borderRadius="md"
                                        maxH="200px" overflowY="auto"
                                    >
                                        {suggestions.map(s => (
                                            <ListItem 
                                                key={s.symbol} 
                                                p={2} 
                                                _hover={{bg: 'var(--bg-secondary-dynamic)'}}
                                                cursor="pointer"
                                                onClick={() => handleStockSelect(s.symbol)}
                                            >
                                                <Text fontWeight="bold">{s.symbol}</Text>
                                                <Text fontSize="xs">{s.name}</Text>
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                                {stockLoading && <Text fontSize="xs" color="blue.300" mt={1}>Analyzing historical returns...</Text>}
                            </Box>
                        </Box>
                    )}

                    <Box>
                        <Text mb={2}>Monthly Investment (₹)</Text>
                        <Input 
                            type="number" 
                            value={monthlyInvestment} 
                            onChange={(e) => setMonthlyInvestment(Number(e.target.value))} 
                            mb={2}
                        />
                        <Slider value={monthlyInvestment} min={500} max={100000} step={500} onChange={setMonthlyInvestment}>
                            <SliderTrack><SliderFilledTrack bg="blue.400" /></SliderTrack>
                            <SliderThumb />
                        </Slider>
                    </Box>

                    <Box>
                        <Text mb={2}>
                            Expected Return Rate (p.a) % 
                            {mode === 'stock' && symbol && <Badge ml={2} colorScheme="green">Based on 5Y History</Badge>}
                            {mode === 'mf' && selectedFund && <Badge ml={2} colorScheme="blue">Category Avg</Badge>}
                        </Text>
                        <Input 
                            type="number" 
                            value={rateOfReturn} 
                            onChange={(e) => setRateOfReturn(Number(e.target.value))} 
                            mb={2}
                        />
                        <Slider value={rateOfReturn} min={1} max={35} step={0.1} onChange={setRateOfReturn}>
                            <SliderTrack><SliderFilledTrack bg="green.400" /></SliderTrack>
                            <SliderThumb />
                        </Slider>
                    </Box>

                    <Box>
                        <Text mb={2}>Time Period (Years)</Text>
                        <Input 
                            type="number" 
                            value={timePeriod} 
                            onChange={(e) => setTimePeriod(Number(e.target.value))} 
                            mb={2}
                        />
                        <Slider value={timePeriod} min={1} max={40} step={1} onChange={setTimePeriod}>
                            <SliderTrack><SliderFilledTrack bg="purple.400" /></SliderTrack>
                            <SliderThumb />
                        </Slider>
                    </Box>
                </VStack>

                <VStack spacing={6} align="stretch">
                    <SimpleGrid columns={3} spacing={4} textAlign="center">
                        <Box bg="var(--bg-dark-primary)" p={3} borderRadius="md" border="1px solid var(--border-dynamic)">
                            <Text fontSize="sm" color="gray.400">Invested</Text>
                            {/* ✅ Uses formatNumber hook for Indian System support */}
                            <Text fontWeight="bold">{formatNumber(results.invested)}</Text>
                        </Box>
                        <Box bg="var(--bg-dark-primary)" p={3} borderRadius="md" border="1px solid var(--border-dynamic)">
                            <Text fontSize="sm" color="gray.400">Est. Returns</Text>
                            <Text fontWeight="bold" color="green.400">{formatNumber(results.gains)}</Text>
                        </Box>
                        <Box bg="var(--bg-dark-primary)" p={3} borderRadius="md" border="1px solid var(--border-dynamic)">
                            <Text fontSize="sm" color="gray.400">Total Value</Text>
                            <Text fontWeight="bold" fontSize="xl">{formatNumber(results.total)}</Text>
                        </Box>
                    </SimpleGrid>

                    <Box bg="var(--bg-dark-primary)" p={4} borderRadius="lg" height="350px" border="1px solid var(--border-dynamic)">
                        {chartData && <Line data={chartData} options={{ maintainAspectRatio: false, elements: { point: { radius: 0 } } }} />}
                    </Box>
                </VStack>
            </SimpleGrid>
        </Container>
    );
}

export default SIPCalculator;