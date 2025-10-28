// src/pages/MutualFunds.js
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { buyInvestment } from '../api/portfolio';
import { formatCurrency } from '../utils/format';
import BackButton from '../components/BackButton';
import { toast } from 'react-toastify';
import {
  Box, Container, Heading, Text, SimpleGrid, Select, Input, Button,
  FormControl, FormLabel, Spinner, Flex
} from '@chakra-ui/react';

const BASE_URL = "http://localhost:8000";

const FundCard = ({ fund }) => (
  <Box
    bg="var(--bg-primary-dynamic, var(--bg-dark-primary))"
    p={5}
    borderRadius="lg"
    borderWidth="1px"
    borderColor="var(--border-dynamic, var(--border-color))"
    boxShadow="md"
  >
    <Heading size="sm" color="var(--brand-primary-dynamic, var(--brand-primary))">{fund.name}</Heading>
    <Text fontSize="sm" color="var(--text-secondary-dynamic, var(--text-secondary))" mt={1}>
      Category: {fund.category}
    </Text>
    <Text mt={3}>
      <Text as="span" color="var(--text-secondary-dynamic, var(--text-secondary))">Base NAV: </Text>
      <Text as="span" fontWeight="bold">{formatCurrency(fund.baseNav, 'INR')}</Text>
    </Text>
  </Box>
);

function MutualFunds() {
    const { user, refreshUser } = useAuth();
    const [allFunds, setAllFunds] = useState([]);
    const [selectedFundId, setSelectedFundId] = useState('');
    const [amount, setAmount] = useState(5000);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [currentNav, setCurrentNav] = useState(null);
    const [filterCategory, setFilterCategory] = useState('All Funds');

    const fundCategories = [
        'All Funds', 'Index Funds', 'Midcap Funds', 'Smallcap Funds',
        'Flexicap Funds', 'ELSS Funds', 'Contra & Value Funds'
    ];

    useEffect(() => {
        const fetchFunds = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/mutual-funds`);
                setAllFunds(response.data);
                if (response.data.length > 0) {
                    setSelectedFundId(response.data[0].id);
                }
            } catch (error) {
                toast.error("Could not load list of mutual funds.");
            }
            setPageLoading(false);
        };
        fetchFunds();
    }, []);

    const filteredFunds = useMemo(() => {
        if (filterCategory === 'All Funds') {
            return allFunds;
        }
        return allFunds.filter(fund => fund.category === filterCategory);
    }, [allFunds, filterCategory]);

    useEffect(() => {
        if (filteredFunds.length > 0 && !filteredFunds.find(f => f.id === selectedFundId)) {
            setSelectedFundId(filteredFunds[0].id);
        } else if (filteredFunds.length === 0) {
            setSelectedFundId('');
        }
    }, [filteredFunds, selectedFundId]);

    useEffect(() => {
        if (!selectedFundId) {
            setCurrentNav(null);
            return;
        }
        const fetchNav = async () => {
            setCurrentNav(null);
            try {
                const response = await axios.get(`${BASE_URL}/mutual-funds/nav/${selectedFundId}`);
                setCurrentNav(response.data.simulated_nav);
            } catch (error) {
                toast.error(`Could not fetch NAV for ${selectedFundId}.`);
            }
        };
        fetchNav();
    }, [selectedFundId]);

    const handleBuy = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (!currentNav || currentNav <= 0) {
            toast.error("NAV is not available. Please try again.");
            setLoading(false); return;
        }
        if (amount <= 0 || !user || amount > user.balance) {
            toast.error("Invalid amount or insufficient balance.");
            setLoading(false); return;
        }
        try {
            const quantity = amount / currentNav;
            const investment = {
                symbol: selectedFundId,
                quantity: Number(quantity.toFixed(4)),
                buy_price: currentNav,
                buy_date: new Date().toISOString()
            };
            await buyInvestment(user.id, investment);
            await refreshUser();
            toast.success(`Successfully invested ${formatCurrency(amount, "INR")}!`);
            setAmount(5000);
        } catch (err) {
            toast.error(err.detail || err.message || 'Investment failed.');
        }
        setLoading(false);
    };

    if (pageLoading) {
        return <Container centerContent><Spinner size="xl" mt={20} /></Container>;
    }
    
    return (
        <Container maxW="container.xl" className="container">
            <BackButton />
            <Box className="page-header">
                <Heading as="h1">Invest in Mutual Funds (Direct Plans)</Heading>
                <Text>Mutual Fund prices (NAV) are simulated daily and represent Direct Plan - Growth values.</Text>
            </Box>
            
            <Box as="form" onSubmit={handleBuy} bg="var(--bg-secondary-dynamic, var(--bg-dark-secondary))" p={6} borderRadius="lg" mb={8} boxShadow="lg">
                <Heading size="md" mb={4}>New Mutual Fund Investment</Heading>
                <SimpleGrid columns={[1, null, 2]} spacing={4}>
                    <FormControl>
                        <FormLabel>Choose a Mutual Fund</FormLabel>
                        <Select value={selectedFundId} onChange={(e) => setSelectedFundId(e.target.value)}>
                            {filteredFunds.map(fund => (<option key={fund.id} value={fund.id} style={{backgroundColor: 'var(--bg-dark-secondary)'}}>{fund.name}</option>))}
                        </Select>
                    </FormControl>
                    <FormControl>
                        <FormLabel>Today's NAV</FormLabel>
                        <Input value={currentNav ? formatCurrency(currentNav, "INR") : "Calculating..."} isReadOnly />
                    </FormControl>
                </SimpleGrid>
                <FormControl mt={4}>
                    <FormLabel>Amount to Invest (₹)</FormLabel>
                    <Input type="number" value={amount} min="500" step="100" onChange={(e) => setAmount(Number(e.target.value))} />
                </FormControl>
                <Button type="submit" isLoading={loading} isDisabled={!currentNav} mt={6} width="full">
                    Invest Now
                </Button>
            </Box>

            <Flex mb={6} align="center">
                <Heading size="md" mr={4}>Available Mutual Funds</Heading>
                <Select maxW="250px" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    {fundCategories.map(cat => (
                        <option key={cat} value={cat} style={{backgroundColor: 'var(--bg-dark-secondary)'}}>{cat}</option>
                    ))}
                </Select>
            </Flex>

            <SimpleGrid columns={[1, null, 2, 3]} spacing={6}>
                {filteredFunds.length > 0 ? (
                    filteredFunds.map(fund => <FundCard key={fund.id} fund={fund} />)
                ) : (
                    <Text>No funds found in this category.</Text>
                )}
            </SimpleGrid>
        </Container>
    );
}

export default MutualFunds;