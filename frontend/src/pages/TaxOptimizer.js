// src/pages/TaxOptimizer.js

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPortfolio, getPortfolioLiveValue } from '../api/portfolio';
import { formatCurrency, formatDate } from '../utils/format';
import BackButton from '../components/BackButton';
import Tooltip from '../components/Tooltip';
import { Link } from 'react-router-dom';

const STCG_RATE = 0.15; // 15% Short-term capital gains tax
const LTCG_RATE = 0.10; // 10% Long-term capital gains tax (above 1 lakh)

function TaxOptimizer() {
    const { user } = useAuth();
    const [portfolio, setPortfolio] = useState([]);
    const [liveValues, setLiveValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    const lossHarvestingOpportunities = processedHoldings.filter(h => h.gainLoss < 0);
    const ltcgAlerts = processedHoldings.filter(h => h.gainLoss > 0 && !h.isLongTerm && h.daysToLTCG <= 45);

    const InfoCard = ({ title, content, children }) => (
        <div style={{ background: 'var(--bg-dark-primary)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: 0, color: 'var(--brand-primary)' }}>{title}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{content}</p>
            {children}
        </div>
    );

    return (
        <div className="container">
            <BackButton />
            <div className="page-header">
                <h1>Tax Optimizer</h1>
                <p>Learn about tax-saving strategies by analyzing your portfolio.</p>
            </div>

            {loading && <p>Analyzing your portfolio...</p>}
            {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

            {!loading && !error && (
                <>
                    <InfoCard
                        title="💡 Tax Loss Harvesting Opportunities"
                        content="Selling investments at a loss can offset gains from other investments, reducing your overall tax bill. Here are your current positions that are at a loss."
                    >
                        {lossHarvestingOpportunities.length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {lossHarvestingOpportunities.map(inv => (
                                    <li key={inv.id} style={{ background: 'var(--bg-dark-secondary)', padding: '1rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                                        <strong>{inv.symbol}</strong>: Loss of <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{formatCurrency(inv.gainLoss, 'INR')}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No tax-loss harvesting opportunities found (all your positions are in profit!).</p>
                        )}
                    </InfoCard>

                    <InfoCard
                        title="⏳ Long-Term Capital Gains (LTCG) Alerts"
                        content={`In India, gains on stocks held for more than one year are taxed at a lower rate (${LTCG_RATE*100}%). Holding these profitable investments for a little longer could save you money.`}
                    >
                        {ltcgAlerts.length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {ltcgAlerts.map(inv => (
                                    <li key={inv.id} style={{ background: 'var(--bg-dark-secondary)', padding: '1rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                                        <strong>{inv.symbol}</strong>: Becomes long-term in <strong>{inv.daysToLTCG} days</strong>. Holding could reduce tax from {STCG_RATE*100}% to {LTCG_RATE*100}%.
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p>No positions are approaching long-term status in the next 45 days.</p>
                        )}
                    </InfoCard>

                    <InfoCard title="📚 Learn More">
                        <p>These strategies are simplified for this simulator. Real-world tax laws have more nuances, such as exemptions on the first ₹1 lakh of LTCG. Always consult a financial advisor for real investment decisions.</p>
                        <Link to="/learn">Go to the Learning Center</Link>
                    </InfoCard>
                </>
            )}
        </div>
    );
}

export default TaxOptimizer;