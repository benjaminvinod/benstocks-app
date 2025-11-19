import React from 'react';

// Define the badges and their criteria
const badgeDefinitions = [
  { 
    name: "First Trade", 
    description: "Awarded for making your first buy or sell.", 
    check: (transactions) => transactions.length >= 1, 
    icon: "🥇" 
  },
  { 
    name: "Active Trader", 
    description: "Awarded for making at least 5 trades.", 
    check: (transactions) => transactions.length >= 5, 
    icon: "📈" 
  },
  { 
    name: "Seasoned Investor", 
    description: "Awarded for making at least 10 trades.", 
    check: (transactions) => transactions.length >= 10, 
    icon: "🏆" 
  },
  { 
    name: "Big Whale", 
    description: "Made a single trade worth over ₹1 Lakh.", 
    check: (transactions) => transactions.some(t => t.total_value_inr >= 100000), 
    icon: "🐋" 
  },
  { 
    name: "Crypto Bro", 
    description: "Invested in a Cryptocurrency.", 
    check: (transactions) => transactions.some(t => t.symbol.includes("-USD") && !t.symbol.includes("MON100")), 
    icon: "🚀" 
  },
  { 
    name: "Diversified", 
    description: "Owns at least 3 different assets.", 
    check: (transactions) => {
        const uniqueSymbols = new Set(transactions.map(t => t.symbol));
        return uniqueSymbols.size >= 3;
    }, 
    icon: "🎨" 
  }
];

// Simple Tooltip component
const Tooltip = ({ text, children }) => {
  const [visible, setVisible] = React.useState(false);
  const tooltipStyle = {
    position: 'absolute',
    bottom: '125%', 
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
  if (!transactions) return null; 

  const earnedBadges = badgeDefinitions.filter(badge => badge.check(transactions));

  if (earnedBadges.length === 0) {
    return null; 
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
    fontSize: '1.5rem', 
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