// src/pages/SIPCalculator.js
import React, { useState, useEffect } from 'react';
import { Box, Container, Heading, Text, Input, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Button, SimpleGrid, VStack } from '@chakra-ui/react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import BackButton from '../components/BackButton';
import { formatCurrency, formatLargeNumber } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function SIPCalculator() {
    const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
    const [rateOfReturn, setRateOfReturn] = useState(12);
    const [timePeriod, setTimePeriod] = useState(10);
    const [chartData, setChartData] = useState(null);
    const [results, setResults] = useState({ invested: 0, gains: 0, total: 0 });

    const calculateSIP = () => {
        const P = monthlyInvestment;
        const i = rateOfReturn / 12 / 100;
        const n = timePeriod * 12;

        // SIP Formula: M = P × ({[1 + i]^n - 1} / i) × (1 + i)
        const totalValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
        const investedAmount = P * n;
        const estimatedReturns = totalValue - investedAmount;

        setResults({
            invested: investedAmount,
            gains: estimatedReturns,
            total: totalValue
        });

        // Generate Chart Data (Yearly breakdown)
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
                    label: 'Total Value',
                    data: valueData,
                    borderColor: '#48BB78',
                    backgroundColor: 'rgba(72, 187, 120, 0.2)',
                    fill: true,
                },
                {
                    label: 'Invested Amount',
                    data: investedData,
                    borderColor: '#4299E1',
                    backgroundColor: 'rgba(66, 153, 225, 0.2)',
                    fill: true,
                }
            ]
        });
    };

    useEffect(() => {
        calculateSIP();
    }, [monthlyInvestment, rateOfReturn, timePeriod]);

    return (
        <Container maxW="container.xl" className="container">
            <BackButton />
            <div className="page-header">
                <Heading>SIP Calculator</Heading>
                <Text>Project your wealth growth with Systematic Investment Plans.</Text>
            </div>

            <SimpleGrid columns={[1, null, 2]} spacing={10}>
                {/* Inputs */}
                <VStack spacing={6} align="stretch" bg="var(--bg-secondary-dynamic)" p={6} borderRadius="lg">
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
                        <Text mb={2}>Expected Return Rate (p.a) %</Text>
                        <Input 
                            type="number" 
                            value={rateOfReturn} 
                            onChange={(e) => setRateOfReturn(Number(e.target.value))} 
                            mb={2}
                        />
                        <Slider value={rateOfReturn} min={1} max={30} step={0.5} onChange={setRateOfReturn}>
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

                {/* Results & Chart */}
                <VStack spacing={6} align="stretch">
                    <SimpleGrid columns={3} spacing={4} textAlign="center">
                        <Box bg="var(--bg-dark-primary)" p={3} borderRadius="md">
                            <Text fontSize="sm" color="gray.400">Invested</Text>
                            <Text fontWeight="bold">{formatLargeNumber(results.invested)}</Text>
                        </Box>
                        <Box bg="var(--bg-dark-primary)" p={3} borderRadius="md">
                            <Text fontSize="sm" color="gray.400">Est. Returns</Text>
                            <Text fontWeight="bold" color="green.400">{formatLargeNumber(results.gains)}</Text>
                        </Box>
                        <Box bg="var(--bg-dark-primary)" p={3} borderRadius="md">
                            <Text fontSize="sm" color="gray.400">Total Value</Text>
                            <Text fontWeight="bold" fontSize="xl">{formatLargeNumber(results.total)}</Text>
                        </Box>
                    </SimpleGrid>

                    <Box bg="var(--bg-dark-primary)" p={4} borderRadius="lg" height="300px">
                        {chartData && <Line data={chartData} options={{ maintainAspectRatio: false, elements: { point: { radius: 0 } } }} />}
                    </Box>
                </VStack>
            </SimpleGrid>
        </Container>
    );
}

export default SIPCalculator;