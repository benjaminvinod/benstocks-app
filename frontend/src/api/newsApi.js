// src/api/newsApi.js

import axios from "axios";

const BASE_URL = "http://localhost:8000";

export const getFinancialNews = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/news`);
    return response.data;
  } catch (error) {
    console.error("Error fetching financial news:", error);
    throw error.response?.data || error;
  }
};