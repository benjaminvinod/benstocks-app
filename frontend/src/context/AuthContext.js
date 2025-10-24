// src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { login as apiLogin, signup as apiSignup, getMe } from '../api/auth';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Keep true to prevent flicker on protected routes

  // This function fetches the latest user data after a login or refresh.
  const fetchAndSetUser = useCallback(async (userId, token) => {
    try {
      const response = await getMe(userId);
      const updatedUser = { ...response.user, token };
      
      setUser(updatedUser);
      localStorage.setItem('benstocks_user', JSON.stringify(updatedUser)); // We still save it for refreshUser
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return updatedUser;
    } catch (error) {
      console.error("Failed to fetch user data, logging out.", error);
      logout();
      return null;
    }
  }, []);

  // This useEffect now ONLY sets loading to false. It no longer auto-logs in.
  useEffect(() => {
    // By removing the localStorage check here, the app will always start
    // with `user` as null, forcing a login for protected routes.
    setLoading(false);
  }, []);


  const login = async (email, password) => {
    try {
      const response = await apiLogin({ email, password });
      const userData = response.user;
      await fetchAndSetUser(userData.id, userData.token);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error(error.detail || "Login failed");
    }
  };

  const signup = async (username, email, password) => {
    try {
      await apiSignup({ username, email, password });
      await login(email, password); // This will call fetchAndSetUser
      return true;
    } catch (error) {
      console.error("Signup failed:", error);
      throw new Error(error.detail || "Signup failed");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('benstocks_user');
    delete axios.defaults.headers.common['Authorization'];
    console.log("User logged out.");
  };

  // refreshUser still works by grabbing the last known user from localStorage if needed
  const refreshUser = useCallback(async () => {
    let currentUser = user;
    if (!currentUser) {
        const storedUserString = localStorage.getItem('benstocks_user');
        if (storedUserString) {
            currentUser = JSON.parse(storedUserString);
        }
    }
    
    if (!currentUser?.id || !currentUser?.token) return;
    
    console.log("Attempting to refresh user...");
    await fetchAndSetUser(currentUser.id, currentUser.token);
  }, [user, fetchAndSetUser]);

  const value = { user, isAuthenticated: !!user, loading, login, signup, logout, refreshUser };

  // Only render children when NOT loading initially
  return (
    <AuthContext.Provider value={value}>
      {!loading && children} 
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}