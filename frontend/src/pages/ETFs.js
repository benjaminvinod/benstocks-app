// src/pages/ETFs.js

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { buyInvestment } from '../api/portfolio';
import { getStockPrice } from '../api/stocks';
import { formatCurrency } from '../utils/format';
import BackButton from '../components/BackButton';
import { toast } from 'react-toastify';
import { DIVIDEND_ETFS } from '../utils/dividendAssets';

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

            {/* Form to buy ETFs */}
            <form onSubmit={handleBuy} style={{ background: 'var(--bg-dark-primary)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                <h3>New ETF Investment</h3>
                <div className="form-group">
                    <label htmlFor="fund">Choose an ETF</label>
                    <select id="fund" value={selectedFund} onChange={(e) => setSelectedFund(e.target.value)}>
                        {popularETFs.map(fund => (<option key={fund.symbol} value={fund.symbol}>{fund.name} ({fund.symbol})</option>))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="amount">Amount to Invest (₹)</label>
                    <input type="number" id="amount" value={amount} min="100" step="100" onChange={(e) => setAmount(Number(e.target.value))} />
                </div>
                <button type="submit" disabled={loading}>{loading ? 'Investing...' : 'Invest Now'}</button>
            </form>

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