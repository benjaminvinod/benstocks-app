// Sidebar.js
import React, { useState } from 'react';

const glossaryTerms = {
  CAGR: {
    term: 'Compound Annual Growth Rate',
    definition: 'CAGR is the rate of return that would be required for an investment to grow from its beginning balance to its ending balance, assuming the profits were reinvested at the end of each year of the investment’s lifespan.'
  },
  Stocks: {
    term: 'Stocks (or Shares)',
    definition: 'A type of security that signifies ownership in a corporation and represents a claim on part of the corporation\'s assets and earnings.'
  },
  Bonds: {
    term: 'Bonds',
    definition: 'A fixed-income instrument that represents a loan made by an investor to a borrower (typically corporate or governmental). In return for the loan, the borrower pays interest.'
  },
  'Mutual Fund': {
    term: 'Mutual Fund',
    definition: 'A type of financial vehicle made up of a pool of money collected from many investors to invest in securities like stocks, bonds, and other assets.'
  },
  ETF: {
    term: 'Exchange-Traded Fund',
    definition: 'A type of security that tracks an index, sector, commodity, or other asset, but which can be purchased or sold on a stock exchange the same as a regular stock.'
  },
  Volatility: {
    term: 'Volatility',
    definition: 'A statistical measure of the dispersion of returns for a given security or market index. In most cases, the higher the volatility, the riskier the security.'
  },
  Diversification: {
    term: 'Diversification',
    definition: 'A risk management strategy that mixes a wide variety of investments within a portfolio. The rationale behind this technique is that a portfolio constructed of different kinds of assets will, on average, yield higher long-term returns and lower the risk of any single holding.'
  }
};

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button 
        onClick={toggleSidebar}
        style={{
          position: 'fixed',
          right: isOpen ? '320px' : '20px',
          bottom: '20px',
          zIndex: 1001,
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          transition: 'right 0.3s ease-in-out'
        }}
        title="Open Glossary"
      >
        ?
      </button>
      
      <aside style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? '0' : '-300px',
        width: '300px',
        height: '100%',
        backgroundColor: 'var(--surface-color)',
        padding: '2rem 1.5rem',
        boxSizing: 'border-box',
        zIndex: 1000,
        overflowY: 'auto',
        transition: 'right 0.3s ease-in-out',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: '-5px 0 15px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{marginTop: 0, marginBottom: "2rem"}}>Glossary</h2>
        {Object.entries(glossaryTerms).map(([key, value]) => (
          <div key={key} style={{marginBottom: "1.5rem"}}>
            <h3 style={{color: 'var(--primary-color)', marginBottom: '0.5rem'}}>{value.term}</h3>
            <p style={{color: 'var(--text-muted-color)'}}>{value.definition}</p>
          </div>
        ))}
      </aside>
    </>
  );
}

export default Sidebar;
