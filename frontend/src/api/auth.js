// src/api/auth.js
import client from "./client"; // Import the central client

export const signup = async (user) => {
  try {
    // No need to type the full URL anymore, just the endpoint
    const response = await client.post("/auth/signup", user);
    return response.data;
  } catch (error) {
    console.error("Signup error:", error);
    throw error.response?.data || error;
  }
};

export const login = async (user) => {
  try {
    const response = await client.post("/auth/login", user);
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error.response?.data || error;
  }
};

export const getMe = async (userId) => {
  try {
    const response = await client.get(`/auth/me/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Fetch user error:", error);
    throw error.response?.data || error;
  }
};