import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getStockPrice } from "../api/stocks";
import { buyInvestment } from "../api/portfolio";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/format"; 
import BackButton from '../components/BackButton';
import StockChart from "../components/StockChart";

function StockDetails() {
  const { symbol } = useParams();
  const { user, refreshUser } = useAuth(); 
  
  const [stockData, setStockData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // This is the state for the quantity input field.
  const [quantity, setQuantity] = useState(1);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [buySuccess, setBuySuccess] = useState('');

  useEffect(() => {
    const fetchStock = async () => {
      setIsLoading(true);
      setError(null);
      setStockData(null);
      try {
        const data = await getStockPrice(symbol);
        if (data.detail || data.error) {
          throw new Error(data.detail || data.error);
        }
        setStockData(data);
      } catch (err) {
        setError(err.message || "Could not fetch stock data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStock();
  }, [symbol]);

  const handleBuyStock = async (e) => {
    e.preventDefault();
    setBuyLoading(true);
    setBuyError('');
    setBuySuccess('');

    const currentPrice = stockData?.close;
    if (!currentPrice || currentPrice <= 0 || quantity <= 0) {
      setBuyError("Invalid price or quantity. Please refresh.");
      setBuyLoading(false);
      return;
    }

    try {
      const investmentData = {
        symbol: stockData.symbol,
        quantity: Number(quantity),
        buy_price: currentPrice,
        buy_date: new Date().toISOString(),
      };

      await buyInvestment(user.id, investmentData);
      await refreshUser(); 
      
      setBuySuccess(`Successfully purchased ${quantity} share(s) of ${stockData.symbol}!`);
      setQuantity(1);

    } catch (err) {
      setBuyError(err.detail || err.message || 'Purchase failed.');
    } finally {
      setBuyLoading(false);
    }
  };

  const formContainerStyle = {
    marginTop: '2rem',
    padding: '1.5rem',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-dark-secondary)'
  };

  const currencyCode = stockData?.currency || 'INR';
  const estimatedCost = quantity * (stockData?.close || 0);

  return (
    <div className="container">
      <BackButton />
      {isLoading && <p>Loading stock data...</p>}
      {error && <p style={{ color: "var(--danger)" }}>Error: {error}</p>}

      {stockData && (
        <>
          {/* --- STOCK INFO (RESTORED) --- */}
          <div className="page-header">
            <h1>{stockData.name} ({stockData.symbol})</h1>
            <p style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
              {formatCurrency(stockData.close, currencyCode)}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem' }}>
            <p><span style={{color: 'var(--text-secondary)'}}>Open:</span> {formatCurrency(stockData.open, currencyCode)}</p>
            <p><span style={{color: 'var(--text-secondary)'}}>High:</span> {formatCurrency(stockData.high, currencyCode)}</p>
            <p><span style={{color: 'var(--text-secondary)'}}>Low:</span> {formatCurrency(stockData.low, currencyCode)}</p>
          </div>
          
          <StockChart symbol={symbol} />

          {/* --- BUY FORM (FIXED) --- */}
          <div style={formContainerStyle}>
            <h2>Buy {stockData.symbol}</h2>
            <form onSubmit={handleBuyStock}>
              <div className="form-group">
                <label htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  value={quantity}
                  // This allows you to change the number of shares
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  step="1"
                  required
                />
              </div>
              <div style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>
                {/* This now updates automatically as you type */}
                Estimated Cost: {formatCurrency(estimatedCost, currencyCode)}
              </div>
              
              {buyError && <p style={{ color: 'var(--danger)' }}>{buyError}</p>}
              {buySuccess && <p style={{ color: 'var(--brand-primary)' }}>{buySuccess}</p>}

              <button type="submit" disabled={buyLoading}>
                {buyLoading ? 'Processing...' : 'Buy Shares'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default StockDetails;