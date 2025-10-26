# BenStocks - A Full-Stack Stock Market Simulator 🚀

BenStocks is a realistic, full-stack stock market simulation platform designed for educational purposes. It provides a risk-free environment where users can learn about investing, practice trading strategies, and compete with others using simulated currency. The application fetches near real-time stock data and financial news to create an immersive learning experience.

✨ Features & Technology Stack

The platform is rich with features, including secure user authentication, simulated trading of U.S. and Indian stocks, ETFs, and Mutual Funds, and a dynamic dashboard showing live portfolio value with real-time Profit & Loss (P&L) calculations.

Users can manage a personal watchlist, view a complete transaction history, and benefit from real-time price updates via WebSockets. It also offers in-depth stock details with interactive historical charts, a smart search bar to find companies, and an AI-powered financial news feed with sentiment analysis.

To enhance user engagement, the platform includes a competitive leaderboard, achievement badges for trading milestones, a comprehensive learning center, and a handy financial glossary. For administrative purposes, a dividend simulation tool is also available.

The project is built with a modern, asynchronous-first technology stack. **The backend** is powered by Python's **FastAPI** framework, using **MongoDB** as the database with the asynchronous **Motor** driver. Real-time communication is handled by **WebSockets**, financial data is sourced via the `yfinance` library, news is fetched from the NewsData.io API, and user authentication is secured with Passlib & Bcrypt. It also incorporates the `transformers` library from Hugging Face for sentiment analysis and runs on a **Uvicorn** server. **The frontend** is a **React.js** application, utilizing **React Router** for navigation and the **React Context API** for state management. The user interface is built with the **Chakra UI** component library, with **Axios** handling HTTP requests. Data visualization is powered by **Chart.js**, and user feedback is provided through **React Toastify**.

🏁 Getting Started & Setup Instructions

To get the project running locally, first ensure you have Python 3.8+, Node.js with npm, and a MongoDB instance (local or a free Atlas account).

Start by cloning the repository using `git clone <your-repository-url>` and then navigate into the created directory with `cd BenStocks`.

Next, set up the **backend**. Navigate into the backend directory with `cd backend`, install all the required Python packages by running `pip install -r requirements.txt`. After installation, you must create a `.env` file in the `backend` directory.

This file should contain your `MONGO_URI="your_mongodb_connection_string"` and your `NEWSDATA_API_KEY="your_newsdata.io_api_key"`. With the environment configured, you can start the backend server by running `uvicorn app:app --reload`. The API will then be live at `http://127.0.0.1:8000`.

With the backend running, set up the **frontend**. From the project's root `BenStocks` directory, install the necessary JavaScript dependencies by running `npm install`. After the installation is complete, start the React development server with the command `npm start`. This will automatically open the application in your browser at `http://localhost:3000`. You can now register an account and begin using the BenStocks simulator.