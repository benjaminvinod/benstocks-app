import yfinance as yf
import time
import pandas as pd # Make sure pandas is imported

# --- Caching Setup ---
stock_data_cache = {}
CACHE_DURATION_SECONDS = 900  

def fetch_stock_data(symbol: str):
    """
    Fetches stock data for a given symbol, using a cache to improve performance.
    Includes key financial metrics.
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
        
        # Basic Info and History
        history = stock.history(period="2d")
        if history.empty:
            return {"error": f"No historical data found for symbol '{symbol}'. It may be an invalid ticker."}
        latest_data = history.iloc[-1]
        info = stock.info

        # --- START: ADDED FINANCIAL DATA FETCHING ---
        revenue = None
        net_income = None
        total_debt = None
        free_cash_flow = None

        try:
            financials = stock.financials
            if not financials.empty and isinstance(financials, pd.DataFrame):
                # Ensure we handle cases where columns might be missing or are not numeric
                latest_year_financials = financials.iloc[:, 0]
                revenue = latest_year_financials.get("Total Revenue")
                net_income = latest_year_financials.get("Net Income")
        except Exception as e:
            print(f"Warning: Could not fetch financials for {symbol}: {e}")

        try:
            balance_sheet = stock.balance_sheet
            if not balance_sheet.empty and isinstance(balance_sheet, pd.DataFrame):
                latest_year_bs = balance_sheet.iloc[:, 0]
                total_debt = latest_year_bs.get("Total Debt")
        except Exception as e:
            print(f"Warning: Could not fetch balance sheet for {symbol}: {e}")

        try:
            cashflow = stock.cashflow
            if not cashflow.empty and isinstance(cashflow, pd.DataFrame):
                latest_year_cashflow = cashflow.iloc[:, 0]
                # Try multiple possible keys for Free Cash Flow
                free_cash_flow = latest_year_cashflow.get("Free Cash Flow") or \
                                 latest_year_cashflow.get("Repurchase Of Capital Stock") # Approximation if direct key missing
        except Exception as e:
            print(f"Warning: Could not fetch cashflow for {symbol}: {e}")
        # --- END: ADDED FINANCIAL DATA FETCHING ---
        
        # ESG Data
        esg_score = None
        esg_percentile = None
        try:
            sustainability_df = stock.sustainability
            if sustainability_df is not None and not sustainability_df.empty and isinstance(sustainability_df, pd.DataFrame):
                # Check for column existence before accessing
                if 'totalEsg' in sustainability_df.columns:
                    esg_value = sustainability_df['totalEsg'].iloc[0]
                    # Check if the value is not NaN before assigning
                    if pd.notna(esg_value):
                         esg_score = esg_value
                if 'percentile' in sustainability_df.columns:
                     percentile_value = sustainability_df['percentile'].iloc[0]
                     if pd.notna(percentile_value):
                         esg_percentile = percentile_value
        except Exception as e:
             print(f"Warning: Could not fetch sustainability data for {symbol}: {e}")


        currency = "INR" if symbol.upper().endswith((".NS", ".BO")) else info.get("currency", "USD")
        live_price = info.get("currentPrice") or info.get("regularMarketPrice") or latest_data["Close"]
        
        # Helper to safely convert to float or return None
        def safe_float(value):
             try:
                 return float(value) if pd.notna(value) else None
             except (ValueError, TypeError):
                 return None

        data = {
            "symbol": symbol.upper(),
            "name": info.get("longName", "N/A"),
            "open": safe_float(latest_data["Open"]),
            "high": safe_float(latest_data["High"]),
            "low": safe_float(latest_data["Low"]),
            "close": safe_float(live_price),
            "currency": currency,
            
            "market_cap": safe_float(info.get("marketCap")),
            "pe_ratio": safe_float(info.get("trailingPE")),
            "dividend_yield": safe_float(info.get("dividendYield")),
            "week_52_high": safe_float(info.get("fiftyTwoWeekHigh")),
            "week_52_low": safe_float(info.get("fiftyTwoWeekLow")),

            "recommendation": info.get("recommendationKey"),
            "number_of_analysts": info.get("numberOfAnalystOpinions"), # Already integer or None
            "target_price": safe_float(info.get("targetMeanPrice")),

            "beta": safe_float(info.get("beta")),
            "sharpe_ratio": safe_float(info.get("annualReportExpenseRatio")), # Proxy
            "esg_score": safe_float(esg_score),
            "esg_percentile": safe_float(esg_percentile),
            
            # --- START: ADDED FINANCIAL METRICS TO RESPONSE ---
            "revenue": safe_float(revenue),
            "net_income": safe_float(net_income),
            "total_debt": safe_float(total_debt),
            "free_cash_flow": safe_float(free_cash_flow),
            # --- END: ADDED FINANCIAL METRICS TO RESPONSE ---
        }

        # Clean up None values if necessary before caching, or handle Nones on frontend
        # data = {k: v for k, v in data.items() if v is not None} # Optional: remove None values entirely

        stock_data_cache[symbol] = (data, current_time)
        return data

    except Exception as e:
        print(f"An error occurred while fetching data for {symbol}: {e}")
        # Add more specific error handling if needed
        if "No data found" in str(e): # Check if yfinance raised a specific error
            return {"error": f"No data found for symbol '{symbol}'. It may be an invalid ticker."}
        return {"error": "Failed to retrieve data from the financial API. It might be temporarily unavailable or the ticker is invalid."}