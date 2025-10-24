import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { buyInvestment } from '../api/portfolio';
import { getStockPrice } from '../api/stocks'; 
import { formatCurrency } from '../utils/format';
import BackButton from '../components/BackButton'; // Import the new BackButton

// 1. A much larger list of real, popular Indian ETFs
const popularETFs = [
  // --- Index Funds ---
  { symbol: "NIFTYBEES.NS", name: "Nippon India ETF Nifty 50 BeES", description: "Tracks the Nifty 50 Index.", risk: "Medium" },
  { symbol: "JUNIORBEES.NS", name: "Nippon India ETF Nifty Next 50", description: "Tracks the Nifty Next 50 Index.", risk: "High" },
  { symbol: "MID150BEES.NS", name: "Nippon India ETF Nifty Midcap 150", description: "Tracks the Nifty Midcap 150 Index.", risk: "High" },
  { symbol: "MOMID100.NS", name: "Motilal Oswal Midcap 100 ETF", description: "Tracks the Nifty Midcap 100 Index.", risk: "High" },
  { symbol: "ICICINIFTY.NS", name: "ICICI Prudential Nifty 50 ETF", description: "Another popular ETF tracking the Nifty 50.", risk: "Medium" },
  
  // --- Sectoral Funds ---
  { symbol: "BANKBEES.NS", name: "Nippon India ETF Bank BeES", description: "Tracks the Nifty Bank Index.", risk: "High" },
  { symbol: "ITBEES.NS", name: "Nippon India ETF Nifty IT", description: "Tracks the Nifty IT Index.", risk: "High" },
  { symbol: "PHARMABEES.NS", name: "Nippon India ETF Nifty Pharma", description: "Tracks the Nifty Pharma Index.", risk: "Medium" },
  { symbol: "CPSEETF.NS", name: "Nippon India ETF CPSE", description: "Invests in Central Public Sector Enterprises.", risk: "Medium-High" },
  { symbol: "INFRABEES.NS", name: "Nippon India ETF Nifty Infra BeES", description: "Tracks the Nifty Infrastructure Index.", risk: "High" },
  { symbol: "MOMENTUM.NS", name: "Motilal Oswal Nifty 200 Momentum 30 ETF", description: "Tracks high momentum stocks.", risk: "Very High" },
  { symbol: "MON100.NS", name: "Motilal Oswal Nasdaq 100 ETF", description: "Tracks the 100 largest non-financial companies on the Nasdaq (US).", risk: "Very High" },

  // --- Commodity Funds ---
  { symbol: "GOLDBEES.NS", name: "Nippon India ETF Gold BeES", description: "Invests in physical gold.", risk: "Low-Medium" },
  { symbol: "SILVERBEES.NS", name: "Nippon India ETF Silver BeES", description: "Invests in physical silver.", risk: "High" },
  { symbol: "ICICIGOLD.NS", name: "ICICI Prudential Gold ETF", description: "Another popular ETF investing in gold.", risk: "Low-Medium" },

  // --- Debt (Bond) Funds ---
  { symbol: "LIQUIDBEES.NS", name: "Nippon India ETF Liquid BeES", description: "Invests in very short-term debt. Aims for safety.", risk: "Low" },
  { symbol: "GSEC.NS", name: "Nippon India ETF Nifty 5 Yr G-Sec", description: "Invests in 5-year Government of India bonds.", risk: "Low" },
  { symbol: "BFOETF.NS", name: "Aditya Birla SL Banking & PSU Debt ETF", description: "Invests in debt of Banks and PSUs.", risk: "Low" },
  { symbol: "CPSEPLUSSDL.NS", name: "Nippon ETF CPSE + SDL 2027", description: "Invests in CPSEs and State Bonds maturing in 2027.", risk: "Low" },
  { symbol: "SDL2026.NS", name: "Axis Nifty SDL 2026 Debt ETF", description: "Invests in State Development Loans maturing in 2026.", risk: "Low" },
];


function MutualFunds() {
  const { user, refreshUser } = useAuth(); // Get refreshUser
  
  const [selectedFund, setSelectedFund] = useState(popularETFs[0].symbol);
  const [amount, setAmount] = useState(5000); // Invest by amount
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuy = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (amount <= 0) {
      setError("Please enter a valid amount to invest.");
      setLoading(false);
      return;
    }
    
    if(!user || amount > user.balance) {
      setError("Insufficient balance for this investment.");
      setLoading(false);
      return;
    }

    try {
      // 1. Get the LIVE price (NAV)
      const fundData = await getStockPrice(selectedFund);
      const currentNav = fundData.close;
      
      if (!currentNav || currentNav <= 0) {
        setError("Could not fetch fund price. Please try again.");
        setLoading(false);
        return;
      }

      // 2. Calculate units
      const quantity = amount / currentNav; 

      const investment = {
        symbol: selectedFund,
        quantity: Number(quantity.toFixed(4)), // Store units
        buy_price: currentNav, // Store NAV as buy price
        buy_date: new Date().toISOString()
      };

      // 3. Call the existing buyInvestment API
      await buyInvestment(user.id, investment);
      
      // 4. Refresh the user's balance!
      await refreshUser();
      
      setSuccess(`Successfully invested ${formatCurrency(amount, "INR")} in ${selectedFund}!`);
      setAmount(5000); // Reset form
      
    } catch (err) {
      const errorMsg = err.detail || err.message || 'Failed to make investment.';
      setError(errorMsg);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <BackButton /> {/* --- ADDED BACK BUTTON --- */}
      <div className="page-header">
        <h1>Invest in ETFs (Funds)</h1>
        <p>Invest a lump sum amount into a real Exchange Traded Fund. Prices are live.</p>
      </div>

      {/* --- Buy Form --- */}
      <form onSubmit={handleBuy} style={{ background: 'var(--bg-dark-primary)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3>New Investment</h3>
        
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        {success && <p style={{ color: 'var(--brand-primary)' }}>{success}</p>}

        <div className="form-group">
          <label htmlFor="fund">Choose an ETF</label>
          <select 
            id="fund" 
            value={selectedFund} 
            onChange={(e) => setSelectedFund(e.target.value)}
          >
            {popularETFs.map(fund => (
              <option key={fund.symbol} value={fund.symbol}>
                {fund.name} ({fund.symbol})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="amount">Amount to Invest (₹)</label>
          <input 
            type="number" 
            id="amount"
            value={amount}
            min="100"
            step="100"
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Investing...' : 'Invest Now'}
        </button>
      </form>

      {/* --- Fund List --- */}
      <h2>Available ETFs</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {popularETFs.map(fund => (
          <div key={fund.symbol} style={{ background: 'var(--bg-dark-primary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ color: 'var(--brand-primary)', margin: 0 }}>{fund.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{fund.description}</p>
            <p><span style={{ color: 'var(--text-primary)' }}>Risk:</span> {fund.risk}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MutualFunds;