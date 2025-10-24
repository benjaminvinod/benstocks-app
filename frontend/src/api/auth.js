// auth.js
import axios from "axios";

const BASE_URL = "http://localhost:8000"; // Backend URL

export const signup = async (user) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/signup`, user);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data || error;
  }
};

export const login = async (user) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, user);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data || error;
  }
};

export const getMe = async (userId) => {
  try {
    // This calls the new endpoint we just made
    const response = await axios.get(`${BASE_URL}/auth/me/${userId}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data || error;
  }
};