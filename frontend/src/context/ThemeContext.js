// src/context/ThemeContext.js
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';

// Define theme palettes
const themes = {
  default: {
    name: 'Default Dark',
    // Uses existing CSS variables as fallback, applies overlay
    gradient: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), linear-gradient(135deg, var(--bg-dark-primary, #1a202c) 0%, var(--bg-dark-secondary, #2d3748) 100%)',
    primary: 'var(--brand-primary, #4299e1)', // Use original primary
    textPrimary: 'var(--text-primary, #edf2f7)',
    textSecondary: 'var(--text-secondary, #a0aec0)',
    bgPrimary: 'var(--bg-dark-primary, #1a202c)',
    bgSecondary: 'var(--bg-dark-secondary, #2d3748)',
    borderColor: 'var(--border-color, #4a5568)',
  },
  sunset: {
    name: 'Sunset Orange',
    gradient: 'linear-gradient(135deg, #4A0E0E 0%, #D97706 100%)',
    primary: '#F59E0B', // Amber/Yellow
    textPrimary: '#FFFBEB', // Off-white
    textSecondary: '#FDE68A', // Light yellow
    bgPrimary: '#4A0E0E', // Dark red
    bgSecondary: '#78350F', // Dark orange/brown
    borderColor: '#B45309', // Darker orange
  },
  oceanic: {
    name: 'Oceanic Blue',
    gradient: 'linear-gradient(135deg, #0D253F 0%, #01B4E4 50%, #76d7c4 100%)',
    primary: '#76d7c4', // Teal green
    textPrimary: '#E0F2F7', // Very light blue
    textSecondary: '#B3E5FC', // Light blue
    bgPrimary: '#0D253F', // Deep blue
    bgSecondary: '#01579B', // Medium blue
    borderColor: '#0277BD', // Brighter blue
  },
   forest: {
    name: 'Forest Green',
    gradient: 'linear-gradient(135deg, #145A32 0%, #58D68D 100%)',
    primary: '#58D68D', // Bright green
    textPrimary: '#E8F8F5', // Very light green
    textSecondary: '#ABEBC6', // Light green
    bgPrimary: '#145A32', // Deep green
    bgSecondary: '#1E8449', // Medium green
    borderColor: '#239B56', // Brighter green
  },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => localStorage.getItem('app_theme') || 'default');

  // Apply theme variables to root element
  useEffect(() => {
    const currentTheme = themes[themeName] || themes.default;
    const root = document.documentElement;

    root.style.setProperty('--dynamic-gradient', currentTheme.gradient);
    // Use dynamic versions for overrides, keeping original CSS vars as fallbacks
    root.style.setProperty('--brand-primary-dynamic', currentTheme.primary);
    root.style.setProperty('--text-primary-dynamic', currentTheme.textPrimary);
    root.style.setProperty('--text-secondary-dynamic', currentTheme.textSecondary);
    root.style.setProperty('--bg-primary-dynamic', currentTheme.bgPrimary);
    root.style.setProperty('--bg-secondary-dynamic', currentTheme.bgSecondary);
    root.style.setProperty('--border-dynamic', currentTheme.borderColor);

    localStorage.setItem('app_theme', themeName);
  }, [themeName]);

  const value = useMemo(() => ({ themeName, setThemeName, themes }), [themeName]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);