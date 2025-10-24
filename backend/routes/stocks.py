import pandas as pd 
import yfinance as yf

from fastapi import APIRouter, HTTPException, Query
from utils.fetch_data import fetch_stock_data
from utils.calculate import calculate_future_value

router = APIRouter()

@router.get("/price")
async def get_stock_price(symbol: str = Query(..., description="Stock symbol")):
    """
    Fetches the latest stock data for a given symbol.
    """
    try:
        data = fetch_stock_data(symbol)
        
        # Check if the fetch_data function returned an error
        if data.get("error"):
            raise HTTPException(status_code=404, detail=data["error"])

        # This mapping now includes all the new fields from our updated fetch_data function
        stock_data = {
            "symbol": data.get("symbol"),
            "name": data.get("name"),
            "open": data.get("open"),
            "high": data.get("high"),
            "low": data.get("low"),
            "close": data.get("close"),
            "currency": data.get("currency"),

            # --- NEW FIELDS ---
            "market_cap": data.get("market_cap"),
            "pe_ratio": data.get("pe_ratio"),
            "dividend_yield": data.get("dividend_yield"),
            "week_52_high": data.get("week_52_high"),
            "week_52_low": data.get("week_52_low"),
        }

        # Check if any crucial values are missing after mapping
        if not all([
            stock_data["open"], 
            stock_data["high"], 
            stock_data["low"], 
            stock_data["close"]
        ]):
            raise HTTPException(
                status_code=500, 
                detail="Incomplete data from financial API. Please try again."
            )
            
        return stock_data

    except HTTPException as http_e:
        # Re-raise HTTPException (like 404s) directly
        raise http_e
    except Exception as e:
        # Catch any other unexpected server errors
        print(f"Error in get_stock_price: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {e}")

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
    Fetches historical stock data, ensuring Date is ISO format and data is clean.
    Valid periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
    """
    valid_periods = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"]
    if period not in valid_periods:
        raise HTTPException(status_code=400, detail="Invalid period specified.")
        
    print(f"Attempting to fetch history for {symbol} ({period})") # Add logging
    try:
        ticker = yf.Ticker(symbol)
        # Increase timeout slightly, sometimes yfinance can be slow
        hist = ticker.history(period=period, timeout=20) 
        
        if hist.empty:
            print(f"Initial history fetch empty for {symbol}. Trying with .NS suffix.")
            # Try adding .NS suffix automatically if it might be an Indian stock
            if not symbol.upper().endswith((".NS", ".BO")):
                 ticker_ns = yf.Ticker(f"{symbol}.NS")
                 hist = ticker_ns.history(period=period, timeout=20)
                 if hist.empty:
                     print(f"History fetch empty even with .NS for {symbol}.")
                     raise HTTPException(status_code=404, detail=f"No historical data found for {symbol} or {symbol}.NS for period {period}.")
            else:
                 print(f"History fetch empty for {symbol} (already had suffix).")
                 raise HTTPException(status_code=404, detail=f"No historical data found for {symbol} for period {period}.")

        # --- Data Cleaning and Formatting ---
        hist.reset_index(inplace=True)
        
        # Ensure 'Date' column exists and is datetime type before formatting
        if 'Date' not in hist.columns:
             raise HTTPException(status_code=500, detail="Historical data missing 'Date' column.")
        # Convert to timezone-naive UTC for consistency before ISO formatting
        try:
            hist['Date'] = pd.to_datetime(hist['Date']).dt.tz_localize(None) # Make timezone naive
            hist['Date'] = hist['Date'].apply(lambda x: x.isoformat() + "Z") # Add Z for UTC
        except Exception as date_err:
             print(f"Error converting Date column: {date_err}")
             raise HTTPException(status_code=500, detail="Error processing date format in historical data.")

        # Ensure 'Close' column exists
        if 'Close' not in hist.columns:
             raise HTTPException(status_code=500, detail="Historical data missing 'Close' column.")

        # Select only necessary columns and handle missing values
        hist_filtered = hist[['Date', 'Close']].copy()
        hist_filtered.dropna(subset=['Close'], inplace=True) # Drop rows where Close is NaN/None

        # Convert remaining data to records
        records = hist_filtered.to_dict("records")
        print(f"Successfully fetched {len(records)} history records for {symbol} ({period})")
        return records
        
    except HTTPException as http_exc:
        # Log and re-raise specific HTTP errors
        print(f"HTTP Exception fetching history for {symbol}: {http_exc.detail}")
        raise http_exc 
    except Exception as e:
        # Log unexpected errors
        print(f"Unexpected error fetching history for {symbol} ({period}): {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve historical data: An unexpected error occurred.")