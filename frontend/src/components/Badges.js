import React from 'react';

// Define the badges and their criteria
const badgeDefinitions = [
  { name: "First Trade", description: "Awarded for making your first buy or sell.", minTransactions: 1, icon: "🥇" },
  { name: "Active Trader", description: "Awarded for making at least 5 trades.", minTransactions: 5, icon: "📈" },
  { name: "Seasoned Investor", description: "Awarded for making at least 10 trades.", minTransactions: 10, icon: "🏆" },
  // Add more badges here based on different criteria (e.g., profit, portfolio size)
];

// Simple Tooltip component (can reuse or enhance your existing Tooltip.js)
const Tooltip = ({ text, children }) => {
  const [visible, setVisible] = React.useState(false);
  const tooltipStyle = {
    position: 'absolute',
    bottom: '125%', // Position above the icon
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'var(--bg-dark-primary)',
    color: 'var(--text-primary)',
    padding: '0.5rem',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    fontSize: '0.8rem',
    border: '1px solid var(--border-color)',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
    opacity: visible ? 1 : 0,
    visibility: visible ? 'visible' : 'hidden',
    transition: 'opacity 0.2s, visibility 0.2s',
  };
  return (
    <span
      style={{ position: 'relative', display: 'inline-block', cursor: 'help' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <span style={tooltipStyle}>{text}</span>
    </span>
  );
};


function Badges({ transactions = [] }) {
  if (!transactions) return null; // Handle null case

  const earnedBadges = badgeDefinitions.filter(badge => transactions.length >= badge.minTransactions);

  if (earnedBadges.length === 0) {
    return null; // Don't show the section if no badges are earned
  }

  const badgeContainerStyle = {
    background: 'var(--bg-dark-primary)',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    border: '1px solid var(--border-color)',
  };

  const badgeStyle = {
    display: 'inline-block',
    marginRight: '1rem',
    fontSize: '1.5rem', // Make icons bigger
  };

  return (
    <div style={badgeContainerStyle}>
      <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Your Badges</h3>
      <div>
        {earnedBadges.map(badge => (
          <Tooltip key={badge.name} text={`${badge.name}: ${badge.description}`}>
            <span style={badgeStyle} aria-label={badge.name}>{badge.icon}</span>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

export default Badges;