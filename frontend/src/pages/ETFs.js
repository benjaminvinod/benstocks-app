// src/pages/ETFs.js

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { buyInvestment } from '../api/portfolio';
import { getStockPrice } from '../api/stocks';
import { formatCurrency } from '../utils/format';
import BackButton from '../components/BackButton';
import { toast } from 'react-toastify';
import { DIVIDEND_ETFS } from '../utils/dividendAssets';
// --- ADDED: Chakra UI Imports ---
import { Box, Heading, FormControl, FormLabel, Select, Input, Button } from '@chakra-ui/react';

// --- START: MODIFIED CODE ---
// This is the new, curated list of highly reliable and popular ETFs.
// Every symbol on this list is confirmed to work with our data source.
const popularETFs = [
    { symbol: "NIFTYBEES.NS", name: "Nippon India ETF Nifty 50 BeES", description: "Tracks India's top 50 companies (Nifty 50).", risk: "Medium" },
    { symbol: "BANKBEES.NS", name: "Nippon India ETF Bank BeES", description: "Tracks the Nifty Bank Index, focusing on banking stocks.", risk: "High" },
    { symbol: "ITBEES.NS", name: "Nippon India ETF Nifty IT", description: "Tracks the Nifty IT Index, focusing on technology companies.", risk: "High" },
    { symbol: "JUNIORBEES.NS", name: "Nippon India ETF Nifty Next 50", description: "Tracks the 50 companies poised to be in the Nifty 50.", risk: "High" },
    { symbol: "CPSEETF.NS", name: "Nippon India ETF CPSE", description: "Invests in a basket of Central Public Sector Enterprises.", risk: "Medium-High" },
    { symbol: "MON100.NS", name: "Motilal Oswal Nasdaq 100 ETF", description: "Tracks the 100 largest non-financial companies on the US Nasdaq.", risk: "Very High" },
    { symbol: "GOLDBEES.NS", name: "Nippon India ETF Gold BeES", description: "Invests in physical gold, tracking its price.", risk: "Low-Medium" },
    { symbol: "LIQUIDBEES.NS", name: "Nippon India ETF Liquid BeES", description: "Invests in very short-term debt. Aims for safety and liquidity.", risk: "Low" },
];
// --- END: MODIFIED CODE ---


function ETFs() {
    const { user, refreshUser } = useAuth();
    const [selectedFund, setSelectedFund] = useState(popularETFs[0].symbol);
    const [amount, setAmount] = useState(5000);
    const [loading, setLoading] = useState(false);

    // This is the original buy handler that uses getStockPrice for live ETF prices
    const handleBuy = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (amount <= 0) {
            toast.error("Please enter a valid amount to invest.");
            setLoading(false); return;
        }
        if (!user || amount > user.balance) {
            toast.error("Insufficient balance.");
            setLoading(false); return;
        }
        try {
            // Fetch live price using getStockPrice
            const fundData = await getStockPrice(selectedFund);
            const currentPrice = fundData.close;
            if (!currentPrice || currentPrice <= 0) {
                toast.error("Could not fetch ETF price.");
                setLoading(false); return;
            }
            const quantity = amount / currentPrice;
            const investment = {
                symbol: selectedFund,
                quantity: Number(quantity.toFixed(4)),
                buy_price: currentPrice,
                buy_date: new Date().toISOString()
            };
            await buyInvestment(user.id, investment);
            await refreshUser();
            toast.success(`Successfully invested ${formatCurrency(amount, "INR")} in ${selectedFund}!`);
            setAmount(5000);
        } catch (err) {
            toast.error(err.detail || err.message || 'Investment failed.');
        }
        setLoading(false);
    };

    return (
        <div className="container">
            <BackButton />
            <div className="page-header">
                <h1>Invest in ETFs</h1>
                <p>Invest a lump sum amount into Exchange Traded Funds. Prices are live.</p>
            </div>

            {/* FIXED FORM: Uses Chakra UI components for correct Dark Mode styling */}
            <Box 
                as="form" 
                onSubmit={handleBuy} 
                bg="var(--bg-secondary-dynamic, var(--bg-dark-secondary))" 
                p={6} 
                borderRadius="lg" 
                mb={8} 
                border="1px solid var(--border-color)"
            >
                <Heading size="md" mb={4} color="var(--text-primary)">New ETF Investment</Heading>
                
                <FormControl mb={4}>
                    <FormLabel>Choose an ETF</FormLabel>
                    <Select 
                        value={selectedFund} 
                        onChange={(e) => setSelectedFund(e.target.value)}
                        bg="var(--bg-dark-primary)"
                        borderColor="var(--border-color)"
                    >
                        {popularETFs.map(fund => (
                            <option 
                                key={fund.symbol} 
                                value={fund.symbol}
                                style={{ backgroundColor: '#1e293b', color: 'white' }} // Ensures dropdown items are visible
                            >
                                {fund.name} ({fund.symbol})
                            </option>
                        ))}
                    </Select>
                </FormControl>

                <FormControl mb={4}>
                    <FormLabel>Amount to Invest (₹)</FormLabel>
                    <Input 
                        type="number" 
                        value={amount} 
                        min="100" 
                        step="100" 
                        onChange={(e) => setAmount(Number(e.target.value))} 
                        bg="var(--bg-dark-primary)"
                        borderColor="var(--border-color)"
                    />
                </FormControl>

                <Button 
                    type="submit" 
                    isLoading={loading} 
                    width="full" 
                    colorScheme="blue"
                    loadingText="Investing..."
                >
                    Invest Now
                </Button>
            </Box>

            <h2>Available ETFs</h2>
            {/* Displaying the list of ETFs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {popularETFs.map(fund => (
                    <div key={fund.symbol} style={{ background: 'var(--bg-dark-primary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ color: 'var(--brand-primary)', margin: 0 }}>
                            {fund.name}
                            {/* Display dividend icon if applicable */}
                            {DIVIDEND_ETFS.includes(fund.symbol) && <span title="Distributes dividends/interest"> 💵</span>}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{fund.description}</p>
                        <p><span style={{ color: 'var(--text-primary)' }}>Risk:</span> {fund.risk}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ETFs;