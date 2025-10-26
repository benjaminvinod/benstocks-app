# BenStocks — A Full-Stack Stock Market Simulator

*Learn. Trade. Compete. Grow.*

**BenStocks** is a full-stack **stock market simulation platform** built for learners, students, and enthusiasts who want to explore investing in a realistic, hands-on way — without the risk of losing real money.

It allows users to practice trading, analyze stocks, and track market movements using real data and simulated currency. The platform offers a live portfolio tracker, AI-powered news insights, and a friendly interface designed for financial learning and experimentation.

---

## 🧭 Overview

BenStocks bridges the gap between financial education and technology by combining live market data with modern software engineering practices.  
With its clean design, real-time updates, and interactive dashboards, it gives users the tools to understand how the markets work — step by step.

---

## ✨ Key Features

- **Simulated Trading** – Buy and sell U.S. and Indian stocks, ETFs, and mutual funds using virtual money.  
- **Secure Authentication** – Built with FastAPI, Passlib, and Bcrypt to ensure safe logins and data protection.  
- **Live Portfolio Dashboard** – Tracks portfolio value, holdings, and P&L with automatic real-time updates.  
- **Smart Watchlist** – Add and monitor your favorite companies and funds easily.  
- **Transaction History** – Review your trade activity and performance over time.  
- **Real-Time Stock Data** – Fetched via `yfinance` for near live accuracy.  
- **AI-Powered Financial News** – Pulls news from NewsData.io and analyzes sentiment with Hugging Face Transformers.  
- **Leaderboards & Achievements** – Adds a competitive edge with badges and rankings.  
- **Learning Center** – Offers guides, tutorials, and definitions to help users understand investing fundamentals.  
- **Dividend Simulation** – Visualizes how dividend payouts affect portfolio growth.  

---

## ⚙️ Technology Stack

BenStocks is built with a modern, asynchronous-first architecture, ensuring fast performance and scalability.

### **Backend (FastAPI + MongoDB)**
- **Framework:** FastAPI  
- **Database:** MongoDB with Motor (asynchronous driver)  
- **Server:** Uvicorn  
- **Key Libraries:**
  - `yfinance` – Fetches market data  
  - `transformers` – Sentiment analysis  
  - `passlib`, `bcrypt` – Secure password handling  
  - `pydantic` – Data validation  
  - `python-dotenv` – Environment configuration  
  - `requests`, `httpx` – API calls  
  - `email-validator` – Email verification  
- **Authentication:** JWT-based with token encryption  
- **Realtime Communication:** WebSockets  

### **Frontend (React.js + Chakra UI)**
- **Framework:** React.js  
- **UI Library:** Chakra UI (with @emotion/react & framer-motion)  
- **Routing:** React Router  
- **State Management:** React Context API  
- **Data Fetching:** Axios  
- **Charts:** Chart.js  
- **Notifications:** React Toastify  
- **Animations:** Framer Motion  

---


---

## 🚀 Getting Started

Follow these steps to run **BenStocks** locally.

### **1. Prerequisites**

Ensure the following are installed:
- Python 3.8 or newer  
- Node.js + npm (v22+ recommended)  
- MongoDB (either local or [MongoDB Atlas](https://www.mongodb.com/atlas/database))  

---

## 🐍 Backend Setup

1. Navigate to the backend directory:
    cd backend

2. Install dependencies:
    pip install -r requirements.txt

3. Create a .env file in the backend directory and add:
    MONGO_URI="your_mongodb_connection_string"
    NEWSDATA_API_KEY="your_newsdata_api_key"

4. Start the backend server:
    uvicorn app:app --reload

The backend will now run at http://127.0.0.1:8000

---

⚛️ Frontend Setup

1. Navigate to the frontend directory:
    cd ../frontend

2. Install the required npm packages:
    npm install

3. Start the React development server:
    npm start

The app will launch automatically at http://localhost:3000

---

## 🧠 Learning Center

The built-in **Learning Center** provides educational content designed to help users understand financial concepts in a simple and structured way.

### Topics Covered:
- **Investment Basics** – Understand how markets work, the role of companies, and why stock prices move.  
- **Stock Market Terms** – Learn essential concepts like IPOs, indices, P/E ratios, market cap, and more.  
- **ETFs and Mutual Funds** – Explore how these pooled investment vehicles work, and how they differ.  
- **Risk Management and Diversification** – Discover how to balance risk and returns through asset allocation.  
- **Dividends and Compounding** – Visualize how reinvesting earnings can accelerate long-term growth.  

This section aims to make finance approachable for **beginners**, while offering valuable insights for **intermediate learners** looking to strengthen their fundamentals.
