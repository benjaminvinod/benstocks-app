// src/context/NumberFormatContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { formatLargeNumber as formatLargeNumberUtil } from '../utils/format';

const NumberFormatContext = createContext();

export function NumberFormatProvider({ children }) {
  // Default to International ('INTL'), check localStorage
  const [numberSystem, setNumberSystem] = useState(() => {
      return localStorage.getItem('benstocks_number_system') || 'INTL';
  });

  useEffect(() => {
      localStorage.setItem('benstocks_number_system', numberSystem);
  }, [numberSystem]);

  // Wrapper function that automatically uses the current system
  const formatNumber = (num) => {
      return formatLargeNumberUtil(num, numberSystem);
  };

  const value = {
      numberSystem,
      setNumberSystem,
      formatNumber
  };

  return (
    <NumberFormatContext.Provider value={value}>
      {children}
    </NumberFormatContext.Provider>
  );
}

// Custom hook for easy access
export function useNumberFormat() {
  const context = useContext(NumberFormatContext);
  if (context === undefined) {
    throw new Error('useNumberFormat must be used within a NumberFormatProvider');
  }
  return context;
}