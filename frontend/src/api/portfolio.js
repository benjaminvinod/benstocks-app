// src/api/portfolio.js
import client from "./client";

// --- Stocks Wrappers ---
// Used by Dashboard to fetch live prices for holdings
export const getStockPrice = async (symbol) => {
  try {
    const response = await client.get("/stocks/price", {
      params: { symbol }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching stock price:", error);
    throw error.response?.data || error;
  }
};

// --- Portfolio Management ---

export const getPortfolio = async (userId) => {
  try {
    const response = await client.get(`/portfolio/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    throw error.response?.data || error;
  }
};

export const buyInvestment = async (userId, investment, orderType = "MARKET", limitPrice = null) => {
  try {
    const body = {
        investment: investment,
        order_type: orderType,
        limit_price: limitPrice ? Number(limitPrice) : null
    };
    
    const response = await client.post(`/portfolio/buy/${userId}`, body);
    return response.data;
  } catch (error) {
    console.error("Buy investment error:", error);
    throw error.response?.data || error;
  }
};

export const sellInvestment = async (userId, symbol, quantityToSell) => {
  try {
    const response = await client.post(`/portfolio/sell/${userId}`, {
      investment_id: symbol,
      quantity_to_sell: quantityToSell,
    });
    return response.data;
  } catch (error) {
    console.error("Sell investment error:", error);
    throw error.response?.data || error;
  }
};

export const getTransactions = async (userId) => {
  try {
    const response = await client.get(`/portfolio/transactions/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error.response?.data || error;
  }
};

export const getPortfolioLiveValue = async (userId) => {
  try {
    const response = await client.get(`/portfolio/value/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching live value:", error);
    throw error.response?.data || error;
  }
};

export const getLeaderboard = async (limit = 10) => {
  try {
    const response = await client.get("/leaderboard", {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    throw error.response?.data || error;
  }
};

export const getDiversificationScore = async (userId) => {
  try {
    const response = await client.get(`/analytics/diversification-score/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching diversification score:", error);
    // Return a safe fallback so the UI doesn't crash
    return { score: 'N/A', feedback: 'Could not calculate score.', color: '#A0AEC0' };
  }
};

// --- Watchlist ---

export const getWatchlist = async (userId) => {
  try {
    const response = await client.get(`/portfolio/watchlist/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    throw error.response?.data || error;
  }
};

export const addToWatchlist = async (userId, symbol) => {
  try {
    const response = await client.post(`/portfolio/watchlist/${userId}`, { symbol });
    return response.data;
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    throw error.response?.data || error;
  }
};

export const removeFromWatchlist = async (userId, symbol) => {
  try {
    const response = await client.delete(`/portfolio/watchlist/${userId}/${symbol}`);
    return response.data;
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    throw error.response?.data || error;
  }
};