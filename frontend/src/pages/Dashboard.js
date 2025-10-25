// src/pages/Dashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { getPortfolio, getPortfolioLiveValue, getTransactions, getStockPrice } from '../api/portfolio';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StockCard from '../components/StockCard';
import { formatCurrency } from '../utils/format';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import Badges from '../components/Badges';
import NewsTicker from '../components/NewsTicker'; // Import the NewsTicker

import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import Joyride, { STATUS } from 'react-joyride';

ChartJS.register(ArcElement, Tooltip, Legend);

// Accordion Components
const AccordionHeader = ({ id, title, isOpen, onClick }) => (
    <div
        id={id} // Added id prop for Joyride
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
      {/* Simulate News Ticker loading */}
      <Skeleton height={150} style={{ marginBottom: '2rem' }}/>
      {/* Simulate Badges loading */}
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

    // Accordion State
    const [isAllocationOpen, setIsAllocationOpen] = useState(false); // Default closed
    const [isCheckerOpen, setIsCheckerOpen] = useState(false);
    const [isHoldingsOpen, setIsHoldingsOpen] = useState(true); // Default open

    // Tour State
    const [runTour, setRunTour] = useState(false);

    const tourSteps = [
        { target: '#cash-balance', content: 'Your available cash.', placement: 'bottom' },
        { target: '#news-ticker', content: 'Latest financial news with sentiment.', placement: 'bottom' },
        { target: '#stock-checker-form', content: 'Search for stocks here.', placement: 'bottom' },
        { target: '#holdings-section', content: 'Your purchased investments appear here.', placement: 'top' },
    ];

    // Run tour on first visit
    useEffect(() => {
        const isFirstVisit = !localStorage.getItem('hasVisitedBenStocks');
        if (isFirstVisit && !isInitialLoading) { // Only start tour after initial load
          setTimeout(() => setRunTour(true), 500);
          localStorage.setItem('hasVisitedBenStocks', 'true');
        }
    }, [isInitialLoading]); // Depend on initial loading state

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
          setRunTour(false);
        }
    };

    // Fetch all dashboard data
    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) {
            setIsInitialLoading(false);
            return;
        }

        await Promise.allSettled([
            getPortfolio(user.id),
            getPortfolioLiveValue(user.id),
            getTransactions(user.id)
        ]).then(results => {
            // Portfolio & Chart Data
            if (results[0].status === 'fulfilled' && results[0].value?.investments) {
                const investments = results[0].value.investments;
                setPortfolio(investments);
                const labels = ['Cash'];
                const cashValue = (typeof user.balance === 'number' && !isNaN(user.balance)) ? user.balance : 0;
                const values = [cashValue];
                investments.forEach(inv => {
                    labels.push(inv.symbol);
                    values.push(inv.buy_cost_inr || 0); // Use buy cost for allocation chart
                });
                const backgroundColors = ['#4A5568', '#4299E1', '#48BB78', '#ED8936', '#9F7AEA', '#E53E3E', '#38B2AC', '#ECC94B'];
                setChartData({ labels, datasets: [{ data: values, backgroundColor: labels.map((_, i) => backgroundColors[i % backgroundColors.length]), borderColor: 'var(--bg-dark-secondary)', borderWidth: 2 }] });
            } else { setPortfolioError('Failed to load portfolio.'); }

            // Live Value & Investment Details
            if (results[1].status === 'fulfilled' && results[1].value) {
                const liveData = results[1].value;
                setLivePortfolioValue(liveData);
                if (liveData.investment_details) {
                    setInvestmentDetails(liveData.investment_details);
                }
            } else { setLiveValueError('Failed to load live value.'); }

            // Transactions (for Badges)
            if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) {
                setTransactions(results[2].value);
            } else { setTransactionsError('Failed to load transactions.'); }

            setIsInitialLoading(false); // Mark initial loading as complete
        });
    }, [user]);

    // Fetch data on initial load and when user changes
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Handle stock search
    const handleCheckStock = async (e) => {
        e.preventDefault();
        if (!symbol) return;
        setIsSearching(true);
        setSearchError('');
        try {
          const data = await getStockPrice(symbol); // Check if stock exists
          if (data.error) { throw new Error(data.error); }
          navigate(`/stock/${symbol.toUpperCase()}`); // Navigate on success
        } catch (err) {
          setSearchError(err.message || 'Could not find stock.');
        }
        setIsSearching(false);
    };

    // Show skeleton loader during initial data fetch
    if (isInitialLoading) {
        return <div className="container"><DashboardSkeleton /></div>;
    }

    // Render the main dashboard content
    return (
        <div className="container">
            {/* Joyride Tour Component */}
            <Joyride
                steps={tourSteps}
                run={runTour}
                callback={handleJoyrideCallback}
                continuous
                showProgress
                showSkipButton
                styles={{ options: { arrowColor: '#2d3748', backgroundColor: '#2d3748', primaryColor: '#4299e1', textColor: '#edf2f7' } }}
            />

            {/* Page Header with Welcome and Balances */}
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

             {/* --- START: ADDED CODE --- */}
             {/* News Ticker Component */}
             <div id="news-ticker"> {/* Added ID for tour */}
                 <NewsTicker />
             </div>
             {/* --- END: ADDED CODE --- */}

            {/* Badges Component */}
            {transactionsError ? <p style={{color: 'var(--danger)'}}>Failed to load badges data.</p> : <Badges transactions={transactions} />}

            {/* Portfolio Allocation Accordion */}
            <AccordionHeader title="Portfolio Allocation (Buy Cost)" isOpen={isAllocationOpen} onClick={() => setIsAllocationOpen(!isAllocationOpen)} />
            <AccordionContent isOpen={isAllocationOpen}>
                {portfolioError ? <p style={{color: 'var(--danger)'}}>{portfolioError}</p> : chartData ? (
                    <div style={{ width: '100%', maxWidth: '350px', margin: '0 auto' }}>
                        <Pie data={chartData} options={{ responsive: true, plugins: { legend:{ display: true, position: 'top', labels: {color: 'var(--text-primary)'} } } }} />
                    </div>
                ) : <p>No investments yet to show allocation.</p>}
            </AccordionContent>

            {/* Stock Checker Accordion */}
            <AccordionHeader title="Stock Checker" isOpen={isCheckerOpen} onClick={() => setIsCheckerOpen(!isCheckerOpen)} />
            <AccordionContent isOpen={isCheckerOpen}>
                <p>Enter a stock symbol to view its details and purchase shares.</p>
                <form id="stock-checker-form" onSubmit={handleCheckStock} style={{ display: 'flex', gap: '1rem' }}>
                    <input type="text" placeholder="e.g., AAPL or RELIANCE.NS" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} style={{ flex: 1 }} />
                    <button type="submit" disabled={isSearching}>{isSearching ? 'Checking...' : 'Check Stock'}</button>
                </form>
                {searchError && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{searchError}</p>}
            </AccordionContent>

            {/* Holdings Accordion */}
            <AccordionHeader id="holdings-section" title="Your Holdings" isOpen={isHoldingsOpen} onClick={() => setIsHoldingsOpen(!isHoldingsOpen)} />
            <AccordionContent isOpen={isHoldingsOpen}>
                {portfolioError ? <p style={{color: 'var(--danger)'}}>{portfolioError}</p> : portfolio.length === 0 ? <p>You have no investments yet.</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {portfolio.map((inv) => (
                            <StockCard
                                key={inv.id}
                                investment={inv}
                                fetchPortfolio={fetchDashboardData} // Pass refetch function
                                liveDetails={investmentDetails[inv.id]} // Pass live value for P/L
                            />
                        ))}
                    </div>
                )}
            </AccordionContent>
        </div>
    );
}

export default Dashboard;