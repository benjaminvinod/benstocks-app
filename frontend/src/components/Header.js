import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'var(--bg-dark-secondary)',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
  };

  const navLinkStyle = {
    color: 'var(--text-primary)',
    marginRight: '1.5rem',
    textDecoration: 'none',
    fontWeight: 600,
  };

  const logoStyle = {
    color: 'var(--text-primary)',
    textDecoration: 'none',
    fontSize: '1.75rem',
    fontWeight: 'bold',
  };

  return (
    <header style={headerStyle}>
      <Link to={isAuthenticated ? "/dashboard" : "/"} style={logoStyle}>
        BenStocks
      </Link>
      <nav>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
            <Link to="/etfs" style={navLinkStyle}>ETFs</Link>
            <Link to="/mutual-funds" style={navLinkStyle}>Mutual Funds</Link>
            <Link to="/risk-profile" style={navLinkStyle}>Risk Profiling Quiz</Link>
            <Link to="/tax-optimizer" style={navLinkStyle}>Tax Optimizer</Link> {/* --- START: ADDED CODE --- */}
            <Link to="/transactions" style={navLinkStyle}>Transactions</Link>
            <Link to="/learn" style={navLinkStyle}>Learn</Link>
            <Link to="/leaderboard" style={navLinkStyle}>Leaderboard</Link>
            <button onClick={handleLogout} style={{ padding: '0.5rem 1rem' }}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/learn" style={navLinkStyle}>Learn</Link>
            <Link to="/login" style={navLinkStyle}>Log In</Link>
            <button onClick={() => navigate('/signup')} style={{ padding: '0.5rem 1rem' }}>
              Sign Up
            </button>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;