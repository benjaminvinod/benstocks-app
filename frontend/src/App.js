// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import theme from './theme'; 

// Contexts
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { ThemeProvider } from './context/ThemeContext'; 
import { NumberFormatProvider } from './context/NumberFormatContext';

// Page Imports
import Disclaimer from './pages/Disclaimer';
import Learn from './pages/Learn';
import Dashboard from './pages/Dashboard';
import StockDetails from './pages/StockDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ETFs from './pages/ETFs';
import MutualFunds from './pages/MutualFunds';
import Transactions from './pages/Transactions';
import Leaderboard from './pages/Leaderboard';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RiskProfile from './pages/RiskProfile';
import TaxOptimizer from './pages/TaxOptimizer';
import SIPCalculator from './pages/SIPCalculator';
import Portify from './pages/Portify';

// Component Imports
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ChatBot from './components/ChatBot';
import Sidebar from './components/Sidebar'; 
import CommandPalette from './components/CommandPalette'; // --- NEW IMPORT

function App() {
  return (
    <ThemeProvider>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <WebSocketProvider>
            <NumberFormatProvider> 
                <Router>
                  <AppContent />
                </Router>
            </NumberFormatProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ChakraProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" bg="var(--dynamic-gradient)">
      <ToastContainer position="bottom-right" autoClose={5000} theme="dark" />
      
      {/* GLOBAL COMMAND PALETTE (Cmd+K) */}
      <CommandPalette /> 
      
      <Header />
      <Sidebar /> {/* Glossary Sidebar */}

      <Box as="main" flex="1" py={8} > 
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/disclaimer" />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/stock/:symbol" element={<StockDetails />} />
            <Route path="/etfs" element={<ETFs />} />
            <Route path="/mutual-funds" element={<MutualFunds />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/risk-profile" element={<RiskProfile />} />
            <Route path="/tax-optimizer" element={<TaxOptimizer />} />
            <Route path="/sip-calculator" element={<SIPCalculator />} />
            <Route path="/portify" element={<Portify />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Box>
      
      {/* Floating ChatBot - Visible on all pages */}
      <ChatBot />
      
      <Footer />
    </Box>
  );
}

export default App;