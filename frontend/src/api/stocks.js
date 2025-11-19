// src/api/stocks.js
import client from "./client";

/**
 * Searches for stocks matching the query string.
 * @param {string} query - The ticker or company name to search for.
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
    return []; // Return empty array to prevent UI crashes
  }
};

/**
 * Fetches live price and details for a specific symbol.
 * @param {string} symbol - The stock ticker (e.g., AAPL, RELIANCE.NS).
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
 * @param {string} symbol - The stock ticker.
 * @param {string} period - Time range (e.g., '1y', '1mo').
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