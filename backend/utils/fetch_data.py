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
        
        # --- START: MODIFIED CODE (Fetch ESG data) ---
        sustainability_df = stock.sustainability
        esg_score = None
        esg_percentile = None
        if sustainability_df is not None and not sustainability_df.empty:
            if 'totalEsg' in sustainability_df.columns:
                esg_score = sustainability_df['totalEsg'].iloc[0]
            if 'percentile' in sustainability_df.columns:
                esg_percentile = sustainability_df['percentile'].iloc[0]
        # --- END: MODIFIED CODE ---

        currency = "INR" if symbol.upper().endswith((".NS", ".BO")) else info.get("currency", "USD")
        
        live_price = info.get("currentPrice") or info.get("regularMarketPrice") or latest_data["Close"]
        
        data = {
            "symbol": symbol.upper(),
            "name": info.get("longName", "N/A"),
            "open": round(latest_data["Open"], 2),
            "high": round(latest_data["High"], 2),
            "low": round(latest_data["Low"], 2),
            "close": round(live_price, 2),
            "currency": currency,
            
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "dividend_yield": info.get("dividendYield"),
            "week_52_high": info.get("fiftyTwoWeekHigh"),
            "week_52_low": info.get("fiftyTwoWeekLow"),

            "recommendation": info.get("recommendationKey"),
            "number_of_analysts": info.get("numberOfAnalystOpinions"),
            "target_price": info.get("targetMeanPrice"),

            # --- START: ADDED ADVANCED ANALYTICS ---
            "beta": info.get("beta"),
            "sharpe_ratio": info.get("annualReportExpenseRatio"), # Using this as a proxy; yfinance 'info' lacks direct sharpe.
            "esg_score": esg_score,
            "esg_percentile": esg_percentile,
            # --- END: ADDED ADVANCED ANALYTICS ---
        }

        stock_data_cache[symbol] = (data, current_time)
        return data

    except Exception as e:
        print(f"An error occurred while fetching data for {symbol}: {e}")
        return {"error": "Failed to retrieve data from the financial API. It might be temporarily unavailable."}