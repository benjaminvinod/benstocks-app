import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { login as apiLogin, signup as apiSignup, getMe } from '../api/auth';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- REFINED: Function to fetch and set user data ---
  // useCallback prevents this function from changing on every render
  const fetchAndSetUser = useCallback(async (userId, token) => {
    try {
      const response = await getMe(userId); // Fetch latest data from backend
      const updatedUser = { ...response.user, token }; // Add token back (backend doesn't store it)
      
      setUser(updatedUser);
      localStorage.setItem('benstocks_user', JSON.stringify(updatedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log("User data fetched/refreshed:", updatedUser);
      return updatedUser; // Return the user data
    } catch (error) {
      console.error("Failed to fetch user data, logging out.", error);
      logout(); // Log out if fetching fails (e.g., bad token/user ID)
      return null;
    }
  }, []); // Empty dependency array means this function is created once

  // --- REFINED: Initial load effect ---
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component unmounts quickly
    setLoading(true); // Ensure loading is true at the start
    
    try {
      const storedUserString = localStorage.getItem('benstocks_user');
      if (storedUserString) {
        const storedUser = JSON.parse(storedUserString);
        if (storedUser?.id && storedUser?.token) {
          // Instead of just setting the stored user, fetch the LATEST data
          fetchAndSetUser(storedUser.id, storedUser.token).then(latestUser => {
            if (isMounted && !latestUser) {
              // If fetch failed and logged out, ensure loading is finished
              setLoading(false);
            } else if (isMounted) {
               setLoading(false); // Finish loading after successful fetch
            }
          });
        } else {
          // Invalid stored user data
          localStorage.removeItem('benstocks_user');
          if (isMounted) setLoading(false);
        }
      } else {
        // No user stored
         if (isMounted) setLoading(false);
      }
    } catch (error) {
      console.error("Failed during initial user load", error);
      localStorage.removeItem('benstocks_user');
      if (isMounted) setLoading(false);
    }

    return () => {
      isMounted = false; // Cleanup function for when component unmounts
    };
  }, [fetchAndSetUser]); // Rerun if fetchAndSetUser changes (shouldn't with useCallback)


  const login = async (email, password) => {
    try {
      const response = await apiLogin({ email, password });
      const userData = response.user; 
      
      // Use fetchAndSetUser to ensure consistency
      await fetchAndSetUser(userData.id, userData.token); 
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error(error.detail || "Login failed");
    }
  };

  const signup = async (username, email, password) => {
    // Signup logic remains the same...
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

  // --- REFINED: Use fetchAndSetUser for refresh ---
  const refreshUser = useCallback(async () => {
    if (!user?.id || !user?.token) return; // No user/token to refresh with
    console.log("Attempting to refresh user...");
    await fetchAndSetUser(user.id, user.token);
  }, [user, fetchAndSetUser]); // Recreate if user or fetch function changes

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