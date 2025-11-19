// src/api/portfolio.js
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

// --- MODIFIED: Accept Order Type and Limit Price ---
export const buyInvestment = async (userId, investment, orderType = "MARKET", limitPrice = null) => {
  try {
    // We pass order_type and limit_price in the body
    const payload = {
        investment: investment,
        order_type: orderType,
        limit_price: limitPrice ? Number(limitPrice) : null
    };
    
    // Note: The backend expects `investment` object fields inside the body, 
    // but also the order params. We need to structure it carefully or 
    // simpler: put params in query or flattened body.
    // Let's adjust to match backend signature: 
    // Backend: buy_investment(user_id, investment: Investment, order_type, limit_price)
    // FastAPI expects JSON body.
    
    // Flattening the payload for the request
    const response = await axios.post(`${BASE_URL}/portfolio/buy/${userId}`, {
        ...investment, // Spread investment fields (symbol, quantity, etc.)
        // Note: FastAPI Pydantic will look for these. 
        // Actually, FastAPI with multiple body params expects a specific structure.
        // Let's use the updated backend signature which expects JSON.
        // Wait, if I mix Pydantic model and body params, FastAPI expects keys.
    }, {
        // Backend is likely expecting "investment" key + others if defined that way,
        // OR if we flatten, we need to be careful. 
        // Given the backend code: investment: Investment, order_type: str = Body(...)
        // FastAPI expects: { "investment": {...}, "order_type": "...", "limit_price": ... }
    });
    
    // Correction: The frontend call below constructs the body to match FastAPI's expectation
    const body = {
        investment: investment,
        order_type: orderType,
        limit_price: limitPrice
    };
    
    const res = await axios.post(`${BASE_URL}/portfolio/buy/${userId}`, body);
    return res.data;
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

export const getDiversificationScore = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/analytics/diversification-score/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching diversification score:", error);
    return { score: 'N/A', feedback: 'Could not calculate score.', color: '#A0AEC0' };
  }
};

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