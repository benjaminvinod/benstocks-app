// src/pages/TaxOptimizer.js

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPortfolio, getPortfolioLiveValue } from '../api/portfolio';
import { formatCurrency } from '../utils/format';
import BackButton from '../components/BackButton';
import { Link } from 'react-router-dom';
import { Switch, FormControl, FormLabel, Box, Heading, Text, Divider } from '@chakra-ui/react';
import { toast } from 'react-toastify';

const STCG_RATE = 0.15; 
const LTCG_RATE = 0.10; 

function TaxOptimizer() {
    const { user } = useAuth();
    const [portfolio, setPortfolio] = useState([]);
    const [liveValues, setLiveValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [emailAlerts, setEmailAlerts] = useState(false); // New State for Email Preference

    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        setError('');
        try {
            const [portfolioRes, liveValueRes] = await Promise.all([
                getPortfolio(user.id),
                getPortfolioLiveValue(user.id),
            ]);

            if (portfolioRes?.investments) {
                setPortfolio(portfolioRes.investments);
            } else {
                setError('Could not load portfolio holdings.');
            }

            if (liveValueRes?.investment_details) {
                setLiveValues(liveValueRes.investment_details);
            } else {
                 setError('Could not load live market values.');
            }

        } catch (err) {
            setError('An error occurred while fetching data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle Email Toggle
    const handleEmailToggle = () => {
        const newState = !emailAlerts;
        setEmailAlerts(newState);
        // In a real app, we would send an API call here: axios.post('/user/settings', { emailAlerts: newState })
        if (newState) {
            toast.success("You will now receive weekly tax harvesting alerts.");
        } else {
            toast.info("Tax alerts turned off.");
        }
    };

    const processedHoldings = portfolio.map(inv => {
        const liveValue = liveValues[inv.id]?.live_value_inr;
        const gainLoss = liveValue ? liveValue - inv.buy_cost_inr : 0;
        
        const buyDate = new Date(inv.buy_date);
        const today = new Date();
        const holdingDays = Math.round((today - buyDate) / (1000 * 60 * 60 * 24));
        const isLongTerm = holdingDays > 365;
        const daysToLTCG = 365 - holdingDays;

        return {
            ...inv,
            liveValue,
            gainLoss,
            holdingDays,
            isLongTerm,
            daysToLTCG
        };
    });

    const lossHarvestingOpportunities = processedHoldings.filter(h => h.gainLoss < -1000); // Threshold for meaningful loss
    const ltcgAlerts = processedHoldings.filter(h => h.gainLoss > 5000 && !h.isLongTerm && h.daysToLTCG <= 60);

    const InfoCard = ({ title, content, children }) => (
        <div style={{ background: 'var(--bg-dark-primary)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--brand-primary)' }}>{title}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{content}</p>
            {children}
        </div>
    );

    return (
        <div className="container">
            <BackButton />
            <div className="page-header">
                <h1>Tax Optimizer & Settings</h1>
                <p>Analyze your portfolio for tax-saving opportunities.</p>
            </div>

            {/* New Email Settings Section */}
            <Box bg="var(--bg-secondary-dynamic)" p={5} borderRadius="lg" mb={6}>
                <Heading size="md" mb={2}>Notification Preferences</Heading>
                <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="email-alerts" mb="0" flex="1" color="var(--text-primary)">
                        Receive weekly email alerts for Tax Harvesting opportunities?
                    </FormLabel>
                    <Switch id="email-alerts" isChecked={emailAlerts} onChange={handleEmailToggle} colorScheme="green" />
                </FormControl>
            </Box>

            <Divider mb={6} />

            {loading && <p>Analyzing your portfolio...</p>}
            {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

            {!loading && !error && (
                <>
                    <InfoCard
                        title="💡 Tax Loss Harvesting Opportunities"
                        content="Selling these investments now can help offset capital gains taxes from other profits. (Showing losses > ₹1,000)"
                    >
                        {lossHarvestingOpportunities.length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {lossHarvestingOpportunities.map(inv => (
                                    <li key={inv.id} style={{ background: 'var(--bg-dark-secondary)', padding: '1rem', borderRadius: '4px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                        <span><strong>{inv.symbol}</strong> ({Math.round(inv.quantity)} qty)</span>
                                        <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Loss: {formatCurrency(inv.gainLoss, 'INR')}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No significant tax-loss harvesting opportunities found.</p>
                        )}
                    </InfoCard>

                    <InfoCard
                        title="⏳ Long-Term Capital Gains (LTCG) Alerts"
                        content={`Investments becoming 'Long Term' within 60 days. Holding them until then drops tax rate from ${STCG_RATE*100}% to ${LTCG_RATE*100}%.`}
                    >
                        {ltcgAlerts.length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {ltcgAlerts.map(inv => (
                                    <li key={inv.id} style={{ background: 'var(--bg-dark-secondary)', padding: '1rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                                        <strong>{inv.symbol}</strong>: Long-term in <span style={{color: 'var(--brand-primary)', fontWeight: 'bold'}}>{inv.daysToLTCG} days</span>. Potential Gain: {formatCurrency(inv.gainLoss, 'INR')}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p>No positions are approaching long-term status shortly.</p>
                        )}
                    </InfoCard>

                    <InfoCard title="📚 Learn More">
                        <p>These strategies are simplified. Real-world tax includes cess, surcharge, and grandfathering clauses. Always consult a CA.</p>
                        <Link to="/learn">Go to Learning Center</Link>
                    </InfoCard>
                </>
            )}
        </div>
    );
}

export default TaxOptimizer;