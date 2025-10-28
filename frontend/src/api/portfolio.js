// portfolio.js
import axios from "axios";

const BASE_URL = "http://localhost:8000"; // Backend URL

// We need getStockPrice here for the Dashboard chart
export const getStockPrice = async (symbol) => {
  try {
    const response = await axios.get(`${BASE_URL}/stocks/price`, {
      params: { symbol }
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data || error;
  }
};

export const getPortfolio = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/portfolio/${userId}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data || error;
  }
};

export const buyInvestment = async (userId, investment) => {
  try {
    const response = await axios.post(`${BASE_URL}/portfolio/buy/${userId}`, investment);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data || error;
  }
};

export const sellInvestment = async (userId, symbol, quantityToSell) => {
  try {
    const response = await axios.post(`${BASE_URL}/portfolio/sell/${userId}`, {
      investment_id: symbol,
      quantity_to_sell: quantityToSell,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data || error;
  }
};

export const getTransactions = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/portfolio/transactions/${userId}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data || error;
  }
};

export const getPortfolioLiveValue = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/portfolio/value/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching live portfolio value:", error);
    throw error.response?.data || error;
  }
};

export const getLeaderboard = async (limit = 10) => {
  try {
    const response = await axios.get(`${BASE_URL}/leaderboard`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    throw error.response?.data || error;
  }
};

// --- START: ADDED CODE ---
export const getDiversificationScore = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/analytics/diversification-score/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching diversification score:", error);
    // Return a default error state so the app doesn't crash
    return { score: 'N/A', feedback: 'Could not calculate score.', color: '#A0AEC0' };
  }
};
// --- END: ADDED CODE ---

export const getWatchlist = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/portfolio/watchlist/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    throw error.response?.data || error;
  }
};

export const addToWatchlist = async (userId, symbol) => {
  try {
    const response = await axios.post(`${BASE_URL}/portfolio/watchlist/${userId}`, { symbol });
    return response.data;
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    throw error.response?.data || error;
  }
};

export const removeFromWatchlist = async (userId, symbol) => {
  try {
    const response = await axios.delete(`${BASE_URL}/portfolio/watchlist/${userId}/${symbol}`);
    return response.data;
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    throw error.response?.data || error;
  }
};