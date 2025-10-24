// src/pages/Dashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { getPortfolio, getPortfolioLiveValue, getTransactions } from '../api/portfolio';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StockCard from '../components/StockCard';
import { formatCurrency } from '../utils/format';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import Badges from '../components/Badges';

import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

ChartJS.register(ArcElement, Tooltip, Legend);

// --- START: CORRECTED CODE ---
// This is the full, working code for the accordion components.
const AccordionHeader = ({ title, isOpen, onClick }) => (
  <div
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
// --- END: CORRECTED CODE ---


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
    <div style={{ marginBottom: '2rem' }}>
      <Skeleton height={40} />
    </div>
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


function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [portfolio, setPortfolio] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [livePortfolioValue, setLivePortfolioValue] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [portfolioError, setPortfolioError] = useState('');
  const [liveValueError, setLiveValueError] = useState('');
  const [transactionsError, setTransactionsError] = useState('');
  
  const [symbol, setSymbol] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [isAllocationOpen, setIsAllocationOpen] = useState(true);
  const [isCheckerOpen, setIsCheckerOpen] = useState(false);
  const [isHoldingsOpen, setIsHoldingsOpen] = useState(true);

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
        // Portfolio Result
        if (results[0].status === 'fulfilled' && results[0].value?.investments) {
            const investments = results[0].value.investments;
            setPortfolio(investments);
            const labels = ['Cash'];
            const cashValue = (typeof user.balance === 'number' && !isNaN(user.balance)) ? user.balance : 0;
            const values = [cashValue];
            investments.forEach(inv => {
                labels.push(inv.symbol);
                values.push(inv.buy_cost_inr || 0);
            });
            const backgroundColors = ['#4A5568', '#4299E1', '#48BB78', '#ED8936', '#9F7AEA', '#E53E3E', '#38B2AC', '#ECC94B'];
            setChartData({ labels, datasets: [{ data: values, backgroundColor: labels.map((_, i) => backgroundColors[i % backgroundColors.length]), borderColor: 'var(--bg-dark-secondary)', borderWidth: 2 }] });
        } else {
            setPortfolioError('Failed to load portfolio.');
        }

        // Live Value Result
        if (results[1].status === 'fulfilled' && results[1].value) {
            setLivePortfolioValue(results[1].value);
        } else {
            setLiveValueError('Failed to load live value.');
        }

        // Transactions Result
        if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) {
            setTransactions(results[2].value);
        } else {
            setTransactionsError('Failed to load transactions.');
        }

        setIsInitialLoading(false);
    });

  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCheckStock = async () => { /* Add your search logic here if needed */ };

  if (isInitialLoading) {
    return <div className="container"><DashboardSkeleton /></div>;
  }

  return (
    <div className="container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
           <h1>Welcome, {user?.username || 'Investor'}!</h1>
           <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
             Cash Balance: {formatCurrency(user?.balance || 0, 'INR')}
           </p>
         </div>
         <div style={{ textAlign: 'right' }}>
           {liveValueError && <p style={{color: 'var(--danger)'}}>{liveValueError}</p>}
           {!liveValueError && livePortfolioValue && (
            <>
              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>
                Investments: {formatCurrency(livePortfolioValue.total_investment_value_inr, 'INR')}
              </p>
              <p style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                Total Assets: {formatCurrency(livePortfolioValue.total_portfolio_value_inr, 'INR')}
              </p>
            </>
           )}
         </div>
       </div>

       {transactionsError && <p style={{color: 'var(--danger)'}}>Failed to load badges.</p>}
       {!transactionsError && <Badges transactions={transactions} />}

      <AccordionHeader 
        title="Portfolio Allocation (Buy Cost)" 
        isOpen={isAllocationOpen} 
        onClick={() => setIsAllocationOpen(!isAllocationOpen)} 
      />
      <AccordionContent isOpen={isAllocationOpen}>
        {portfolioError && <p style={{color: 'var(--danger)'}}>{portfolioError}</p>}
        {!portfolioError && chartData && (
          <div style={{ width: '100%', maxWidth: '350px', margin: '0 auto' }}>
            <Pie data={chartData} options={{ responsive: true, plugins: { legend:{ display: true, position: 'top', labels: {color: 'var(--text-primary)'} } } }} />
          </div>
        )}
         {!portfolioError && !chartData && (
             <p>Could not generate allocation chart. Ensure you have holdings.</p> 
         )}
      </AccordionContent>
      
      <AccordionHeader 
        title="Your Holdings" 
        isOpen={isHoldingsOpen} 
        onClick={() => setIsHoldingsOpen(!isHoldingsOpen)} 
      />
      <AccordionContent isOpen={isHoldingsOpen}>
        {portfolioError && <p style={{color: 'var(--danger)'}}>{portfolioError}</p>}
        {!portfolioError && portfolio.length === 0 && (
            <p>You have no investments yet.</p>
        )}
        {!portfolioError && portfolio.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {portfolio.map((inv) => (
              <StockCard 
                key={inv.id} 
                investment={inv} 
                fetchPortfolio={fetchDashboardData} 
              />
            ))}
          </div>
        )}
      </AccordionContent>
    </div>
  );
}

export default Dashboard;