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
    // ... (fetch logic remains the same)
    setLoading(true);
    try {
      const data = await getTransactions(user.id);
      setTransactions(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const tableStyle = { /* ... */ };
  const thStyle = { /* ... */ };
  const tdStyle = { /* ... */ };

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
                <th style={thStyle}>Quantity</th>
                <th style={thStyle}>Price (Original)</th>
                {/* --- ADDED INR Columns --- */}
                <th style={thStyle}>Price (INR)</th>
                <th style={thStyle}>Total Value (INR)</th> 
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => {
                // Determine original currency for display
                const originalCurrency = (t.symbol?.toUpperCase().endsWith('.NS') || t.symbol?.toUpperCase().endsWith('.BO')) ? 'INR' : 'USD';
                
                return (
                  <tr key={t.id}>
                    <td style={tdStyle}>{formatDate(t.timestamp)}</td>
                    <td style={{ ...tdStyle, color: t.type === 'BUY' ? 'var(--brand-hover)' : 'var(--danger)' }}>
                      {t.type}
                    </td>
                    <td style={tdStyle}>{t.symbol}</td>
                    <td style={tdStyle}>{t.quantity?.toFixed(4)}</td>
                    {/* Display original price */}
                    <td style={tdStyle}>{formatCurrency(t.price_per_unit, originalCurrency)}</td>
                    {/* --- Display INR price and value --- */}
                    <td style={tdStyle}>{t.price_per_unit_inr ? formatCurrency(t.price_per_unit_inr, 'INR') : 'N/A'}</td>
                    <td style={tdStyle}>{t.total_value_inr ? formatCurrency(t.total_value_inr, 'INR') : 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Transactions;