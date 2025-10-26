// src/pages/Dashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { getPortfolio, getPortfolioLiveValue, getTransactions } from '../api/portfolio';
import { searchStocks } from '../api/stocksApi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StockCard from '../components/StockCard';
import { formatCurrency } from '../utils/format';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import Badges from '../components/Badges';
import NewsTicker from '../components/NewsTicker';

import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import Joyride, { STATUS } from 'react-joyride';

ChartJS.register(ArcElement, Tooltip, Legend);

// Accordion Components
const AccordionHeader = ({ id, title, isOpen, onClick }) => (
    <div
        id={id}
        onClick={onClick}
        style={{
            backgroundColor: 'var(--bg-dark-primary)',
            padding: '1rem 1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '2rem'
        }}
    >
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{title}</h3>
        <span style={{ fontSize: '1.5rem', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
        {isOpen ? '−' : '+'}
        </span>
    </div>
);

const AccordionContent = ({ isOpen, children }) => (
    <div style={{
        padding: '1.5rem',
        border: '1px solid var(--border-color)',
        borderTop: 'none',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        display: isOpen ? 'block' : 'none'
    }}>
        {children}
    </div>
);

// Skeleton Loader Component
const DashboardSkeleton = () => (
    <SkeletonTheme baseColor="#2d3748" highlightColor="#4a5568">
       <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
           <h1><Skeleton width={200} /></h1>
           <p><Skeleton width={250} /></p>
         </div>
         <div style={{ textAlign: 'right' }}>
           <p><Skeleton width={180} /></p>
           <p><Skeleton width={220} /></p>
         </div>
       </div>
       <Skeleton height={150} style={{ marginBottom: '2rem' }}/>
       <Skeleton height={60} style={{ marginBottom: '2rem' }}/>
       <div>
         <Skeleton height={40} style={{ marginBottom: '1rem' }}/>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
           <Skeleton height={200} />
           <Skeleton height={200} />
           <Skeleton height={200} />
         </div>
       </div>
    </SkeletonTheme>
  );

// Main Dashboard Component
function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data States
    const [portfolio, setPortfolio] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [livePortfolioValue, setLivePortfolioValue] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [investmentDetails, setInvestmentDetails] = useState({});

    // Loading & Error States
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [portfolioError, setPortfolioError] = useState('');
    const [liveValueError, setLiveValueError] = useState('');
    const [transactionsError, setTransactionsError] = useState('');

    // Search State
    const [symbol, setSymbol] = useState('');
    const [searchError, setSearchError] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);

    // Accordion State
    const [isAllocationOpen, setIsAllocationOpen] = useState(false);
    const [isCheckerOpen, setIsCheckerOpen] = useState(true);
    const [isHoldingsOpen, setIsHoldingsOpen] = useState(true);

    // Tour State
    const [runTour, setRunTour] = useState(false);
    const tourSteps = [
        {
            target: '#cash-balance',
            content: 'This is your starting cash balance. Use it to buy stocks, ETFs, and mutual funds!',
        },
        {
            target: '#stock-checker-form',
            content: 'Search for any stock here to see its details and historical performance.',
        },
        {
            target: '#holdings-section',
            content: 'Your purchased investments will appear in this section.',
        },
        {
            target: '#news-ticker',
            content: 'Check out the latest financial news to help inform your investment decisions.',
        },
    ];

    useEffect(() => {
        const hasTakenTour = localStorage.getItem('benstocks_tour_complete');
        if (!hasTakenTour && !isInitialLoading) {
            setRunTour(true);
        }
    }, [isInitialLoading]);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
        if (finishedStatuses.includes(status)) {
            setRunTour(false);
            localStorage.setItem('benstocks_tour_complete', 'true');
        }
    };

    // --- START: THIS IS THE CORRECTED DATA FETCHING LOGIC ---
    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) return;

        try {
            const [portfolioRes, liveValueRes, transactionsRes] = await Promise.all([
                getPortfolio(user.id),
                getPortfolioLiveValue(user.id),
                getTransactions(user.id)
            ]);
            
            // Portfolio and Chart Data
            if (portfolioRes && portfolioRes.investments) {
                setPortfolio(portfolioRes.investments);
                if (portfolioRes.investments.length > 0) {
                    const labels = portfolioRes.investments.map(inv => inv.symbol);
                    const data = portfolioRes.investments.map(inv => inv.buy_cost_inr || 0);
                    const backgroundColors = labels.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`);
                    setChartData({ labels, datasets: [{ label: 'Investment Allocation (by Cost)', data, backgroundColor: backgroundColors }] });
                } else {
                    setChartData(null);
                }
            } else { setPortfolioError('Could not load portfolio.'); }

            // Live Value Data
            if (liveValueRes) {
                setLivePortfolioValue(liveValueRes);
                setInvestmentDetails(liveValueRes.investment_details || {});
            } else { setLiveValueError('Could not load live values.'); }

            // Transactions Data for Badges
            if (transactionsRes) {
                setTransactions(transactionsRes);
            } else { setTransactionsError('Could not load transactions.'); }

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            setPortfolioError("An error occurred while fetching your data.");
        } finally {
            setIsInitialLoading(false);
        }
    }, [user]);
    // --- END: THIS IS THE CORRECTED DATA FETCHING LOGIC ---

    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

    useEffect(() => {
        if (symbol.trim() === '') {
            setSuggestions([]);
            return;
        }
        const fetchSuggestions = async () => {
            setIsSearching(true);
            const results = await searchStocks(symbol);
            setSuggestions(results);
            setIsSearching(false);
        };
        const debounceTimer = setTimeout(() => {
            fetchSuggestions();
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [symbol]);

    const handleSuggestionClick = (selectedSymbol) => {
        setSymbol(selectedSymbol);
        setSuggestions([]);
        setIsSuggestionsVisible(false);
        navigate(`/stock/${selectedSymbol}`);
    };

    if (isInitialLoading) {
        return <div className="container"><DashboardSkeleton /></div>;
    }

    return (
        <div className="container">
            <Joyride
                steps={tourSteps}
                run={runTour}
                callback={handleJoyrideCallback}
                continuous showProgress showSkipButton
                styles={{ options: { arrowColor: '#2d3748', backgroundColor: '#2d3748', primaryColor: '#4299e1', textColor: '#edf2f7' } }}
            />

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Welcome, {user?.username || 'Investor'}!</h1>
                    <p id="cash-balance" style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        Cash Balance: {formatCurrency(user?.balance || 0, 'INR')}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {liveValueError ? <p style={{color: 'var(--danger)'}}>{liveValueError}</p> : livePortfolioValue ? (
                        <>
                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>
                                Investments Value: {formatCurrency(livePortfolioValue.total_investment_value_inr, 'INR')}
                            </p>
                            <p style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                Total Assets: {formatCurrency(livePortfolioValue.total_portfolio_value_inr, 'INR')}
                            </p>
                        </>
                    ) : <p>Loading values...</p>}
                </div>
            </div>

            <div id="news-ticker">
                <NewsTicker />
            </div>

            {transactionsError ? <p style={{color: 'var(--danger)'}}>Failed to load badges data.</p> : <Badges transactions={transactions} />}

            <AccordionHeader title="Portfolio Allocation (Buy Cost)" isOpen={isAllocationOpen} onClick={() => setIsAllocationOpen(!isAllocationOpen)} />
            <AccordionContent isOpen={isAllocationOpen}>
                {portfolioError ? <p style={{color: 'var(--danger)'}}>{portfolioError}</p> : chartData ? (
                    <div style={{ width: '100%', maxWidth: '350px', margin: '0 auto' }}>
                        <Pie data={chartData} options={{ responsive: true, plugins: { legend:{ display: true, position: 'top', labels: {color: 'var(--text-primary)'} } } }} />
                    </div>
                ) : <p>No investments yet to show allocation.</p>}
            </AccordionContent>

            <AccordionHeader title="Stock Checker" isOpen={isCheckerOpen} onClick={() => setIsCheckerOpen(!isCheckerOpen)} />
            <AccordionContent isOpen={isCheckerOpen}>
                <p>Enter a stock symbol or company name to search.</p>
                <div style={{ position: 'relative' }}>
                    <form id="stock-checker-form" style={{ display: 'flex', gap: '1rem' }} onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="text"
                            placeholder="e.g., AAPL or Reliance"
                            value={symbol}
                            onChange={(e) => {
                                setSymbol(e.target.value);
                                setIsSuggestionsVisible(true);
                            }}
                            onBlur={() => setTimeout(() => setIsSuggestionsVisible(false), 200)}
                            style={{ flex: 1 }}
                        />
                    </form>

                    {isSuggestionsVisible && (suggestions.length > 0 || isSearching) && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            background: 'var(--bg-dark-primary)',
                            border: '1px solid var(--border-color)', borderRadius: '0 0 8px 8px',
                            marginTop: '-1px',
                            zIndex: 10, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                        }}>
                            {isSearching && <div style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Searching...</div>}
                            {!isSearching && suggestions.map((s) => (
                                <div
                                    key={s.symbol}
                                    onMouseDown={() => handleSuggestionClick(s.symbol)}
                                    style={{
                                        padding: '0.75rem 1rem', cursor: 'pointer',
                                        borderBottom: '1px solid var(--border-color)',
                                    }}
                                    className="suggestion-item"
                                >
                                    <strong style={{ color: 'var(--text-primary)' }}>{s.symbol}</strong>
                                    <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9em' }}>{s.name}</span>
                                </div>
                            ))}
                            {!isSearching && suggestions.length > 0 && <style>{`.suggestion-item:last-child { border-bottom: none; }`}</style>}
                        </div>
                    )}
                </div>
            </AccordionContent>

            <AccordionHeader id="holdings-section" title="Your Holdings" isOpen={isHoldingsOpen} onClick={() => setIsHoldingsOpen(!isHoldingsOpen)} />
            <AccordionContent isOpen={isHoldingsOpen}>
                {portfolioError ? <p style={{color: 'var(--danger)'}}>{portfolioError}</p> : portfolio.length === 0 ? <p>You have no investments yet.</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {portfolio.map((inv) => (
                            <StockCard
                                key={inv.id}
                                investment={inv}
                                fetchPortfolio={fetchDashboardData}
                                liveDetails={investmentDetails[inv.id]}
                            />
                        ))}
                    </div>
                )}
            </AccordionContent>
        </div>
    );
}

export default Dashboard;