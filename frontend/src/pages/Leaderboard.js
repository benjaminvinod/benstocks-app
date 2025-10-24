import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/portfolio'; // Get the API function
import { formatCurrency } from '../utils/format';
import BackButton from '../components/BackButton';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLeaderboard(10); // Get top 10
      setLeaderboard(data);
    } catch (err) {
      setError('Failed to load leaderboard.');
      console.error(err);
    }
    setLoading(false);
  };

  const tableStyle = { /* ... same as Transactions page ... */ };
  const thStyle = { /* ... */ };
  const tdStyle = { /* ... */ };

  return (
    <div className="container">
      <BackButton />
      <div className="page-header">
        <h1>Top Investors</h1>
        <p>Ranked by current total portfolio value (Cash + Investments).</p>
        <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>(Updates may take a moment to reflect live values)</p>
      </div>

      {loading && <p>Loading leaderboard...</p>}
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      
      {!loading && !error && leaderboard.length === 0 && (
          <p>No leaderboard data available yet.</p>
      )}

      {!loading && !error && leaderboard.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Rank</th>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Total Portfolio Value (INR)</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user, index) => (
                <tr key={user.username + index}> {/* Use index if usernames aren't unique */}
                  <td style={tdStyle}>{index + 1}</td>
                  <td style={tdStyle}>{user.username}</td>
                  <td style={{...tdStyle, fontWeight: 'bold' }}>
                      {formatCurrency(user.total_value_inr, 'INR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;