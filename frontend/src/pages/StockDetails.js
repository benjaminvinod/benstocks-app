// src/pages/StockDetails.js

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getStockPrice } from "../api/stocks";
import { buyInvestment, getWatchlist, addToWatchlist, removeFromWatchlist } from "../api/portfolio"; // Import watchlist functions
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/format";
import BackButton from '../components/BackButton';
import StockChart from "../components/StockChart";
import { toast } from 'react-toastify';

function StockDetails() {
  const { symbol } = useParams();
  const { user, refreshUser } = useAuth();

  const [stockData, setStockData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [buyLoading, setBuyLoading] = useState(false);
  
  // --- START: ADDED CODE ---
  const [watchlist, setWatchlist] = useState([]);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  // --- END: ADDED CODE ---

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      setStockData(null);
      
      try {
        // Fetch stock data and watchlist in parallel
        const [stockRes, watchlistRes] = await Promise.all([
          getStockPrice(symbol),
          getWatchlist(user.id)
        ]);

        if (stockRes.detail || stockRes.error) {
          throw new Error(stockRes.detail || stockRes.error);
        }
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

    if (user?.id) {
        fetchAllData();
    }
  }, [symbol, user]);

  const handleBuyStock = async (e) => { /* ... existing code, unchanged ... */ };
  
  // --- START: ADDED CODE ---
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
  // --- END: ADDED CODE ---

  const formContainerStyle = { /* ... */ };
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
            {/* --- START: ADDED CODE --- */}
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
            {/* --- END: ADDED CODE --- */}
          </div>
          {/* ... The rest of the component remains the same ... */}
        </>
      )}
    </div>
  );
}

export default StockDetails;