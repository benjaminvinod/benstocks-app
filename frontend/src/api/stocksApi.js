// src/api/stocksApi.js

import axios from "axios";

const BASE_URL = "http://localhost:8000";

export const searchStocks = async (query) => {
  if (!query) return []; // Don't search if query is empty
  try {
    const response = await axios.get(`${BASE_URL}/stocks/search`, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    console.error("Error searching stocks:", error);
    return []; // Return an empty array on error
  }
};