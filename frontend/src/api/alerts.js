// src/api/alerts.js
import client from "./client";

export const createAlert = async (userId, symbol, targetPrice, condition) => {
  try {
    const payload = {
        user_id: userId,
        symbol: symbol,
        target_price: parseFloat(targetPrice),
        condition: condition
    };
    const response = await client.post("/alerts/", payload);
    return response.data;
  } catch (error) {
    console.error("Error creating alert:", error);
    throw error.response?.data || error;
  }
};

export const getUserAlerts = async (userId) => {
  try {
    const response = await client.get(`/alerts/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching alerts:", error);
    throw error.response?.data || error;
  }
};

export const deleteAlert = async (alertId) => {
  try {
    const response = await client.delete(`/alerts/${alertId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting alert:", error);
    throw error.response?.data || error;
  }
};