import React, { useState, useEffect, useCallback } from 'react';
import { getPortfolio, getStockPrice, getPortfolioLiveValue, getTransactions } from '../api/portfolio'; 
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StockCard from '../components/StockCard';
import { formatCurrency } from '../utils/format';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import Badges from '../components/Badges'; 

ChartJS.register(ArcElement, Tooltip, Legend);

// Accordion Components (remain the same)
const AccordionHeader = ({ title, isOpen, onClick }) => (
  <div onClick={onClick} style={{ /*...*/ }} /*...*/ >
    <h3 style={{ /*...*/ }}>{title}</h3>
    <span style={{ /*...*/ }}>{isOpen ? '−' : '+'}</span>
  </div>
);
const AccordionContent = ({ isOpen, children }) => (
  <div style={{ /*...*/ display: isOpen ? 'block' : 'none' }}>
    {children}
  </div>
);


function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [portfolio, setPortfolio] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [livePortfolioValue, setLivePortfolioValue] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Loading States
  const [loadingPortfolio, setLoadingPortfolio] = useState(true); 
  const [loadingLiveValue, setLoadingLiveValue] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  
  // Error States
  const [portfolioError, setPortfolioError] = useState('');
  const [liveValueError, setLiveValueError] = useState('');
  const [transactionsError, setTransactionsError] = useState('');
  
  // Search State
  const [symbol, setSymbol] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Accordion State
  const [isAllocationOpen, setIsAllocationOpen] = useState(true);
  const [isCheckerOpen, setIsCheckerOpen] = useState(false);
  const [isHoldingsOpen, setIsHoldingsOpen] = useState(true);

  // Fetch Function with Refined Error Handling and Logging
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
        setLoadingPortfolio(false); setLoadingLiveValue(false); setLoadingTransactions(false);
        setPortfolio([]); setTransactions([]); setChartData(null); setLivePortfolioValue(null);
        console.log("Dashboard: No user ID, clearing data.");
        return;
    }
    
    setLoadingPortfolio(true); setLoadingLiveValue(true); setLoadingTransactions(true);
    setPortfolioError(''); setLiveValueError(''); setTransactionsError('');
    // Don't clear previous data immediately, looks smoother
    // setPortfolio([]); setTransactions([]); setChartData(null); setLivePortfolioValue(null);

    console.log("Dashboard: Starting data fetch for user", user.id);

    // 1. Fetch Portfolio & Process Chart
    try {
      console.log("Dashboard: Fetching Portfolio...");
      const portfolioData = await getPortfolio(user.id);
       // Explicitly check if the response format is as expected
       if (!portfolioData || !Array.isArray(portfolioData.investments)) {
           console.error("Dashboard: Invalid portfolio data format received:", portfolioData);
           throw new Error('Received invalid portfolio data format from server.');
       }
      const investments = portfolioData.investments;
      setPortfolio(investments);
      console.log("Dashboard: Portfolio fetched:", investments);

      // Process Chart Data
      console.log("Dashboard: Processing chart data...");
      const labels = ['Cash'];
       // Ensure user.balance is a number before using it
      const cashValue = (typeof user.balance === 'number' && !isNaN(user.balance)) ? user.balance : 0;
      const values = [cashValue]; 
      investments.forEach(inv => {
        const valueAtBuy = (inv.buy_price || 0) * (inv.quantity || 0);
        labels.push(inv.symbol);
        values.push(valueAtBuy);
      });
      const backgroundColors = ['#4A5568', '#4299E1', '#48BB78', '#ED8936', '#9F7AEA', '#E53E3E', '#38B2AC', '#ECC94B'];
      setChartData({
        labels: labels,
        datasets: [{
            data: values,
            backgroundColor: labels.map((_, i) => backgroundColors[i % backgroundColors.length]),
            borderColor: 'var(--bg-dark-secondary)',
            borderWidth: 2,
        }],
      });
      console.log("Dashboard: Chart data processed");
      setPortfolioError(''); // Clear error on success
    } catch (err) {
      console.error("Dashboard: Error fetching portfolio/chart data:", err);
      // Ensure a user-friendly message is set
      setPortfolioError(err.message || 'Failed to load portfolio holdings.');
      setPortfolio([]); // Clear portfolio data on error
      setChartData(null); // Clear chart data on error
    } finally {
      setLoadingPortfolio(false); 
      console.log("Dashboard: Finished loading portfolio section.");
    }

    // 2. Fetch Live Value (Check user ID again)
    if (user?.id) {
        try {
          console.log("Dashboard: Fetching Live Value...");
          const liveValueData = await getPortfolioLiveValue(user.id);
           if (!liveValueData || typeof liveValueData.total_portfolio_value_inr !== 'number') {
               console.error("Dashboard: Invalid live value data format:", liveValueData);
               throw new Error("Received invalid live value data format.");
           }
          setLivePortfolioValue(liveValueData);
          console.log("Dashboard: Live value fetched:", liveValueData);
          setLiveValueError(''); // Clear error on success
        } catch (err) {
          console.error("Dashboard: Error fetching live portfolio value:", err);
          setLiveValueError(err.message || 'Failed to load live portfolio value.');
          setLivePortfolioValue(null); // Clear live value on error
        } finally {
          setLoadingLiveValue(false);
          console.log("Dashboard: Finished loading live value section.");
        }
    } else { setLoadingLiveValue(false); }

    // 3. Fetch Transactions (Check user ID again)
    if (user?.id) {
        try {
          console.log("Dashboard: Fetching Transactions...");
          const transactionsData = await getTransactions(user.id);
           if (!Array.isArray(transactionsData)) {
               console.error("Dashboard: Invalid transactions data format:", transactionsData);
               throw new Error("Received invalid transaction data format.");
           }
          setTransactions(transactionsData);
          console.log("Dashboard: Transactions fetched:", transactionsData.length);
          setTransactionsError(''); // Clear error on success
        } catch (err) {
          console.error("Dashboard: Error fetching transactions:", err);
          setTransactionsError(err.message || 'Failed to load transaction history.');
          setTransactions([]); // Clear transactions on error
        } finally {
          setLoadingTransactions(false);
          console.log("Dashboard: Finished loading transactions section.");
        }
    } else { setLoadingTransactions(false); }

  }, [user]); 

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Simplified Stock Search Logic (remains the same)
  const handleCheckStock = async () => { /* ... */ };

  // --- RENDER LOGIC ---
  return (
    <div className="container">
      {/* --- Header & Balances --- */}
       <div className="page-header" style={{ /*...*/ }}>
         <div>
           <h1>Welcome, {user?.username || 'Investor'}!</h1>
           <p style={{ /*...*/ }}>
             Cash Balance: {formatCurrency(user?.balance || 0, 'INR')}
           </p>
         </div>
         <div style={{ /*...*/ }}>
           {loadingLiveValue && <p>Loading portfolio value...</p>}
           {liveValueError && <p style={{color: 'var(--danger)'}}>{liveValueError}</p>}
           {!loadingLiveValue && !liveValueError && livePortfolioValue && (
            <>
              <p style={{ /*...*/ }}>
                Investments: {formatCurrency(livePortfolioValue.total_investment_value_inr, 'INR')}
              </p>
              <p style={{ /*...*/ }}>
                Total Assets: {formatCurrency(livePortfolioValue.total_portfolio_value_inr, 'INR')}
              </p>
            </>
           )}
           {/* Handle case where live value failed but wasn't loading */}
           {!loadingLiveValue && !liveValueError && !livePortfolioValue && <p style={{color: 'var(--text-secondary)'}}>Live value unavailable.</p>}
         </div>
       </div>

       {/* --- Badges --- */}
       {loadingTransactions && <p>Loading badges...</p>}
       {transactionsError && <p style={{color: 'var(--danger)'}}>Failed to load badges.</p>}
       {!loadingTransactions && !transactionsError && <Badges transactions={transactions} />}

      {/* --- SECTION 1: Portfolio Allocation --- */}
      <AccordionHeader 
        title="Portfolio Allocation (Buy Cost)" 
        isOpen={isAllocationOpen} 
        onClick={() => setIsAllocationOpen(!isAllocationOpen)} 
      />
      <AccordionContent isOpen={isAllocationOpen}>
        {/* --- Refined Conditional Rendering --- */}
        {loadingPortfolio && <p>Loading allocation chart...</p>}
        {portfolioError && <p style={{color: 'var(--danger)'}}>{portfolioError}</p>}
        {!loadingPortfolio && !portfolioError && chartData && (
          <div style={{ width: '100%', maxWidth: '350px', margin: '0 auto' }}>
            <Pie data={chartData} options={{ responsive: true, plugins: { legend:{ display: true, position: 'top', labels: {color: 'var(--text-primary)'} } } }} />
          </div>
        )}
        {/* Show message if not loading, no error, but chart data is missing */}
         {!loadingPortfolio && !portfolioError && !chartData && (
             <p>Could not generate allocation chart. Ensure you have holdings.</p> 
         )}
      </AccordionContent>

      {/* --- SECTION 2: Stock Checker --- */}
      {/* ... Accordion Header/Content ... */}
      
      {/* --- SECTION 3: Your Holdings --- */}
       <AccordionHeader 
        title="Your Holdings" 
        isOpen={isHoldingsOpen} 
        onClick={() => setIsHoldingsOpen(!isHoldingsOpen)} 
      />
      <AccordionContent isOpen={isHoldingsOpen}>
        {/* --- Refined Conditional Rendering --- */}
        {loadingPortfolio && <p>Loading portfolio...</p>}
        {portfolioError && <p style={{color: 'var(--danger)'}}>{portfolioError}</p>}
        {!loadingPortfolio && !portfolioError && portfolio.length === 0 && (
            <p>You have no investments yet.</p>
        )}
        {!loadingPortfolio && !portfolioError && portfolio.length > 0 && (
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