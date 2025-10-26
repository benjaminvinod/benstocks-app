// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- START: ADDED CODE ---
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme'; // Import our custom theme
// --- END: ADDED CODE ---

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

// Component Imports
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    // --- START: MODIFIED CODE ---
    // Wrap the entire application with ChakraProvider and pass our theme
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <WebSocketProvider>
          <Router>
            <AppContent />
          </Router>
        </WebSocketProvider>
      </AuthProvider>
    </ChakraProvider>
    // --- END: MODIFIED CODE ---
  );
}

// AppContent contains the layout and routes
function AppContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        theme="dark"
      />
      <Header />
      <main style={{ flex: 1, paddingTop: '2rem', paddingBottom: '2rem' }}>
        <Routes>
          {/* All your routes remain the same */}
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
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;