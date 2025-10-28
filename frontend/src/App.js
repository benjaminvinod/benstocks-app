// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { ThemeProvider } from './context/ThemeContext'; // Import ThemeProvider
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ChakraProvider } from '@chakra-ui/react';
import { Box } from '@chakra-ui/react';
import theme from './theme'; // Your existing Chakra theme config

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

// Component Imports
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar'; // Assuming Sidebar is for glossary

function App() {
  return (
    // Wrap ChakraProvider with ThemeProvider
    <ThemeProvider>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <WebSocketProvider>
            <Router>
              <AppContent />
            </Router>
          </WebSocketProvider>
        </AuthProvider>
      </ChakraProvider>
    </ThemeProvider>
  );
}

// AppContent remains largely the same but might include Sidebar if desired globally
function AppContent() {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" bg="var(--dynamic-gradient)"> {/* Use dynamic gradient */}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        theme="dark" // Consider making this dynamic too later
      />
      <Header />
      {/* Use Chakra's Box for main content area */}
      <Box as="main" flex="1" py={8} > {/* Added padding with py */}
        <Routes>
          {/* Routes remain the same */}
          <Route path="/" element={<Navigate to="/disclaimer" />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/stock/:symbol" element={<StockDetails />} />
            <Route path="/etfs" element={<ETFs />} />
            <Route path="/mutual-funds" element={<MutualFunds />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/risk-profile" element={<RiskProfile />} />
            <Route path="/tax-optimizer" element={<TaxOptimizer />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Box>
      <Footer />
    </Box>
  );
}

export default App;