// src/pages/StockDetails.js

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getStockPrice } from "../api/stocks";
import { buyInvestment, getWatchlist, addToWatchlist, removeFromWatchlist } from "../api/portfolio";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatLargeNumber } from "../utils/format"; // Import formatLargeNumber
import BackButton from '../components/BackButton';
import StockChart from "../components/StockChart";
import { toast } from 'react-toastify';

// This is a new helper component for displaying stats
const Stat = ({ label, value }) => (
    <div style={{ flex: '1 1 150px', background: 'var(--bg-dark-primary)', padding: '1rem', borderRadius: '8px' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</p>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {value || 'N/A'}
        </p>
    </div>
);


function StockDetails() {
  const { symbol } = useParams();
  const { user, refreshUser } = useAuth(); 
  
  const [stockData, setStockData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [buyLoading, setBuyLoading] = useState(false);
  
  const [watchlist, setWatchlist] = useState([]);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      setStockData(null);
      try {
        const [stockRes, watchlistRes] = await Promise.all([
          getStockPrice(symbol),
          getWatchlist(user.id)
        ]);
        if (stockRes.detail || stockRes.error) { throw new Error(stockRes.detail || stockRes.error); }
        setStockData(stockRes);
        if (Array.isArray(watchlistRes)) {
            setWatchlist(watchlistRes);
            setIsWatchlisted(watchlistRes.includes(symbol.toUpperCase()));
        }
      } catch (err) {
        setError(err.message || "Could not fetch data.");
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.id) { fetchAllData(); }
  }, [symbol, user]);

  const handleBuyStock = async (e) => {
    e.preventDefault();
    setBuyLoading(true);
    const currentPrice = stockData?.close;
    if (!currentPrice || currentPrice <= 0 || quantity <= 0) {
      toast.error("Invalid price or quantity. Please refresh.");
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
      toast.success(`Successfully purchased ${quantity} share(s) of ${stockData.symbol}!`);
      setQuantity(1);
    } catch (err) {
      toast.error(err.detail || err.message || 'Purchase failed.');
    } finally {
      setBuyLoading(false);
    }
  };
  
  const handleWatchlistToggle = async () => {
    setWatchlistLoading(true);
    try {
        if(isWatchlisted) {
            await removeFromWatchlist(user.id, symbol);
            toast.info(`${symbol.toUpperCase()} removed from your watchlist.`);
            setIsWatchlisted(false);
        } else {
            await addToWatchlist(user.id, symbol);
            toast.success(`${symbol.toUpperCase()} added to your watchlist!`);
            setIsWatchlisted(true);
        }
    } catch (err) {
        toast.error(err.detail || "Watchlist update failed.");
    } finally {
        setWatchlistLoading(false);
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
          <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
              <h1>{stockData.name} ({stockData.symbol})</h1>
              <p style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                {formatCurrency(stockData.close, currencyCode)}
              </p>
            </div>
            <button 
                onClick={handleWatchlistToggle} 
                disabled={watchlistLoading}
                style={{
                    backgroundColor: isWatchlisted ? 'transparent' : 'var(--brand-primary)',
                    border: `1px solid ${isWatchlisted ? 'var(--brand-primary)' : 'transparent'}`,
                    color: isWatchlisted ? 'var(--brand-primary)' : 'white'
                }}
            >
              {watchlistLoading ? '...' : (isWatchlisted ? '★ Following' : '☆ Add to Watchlist')}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem' }}>
            <p><span style={{color: 'var(--text-secondary)'}}>Open:</span> {formatCurrency(stockData.open, currencyCode)}</p>
            <p><span style={{color: 'var(--text-secondary)'}}>High:</span> {formatCurrency(stockData.high, currencyCode)}</p>
            <p><span style={{color: 'var(--text-secondary)'}}>Low:</span> {formatCurrency(stockData.low, currencyCode)}</p>
          </div>
          
          {/* --- START: ADDED CODE --- */}
          {/* This is the new section for key metrics */}
          <h2>Key Metrics</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <Stat label="Market Cap" value={formatLargeNumber(stockData.market_cap)} />
              <Stat label="P/E Ratio" value={stockData.pe_ratio ? stockData.pe_ratio.toFixed(2) : 'N/A'} />
              <Stat label="Dividend Yield" value={stockData.dividend_yield ? (stockData.dividend_yield * 100).toFixed(2) + '%' : 'N/A'} />
              <Stat label="52-Week High" value={formatCurrency(stockData.week_52_high, currencyCode)} />
              <Stat label="52-Week Low" value={formatCurrency(stockData.week_52_low, currencyCode)} />
          </div>
          {/* --- END: ADDED CODE --- */}

          <StockChart symbol={symbol} />

          <div style={formContainerStyle}>
            <h2>Buy {stockData.symbol}</h2>
            <form onSubmit={handleBuyStock}>
              <div className="form-group">
                <label htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  step="1"
                  required
                />
              </div>
              <div style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>
                Estimated Cost: {formatCurrency(estimatedCost, currencyCode)}
              </div>
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