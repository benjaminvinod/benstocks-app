// src/pages/MutualFunds.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { buyInvestment } from '../api/portfolio';
import { formatCurrency } from '../utils/format';
import BackButton from '../components/BackButton';
import { toast } from 'react-toastify';

const BASE_URL = "http://localhost:8000";

function MutualFunds() {
    const { user, refreshUser } = useAuth();
    const [popularMutualFunds, setPopularMutualFunds] = useState([]);
    const [selectedFundId, setSelectedFundId] = useState('');
    const [amount, setAmount] = useState(5000);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [currentNav, setCurrentNav] = useState(null);

    // Fetch the list of funds when the page loads
    useEffect(() => {
        const fetchFunds = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/mutual-funds`);
                setPopularMutualFunds(response.data);
                if (response.data.length > 0) {
                    setSelectedFundId(response.data[0].id); // Set the first fund as default
                }
            } catch (error) {
                toast.error("Could not load list of mutual funds.");
            }
            setPageLoading(false);
        };
        fetchFunds();
    }, []);

    // Fetch the simulated NAV when the selected fund changes
    useEffect(() => {
        if (!selectedFundId) return;
        const fetchNav = async () => {
            setCurrentNav(null); // Reset while fetching
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
        return <div className="container"><p>Loading Mutual Funds...</p></div>;
    }
    
    return (
        <div className="container">
            <BackButton />
            <div className="page-header">
                <h1>Invest in Mutual Funds (Simulated NAV)</h1>
                <p>Mutual Fund prices (NAV) are simulated daily. This value remains consistent for the entire day.</p>
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
                    <input type="text" id="nav-display" value={currentNav ? formatCurrency(currentNav, "INR") : "Calculating..."} disabled style={{ backgroundColor: 'var(--border-color)', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                    <label htmlFor="amount">Amount to Invest (₹)</label>
                    <input type="number" id="amount" value={amount} min="500" step="100" onChange={(e) => setAmount(Number(e.target.value))} />
                </div>
                <button type="submit" disabled={loading || !currentNav}>
                    {loading ? 'Investing...' : 'Invest Now'}
                </button>
            </form>

            <h2>Available Mutual Funds</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {popularMutualFunds.map(fund => (
                    <div key={fund.id} style={{ background: 'var(--bg-dark-primary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ color: 'var(--brand-primary)', margin: 0 }}>{fund.name}</h3>
                        <p><span style={{ color: 'var(--text-primary)' }}>Base NAV:</span> {formatCurrency(fund.baseNav, 'INR')}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MutualFunds;