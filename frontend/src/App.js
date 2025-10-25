// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext'; // Import the WebSocket provider
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Page Imports
import Disclaimer from './pages/Disclaimer';
import Learn from './pages/Learn';
import Dashboard from './pages/Dashboard';
import StockDetails from './pages/StockDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
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
    // Wrap the entire app, first with Auth, then with WebSocket
    <AuthProvider>
      <WebSocketProvider>
        <Router>
          <AppContent />
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
}

// AppContent contains the layout and routes
function AppContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Toast container for notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      {/* Header component */}
      <Header />
      {/* Main content area where pages are rendered */}
      <main style={{ flex: 1, paddingTop: '2rem', paddingBottom: '2rem' }}>
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

          {/* Protected Routes (Require Login) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/stock/:symbol" element={<StockDetails />} />
            <Route path="/mutual-funds" element={<MutualFunds />} />
            <Route path="/transactions" element={<Transactions />} />
          </Route>

          {/* Fallback for unknown routes - redirect to dashboard if logged in, or login */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
      {/* Footer component */}
      <Footer />
    </div>
  );
}

export default App;