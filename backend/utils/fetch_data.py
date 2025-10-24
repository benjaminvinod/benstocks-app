import yfinance as yf
import time

# --- Caching Setup ---
stock_data_cache = {}
CACHE_DURATION_SECONDS = 900  

def fetch_stock_data(symbol: str):
    """
    Fetches stock data for a given symbol, using a cache to improve performance.
    """
    current_time = time.time()
    
    if symbol in stock_data_cache:
        cached_data, timestamp = stock_data_cache[symbol]
        if current_time - timestamp < CACHE_DURATION_SECONDS:
            print(f"CACHE HIT: Returning cached data for {symbol}")
            return cached_data

    print(f"CACHE MISS: Fetching new data for {symbol} from yfinance")
    try:
        stock = yf.Ticker(symbol)
        history = stock.history(period="2d")

        if history.empty:
            return {"error": f"No data found for symbol '{symbol}'. It may be an invalid ticker."}

        latest_data = history.iloc[-1]
        info = stock.info

        # --- THIS IS THE CURRENCY FIX ---
        currency = "INR" if symbol.upper().endswith((".NS", ".BO")) else info.get("currency", "USD")

        data = {
            "symbol": symbol.upper(),
            "name": info.get("longName", "N/A"),
            "open": round(latest_data["Open"], 2),
            "high": round(latest_data["High"], 2),
            "low": round(latest_data["Low"], 2),
            "close": round(latest_data["Close"], 2),
            "currency": currency, # Use our fixed currency
        }

        stock_data_cache[symbol] = (data, current_time)
        return data

    except Exception as e:
        print(f"An error occurred while fetching data for {symbol}: {e}")
        return {"error": "Failed to retrieve data from the financial API. It might be temporarily unavailable."}