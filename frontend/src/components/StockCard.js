import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { sellInvestment } from '../api/portfolio';

// fetchPortfolio is passed from Dashboard to refresh the list
function StockCard({ investment, fetchPortfolio }) {
  const { user, refreshUser } = useAuth(); // Get the logged-in user
  
  const [showSell, setShowSell] = useState(false);
  // Default sell quantity to the total owned for convenience
  const [quantityToSell, setQuantityToSell] = useState(investment.quantity); 
  const [sellError, setSellError] = useState('');
  const [sellLoading, setSellLoading] = useState(false);

  const handleSell = async (e) => {
    e.preventDefault();
    setSellLoading(true);
    setSellError('');

    if (!user || !user.id) {
        setSellError('User not logged in.');
        setSellLoading(false);
        return;
    }

    const qty = Number(quantityToSell);
    // Use a small tolerance for floating point comparisons
    if (isNaN(qty) || qty <= 1e-9 || qty > investment.quantity + 1e-9) { 
      setSellError(`Invalid quantity (Max: ${investment.quantity.toFixed(4)}).`);
      setSellLoading(false);
      return;
    }

    try {
      // Pass the logged-in user's ID, the investment's unique ID, and quantity
      await sellInvestment(user.id, investment.id, qty); 
      
      // Refresh balance (AuthContext) and portfolio list (Dashboard)
      await refreshUser(); 
      await fetchPortfolio(); 
      
      // Don't necessarily close form, user might want to sell more/less later
      // setShowSell(false); 
      // Instead, just clear errors and maybe reset quantity if needed
      setQuantityToSell(0); // Reset quantity after successful sell

    } catch (err) {
      setSellError(err.detail || err.message || "Sell failed.");
    }
    setSellLoading(false);
  };

  const cardStyle = { /* ... */ }; 
  const currencyCode = (investment.symbol?.toUpperCase().endsWith('.NS') || investment.symbol?.toUpperCase().endsWith('.BO')) ? 'INR' : 'USD';

  return (
    <div style={cardStyle}>
      <h3 /* ... */>{investment.symbol?.toUpperCase()}</h3>
      <p /* ... */>
        <span>Quantity:</span> {investment.quantity?.toFixed(4)}
      </p>
      <p /* ... */>
        <span>Buy Price:</span> {formatCurrency(investment.buy_price, currencyCode)}
      </p>
      {investment.buy_cost_inr && (
         <p /* ... */>
             <span>Cost (INR):</span> {formatCurrency(investment.buy_cost_inr, 'INR')}
         </p>
      )}
      <p /* ... */>
        <span>Buy Date:</span> {formatDate(investment.buy_date)}
      </p>
      
      <button 
        onClick={() => {
            setShowSell(!showSell);
            // Reset quantity input when opening/closing
            if (!showSell) setQuantityToSell(investment.quantity); 
            setSellError(''); // Clear error when toggling
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
          {sellError && <p style={{ color: 'var(--danger)' }}>{sellError}</p>}
          <button type="submit" disabled={sellLoading} style={{ width: '100%' }}>
            {sellLoading ? 'Processing...' : `Confirm Sell`}
          </button>
        </form>
      )}
    </div>
  );
}

export default StockCard;