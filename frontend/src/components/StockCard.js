// src/components/StockCard.js

import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { sellInvestment } from '../api/portfolio';
import { toast } from 'react-toastify'; // Make sure toast is imported

// --- START: MODIFIED CODE ---
// The component now accepts `liveDetails` as a prop
function StockCard({ investment, fetchPortfolio, liveDetails }) {
// --- END: MODIFIED CODE ---
  const { user, refreshUser } = useAuth();
  
  const [showSell, setShowSell] = useState(false);
  const [quantityToSell, setQuantityToSell] = useState(investment.quantity); 
  const [sellError, setSellError] = useState('');
  const [sellLoading, setSellLoading] = useState(false);

  const handleSell = async (e) => {
    e.preventDefault();
    setSellLoading(true);
    setSellError('');

    if (!user || !user.id) {
        toast.error('User not logged in.');
        setSellLoading(false);
        return;
    }

    const qty = Number(quantityToSell);
    if (isNaN(qty) || qty <= 1e-9 || qty > investment.quantity + 1e-9) { 
      toast.error(`Invalid quantity (Max: ${investment.quantity.toFixed(4)}).`);
      setSellLoading(false);
      return;
    }

    try {
      await sellInvestment(user.id, investment.id, qty);
      toast.success('Investment sold successfully!');
      
      await refreshUser(); 
      await fetchPortfolio(); 
      
      setShowSell(false); // Close form on successful sell
    } catch (err) {
      toast.error(err.detail || err.message || "Sell failed.");
    }
    setSellLoading(false);
  };
  
  const cardStyle = {
    background: 'var(--bg-dark-secondary)',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  };

  const pStyle = {
    margin: 0,
    display: 'flex',
    justifyContent: 'space-between',
    color: 'var(--text-secondary)'
  };
  
  const spanStyle = {
    color: 'var(--text-primary)',
    fontWeight: '600'
  };

  const currencyCode = (investment.symbol?.toUpperCase().endsWith('.NS') || investment.symbol?.toUpperCase().endsWith('.BO')) ? 'INR' : 'USD';
  
  // --- START: MODIFIED CODE ---
  // Calculations for Profit & Loss
  const currentValue = liveDetails ? liveDetails.live_value_inr : null;
  const buyValue = investment.buy_cost_inr || 0;
  const profitLoss = currentValue !== null ? currentValue - buyValue : null;
  const profitLossPercent = buyValue > 0 && profitLoss !== null ? (profitLoss / buyValue) * 100 : 0;

  const profitLossColor = profitLoss > 0 ? '#48BB78' : '#E53E3E'; // Green for profit, red for loss
  // --- END: MODIFIED CODE ---

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{investment.symbol?.toUpperCase()}</h3>
      <p style={pStyle}>Quantity: <span style={spanStyle}>{investment.quantity?.toFixed(4)}</span></p>
      <p style={pStyle}>Buy Price: <span style={spanStyle}>{formatCurrency(investment.buy_price, currencyCode)}</span></p>
      <p style={pStyle}>Invested (INR): <span style={spanStyle}>{formatCurrency(buyValue, 'INR')}</span></p>
      
      {/* --- START: MODIFIED CODE --- */}
      {/* New section to display live values */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
      {currentValue !== null ? (
        <>
            <p style={pStyle}>Current Value: <span style={spanStyle}>{formatCurrency(currentValue, 'INR')}</span></p>
            <p style={pStyle}>
                Profit/Loss:
                <span style={{ ...spanStyle, color: profitLossColor }}>
                    {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss, 'INR')} ({profitLossPercent.toFixed(2)}%)
                </span>
            </p>
        </>
      ) : (
        <p style={pStyle}>Current Value: <span style={spanStyle}>Loading...</span></p>
      )}
      {/* --- END: MODIFIED CODE --- */}
      
      <button 
        onClick={() => {
            setShowSell(!showSell);
            if (!showSell) setQuantityToSell(investment.quantity);
            setSellError('');
        }}
        style={{ width: '100%', marginTop: '1rem', backgroundColor: showSell ? 'var(--border-color)' : 'var(--danger)' }}
      >
        {showSell ? 'Cancel' : 'Sell'}
      </button>

      {showSell && (
        <form onSubmit={handleSell} style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label>Quantity to Sell (Max: {investment.quantity?.toFixed(4)})</label>
            <input 
              type="number"
              value={quantityToSell}
              onChange={(e) => setQuantityToSell(e.target.value)}
              max={investment.quantity}
              min="0.0001" 
              step="any"   
              required
            />
          </div>
          <button type="submit" disabled={sellLoading} style={{ width: '100%' }}>
            {sellLoading ? 'Processing...' : `Confirm Sell`}
          </button>
        </form>
      )}
    </div>
  );
}

export default StockCard;