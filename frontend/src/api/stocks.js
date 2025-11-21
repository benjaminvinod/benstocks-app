// src/api/stocks.js
import client from "./client";

/**
 * Searches for stocks matching the query string.
 */
export const searchStocks = async (query) => {
  if (!query) return [];
  try {
    const response = await client.get("/stocks/search", {
      params: { query }
    });
    return response.data;
  } catch (error) {
    console.error("Error searching stocks:", error);
    return []; 
  }
};

/**
 * Fetches live price and details for a specific symbol.
 */
export const getStockPrice = async (symbol) => {
  try {
    const response = await client.get("/stocks/price", {
      params: { symbol }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching stock price:", error);
    throw error.response?.data || { error: "Network error" };
  }
};

/**
 * Fetches historical candle data for charts.
 * Now returns OHLC data for Candlestick charts.
 */
export const getStockHistory = async (symbol, period = '1y') => {
  try {
    const response = await client.get(`/stocks/history/${symbol}`, {
      params: { period }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching stock history:", error);
    throw error.response?.data || { error: "Network error" };
  }
};

/**
 * Calculates projected returns (CAGR).
 */
export const getProjection = async (amount, years, cagr) => {
  try {
    const response = await client.get("/stocks/projection", {
      params: { amount, years, cagr }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching projection:", error);
    throw error.response?.data || error;
  }
};

// --- NEW: MARKET DATA ENDPOINTS ---

/**
 * Fetches summary of major global indices (Nifty, Sensex, BTC).
 */
export const getMarketSummary = async () => {
    try {
        const response = await client.get("/stocks/market-summary");
        return response.data;
    } catch (error) {
        console.error("Error fetching market summary:", error);
        return [];
    }
};

/**
 * Fetches top gainers and losers from the popular stocks list.
 */
export const getTopMovers = async () => {
    try {
        const response = await client.get("/stocks/top-movers");
        return response.data;
    } catch (error) {
        console.error("Error fetching top movers:", error);
        return { gainers: [], losers: [] };
    }
};

// --- NEW: BACKTESTING (Time Machine) ---

/**
 * Calculates past performance of a stock.
 */
export const runBacktest = async (symbol, years, amount) => {
    try {
        const response = await client.get("/stocks/backtest", {
            params: { symbol, years, amount }
        });
        return response.data;
    } catch (error) {
        console.error("Backtest error:", error);
        throw error.response?.data || error;
    }
};