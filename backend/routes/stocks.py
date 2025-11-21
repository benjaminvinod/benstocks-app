# backend/routes/stocks.py
import pandas as pd
import yfinance as yf
import requests
import asyncio

from fastapi import APIRouter, HTTPException, Query
from utils.fetch_data import fetch_stock_data
from utils.calculate import calculate_future_value

router = APIRouter()

# --- CONFIGURATION ---
# Basket of popular stocks to scan for "Top Movers"
POPULAR_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "TATAMOTORS.NS", "SBIN.NS", "BAJFINANCE.NS", "ITC.NS", "WIPRO.NS",
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "NFLX"
]

# Major Indices for the Ticker Tape
INDICES = {
    "^NSEI": "Nifty 50",
    "^BSESN": "Sensex",
    "^GSPC": "S&P 500",
    "BTC-USD": "Bitcoin",
    "GC=F": "Gold"
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
    Fetches the latest stock data for a given symbol.
    """
    try:
        data = fetch_stock_data(symbol)
        if data.get("error"):
            raise HTTPException(status_code=404, detail=data["error"])
        return data
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/market-summary")
async def get_market_summary():
    """
    Fetches live data for major global indices (Nifty, Sensex, BTC, Gold).
    Used for the dashboard Ticker Tape.
    """
    try:
        tickers = list(INDICES.keys())
        # Fetch all indices in parallel
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
                    
                    if pd.notna(close) and pd.notna(prev_close) and prev_close != 0:
                        change = ((close - prev_close) / prev_close) * 100
                        
                        summary.append({
                            "symbol": ticker,
                            "name": name,
                            "price": close,
                            "change_percent": change
                        })
            except Exception as inner_e:
                print(f"Error parsing index {ticker}: {inner_e}")
                continue
                
        return summary
    except Exception as e:
        print(f"Market summary error: {e}")
        return []


@router.get("/top-movers")
async def get_top_movers():
    """
    Scans the POPULAR_TICKERS list to find today's Top Gainers and Losers.
    """
    try:
        # Bulk fetch data for all popular tickers
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
            except:
                continue
            
        # Sort by change percentage
        movers.sort(key=lambda x: x["change"], reverse=True)
        
        return {
            "gainers": movers[:3], # Top 3 Winners
            "losers": movers[-3:]  # Bottom 3 Losers
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
    Calculates the future value of an investment.
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
    Fetches historical stock data for charts.
    """
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        
        if hist.empty:
             # Fallback: Try adding .NS suffix if missing
             if not symbol.upper().endswith(".NS") and not symbol.upper().endswith(".BO"):
                 ticker = yf.Ticker(f"{symbol}.NS")
                 hist = ticker.history(period=period)
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="No historical data found")
        
        hist.reset_index(inplace=True)
        
        records = []
        for index, row in hist.iterrows():
            records.append({
                "Date": row['Date'].isoformat(),
                "Close": row['Close']
            })
        return records

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"History error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")