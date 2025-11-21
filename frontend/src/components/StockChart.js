// src/components/StockChart.js
import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { getStockHistory } from '../api/stocks';
import { Box, Flex, Button, Spinner, Text } from '@chakra-ui/react';

function StockChart({ symbol }) {
    const chartContainerRef = useRef();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [period, setPeriod] = useState('1y');

    useEffect(() => {
        const container = chartContainerRef.current;
        if (!container) return;

        // 1. Initialize Chart
        const chart = createChart(container, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#94a3b8',
            },
            grid: {
                vertLines: { color: 'rgba(40, 40, 40, 0)' }, // Hide vertical grid
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            width: container.clientWidth,
            height: 400,
            timeScale: {
                borderColor: '#334155',
                timeVisible: true,
            },
            rightPriceScale: {
                borderColor: '#334155',
            },
        });

        // 2. Add Candlestick Series
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#10b981', // Emerald Green
            downColor: '#f43f5e', // Rose Red
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#f43f5e',
        });

        // 3. Fetch Data
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await getStockHistory(symbol, period);
                // Lightweight charts expects: { time: '2023-01-01', open: ..., high: ..., low: ..., close: ... }
                // Our updated API provides exactly this.
                candlestickSeries.setData(data);
                chart.timeScale().fitContent();
            } catch (err) {
                setError('Failed to load chart data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // 4. Handle Resize
        const handleResize = () => {
            chart.applyOptions({ width: container.clientWidth });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [symbol, period]);

    const periods = ['1mo', '3mo', '6mo', '1y', '2y', '5y'];

    return (
        <Box className="glass-panel" p={4} mt={6} borderRadius="xl" bg="var(--bg-dark-secondary)">
            <Flex justify="space-between" align="center" mb={4}>
                <Text fontWeight="bold" color="gray.400" fontSize="sm">PRICE ACTION (CANDLESTICK)</Text>
                <Flex gap={2} wrap="wrap">
                    {periods.map(p => (
                        <Button 
                            key={p} 
                            size="xs" 
                            variant={period === p ? "solid" : "ghost"}
                            colorScheme={period === p ? "blue" : "gray"}
                            onClick={() => setPeriod(p)}
                        >
                            {p.toUpperCase()}
                        </Button>
                    ))}
                </Flex>
            </Flex>
            
            <Box position="relative" h="400px" w="100%">
                {loading && (
                    <Flex justify="center" align="center" h="100%" position="absolute" w="100%" zIndex={10} bg="blackAlpha.600">
                        <Spinner color="blue.400" />
                    </Flex>
                )}
                {error && (
                    <Flex justify="center" align="center" h="100%" position="absolute" w="100%">
                        <Text color="red.400">{error}</Text>
                    </Flex>
                )}
                <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
            </Box>
        </Box>
    );
}

export default StockChart;