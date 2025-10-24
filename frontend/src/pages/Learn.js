import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton'; // Add BackButton

// --- Reusable Accordion Component ---
function AccordionItem({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  const headerStyle = {
    backgroundColor: 'var(--bg-dark-primary)',
    padding: '1rem 1.5rem',
    border: '1px solid var(--border-color)',
    borderRadius: isOpen ? '8px 8px 0 0' : '8px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background-color 0.2s ease',
  };

  const contentStyle = {
    padding: '1.5rem',
    border: '1px solid var(--border-color)',
    borderTop: 'none',
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
    backgroundColor: 'var(--bg-dark-secondary)', // Slightly lighter background for content
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div 
        style={headerStyle} 
        onClick={() => setIsOpen(!isOpen)}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-dark-secondary)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-dark-primary)'}
      >
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{title}</h3>
        <span style={{ fontSize: '1.5rem', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
          {isOpen ? '−' : '+'}
        </span>
      </div>
      {isOpen && (
        <div style={contentStyle}>
          {children}
        </div>
      )}
    </div>
  );
}


// --- EXPANDED DATA ---
const investmentInstruments = [
  { 
    name: "Stocks (Equities)", 
    details: {
      "What are they?": "Stocks represent partial ownership (equity) in a publicly traded company. When you buy a stock (e.g., Reliance Industries), you own a tiny fraction of that company.",
      "How do you make money?": "1. **Capital Appreciation:** The stock price goes up over time, and you sell it for more than you paid. 2. **Dividends:** Some companies distribute a portion of their profits to shareholders regularly.",
      "What are the risks?": "Stock prices can be volatile and go down due to company performance, market sentiment, or economic factors. You could lose some or all of your invested capital.",
      "How to invest (in this simulator)?": "Go to the Dashboard, enter a stock symbol (like 'AAPL' or 'RELIANCE.NS'), check its price on the details page, and use the 'Buy' form to purchase shares with your simulated balance.",
    } 
  },
  { 
    name: "ETFs (Exchange Traded Funds)", 
    details: {
       "What are they?": "ETFs are like baskets containing many different stocks, bonds, or commodities, all bundled into a single unit that trades on the stock exchange like a regular stock. Many ETFs track an index (e.g., a Nifty 50 ETF holds shares of the top 50 Indian companies).",
       "How do you make money?": "Primarily through capital appreciation as the value of the underlying assets in the ETF increases. Some ETFs also distribute dividends.",
       "What are the risks?": "The risk depends on what the ETF holds. A broad market ETF (like Nifty 50) is generally less risky than investing in a single stock due to diversification, but it can still lose value if the overall market declines. Sector-specific ETFs (like an IT ETF) carry higher risk.",
       "How to invest (in this simulator)?": "Go to the 'Invest in ETFs (Funds)' page, select an ETF from the list (like 'NIFTYBEES.NS'), enter the amount you want to invest, and click 'Invest Now'. The simulator calculates how many units you get based on the current price (NAV)."
    } 
  },
   { 
    name: "Mutual Funds (MFs)", 
    details: {
       "What are they?": "Similar to ETFs, Mutual Funds pool money from many investors to buy a diversified portfolio. However, they typically don't trade live on an exchange. You buy or sell units directly from the fund house (Asset Management Company - AMC) at a price (NAV - Net Asset Value) calculated once per day after the market closes.",
       "How do they differ from ETFs?": "MFs are usually actively managed (a fund manager picks investments), while most ETFs passively track an index. MFs have NAV calculated daily; ETFs trade live. MFs often have different expense structures.",
        "How do you make money?": "Capital appreciation (NAV increases) and sometimes dividends.",
       "What are the risks?": "Similar to ETFs, risk depends on the fund's holdings and strategy. Actively managed funds also carry 'manager risk' – the risk that the fund manager makes poor investment choices.",
       "How to invest (in this simulator)?": "Our simulator uses ETFs to represent Mutual Funds because we can get live prices. Use the 'Invest in ETFs (Funds)' page."
    } 
  },
  { 
    name: "Bonds (Debt)", 
    details: {
        "What are they?": "Bonds are essentially loans you give to a government (like Government Bonds or G-Secs) or a company (Corporate Bonds). In return, the issuer promises to pay you regular interest (coupon) over a fixed period and return your principal amount at the end (maturity).",
        "How do you make money?": "Primarily through the regular interest payments. Bond prices can also fluctuate in the market based on interest rate changes, potentially offering capital appreciation if sold before maturity.",
        "What are the risks?": "1. **Interest Rate Risk:** If interest rates rise after you buy a bond, newly issued bonds will offer higher interest, making your existing bond less attractive (its price might fall). 2. **Credit Risk (Default Risk):** The issuer might fail to make interest payments or repay the principal (more common with corporate bonds than government bonds).",
        "How to invest (in this simulator)?": "We offer Debt ETFs on the 'Invest in ETFs (Funds)' page (e.g., 'GSEC.NS', 'LIQUIDBEES.NS'). These ETFs hold a basket of bonds, providing diversification."
    } 
  },
];

// --- NEW SECTION: General Terms ---
const generalTerms = [
    {
        name: "Portfolio",
        details: {
            "Definition": "Your entire collection of investments. This includes all the stocks, ETFs, bonds, and cash you hold within your account.",
            "Why it matters": "A well-diversified portfolio (spread across different types of assets and sectors) can help reduce overall risk."
        }
    },
    {
        name: "Diversification",
        details: {
            "Definition": "The strategy of spreading your investments across various asset classes (stocks, bonds), sectors (IT, Pharma, Banking), and geographical regions to reduce risk. Don't put all your eggs in one basket!",
            "Why it matters": "If one investment performs poorly, others in a diversified portfolio might perform well, cushioning the overall impact."
        }
    },
     {
        name: "Risk",
        details: {
            "Definition": "The possibility that an investment's actual return will be different than expected, including the possibility of losing some or all of the original investment.",
            "Types": "Market risk (overall market decline), interest rate risk (for bonds), credit risk (issuer default), inflation risk (returns don't beat inflation), liquidity risk (can't sell easily)."
        }
    },
     {
        name: "Return",
        details: {
            "Definition": "The profit or loss made on an investment over a period, usually expressed as a percentage of the original investment.",
            "Components": "Can include capital appreciation (price increase) and income (dividends or interest)."
        }
    },
     {
        name: "Volatility",
        details: {
            "Definition": "A measure of how much the price of an investment fluctuates over time. Higher volatility means larger price swings (up and down), generally indicating higher risk.",
             "Example": "Technology stocks are often more volatile than utility stocks."
        }
    },
     {
        name: "Bull Market vs. Bear Market",
        details: {
            "Bull Market": "A period when market prices are generally rising, accompanied by investor optimism.",
            "Bear Market": "A period when market prices are generally falling (typically a decline of 20% or more from recent highs), accompanied by investor pessimism."
        }
    },
     {
        name: "NAV (Net Asset Value)",
        details: {
            "Definition": "Used primarily for Mutual Funds and ETFs. It represents the price per share/unit of the fund, calculated by taking the fund's total assets minus its liabilities, divided by the number of outstanding shares/units.",
             "Calculation": "For MFs, calculated once daily after market close. For ETFs, the market price fluctuates live, but an indicative NAV (iNAV) is often calculated throughout the day."
        }
    },
     {
        name: "CAGR (Compound Annual Growth Rate)",
        details: {
            "Definition": "The average annual rate of return an investment provides over a specified period longer than one year, assuming profits are reinvested.",
            "Use": "It provides a smoothed-out measure of an investment's performance over time, better than simple average returns.",
             "Formula (Simplified)": "`((Ending Value / Beginning Value)^(1 / Number of Years)) - 1`"
        }
    },
    {
        name: "Broker",
        details: {
            "Definition": "An individual or firm that acts as an intermediary between an investor and a securities exchange. You need a broker (like Zerodha, Groww, Upstox in India, or Robinhood, Charles Schwab in the US) to buy and sell stocks, ETFs, etc.",
            "Role": "They execute your buy/sell orders, hold your securities and cash (in a demat/trading account), and provide trading platforms and research."
        }
    },
     {
        name: "Demat & Trading Account",
        details: {
            "Demat Account": "Holds your shares and securities in electronic (dematerialized) form.",
            "Trading Account": "Used to place buy and sell orders in the stock market. Linked to your Demat account and bank account."
        }
    },
];


function Learn() {
  const navigate = useNavigate();

  // No longer needed if we remove the proceed button
  // const handleProceed = () => { navigate("/dashboard"); };

  return (
    <div className="container">
      <BackButton /> {/* Add Back Button */}
      <div className="page-header">
        <h1>Learn About Investing</h1>
        <p>Understand the basics of different investment types and common financial terms.</p>
      </div>

      <h2>Investment Instruments</h2>
      {investmentInstruments.map((inst, index) => (
        <AccordionItem key={`inst-${index}`} title={inst.name}>
          {Object.entries(inst.details).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--brand-primary)', marginBottom: '0.3rem' }}>{key}</h4>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{value}</p>
            </div>
          ))}
        </AccordionItem>
      ))}

      <h2 style={{marginTop: '3rem'}}>General Investing Terms</h2>
       {generalTerms.map((term, index) => (
        <AccordionItem key={`term-${index}`} title={term.name}>
           {Object.entries(term.details).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--brand-primary)', marginBottom: '0.3rem' }}>{key}</h4>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{value}</p>
            </div>
          ))}
        </AccordionItem>
      ))}
      
      {/* Optional: Remove proceed button if navigation is clear */}
      {/* <button onClick={handleProceed} style={{ marginTop: "2rem" }}>
        Go to Dashboard
      </button> */}
    </div>
  );
}

export default Learn;