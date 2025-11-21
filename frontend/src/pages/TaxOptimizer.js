// src/pages/TaxOptimizer.js

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPortfolio, getPortfolioLiveValue } from '../api/portfolio';
import { formatCurrency } from '../utils/format';
import BackButton from '../components/BackButton';
import { Link } from 'react-router-dom';
import { 
    Box, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber, 
    StatHelpText, Stack, Badge, Progress, useToast
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';

const STCG_RATE = 0.15; 
const LTCG_RATE = 0.10; 

function TaxOptimizer() {
    const { user } = useAuth();
    const toast = useToast();
    
    const [portfolio, setPortfolio] = useState([]);
    const [liveValues, setLiveValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalGain: 0,
        estTax: 0,
        stcgLiability: 0,
        ltcgLiability: 0,
        harvestableLoss: 0
    });

    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const [portfolioRes, liveValueRes] = await Promise.all([
                getPortfolio(user.id),
                getPortfolioLiveValue(user.id),
            ]);

            const investments = portfolioRes?.investments || [];
            const liveDetails = liveValueRes?.investment_details || {};

            setPortfolio(investments);
            setLiveValues(liveDetails);

            // Calculate Real-Time Tax Metrics
            let totalGain = 0;
            let stcgTax = 0;
            let ltcgTax = 0;
            let potentialLoss = 0;

            investments.forEach(inv => {
                const currentVal = liveDetails[inv.id]?.live_value_inr || (inv.quantity * inv.buy_price);
                const gain = currentVal - inv.buy_cost_inr;
                totalGain += gain;

                const buyDate = new Date(inv.buy_date);
                const today = new Date();
                const daysHeld = Math.floor((today - buyDate) / (1000 * 60 * 60 * 24));
                const isLongTerm = daysHeld > 365;

                if (gain > 0) {
                    if (isLongTerm) ltcgTax += (gain * LTCG_RATE);
                    else stcgTax += (gain * STCG_RATE);
                } else {
                    potentialLoss += Math.abs(gain);
                }
            });

            setMetrics({
                totalGain,
                estTax: stcgTax + ltcgTax,
                stcgLiability: stcgTax,
                ltcgLiability: ltcgTax,
                harvestableLoss: potentialLoss
            });

        } catch (err) {
            console.error(err);
            toast({ title: "Error loading data", status: "error", duration: 3000 });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const processedHoldings = portfolio.map(inv => {
        const liveValue = liveValues[inv.id]?.live_value_inr || (inv.quantity * inv.buy_price);
        const gainLoss = liveValue - inv.buy_cost_inr;
        const buyDate = new Date(inv.buy_date);
        const holdingDays = Math.floor((new Date() - buyDate) / (1000 * 60 * 60 * 24));
        const isLongTerm = holdingDays > 365;
        const daysToLTCG = 365 - holdingDays;

        return { ...inv, liveValue, gainLoss, holdingDays, isLongTerm, daysToLTCG };
    });

    const lossHarvesting = processedHoldings.filter(h => h.gainLoss < -500); 
    const ltcgOpportunities = processedHoldings.filter(h => h.gainLoss > 0 && !h.isLongTerm && h.daysToLTCG <= 60);

    return (
        <div className="container">
            <BackButton />
            <Box className="page-header">
                <Heading size="lg">Tax Optimizer Pro ⚖️</Heading>
                <Text color="gray.400">Analyze liabilities and automate tax harvesting strategies.</Text>
            </Box>

            {/* --- STATS DASHBOARD --- */}
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={5} mb={8}>
                <Stat className="glass-panel" p={4}>
                    <StatLabel color="gray.400">Unrealized Gains</StatLabel>
                    <StatNumber color={metrics.totalGain >= 0 ? "green.400" : "red.400"}>
                        {formatCurrency(metrics.totalGain, 'INR')}
                    </StatNumber>
                    <StatHelpText>Total Portfolio Performance</StatHelpText>
                </Stat>
                <Stat className="glass-panel" p={4}>
                    <StatLabel color="gray.400">Est. Tax Bill</StatLabel>
                    <StatNumber color="red.300">
                        {formatCurrency(metrics.estTax, 'INR')}
                    </StatNumber>
                    <StatHelpText>If sold today</StatHelpText>
                </Stat>
                <Stat className="glass-panel" p={4}>
                    <StatLabel color="gray.400">Harvestable Loss</StatLabel>
                    <StatNumber color="orange.300">
                        {formatCurrency(metrics.harvestableLoss, 'INR')}
                    </StatNumber>
                    <StatHelpText>Available to offset gains</StatHelpText>
                </Stat>
                <Stat className="glass-panel" p={4}>
                    <StatLabel color="gray.400">Tax Breakdown</StatLabel>
                    <Box fontSize="sm" mt={1}>
                        <Text>STCG (15%): <span style={{color:'#f56565'}}>{formatCurrency(metrics.stcgLiability, 'INR')}</span></Text>
                        <Text>LTCG (10%): <span style={{color:'#ed8936'}}>{formatCurrency(metrics.ltcgLiability, 'INR')}</span></Text>
                    </Box>
                </Stat>
            </SimpleGrid>

            {/* --- ANALYSIS CARDS (Moved out of Tabs) --- */}
            <SimpleGrid columns={{base:1, md: 2}} spacing={6}>
                {/* Loss Harvesting Card */}
                <Box className="glass-panel" p={5}>
                    <Heading size="md" mb={4} color="red.300">📉 Loss Harvesting</Heading>
                    <Text fontSize="sm" color="gray.400" mb={4}>
                        Selling these assets now creates a "Loss" that cancels out your taxable profits, lowering your bill.
                    </Text>
                    {lossHarvesting.length === 0 ? (
                        <Text color="green.400"><CheckCircleIcon mr={2}/> No major losses to harvest!</Text>
                    ) : (
                        <Stack spacing={3}>
                            {lossHarvesting.map(inv => (
                                <Box key={inv.id} p={3} bg="whiteAlpha.100" borderRadius="md">
                                    <div style={{display:'flex', justifyContent:'space-between'}}>
                                        <Text fontWeight="bold">{inv.symbol}</Text>
                                        <Text color="red.400" fontWeight="bold">{formatCurrency(inv.gainLoss, 'INR')}</Text>
                                    </div>
                                    <Text fontSize="xs" color="gray.500">Qty: {inv.quantity.toFixed(2)}</Text>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Box>

                {/* LTCG Card */}
                <Box className="glass-panel" p={5}>
                    <Heading size="md" mb={4} color="blue.300">⏳ LTCG Countdown</Heading>
                    <Text fontSize="sm" color="gray.400" mb={4}>
                        Assets nearing 1 year (Long Term). Wait a few days to drop tax from 15% to 10%.
                    </Text>
                    {ltcgOpportunities.length === 0 ? (
                        <Text color="gray.500">No assets approaching LTCG status soon.</Text>
                    ) : (
                        <Stack spacing={3}>
                            {ltcgOpportunities.map(inv => (
                                <Box key={inv.id} p={3} bg="whiteAlpha.100" borderRadius="md">
                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                        <Text fontWeight="bold">{inv.symbol}</Text>
                                        <Badge colorScheme="blue">{inv.daysToLTCG} Days left</Badge>
                                    </div>
                                    <Progress value={100 - (inv.daysToLTCG/365*100)} size="xs" colorScheme="blue" borderRadius="full" />
                                    <Text fontSize="xs" color="gray.400" mt={1}>Potential Tax Save: {formatCurrency(inv.gainLoss * 0.05, 'INR')}</Text>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Box>
            </SimpleGrid>
        </div>
    );
}

export default TaxOptimizer;