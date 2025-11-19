// src/api/client.js
import axios from "axios";

// 1. Dynamically determine the API URL
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// 2. Create a central Axios instance
const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 3. Automatically attach the Token to every request if it exists
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default client;