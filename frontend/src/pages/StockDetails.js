// src/pages/StockDetails.js
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
import { useNumberFormat } from '../context/NumberFormatContext';
import { Select, Input, FormControl, FormLabel, Box, Text } from '@chakra-ui/react';

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
    if (!recommendation && !number_of_analysts) return null;

    const ratingText = recommendation ? recommendation.replace(/_/g, ' ').toUpperCase() : 'N/A';
    
    return (
        <div style={{ marginTop: '2rem' }}>
            <h2>Analyst Consensus</h2>
            <div style={{ background: 'var(--bg-dark-primary)', padding: '1.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                {recommendation && (
                    <div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Rating</p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#48BB78' }}>{ratingText}</p>
                    </div>
                )}
                {target_price && (
                    <div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Target Price</p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(target_price, currency)}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const FinancialsSnapshot = ({ stockData }) => {
    const { revenue, net_income, total_debt, free_cash_flow } = stockData;
    const { formatNumber } = useNumberFormat();
    const hasData = [revenue, net_income, total_debt, free_cash_flow].some(val => val !== null && typeof val !== 'undefined');
    if (!hasData) return null;

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2>Financial Snapshot (Annual)</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Stat label="Total Revenue" value={formatNumber(revenue)} tooltipText="Total sales from goods and services." />
                <Stat label="Net Income" value={formatNumber(net_income)} tooltipText="Profit after expenses." />
                <Stat label="Total Debt" value={formatNumber(total_debt)} tooltipText="Total company debt." />
                <Stat label="Free Cash Flow" value={formatNumber(free_cash_flow)} tooltipText="Cash remaining after operations." />
            </div>
        </div>
    );
};

function StockDetails() {
    const { symbol } = useParams();
    const { user, refreshUser } = useAuth();
    const { livePrices } = useWebSocket();
    const { formatNumber } = useNumberFormat();

    const [stockData, setStockData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [quantity, setQuantity] = useState(1);
    const [orderType, setOrderType] = useState("MARKET"); 
    const [limitPrice, setLimitPrice] = useState("");     
    const [buyLoading, setBuyLoading] = useState(false);
    
    const [isWatchlisted, setIsWatchlisted] = useState(false);
    const [watchlistLoading, setWatchlistLoading] = useState(false);

    const isDividendStock = DIVIDEND_STOCKS.includes(symbol.toUpperCase());
    const isCrypto = symbol.toUpperCase().endsWith("-USD");

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
            try {
                const stockRes = await getStockPrice(symbol);
                if (stockRes.detail || stockRes.error) { throw new Error(stockRes.detail || stockRes.error); }
                setStockData(stockRes);
                if (stockRes.close) setLimitPrice(stockRes.close); 

                if (user?.id) {
                    const watchlistRes = await getWatchlist(user.id);
                    if (Array.isArray(watchlistRes)) setIsWatchlisted(watchlistRes.includes(symbol.toUpperCase()));
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
            toast.error("Invalid price or quantity.");
            setBuyLoading(false);
            return;
        }

        if (orderType === "LIMIT" && Number(limitPrice) < currentPrice) {
             toast.error(`Limit Order Error: Current price ${currentPrice} is higher than your limit ${limitPrice}. Order rejected.`);
             setBuyLoading(false);
             return;
        }
        
        // Estimate cost + 0.1% fee
        const rawCost = buyQuantity * (orderType === "LIMIT" ? Number(limitPrice) : currentPrice);
        const fee = rawCost * 0.001; 
        const totalEstimated = rawCost + fee;

        if (user.balance < totalEstimated) {
            toast.error("Insufficient balance (including fees).");
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
            
            await buyInvestment(user.id, investmentData, orderType, orderType === "LIMIT" ? limitPrice : null);
            
            await refreshUser();
            toast.success(`Successfully executed ${orderType} BUY for ${stockData.symbol}!`);
            setQuantity(1);
        } catch (err) {
            toast.error(err?.detail || err?.message || 'Purchase failed.');
        } finally {
            setBuyLoading(false);
        }
    };

    const handleWatchlistToggle = async () => {
        if (!user) { toast.error("Please log in."); return; }
        setWatchlistLoading(true);
        try {
            if (isWatchlisted) {
                await removeFromWatchlist(user.id, symbol);
                toast.info(`Removed from watchlist.`);
                setIsWatchlisted(false);
            } else {
                await addToWatchlist(user.id, symbol);
                toast.success(`Added to watchlist!`);
                setIsWatchlisted(true);
            }
        } catch (err) {
            toast.error("Watchlist update failed.");
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
    
    // Calc Estimated
    const baseCost = Number(quantity) * (orderType === "LIMIT" ? Number(limitPrice) : (stockData?.close || 0));
    const estFee = baseCost * 0.001;

    if (isLoading) return <div className="container"><p>Loading data...</p></div>;
    if (error) return <div className="container"><BackButton /><p style={{ color: "var(--danger)" }}>Error: {error}</p></div>;
    if (!stockData) return <div className="container"><BackButton /><p>No data.</p></div>;

    return (
        <div className="container">
            <BackButton />
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>{stockData.name || symbol} ({stockData.symbol})</h1>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{formatCurrency(stockData.close, currencyCode)}</p>
                     {isDividendStock && <p style={{ margin: '0.25rem 0 0 0', color: 'var(--brand-primary)', fontWeight: 'bold' }}>💵 This stock may pay dividends.</p>}
                     {isCrypto && <p style={{ margin: '0.25rem 0 0 0', color: '#9F7AEA', fontWeight: 'bold' }}>🚀 Crypto Asset (Trades 24/7)</p>}
                </div>
                <button onClick={handleWatchlistToggle} disabled={watchlistLoading || !user} style={{ padding: '0.6rem 1.2rem', background: isWatchlisted ? 'transparent' : '#4299e1', border: '2px solid #4299e1', borderRadius: '8px', color: isWatchlisted ? '#4299e1' : 'white' }}>
                    {watchlistLoading ? '...' : (isWatchlisted ? '★ Following' : '☆ Watchlist')}
                </button>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                <p><span style={{color: 'var(--text-secondary)'}}>Open:</span> {formatCurrency(stockData.open, currencyCode)}</p>
                <p><span style={{color: 'var(--text-secondary)'}}>High:</span> {formatCurrency(stockData.high, currencyCode)}</p>
                <p><span style={{color: 'var(--text-secondary)'}}>Low:</span> {formatCurrency(stockData.low, currencyCode)}</p>
            </div>

            <h2>Key Metrics</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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
                <h2>Place Order: {stockData.symbol}</h2>
                <form onSubmit={handleBuyStock}>
                    
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Order Type</label>
                        <Select 
                            value={orderType} 
                            onChange={(e) => setOrderType(e.target.value)}
                            bg="var(--bg-dark-primary)" 
                            color="white"
                            borderColor="var(--border-color)"
                        >
                            <option value="MARKET" style={{color: 'black'}}>Market Order</option>
                            <option value="LIMIT" style={{color: 'black'}}>Limit Order</option>
                        </Select>
                        <Text fontSize="sm" color="gray.400" mt={1}>
                            {orderType === "MARKET" ? "Buy immediately at current price." : "Buy only if price is below your limit."}
                        </Text>
                    </div>

                    {orderType === "LIMIT" && (
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Limit Price</label>
                            <Input 
                                type="number" 
                                value={limitPrice} 
                                onChange={(e) => setLimitPrice(e.target.value)}
                                step="0.01"
                                bg="var(--bg-dark-primary)"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Quantity</label>
                        <Input 
                            type="number" 
                            value={quantity} 
                            onChange={(e) => setQuantity(e.target.value)} 
                            min="1" 
                            step="1" 
                            required 
                            bg="var(--bg-dark-primary)" 
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px' }} 
                        />
                    </div>
                    
                    <div style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>
                        <span style={{display: 'block'}}>Base Cost: {formatCurrency(baseCost, currencyCode)}</span>
                        <span style={{display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>+ Brokerage (0.1%): {formatCurrency(estFee, currencyCode)}</span>
                        <hr style={{borderColor: 'var(--border-color)', margin: '0.5rem 0'}} />
                        <strong>Total Cost: {formatCurrency(baseCost + estFee, currencyCode)}</strong>
                    </div>
                    
                    <button type="submit" disabled={buyLoading || !user} style={{ width: '100%' }}>
                        {buyLoading ? 'Processing...' : `Buy ${orderType === 'LIMIT' ? '@ Limit' : '@ Market'}`}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default StockDetails;