import yfinance as yf
import time
import pandas as pd

# --- Caching Setup ---
stock_data_cache = {}
CACHE_DURATION_SECONDS = 900  # Cache for 15 minutes

def fetch_stock_data(symbol: str):
    """
    Fetches stock data for a given symbol, using a cache to improve performance.
    Includes key financial metrics and advanced analytics with more robust error handling.
    """
    current_time = time.time()
    # Always use the uppercase version of the symbol for consistency
    upper_symbol = symbol.upper()

    if upper_symbol in stock_data_cache:
        cached_data, timestamp = stock_data_cache[upper_symbol]
        if current_time - timestamp < CACHE_DURATION_SECONDS:
            print(f"CACHE HIT: Returning cached data for {upper_symbol}")
            return cached_data

    print(f"CACHE MISS: Fetching new data for {upper_symbol} from yfinance")
    try:
        # Pass the uppercase symbol directly to yfinance
        stock = yf.Ticker(upper_symbol)
        
        # .info can be slow, but it's the main way to get snapshot data
        info = stock.info

        # --- START: MODIFIED CODE (More Robust Ticker Validation) ---
        # A more reliable way to check if the ticker is valid is to see if essential
        # pricing data or market cap exists.
        if not info or info.get('marketCap') is None and info.get('regularMarketPrice') is None:
            return {"error": f"No data found for symbol '{upper_symbol}'. It may be an invalid ticker."}
        # --- END: MODIFIED CODE ---

        history = stock.history(period="2d")
        if history.empty: # Fallback check
             return {"error": f"No historical data for '{upper_symbol}'. It may be delisted."}
        latest_data = history.iloc[-1]

        # --- Financial Data ---
        revenue, net_income, total_debt, free_cash_flow = None, None, None, None
        try:
            financials = stock.financials
            if not financials.empty:
                latest_year_financials = financials.iloc[:, 0]
                revenue = latest_year_financials.get("Total Revenue")
                net_income = latest_year_financials.get("Net Income")
        except Exception as e:
            print(f"Could not fetch financials for {upper_symbol}: {e}")
        try:
            balance_sheet = stock.balance_sheet
            if not balance_sheet.empty:
                total_debt = balance_sheet.iloc[:, 0].get("Total Debt")
        except Exception as e:
            print(f"Could not fetch balance sheet for {upper_symbol}: {e}")
        try:
            cashflow = stock.cashflow
            if not cashflow.empty:
                free_cash_flow = cashflow.iloc[:, 0].get("Free Cash Flow")
        except Exception as e:
            print(f"Could not fetch cashflow for {upper_symbol}: {e}")
        
        # --- START: MODIFIED CODE (More Robust ESG Fetching) ---
        # ESG data is often unavailable. This code handles that case gracefully.
        esg_score, esg_percentile = None, None
        try:
            # .sustainability can return None or an empty DataFrame
            sustainability_df = stock.sustainability
            if sustainability_df is not None and not sustainability_df.empty:
                # Check if the required columns exist before accessing them
                if 'totalEsg' in sustainability_df.columns:
                    esg_score = sustainability_df['totalEsg'].iloc[0]
                if 'percentile' in sustainability_df.columns:
                    esg_percentile = sustainability_df['percentile'].iloc[0]
        except Exception as e:
            print(f"Could not fetch ESG data for {upper_symbol}: {e}")
        # --- END: MODIFIED CODE ---

        currency = "INR" if upper_symbol.endswith((".NS", ".BO")) else info.get("currency", "USD")
        live_price = info.get("currentPrice") or info.get("regularMarketPrice") or latest_data["Close"]
        
        def safe_float(value):
             try:
                 return float(value) if pd.notna(value) else None
             except (ValueError, TypeError):
                 return None

        data = {
            "symbol": upper_symbol, "name": info.get("longName", "N/A"),
            "open": safe_float(latest_data["Open"]), "high": safe_float(latest_data["High"]),
            "low": safe_float(latest_data["Low"]), "close": safe_float(live_price),
            "currency": currency,
            
            "market_cap": safe_float(info.get("marketCap")),
            "pe_ratio": safe_float(info.get("trailingPE")),
            "dividend_yield": safe_float(info.get("dividendYield")),
            "week_52_high": safe_float(info.get("fiftyTwoWeekHigh")),
            "week_52_low": safe_float(info.get("fiftyTwoWeekLow")),

            "recommendation": info.get("recommendationKey"),
            "number_of_analysts": info.get("numberOfAnalystOpinions"),
            "target_price": safe_float(info.get("targetMeanPrice")),

            "beta": safe_float(info.get("beta")),
            # Note: Sharpe Ratio is not provided by yfinance. 'threeYearAverageReturn' is a very rough proxy for performance.
            "sharpe_ratio": safe_float(info.get("threeYearAverageReturn")),
            "esg_score": safe_float(esg_score),
            "esg_percentile": safe_float(esg_percentile),
            
            "revenue": safe_float(revenue),
            "net_income": safe_float(net_income),
            "total_debt": safe_float(total_debt),
            "free_cash_flow": safe_float(free_cash_flow),
        }

        stock_data_cache[upper_symbol] = (data, current_time)
        return data

    except Exception as e:
        print(f"An error occurred while fetching data for {symbol}: {e}")
        return {"error": "Failed to retrieve data. The ticker may be invalid or the data provider is temporarily unavailable."}