# backend/routes/stocks.py
import pandas as pd
import yfinance as yf
import requests
import asyncio
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Query
from utils.fetch_data import fetch_stock_data
from utils.calculate import calculate_future_value

router = APIRouter()

# --- CONFIGURATION ---
# A basket of popular stocks to scan for "Top Movers" (Simulating a market scan)
POPULAR_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "TATAMOTORS.NS", "SBIN.NS", "BAJFINANCE.NS", "ITC.NS", "WIPRO.NS",
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "NFLX"
]

# Major Indices to track - EXPANDED LIST
INDICES = {
    "^NSEI": "Nifty 50",
    "^BSESN": "Sensex",
    "^GSPC": "S&P 500",
    "^IXIC": "Nasdaq 100",   # Added Tech
    "BTC-USD": "Bitcoin",
    "ETH-USD": "Ethereum",   # Added Crypto
    "GC=F": "Gold",
    "CL=F": "Crude Oil",     # Added Commodities
    "INR=X": "USD/INR"       # Added Currency
}

# --- ROUTES ---

@router.get("/search")
async def search_symbols(query: str = Query(..., min_length=1, description="Search query for stock symbols")):
    """
    Searches for stock symbols matching the query using Yahoo Finance's API.
    """
    if not query:
        return []

    url = f"https://query1.finance.yahoo.com/v1/finance/search?q={query}"
    headers = {'User-Agent': 'Mozilla/5.0'}

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        results = data.get("quotes", [])

        suggestions = []
        for result in results:
            symbol = result.get("symbol")
            name = result.get("longname") or result.get("shortname")
            quote_type = result.get("quoteType")

            # Filter to ensure we only get Stocks or ETFs
            if symbol and name and (quote_type == "EQUITY" or quote_type == "ETF"):
                suggestions.append({
                    "symbol": symbol,
                    "name": name
                })

        return suggestions[:7]

    except Exception as e:
        print(f"Error searching stocks: {e}")
        return []


@router.get("/price")
async def get_stock_price(symbol: str = Query(..., description="Stock symbol")):
    """
    Fetches the latest stock data for a given symbol, including financials.
    """
    try:
        data = fetch_stock_data(symbol)

        if data.get("error"):
            raise HTTPException(status_code=404, detail=data["error"])

        # We return the full data object as the frontend expects all fields (PE, Beta, etc.)
        return data

    except HTTPException as http_e:
        raise http_e
    except Exception as e:
        print(f"Error in get_stock_price for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred.")


@router.get("/market-summary")
async def get_market_summary():
    """
    Fetches live data for major global indices.
    """
    try:
        tickers = list(INDICES.keys())
        # Fetch all indices in parallel using threads
        data = await asyncio.to_thread(yf.download, tickers, period="1d", group_by='ticker', progress=False, threads=True)
        
        summary = []
        for ticker, name in INDICES.items():
            try:
                # Handle yfinance multi-index structure
                if ticker in data.columns.levels[0]:
                    df = data[ticker]
                else:
                    continue 
                
                if not df.empty and 'Close' in df.columns:
                    close = float(df['Close'].iloc[-1])
                    # Use Open as fallback for prev_close if needed
                    prev_close = float(df['Open'].iloc[-1])
                    if pd.isna(prev_close): prev_close = close
                    
                    if pd.notna(close) and pd.notna(prev_close) and prev_close != 0:
                        change = ((close - prev_close) / prev_close) * 100
                        summary.append({
                            "symbol": ticker,
                            "name": name,
                            "price": close,
                            "change_percent": change
                        })
            except Exception:
                continue
                
        return summary
    except Exception as e:
        print(f"Market summary error: {e}")
        return []


@router.get("/top-movers")
async def get_top_movers():
    """
    Scans popular tickers to find top gainers and losers of the day.
    """
    try:
        data = await asyncio.to_thread(yf.download, POPULAR_TICKERS, period="1d", group_by='ticker', progress=False, threads=True)
        
        movers = []
        for symbol in POPULAR_TICKERS:
            try:
                if symbol in data.columns.levels[0]:
                    df = data[symbol]
                    if not df.empty and 'Close' in df.columns and 'Open' in df.columns:
                        close = float(df['Close'].iloc[-1])
                        open_price = float(df['Open'].iloc[-1])
                        
                        if pd.notna(close) and pd.notna(open_price) and open_price != 0:
                            change = ((close - open_price) / open_price) * 100
                            movers.append({
                                "symbol": symbol,
                                "price": close,
                                "change": change
                            })
            except: continue
            
        # Sort by change %
        movers.sort(key=lambda x: x["change"], reverse=True)
        
        return {
            "gainers": movers[:3], # Top 3
            "losers": movers[-3:]  # Bottom 3
        }
    except Exception as e:
        print(f"Top movers error: {e}")
        return {"gainers": [], "losers": []}


@router.get("/projection")
async def projection(
    amount: float = Query(..., description="Investment amount"),
    years: int = Query(..., description="Number of years"),
    cagr: float = Query(12.0, description="Expected CAGR in %")
):
    """
    Calculates the future value of an investment based on CAGR.
    """
    try:
        future_value = calculate_future_value(amount, years, cagr)
        return {
            "amount": amount,
            "years": years,
            "cagr": cagr,
            "future_value": future_value
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/history/{symbol}")
async def get_stock_history(symbol: str, period: str = "1y"):
    """
    Fetches historical stock data in OHLC format for Candlestick charts.
    """
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)

        if hist.empty:
            # Fallback: Try with .NS suffix for Indian stocks
            if not symbol.upper().endswith(".NS") and not symbol.upper().endswith(".BO"):
                 ticker = yf.Ticker(f"{symbol}.NS")
                 hist = ticker.history(period=period)

        if hist.empty:
             raise HTTPException(status_code=404, detail=f"No historical data found for {symbol}.")

        hist.reset_index(inplace=True)

        # Format specifically for Lightweight Charts (time, open, high, low, close)
        records = []
        for index, row in hist.iterrows():
            records.append({
                "time": row['Date'].strftime('%Y-%m-%d'),
                "open": row['Open'],
                "high": row['High'],
                "low": row['Low'],
                "close": row['Close']
            })
        
        return records

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"Unexpected error fetching history for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve historical data.")


@router.get("/backtest")
async def run_backtest(symbol: str, years: int = 5, amount: float = 100000):
    """
    Time Machine Feature: Calculates past performance of an investment.
    """
    try:
        ticker = yf.Ticker(symbol)
        # Fetch history slightly longer than needed to be safe
        start_date = (datetime.now() - timedelta(days=years*365 + 30)).strftime('%Y-%m-%d')
        hist = ticker.history(start=start_date)
        
        if hist.empty:
             if not symbol.endswith(".NS"):
                 ticker = yf.Ticker(f"{symbol}.NS")
                 hist = ticker.history(start=start_date)
        
        if hist.empty or len(hist) < 2:
            raise HTTPException(status_code=404, detail="Not enough historical data for this stock.")

        buy_price = hist['Close'].iloc[0]
        current_price = hist['Close'].iloc[-1]
        
        quantity = amount / buy_price
        final_value = quantity * current_price
        total_return = ((final_value - amount) / amount) * 100
        # Simple CAGR calculation
        cagr = ((final_value / amount) ** (1/years) - 1) * 100

        # Comparison: Fixed Deposit (~6% avg) & Gold (~10% avg)
        fd_value = amount * ((1 + 0.06) ** years)
        gold_value = amount * ((1 + 0.10) ** years)

        return {
            "symbol": symbol.upper(),
            "years": years,
            "initial_investment": amount,
            "final_value": round(final_value, 2),
            "total_return_percent": round(total_return, 2),
            "cagr": round(cagr, 2),
            "buy_price": round(buy_price, 2),
            "current_price": round(current_price, 2),
            "comparisons": {
                "fixed_deposit": round(fd_value, 2),
                "gold": round(gold_value, 2)
            }
        }
    except Exception as e:
        print(f"Backtest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))