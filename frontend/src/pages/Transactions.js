// src/pages/Transactions.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTransactions } from '../api/portfolio';
import { formatCurrency, formatDate } from '../utils/format';
import BackButton from '../components/BackButton';

function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await getTransactions(user.id);
      setTransactions(data); // API already sorts, no need to sort here
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const tableStyle = { width: '100%', borderCollapse: 'collapse' };
  const thStyle = { background: 'var(--bg-dark-primary)', padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--brand-primary)' };
  const tdStyle = { padding: '0.75rem', borderBottom: '1px solid var(--border-color)' };

  // --- START: ADDED CODE ---
  // Helper function to get the color for each transaction type
  const getTypeStyle = (type) => {
    switch (type) {
      case 'BUY':
        return { color: '#48BB78' }; // Green
      case 'SELL':
        return { color: '#E53E3E' }; // Red
      case 'DIVIDEND':
        return { color: '#4299E1' }; // Blue
      default:
        return {};
    }
  };
  // --- END: ADDED CODE ---

  return (
    <div className="container">
      <BackButton />
      <div className="page-header">
        <h1>Transaction History</h1>
      </div>
      
      {loading ? (
        <p>Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <p>You have no transactions yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Symbol</th>
                <th style={thStyle}>Details</th>
                <th style={thStyle}>Amount (INR)</th> 
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                  <tr key={t.id}>
                    <td style={tdStyle}>{formatDate(t.timestamp)}</td>
                    <td style={{ ...tdStyle, ...getTypeStyle(t.type), fontWeight: 'bold' }}>
                      {t.type}
                    </td>
                    <td style={tdStyle}>{t.symbol}</td>
                    {/* --- START: MODIFIED CODE --- */}
                    {/* We now dynamically show details based on the type */}
                    <td style={tdStyle}>
                      {t.type === 'DIVIDEND'
                        ? `Dividend @ ${formatCurrency(t.price_per_unit, 'INR')} / share`
                        : `${t.quantity?.toFixed(4)} shares @ ${formatCurrency(t.price_per_unit_inr, 'INR')}`
                      }
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>
                      {t.type === 'BUY' ? '-' : '+'}{formatCurrency(t.total_value_inr, 'INR')}
                    </td>
                    {/* --- END: MODIFIED CODE --- */}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Transactions;