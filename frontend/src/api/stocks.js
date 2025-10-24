// stocks.js
import axios from "axios";

const BASE_URL = "http://localhost:8000"; // Backend URL

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

export const getProjection = async (amount, years, cagr) => {
  try {
    const response = await axios.get(`${BASE_URL}/stocks/projection`, {
      params: { amount, years, cagr }
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data || error;
  }
};

export const getStockHistory = async (symbol, period) => {
  try {
    const response = await axios.get(`${BASE_URL}/stocks/history/${symbol}`, {
      params: { period }
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data || error;
  }
};