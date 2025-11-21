// src/components/StockChart.js
import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import { getStockHistory } from '../api/stocks';
import { Box, Flex, Button, Spinner, Text } from '@chakra-ui/react';

function StockChart({ symbol }) {
    const chartContainerRef = useRef();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [period, setPeriod] = useState('1y');

    // We use a single useEffect to handle the Chart Lifecycle (Create -> Fetch -> Destroy)
    // This prevents the "chart is not a function" error by ensuring perfect order of operations.
    useEffect(() => {
        const container = chartContainerRef.current;
        if (!container) return;

        // 1. CONFIGURATION: Define the Professional Look (Midnight Theme)
        const chartOptions = {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#94a3b8', // Slate-400
                fontFamily: "'Inter', sans-serif",
            },
            grid: {
                vertLines: { color: 'rgba(40, 40, 40, 0)' }, // Hidden vertical grid
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' }, // Subtle horizontal grid
            },
            width: container.clientWidth,
            height: 400,
            timeScale: {
                borderColor: '#334155',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: '#334155',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
            crosshair: {
                mode: 1, // Magnet mode
                vertLine: {
                    width: 1,
                    color: 'rgba(255, 255, 255, 0.1)',
                    style: 0,
                },
                horzLine: {
                    width: 1,
                    color: 'rgba(255, 255, 255, 0.1)',
                    style: 0,
                },
            },
        };

        // 2. INITIALIZATION: Create the chart instance
        const chart = createChart(container, chartOptions);

        // 3. SERIES: Add the Candlestick Series using the v5.0+ API
        // Replaced 'addCandlestickSeries' with 'addSeries(CandlestickSeries, ...)'
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10b981',        // Emerald Green
            downColor: '#f43f5e',      // Rose Red
            borderVisible: false,      // Cleaner look without borders
            wickUpColor: '#10b981',    // Matching wick colors
            wickDownColor: '#f43f5e',
        });

        // 4. DATA FETCHING: Get data from Backend and set it
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch OHLC data from our Python Backend
                const data = await getStockHistory(symbol, period);
                
                if (data && data.length > 0) {
                    candlestickSeries.setData(data);
                    chart.timeScale().fitContent(); // Auto-zoom to fit data
                } else {
                    setError('No data available for this period.');
                }
            } catch (err) {
                console.error("Chart Data Error:", err);
                setError('Failed to load chart data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // 5. RESPONSIVENESS: Handle Window Resize
        const handleResize = () => {
            if (container) {
                chart.applyOptions({ width: container.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);

        // 6. CLEANUP: Destroy chart when component unmounts or symbol/period changes
        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };

    }, [symbol, period]); // Re-run everything if Symbol or Period changes

    // Period Buttons Configuration
    const periods = ['1mo', '3mo', '6mo', '1y', '2y', '5y'];

    return (
        <Box className="glass-panel" p={4} mt={6} borderRadius="xl" bg="var(--bg-dark-secondary)">
            {/* Header Section */}
            <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
                <Text fontWeight="bold" color="gray.400" fontSize="sm" letterSpacing="wider">
                    PRICE ACTION
                </Text>
                
                {/* Period Selectors */}
                <Flex gap={2} overflowX="auto" css={{ '::-webkit-scrollbar': { display: 'none' } }}>
                    {periods.map(p => (
                        <Button 
                            key={p} 
                            size="xs" 
                            variant={period === p ? "solid" : "ghost"}
                            colorScheme={period === p ? "blue" : "gray"}
                            onClick={() => setPeriod(p)}
                            borderRadius="md"
                            _hover={{ bg: period === p ? 'blue.600' : 'whiteAlpha.100' }}
                        >
                            {p.toUpperCase()}
                        </Button>
                    ))}
                </Flex>
            </Flex>
            
            {/* Chart Container */}
            <Box position="relative" h="400px" w="100%">
                {/* Loading Overlay */}
                {loading && (
                    <Flex 
                        justify="center" 
                        align="center" 
                        h="100%" 
                        position="absolute" 
                        w="100%" 
                        zIndex={10} 
                        bg="rgba(15, 23, 42, 0.6)" 
                        backdropFilter="blur(2px)"
                        borderRadius="lg"
                    >
                        <Spinner color="blue.400" size="xl" thickness="3px" />
                    </Flex>
                )}
                
                {/* Error Overlay */}
                {error && (
                    <Flex justify="center" align="center" h="100%" position="absolute" w="100%" zIndex={9}>
                        <Text color="red.400" bg="rgba(0,0,0,0.7)" px={4} py={2} borderRadius="md">
                            {error}
                        </Text>
                    </Flex>
                )}
                
                {/* The Actual Chart Div */}
                <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
            </Box>
        </Box>
    );
}

export default StockChart;