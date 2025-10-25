// src/pages/Learn.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';

// Reusable Accordion Component (Remains the same)
function AccordionItem({ title, children, startOpen = false }) { // Added startOpen prop
    const [isOpen, setIsOpen] = useState(startOpen);

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
        backgroundColor: 'var(--bg-dark-secondary)',
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

// --- START: NEW AND EXPANDED DATA STRUCTURE ---
const learnContent = [
    {
        sectionTitle: "📘 1. Introduction to Investing",
        topics: [
            {
                title: "What is investing?",
                content: "Investing is the act of allocating resources, usually money, with the expectation of generating an income or profit in the future. Unlike spending, where money is used for immediate consumption, investing aims to grow your money over time.",
            },
            {
                title: "Difference between saving and investing",
                content: "Saving typically involves putting money aside in a safe place (like a bank account) for short-term goals or emergencies. It prioritizes safety and easy access, but usually offers very low returns. Investing involves taking on some risk with the goal of achieving higher returns over the long term. It's geared towards goals like retirement or building wealth.",
            },
            {
                title: "Why people invest — inflation, wealth creation, goals",
                content: "People invest for several key reasons: 1. Beat Inflation: Inflation erodes the purchasing power of your money over time. Investing aims to generate returns higher than inflation, preserving and growing your wealth. 2. Wealth Creation: Investing allows your money to work for you through compounding, potentially growing significantly over the long run. 3. Achieve Financial Goals: Investing helps reach major goals like buying a house, funding education, or ensuring a comfortable retirement.",
            },
            {
                title: "Common myths and fears about investing",
                content: "Myth: You need a lot of money to start. Reality: You can start with small amounts through SIPs or fractional shares. Myth: Investing is like gambling. Reality: While risk exists, informed investing based on research is very different from gambling. Myth: It's too complicated. Reality: Basic concepts are understandable, and tools like ETFs simplify diversification. Fear: Losing money. Reality: Risk is inherent, but diversification and long-term thinking mitigate it.",
            },
        ],
    },
    {
        sectionTitle: "💹 2. Understanding Financial Markets",
        topics: [
            {
                title: "What are financial markets?",
                content: "Financial markets are marketplaces where buyers and sellers trade financial assets like stocks, bonds, currencies, and commodities. They facilitate the flow of capital from those who have it (investors) to those who need it (companies, governments).",
            },
            {
                title: "Types of markets",
                content: "Stock Market (Equity): Where shares of publicly traded companies are bought and sold. Bond Market (Debt): Where debt securities issued by governments and corporations are traded. Commodity Market: Where raw materials like gold, oil, and agricultural products are traded. Derivatives Market: Where financial contracts deriving their value from underlying assets are traded (e.g., futures, options - more complex). Forex Market: Where currencies are traded.",
            },
            {
                title: "Role of stock exchanges (NSE, BSE, NASDAQ, NYSE, etc.)",
                content: "Stock exchanges are organized and regulated marketplaces that provide the infrastructure for trading stocks. They ensure fair and orderly trading, set listing requirements for companies, and provide price transparency. Examples include the National Stock Exchange (NSE) and Bombay Stock Exchange (BSE) in India, and the NASDAQ and New York Stock Exchange (NYSE) in the US.",
            },
        ],
    },
    {
        sectionTitle: "🧾 3. Investment Instruments",
        topics: [
            {
                title: "Stocks (Equities)",
                content: "Represent ownership in a company. Offer potential for high growth (capital appreciation) and income (dividends). Risker than bonds as value fluctuates with company performance and market sentiment. (See Section 1 for more details).",
            },
            {
                title: "Mutual Funds (MFs)",
                content: "Pool money from many investors to buy a diversified portfolio. Actively managed by a fund manager aiming to beat the market (higher fees). NAV calculated once daily. Good for beginners seeking diversification and professional management. SIP (Systematic Investment Plan) is a popular way to invest fixed amounts regularly.",
            },
            {
                title: "ETFs (Exchange-Traded Funds)",
                content: "Similar to MFs but trade like stocks on an exchange throughout the day. Mostly passively managed, tracking an index (e.g., Nifty 50). Typically have lower fees than active MFs. Offer diversification and flexibility.",
            },
            {
                title: "Bonds",
                content: "Loans to governments or corporations paying fixed interest. Generally safer than stocks, providing income and stability. Prices move inversely to interest rates. Government bonds (G-Secs) are very safe; corporate bonds carry credit risk.",
            },
            {
                title: "Gold (Commodity)",
                content: "Often seen as a 'safe haven' asset during economic uncertainty. Can be invested in physically, through Gold ETFs, or Sovereign Gold Bonds (SGBs) which offer interest.",
            },
            {
                title: "REITs (Real Estate Investment Trusts)",
                content: "Companies that own or finance income-producing real estate. Allow investors to invest in large-scale properties without buying them directly. Trade like stocks and offer income through dividends (from rental income).",
            },
        ],
    },
     {
        sectionTitle: "⚙️ 4. How Investing Works",
        topics: [
            {
                title: "How to buy/sell (Demat & Trading Account, Brokers)",
                content: "To invest in stocks or ETFs, you need: 1. Demat Account: Holds your securities electronically. 2. Trading Account: Used to place buy/sell orders. 3. Broker: An intermediary (like Zerodha, Groww, Upstox in India; Robinhood, Charles Schwab in US) that provides the platform, executes trades, and connects to the exchange. You link your bank account to fund trades.",
            },
            {
                title: "Order types: Market, Limit, Stop-Loss",
                content: "Market Order: Buy/sell immediately at the best available price (guarantees execution, not price). Limit Order: Buy/sell only at your specified price or better (guarantees price if executed, not execution). Stop-Loss Order: An order to sell a stock if its price falls to a certain level, used to limit potential losses.",
            },
            {
                title: "Role of SEBI (India) and regulations",
                content: "Market regulators like the Securities and Exchange Board of India (SEBI) oversee the markets to protect investors, prevent fraud, ensure fair practices, and promote market development. They set rules for brokers, exchanges, and listed companies.",
            },
            {
                title: "How stock prices move",
                content: "Primarily driven by supply and demand, influenced by: Company earnings & future prospects, Economic news (interest rates, GDP growth), Industry trends, Investor sentiment (news, rumors, psychology), and sometimes, unexpected global events.",
            },
        ],
    },
    {
        sectionTitle: "🧠 5. Investment Strategies",
        topics: [
            {
                title: "Short-term vs Long-term Investing",
                content: "Short-term (Trading): Holding investments for days, weeks, or months, trying to profit from price fluctuations. Higher risk, requires more time and skill. Long-term Investing: Holding investments for years or decades, focusing on company growth and compounding. Generally less risky and suitable for wealth building.",
            },
            {
                title: "Diversification & Asset Allocation",
                content: "Diversification: Spreading investments across different asset classes (stocks, bonds), sectors (IT, Pharma), and geographies to reduce risk. Asset Allocation: Deciding the proportion of your portfolio in each asset class based on your goals, risk tolerance, and time horizon.",
            },
            {
                title: "Value vs Growth Investing",
                content: "Value Investing: Seeking stocks that appear undervalued by the market based on fundamental analysis (e.g., low P/E ratio). Growth Investing: Seeking stocks of companies expected to grow earnings at an above-average rate, even if they seem expensive now.",
            },
            {
                title: "SIP & Rupee Cost Averaging",
                content: "A Systematic Investment Plan (SIP) involves investing a fixed amount of money at regular intervals (e.g., monthly) into a mutual fund or ETF. This leads to Rupee Cost Averaging: you buy more units when prices are low and fewer units when prices are high, potentially lowering your average cost per unit over time.",
            },
            {
                title: "Power of Compounding (with example)",
                content: "Compounding is earning returns not just on your initial investment, but also on the accumulated returns from previous periods. It's like a snowball effect. Example: Investing ₹10,000 yearly at 12% return for 30 years results in ~₹24 lakhs, even though you only invested ₹3 lakhs!",
            },
        ],
    },
        {
        sectionTitle: "📊 6. Analyzing Stocks (Basics)",
        topics: [
            {
                title: "Fundamental Analysis Overview",
                content: "Focuses on a company's financial health and intrinsic value. Key aspects include: Revenue & Profit Growth: Is the company consistently making more money? Debt Levels: Does it owe too much? Profit Margins: How efficiently does it operate? Management Quality: Are the leaders competent and ethical?",
            },
            {
                title: "Key Fundamental Ratios",
                content: "EPS (Earnings Per Share): Company's profit divided by outstanding shares. Higher is generally better. P/E Ratio (Price-to-Earnings): Stock price divided by EPS. Compares valuation relative to earnings (see Section 8). ROE (Return on Equity): Net income divided by shareholder equity. Measures how effectively the company uses shareholder investments to generate profit.",
            },
            {
                title: "Technical Analysis Overview",
                content: "Focuses on chart patterns and trading statistics to predict future prices. Key concepts: Support & Resistance: Price levels where a stock tends to stop falling (support) or stop rising (resistance). Moving Averages: Smoothed-out price lines to identify trends. Volume: Number of shares traded; high volume can confirm a trend.",
            },
        ],
    },
    {
        sectionTitle: "⚖️ 7. Risk Management",
        topics: [
            {
                title: "Understanding Volatility",
                content: "Volatility measures how much an investment's price fluctuates. High volatility means large, rapid price swings (riskier). Low volatility means steadier prices (less risky). Different assets have different volatility levels (e.g., small-cap stocks vs. government bonds).",
            },
            {
                title: "Don't Invest All in One Stock",
                content: "Concentrating your investment in a single company is extremely risky. If that company fails, you could lose everything. Diversification across multiple stocks, sectors, and asset classes is crucial.",
            },
            {
                title: "Importance of Emergency Funds",
                content: "Before investing, ensure you have an emergency fund covering 3-6 months of living expenses in a safe, easily accessible place (like a savings account). This prevents you from being forced to sell investments at a loss during unexpected events (job loss, medical issue).",
            },
            {
                title: "Managing Emotional Decisions (Fear & Greed)",
                content: "Market fluctuations can trigger fear (selling during dips) or greed (buying excessively during rallies). Successful investing requires discipline to stick to your long-term plan and avoid impulsive decisions driven by emotion.",
            },
        ],
    },
        {
        sectionTitle: "💼 8. Building Your First Portfolio",
        topics: [
            {
                title: "How to Start Small",
                content: "You don't need a large sum. Start with an amount you're comfortable potentially losing. Focus on learning. Consider SIPs in diversified index funds (like Nifty 50 ETFs) as a simple starting point.",
            },
            {
                title: "Example Beginner Portfolio (Illustrative)",
                content: "This is NOT advice, just an example: 60% Diversified Equity (e.g., Nifty 50 ETF for large caps, Nifty Next 50 ETF for mid-caps), 30% Debt (e.g., Liquid ETF or short-term debt fund for stability), 10% Gold (e.g., Gold ETF or SGB for diversification). Adjust based on your age and risk tolerance.",
            },
            {
                title: "Monitoring and Rebalancing",
                content: "Monitoring: Regularly review your portfolio's performance (e.g., quarterly), but avoid checking daily prices obsessively. Rebalancing: Over time, some assets grow faster than others, shifting your allocation. Periodically (e.g., yearly) sell some winners and buy more losers to bring your portfolio back to its target asset allocation (e.g., back to 60% stocks / 40% bonds).",
            },
        ],
    },
    {
        sectionTitle: "📚 9. Resources & Tools",
        topics: [
            {
                title: "Recommended Books",
                content: "The Intelligent Investor by Benjamin Graham (Value Investing classic), Rich Dad Poor Dad by Robert Kiyosaki (Mindset), The Little Book of Common Sense Investing by John C. Bogle (Index Funds), Let's Talk Money by Monika Halan (Indian context).",
            },
            {
                title: "Free Learning Platforms",
                content: "Zerodha Varsity: Excellent, comprehensive modules on Indian markets. NSE India & BSE India websites: Official exchange resources. Investopedia: Vast online financial dictionary and tutorials. Coursera/edX: Offer finance courses from universities.",
            },
            {
                title: "Useful Apps/Websites",
                content: "Yahoo Finance / Google Finance: General market news and stock data. TradingView: Advanced charting tools. Screener.in / Tickertape: Fundamental analysis tools for Indian stocks. Broker Apps: Your broker's app (Zerodha Kite, Groww, etc.) for trading and portfolio tracking.",
            },
        ],
    },
    {
        sectionTitle: "🌱 10. Conclusion & BenStocks",
        topics: [
            {
                title: "Key Takeaways",
                content: "Investing is a marathon, not a sprint. Patience: Allow time for compounding to work. Discipline: Stick to your plan, invest regularly, and control emotions. Long-Term Thinking: Focus on your goals, not short-term market noise. Continuous Learning: The financial world evolves; keep learning.",
            },
            {
                title: "How BenStocks Helps",
                content: "BenStocks provides a safe, simulated environment to: Practice: Apply what you learn without risking real money. Experiment: Try different strategies and see how they perform. Track: Monitor your (simulated) portfolio and learn from your decisions. Build Confidence: Gain familiarity with market dynamics before investing real capital.",
            },
        ],
    },
];
// --- END: NEW AND EXPANDED DATA STRUCTURE ---

function Learn() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <BackButton />
      <div className="page-header">
        <h1>Learn About Investing</h1>
        <p>Your comprehensive guide to understanding financial markets, instruments, and strategies.</p>
      </div>

      {/* --- START: MODIFIED RENDERING LOGIC --- */}
      {/* Loop through sections */}
      {learnContent.map((section, sectionIndex) => (
        <React.Fragment key={sectionIndex}>
          <h2 style={{ marginTop: sectionIndex === 0 ? '0' : '3rem' }}>{section.sectionTitle}</h2>
          {/* Loop through topics within each section */}
          {section.topics.map((topic, topicIndex) => (
            <AccordionItem key={`${sectionIndex}-${topicIndex}`} title={topic.title} startOpen={sectionIndex === 0 && topicIndex === 0}>
              {/* Render content paragraphs */}
              {topic.content.split('\n').map((paragraph, pIndex) => (
                   <p key={pIndex} style={{ color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>{paragraph}</p>
              ))}
            </AccordionItem>
          ))}
        </React.Fragment>
      ))}
      {/* --- END: MODIFIED RENDERING LOGIC --- */}
    </div>
  );
}

export default Learn;