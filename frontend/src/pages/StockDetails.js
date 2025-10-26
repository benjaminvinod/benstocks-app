import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getStockPrice } from "../api/stocks";
import { buyInvestment, getWatchlist, addToWatchlist, removeFromWatchlist } from "../api/portfolio";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatLargeNumber } from "../utils/format";
import BackButton from '../components/BackButton';
import StockChart from "../components/StockChart";
import { toast } from 'react-toastify';
import { DIVIDEND_STOCKS } from '../utils/dividendAssets';
import { useWebSocket } from '../context/WebSocketContext';
import Tooltip from '../components/Tooltip';

const Stat = ({ label, value, tooltipText }) => (
    <div style={{ flex: '1 1 150px', background: 'var(--bg-dark-primary)', padding: '1rem', borderRadius: '8px' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {label}
            {tooltipText && (
                <Tooltip text={tooltipText}>
                    <span style={{ marginLeft: '8px', cursor: 'help', borderBottom: '1px dotted' }}>?</span>
                </Tooltip>
            )}
        </p>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {value || 'N/A'}
        </p>
    </div>
);

const AnalystRating = ({ stockData }) => {
    if (!stockData || !stockData.recommendation || !stockData.number_of_analysts) {
        return null;
    }

    const getRatingColor = (rec) => {
        const recommendation = rec.toLowerCase();
        if (recommendation.includes('buy') || recommendation.includes('outperform')) return '#48BB78';
        if (recommendation.includes('hold') || recommendation.includes('neutral')) return '#A0AEC0';
        if (recommendation.includes('sell') || recommendation.includes('underperform')) return '#E53E3E';
        return 'var(--text-primary)';
    };

    const ratingText = stockData.recommendation.replace(/_/g, ' ').toUpperCase();
    const color = getRatingColor(ratingText);

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2>Analyst Consensus</h2>
            <div style={{ background: 'var(--bg-dark-primary)', padding: '1.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Overall Rating</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: color }}>
                        {ratingText}
                    </p>
                </div>
                <div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Number of Analysts</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {stockData.number_of_analysts}
                    </p>
                </div>
                <div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Average Target Price</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {stockData.target_price ? formatCurrency(stockData.target_price, stockData.currency) : 'N/A'}
                    </p>
                </div>
            </div>
        </div>
    );
};

const AdvancedAnalytics = ({ stockData }) => {
    const hasData = stockData.beta || stockData.sharpe_ratio || stockData.esg_score;
    if (!hasData) return null;

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2>Advanced Analytics</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Stat 
                    label="Beta" 
                    value={stockData.beta ? stockData.beta.toFixed(2) : 'N/A'} 
                    tooltipText="Measures the stock's volatility relative to the overall market. >1 is more volatile, <1 is less volatile."
                />
                <Stat 
                    label="Sharpe Ratio (proxy)" 
                    value={stockData.sharpe_ratio ? stockData.sharpe_ratio.toFixed(2) : 'N/A'}
                    tooltipText="Measures risk-adjusted return. A higher ratio indicates better performance for the amount of risk taken."
                />
                <Stat 
                    label="ESG Score" 
                    value={stockData.esg_score ? stockData.esg_score.toFixed(2) : 'N/A'}
                    tooltipText="Environmental, Social, and Governance score. Lower is generally better (less risk)."
                />
                <Stat 
                    label="ESG Percentile" 
                    value={stockData.esg_percentile ? `${stockData.esg_percentile.toFixed(2)}%` : 'N/A'}
                    tooltipText="The company's ESG risk percentile compared to its industry. Lower is better."
                />
            </div>
        </div>
    );
};

function StockDetails() {
    const { symbol } = useParams();
    const { user, refreshUser } = useAuth();
    const { livePrices } = useWebSocket();

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
        if (latestPrice && stockData) {
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
                setError(err.message || "Could not fetch data.");
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
        if (!currentPrice || currentPrice <= 0 || !quantity || Number(quantity) <= 0) {
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

    const currencyCode = stockData?.currency || 'USD';
    const estimatedCost = Number(quantity) * (stockData?.close || 0);

    return (
        <div className="container">
            <BackButton />
            {isLoading && <p>Loading stock data...</p>}
            {error && <p style={{ color: "var(--danger)" }}>Error: {error}</p>}

            {stockData && (
                <>
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1>{stockData.name} ({stockData.symbol})</h1>
                            <p style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                {formatCurrency(stockData.close, currencyCode)}
                            </p>
                            {isDividendStock && (
                                <p style={{ margin: 0, color: 'var(--brand-primary)', fontWeight: 'bold' }}>
                                    💵 This stock is known to pay dividends.
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleWatchlistToggle}
                            disabled={watchlistLoading || !user}
                            style={{
                                backgroundColor: isWatchlisted ? 'transparent' : 'var(--brand-primary)',
                                border: `1px solid ${isWatchlisted ? 'var(--brand-primary)' : 'transparent'}`,
                                color: isWatchlisted ? 'var(--brand-primary)' : 'white',
                                cursor: !user ? 'not-allowed' : 'pointer'
                            }}
                            title={!user ? "Login to add to watchlist" : ""}
                        >
                            {watchlistLoading ? '...' : (isWatchlisted ? '★ Following' : '☆ Add to Watchlist')}
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem' }}>
                        <p><span style={{ color: 'var(--text-secondary)' }}>Open:</span> {formatCurrency(stockData.open, currencyCode)}</p>
                        <p><span style={{ color: 'var(--text-secondary)' }}>High:</span> {formatCurrency(stockData.high, currencyCode)}</p>
                        <p><span style={{ color: 'var(--text-secondary)' }}>Low:</span> {formatCurrency(stockData.low, currencyCode)}</p>
                    </div>

                    <h2>Key Metrics</h2>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                        <Stat label="Market Cap" value={formatLargeNumber(stockData.market_cap)} />
                        <Stat label="P/E Ratio" value={stockData.pe_ratio ? stockData.pe_ratio.toFixed(2) : 'N/A'} />
                        <Stat label="Dividend Yield" value={stockData.dividend_yield ? (stockData.dividend_yield * 100).toFixed(2) + '%' : 'N/A'} />
                        <Stat label="52-Week High" value={formatCurrency(stockData.week_52_high, currencyCode)} />
                        <Stat label="52-Week Low" value={formatCurrency(stockData.week_52_low, currencyCode)} />
                    </div>

                    <AnalystRating stockData={stockData} />

                    <AdvancedAnalytics stockData={stockData} />

                    <StockChart symbol={symbol} currency={currencyCode} />

                    <div style={formContainerStyle}>
                        <h2>Buy {stockData.symbol}</h2>
                        <form onSubmit={handleBuyStock}>
                            <div className="form-group">
                                <label htmlFor="quantity">Quantity</label>
                                <input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" step="1" required />
                            </div>
                            <div style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                Estimated Cost: {formatCurrency(estimatedCost, currencyCode)}
                            </div>
                            <button type="submit" disabled={buyLoading || !user} title={!user ? "Login to buy shares" : ""}>
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