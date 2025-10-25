// src/pages/MutualFunds.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { buyInvestment } from '../api/portfolio';
import { formatCurrency } from '../utils/format';
import BackButton from '../components/BackButton';
import { toast } from 'react-toastify';

// --- START: MODIFIED CODE ---
// This is the new, expanded list of 20 popular mutual funds with realistic base NAVs.
const popularMutualFunds = [
    // Large Cap
    { id: "ICICI-PRU-BLUE", name: "ICICI Prudential Bluechip Fund", description: "Focuses on top 100 Indian companies by market cap.", risk: "Medium", baseNav: 75.50 },
    { id: "SBI-BLUE", name: "SBI BlueChip Fund", description: "A well-established fund investing in large-cap stocks.", risk: "Medium", baseNav: 68.90 },
    { id: "MIRAE-LARGE", name: "Mirae Asset Large Cap Fund", description: "Invests in a diversified portfolio of large-cap equities.", risk: "Medium", baseNav: 92.15 },
    { id: "AXIS-BLUE", name: "Axis Bluechip Fund", description: "Invests in large-cap stocks with a quality focus.", risk: "Medium", baseNav: 48.20 },
    { id: "FRANK-BLUE", name: "Franklin India Bluechip Fund", description: "One of the oldest large-cap funds in India.", risk: "Medium", baseNav: 850.70 },
    // Mid Cap
    { id: "HDFC-MID", name: "HDFC Mid-Cap Opportunities Fund", description: "Invests in promising mid-sized Indian companies.", risk: "High", baseNav: 145.30 },
    { id: "KOTAK-EMG", name: "Kotak Emerging Equity Fund", description: "Focuses on emerging mid-cap companies with high growth potential.", risk: "High", baseNav: 95.60 },
    { id: "PGIM-MID", name: "PGIM India Midcap Opportunities Fund", description: "Aims for long-term capital appreciation from mid-cap stocks.", risk: "High", baseNav: 45.35 },
    { id: "EDEL-MID", name: "Edelweiss Mid Cap Fund", description: "A diversified mid-cap fund with a strong track record.", risk: "High", baseNav: 88.25 },
    // Small Cap
    { id: "QUAN-SMALL", name: "Quant Small Cap Fund", description: "Aggressive growth fund for small-cap stocks.", risk: "Very High", baseNav: 190.10 },
    { id: "NIPPON-SMALL", name: "Nippon India Small Cap Fund", description: "One of the largest funds in the small-cap category.", risk: "Very High", baseNav: 125.40 },
    // Flexi Cap
    { id: "PARA-FLEXI", name: "Parag Parikh Flexi Cap Fund", description: "Invests across large, mid, small-cap stocks, and some foreign equity.", risk: "High", baseNav: 55.80 },
    { id: "HDFC-FLEXI", name: "HDFC Flexi Cap Fund", description: "A flexible fund that can invest across market caps based on outlook.", risk: "High", baseNav: 1350.00 },
    { id: "DSP-FLEXI", name: "DSP Flexi Cap Fund", description: "Invests in a mix of market caps with a research-driven approach.", risk: "High", baseNav: 82.50 },
    // Index Funds
    { id: "UTINIFTY", name: "UTI Nifty 50 Index Fund", description: "Passively tracks the Nifty 50 index with low costs.", risk: "Medium", baseNav: 130.45 },
    // Thematic/Sectoral
    { id: "TATA-DIGITAL", name: "Tata Digital India Fund", description: "Thematic fund focusing on technology and digital-first companies.", risk: "Very High", baseNav: 38.90 },
    { id: "ICICI-TECH", name: "ICICI Prudential Technology Fund", description: "Invests in technology sector stocks.", risk: "Very High", baseNav: 160.20 },
    // Contra Funds
    { id: "SBI-CONTRA", name: "SBI Contra Fund", description: "Invests in stocks that are currently out of favor (contrarian view).", risk: "High", baseNav: 290.80 },
    { id: "INV-CONTRA", name: "Invesco India Contra Fund", description: "Aims to identify undervalued stocks with a contrarian strategy.", risk: "High", baseNav: 110.10 },
    // US Fund for variety
    { id: "VTSAX-SIM", name: "Simulated Vanguard Total Stock Market Fund", description: "Tracks the entire US stock market.", risk: "Medium", baseNav: 108.50 },
];
// --- END: MODIFIED CODE ---

function MutualFunds() {
    const { user, refreshUser } = useAuth();
    const [selectedFundId, setSelectedFundId] = useState(popularMutualFunds[0].id);
    const [amount, setAmount] = useState(5000);
    const [loading, setLoading] = useState(false);
    
    const [currentNav, setCurrentNav] = useState(null);

    const selectedFundDetails = popularMutualFunds.find(f => f.id === selectedFundId);

    // This effect simulates a daily NAV change and does NOT call an API.
    useEffect(() => {
        if (!selectedFundDetails) return;
        const baseNav = selectedFundDetails.baseNav;
        const dailyChangePercent = (Math.random() - 0.5) / 100;
        const simulatedNav = baseNav * (1 + dailyChangePercent);
        setCurrentNav(simulatedNav);
    }, [selectedFundId, selectedFundDetails]);

    const handleBuy = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!currentNav || currentNav <= 0) {
            toast.error("NAV is not available. Please try again.");
            setLoading(false);
            return;
        }

        if (amount <= 0 || !user || amount > user.balance) {
            toast.error("Invalid amount or insufficient balance.");
            setLoading(false);
            return;
        }

        try {
            const quantity = amount / currentNav;
            const investment = {
                symbol: selectedFundDetails.id,
                quantity: Number(quantity.toFixed(4)),
                buy_price: currentNav,
                buy_date: new Date().toISOString()
            };
            await buyInvestment(user.id, investment);
            await refreshUser();
            toast.success(`Successfully invested ${formatCurrency(amount, "INR")} in ${selectedFundDetails.name}!`);
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
                <h1>Invest in Mutual Funds (Simulated NAV)</h1>
                <p>
                    Mutual Funds prices (NAV) are updated once daily. This simulation shows a realistic, slightly changed NAV each time you visit.
                </p>
            </div>

            <form onSubmit={handleBuy} style={{ background: 'var(--bg-dark-primary)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                <h3>New Mutual Fund Investment</h3>
                <div className="form-group">
                    <label htmlFor="fund">Choose a Mutual Fund</label>
                    <select id="fund" value={selectedFundId} onChange={(e) => setSelectedFundId(e.target.value)}>
                        {popularMutualFunds.map(fund => (<option key={fund.id} value={fund.id}>{fund.name}</option>))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="nav-display">Today's Simulated NAV (Price per Unit)</label>
                    <input
                        type="text"
                        id="nav-display"
                        value={currentNav ? formatCurrency(currentNav, "INR") : "Calculating..."}
                        disabled
                        style={{ backgroundColor: 'var(--border-color)', cursor: 'not-allowed' }}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="amount">Amount to Invest (₹)</label>
                    <input type="number" id="amount" value={amount} min="500" step="100" onChange={(e) => setAmount(Number(e.target.value))} />
                </div>
                <button type="submit" disabled={loading || !currentNav}>
                    {loading ? 'Investing...' : 'Invest Now'}
                </button>
            </form>

            <h2>Popular Mutual Funds</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {popularMutualFunds.map(fund => (
                    <div key={fund.id} style={{ background: 'var(--bg-dark-primary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ color: 'var(--brand-primary)', margin: 0 }}>{fund.name}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{fund.description}</p>
                        <p><span style={{ color: 'var(--text-primary)' }}>Risk:</span> {fund.risk}</p>
                        <p><span style={{ color: 'var(--text-primary)' }}>Base NAV:</span> {formatCurrency(fund.baseNav, 'INR')}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MutualFunds;