// src/pages/StockDetails.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getStockPrice } from "../api/stocks";
import { buyInvestment, getWatchlist, addToWatchlist, removeFromWatchlist } from "../api/portfolio";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/format";
import BackButton from '../components/BackButton';
import StockChart from "../components/StockChart";
import { toast } from 'react-toastify';
import { DIVIDEND_STOCKS } from '../utils/dividendAssets';
import { useWebSocket } from '../context/WebSocketContext';
import Tooltip from '../components/Tooltip';
// --- CHANGED: Import hook
import { useNumberFormat } from '../context/NumberFormatContext';

const Stat = ({ label, value, tooltipText }) => (
    <div style={{ flex: '1 1 150px', background: 'var(--bg-dark-primary)', padding: '1rem', borderRadius: '8px', minWidth: '150px' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {label}
            {tooltipText && (
                <Tooltip text={tooltipText}>
                    <span style={{ marginLeft: '8px', cursor: 'help', borderBottom: '1px dotted' }}>?</span>
                </Tooltip>
            )}
        </p>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {(value === null || typeof value === 'undefined') ? 'N/A' : value}
        </p>
    </div>
);

const AnalystRating = ({ stockData }) => {
    const { recommendation, number_of_analysts, target_price, currency } = stockData;
    if (!recommendation && !number_of_analysts) {
        return null;
    }

    const getRatingColor = (rec) => {
        if (!rec) return 'var(--text-primary)';
        const lowerRec = rec.toLowerCase();
        if (lowerRec.includes('buy') || lowerRec.includes('outperform')) return '#48BB78';
        if (lowerRec.includes('hold') || lowerRec.includes('neutral') || lowerRec.includes('perform')) return '#A0AEC0';
        if (lowerRec.includes('sell') || lowerRec.includes('underperform')) return '#E53E3E';
        return 'var(--text-primary)';
    };

    const ratingText = recommendation ? recommendation.replace(/_/g, ' ').toUpperCase() : 'N/A';
    const color = getRatingColor(ratingText);

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2>Analyst Consensus</h2>
            <div style={{ background: 'var(--bg-dark-primary)', padding: '1.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                {recommendation && (
                    <div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Overall Rating</p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color }}>
                            {ratingText}
                        </p>
                    </div>
                )}
                {number_of_analysts > 0 && (
                    <div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Number of Analysts</p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {number_of_analysts}
                        </p>
                    </div>
                )}
                {target_price && (
                    <div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Average Target Price</p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {formatCurrency(target_price, currency)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- CHANGED: Financials now use formatNumber hook
const FinancialsSnapshot = ({ stockData }) => {
    const { revenue, net_income, total_debt, free_cash_flow } = stockData;
    const { formatNumber } = useNumberFormat(); // Hook
    
    const hasData = [revenue, net_income, total_debt, free_cash_flow].some(val => val !== null && typeof val !== 'undefined');
    if (!hasData) return null;

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2>Financial Snapshot (Annual)</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Stat label="Total Revenue" value={formatNumber(revenue)} tooltipText="Total sales from goods and services (last fiscal year)." />
                <Stat label="Net Income" value={formatNumber(net_income)} tooltipText="Company's profit after all expenses (last fiscal year)." />
                <Stat label="Total Debt" value={formatNumber(total_debt)} tooltipText="Total money the company owes (last reported)." />
                <Stat label="Free Cash Flow" value={formatNumber(free_cash_flow)} tooltipText="Cash left after paying for operations and investments." />
            </div>
        </div>
    );
};

function StockDetails() {
    const { symbol } = useParams();
    const { user, refreshUser } = useAuth();
    const { livePrices } = useWebSocket();
    // --- CHANGED: Hook
    const { formatNumber } = useNumberFormat();

    const [stockData, setStockData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [buyLoading, setBuyLoading] = useState(false);
    const [isWatchlisted, setIsWatchlisted] = useState(false);
    const [watchlistLoading, setWatchlistLoading] = useState(false);

    const isDividendStock = DIVIDEND_STOCKS.includes(symbol.toUpperCase());

    useEffect(() => {
        const latestPrice = livePrices[symbol.toUpperCase()];
        if (stockData && latestPrice !== undefined && latestPrice !== stockData.close) {
            setStockData(prevData => ({ ...prevData, close: latestPrice }));
        }
    }, [livePrices, symbol, stockData]);

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            setError(null);
            setStockData(null);
            try {
                const stockRes = await getStockPrice(symbol);
                if (stockRes.detail || stockRes.error) { throw new Error(stockRes.detail || stockRes.error); }
                setStockData(stockRes);

                if (user?.id) {
                    const watchlistRes = await getWatchlist(user.id);
                    if (Array.isArray(watchlistRes)) {
                        setIsWatchlisted(watchlistRes.includes(symbol.toUpperCase()));
                    }
                }
            } catch (err) {
                setError(err.message || "Could not fetch stock data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, [symbol, user]);

    const handleBuyStock = async (e) => {
        e.preventDefault();
        setBuyLoading(true);
        const currentPrice = stockData?.close;
        const buyQuantity = Number(quantity);
        if (!currentPrice || currentPrice <= 0 || !buyQuantity || buyQuantity <= 0) {
            toast.error("Invalid price or quantity. Please refresh.");
            setBuyLoading(false);
            return;
        }
        if (user.balance < (buyQuantity * currentPrice)) {
            toast.error("Insufficient balance.");
            setBuyLoading(false);
            return;
        }
        try {
            const investmentData = {
                symbol: stockData.symbol,
                quantity: buyQuantity,
                buy_price: currentPrice,
                buy_date: new Date().toISOString(),
            };
            await buyInvestment(user.id, investmentData);
            await refreshUser();
            toast.success(`Successfully purchased ${buyQuantity} share(s) of ${stockData.symbol}!`);
            setQuantity(1);
        } catch (err) {
            toast.error(err?.detail || err?.message || 'Purchase failed.');
        } finally {
            setBuyLoading(false);
        }
    };

    const handleWatchlistToggle = async () => {
        if (!user) {
            toast.error("Please log in to manage your watchlist.");
            return;
        }
        setWatchlistLoading(true);
        try {
            if (isWatchlisted) {
                await removeFromWatchlist(user.id, symbol);
                toast.info(`${symbol.toUpperCase()} removed from your watchlist.`);
                setIsWatchlisted(false);
            } else {
                await addToWatchlist(user.id, symbol);
                toast.success(`${symbol.toUpperCase()} added to your watchlist!`);
                setIsWatchlisted(true);
            }
        } catch (err) {
            toast.error(err?.detail || "Watchlist update failed.");
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

    const currencyCode = stockData?.currency || 'USD';
    const estimatedCost = Number(quantity) * (stockData?.close || 0);

    if (isLoading) {
        return <div className="container"><p>Loading data for {symbol}...</p></div>;
    }

    if (error) {
        return <div className="container"><BackButton /><p style={{ color: "var(--danger)", textAlign: 'center' }}>Error: {error}</p></div>;
    }

    if (!stockData) {
        return <div className="container"><BackButton /><p>No data available for this stock.</p></div>
    }

    return (
        <div className="container">
            <BackButton />
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>{stockData.name || symbol} ({stockData.symbol})</h1>
                    <p style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 'bold', margin: 0 }}>
                        {formatCurrency(stockData.close, currencyCode)}
                    </p>
                    {isDividendStock && <p style={{ margin: '0.25rem 0 0 0', color: 'var(--brand-primary)', fontWeight: 'bold' }}>💵 This stock may pay dividends.</p>}
                </div>
                <button
                    onClick={handleWatchlistToggle}
                    disabled={watchlistLoading || !user}
                    style={{
                        padding: '0.6rem 1.2rem',
                        backgroundColor: isWatchlisted ? 'transparent' : 'var(--brand-primary)',
                        border: `2px solid ${isWatchlisted ? 'var(--brand-primary)' : 'transparent'}`,
                        color: isWatchlisted ? 'var(--brand-primary)' : 'white',
                        cursor: !user ? 'not-allowed' : 'pointer',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                    }}
                    title={!user ? "Login to manage watchlist" : (isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist")}
                >
                    {watchlistLoading ? '...' : (isWatchlisted ? '★ Following' : '☆ Add to Watchlist')}
                </button>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                <p><span style={{color: 'var(--text-secondary)'}}>Open:</span> {formatCurrency(stockData.open, currencyCode)}</p>
                <p><span style={{color: 'var(--text-secondary)'}}>High:</span> {formatCurrency(stockData.high, currencyCode)}</p>
                <p><span style={{color: 'var(--text-secondary)'}}>Low:</span> {formatCurrency(stockData.low, currencyCode)}</p>
            </div>

            <h2>Key Metrics</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {/* --- CHANGED: Using formatNumber for Market Cap --- */}
                <Stat 
                    label="Market Cap" 
                    value={formatNumber(stockData.market_cap)} 
                    tooltipText="Total value of all a company's shares of stock."
                />
                <Stat 
                    label="P/E Ratio" 
                    value={stockData.pe_ratio !== null ? stockData.pe_ratio.toFixed(2) : 'N/A'} 
                    tooltipText="Ratio of a company's share price to its earnings per share."
                />
                <Stat 
                    label="Dividend Yield" 
                    value={stockData.dividend_yield !== null ? (stockData.dividend_yield * 100).toFixed(2) + '%' : 'N/A'} 
                    tooltipText="Annual dividend payment as a percentage of the stock's current price."
                />
                <Stat 
                    label="52-Week High" 
                    value={formatCurrency(stockData.week_52_high, currencyCode)} 
                    tooltipText="The highest price a stock has traded at in the last year."
                />
                <Stat 
                    label="52-Week Low" 
                    value={formatCurrency(stockData.week_52_low, currencyCode)} 
                    tooltipText="The lowest price a stock has traded at in the last year."
                />
            </div>
            
            <FinancialsSnapshot stockData={stockData} />
            <AnalystRating stockData={stockData} />
            <StockChart symbol={symbol} currency={currencyCode} />

            <div style={formContainerStyle}>
                <h2>Buy {stockData.symbol}</h2>
                <form onSubmit={handleBuyStock}>
                    <div className="form-group">
                        <label htmlFor="quantity">Quantity</label>
                        <input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" step="1" required style={{ maxWidth: '150px' }} />
                    </div>
                    <div style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>
                        Estimated Cost: {formatCurrency(estimatedCost, currencyCode)}
                    </div>
                    <button type="submit" disabled={buyLoading || !user} title={!user ? "Login to buy shares" : ""}>
                        {buyLoading ? 'Processing Purchase...' : 'Buy Shares'}
                    </button>
                    {!user && <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem'}}>Please log in to trade.</p>}
                </form>
            </div>
        </div>
    );
}

export default StockDetails;