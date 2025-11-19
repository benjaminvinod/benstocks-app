// src/api/newsApi.js
import client from "./client";

export const getFinancialNews = async () => {
  try {
    const response = await client.get("/news");
    return response.data;
  } catch (error) {
    console.error("Error fetching financial news:", error);
    throw error.response?.data || error;
  }
};