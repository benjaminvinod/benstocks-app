// src/api/newsApi.js
import client from "./client";

export const getFinancialNews = async (query = null) => {
  try {
    const config = {};
    if (query) {
      config.params = { query };
    }
    const response = await client.get("/news", config);
    return response.data;
  } catch (error) {
    console.error("Error fetching financial news:", error);
    // Return empty array on error to prevent UI crashes
    return [];
  }
};