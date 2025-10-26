import pandas as pd
import yfinance as yf
import requests 

from fastapi import APIRouter, HTTPException, Query
from utils.fetch_data import fetch_stock_data
from utils.calculate import calculate_future_value

router = APIRouter()

@router.get("/search")
async def search_symbols(query: str = Query(..., min_length=1, description="Search query for stock symbols")):
    """
    Searches for stock symbols matching the query using Yahoo Finance's API.
    """
    if not query:
        return []

    url = f"https://query1.finance.yahoo.com/v1/finance/search?q={query}"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

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

            if symbol and name and quote_type == "EQUITY":
                suggestions.append({
                    "symbol": symbol,
                    "name": name
                })

        return suggestions[:7]

    except requests.RequestException as e:
        print(f"Error fetching from Yahoo search API: {e}")
        raise HTTPException(status_code=503, detail="Failed to connect to financial data provider for search.")
    except Exception as e:
        print(f"Error processing search results: {e}")
        raise HTTPException(status_code=500, detail="Error processing search results.")


@router.get("/price")
async def get_stock_price(symbol: str = Query(..., description="Stock symbol")):
    """
    Fetches the latest stock data for a given symbol.
    """
    try:
        data = fetch_stock_data(symbol)

        if data.get("error"):
            raise HTTPException(status_code=404, detail=data["error"])

        stock_data = {
            "symbol": data.get("symbol"),
            "name": data.get("name"),
            "open": data.get("open"),
            "high": data.get("high"),
            "low": data.get("low"),
            "close": data.get("close"),
            "currency": data.get("currency"),
            "market_cap": data.get("market_cap"),
            "pe_ratio": data.get("pe_ratio"),
            "dividend_yield": data.get("dividend_yield"),
            "week_52_high": data.get("week_52_high"),
            "week_52_low": data.get("week_52_low"),
            "recommendation": data.get("recommendation"),
            "number_of_analysts": data.get("number_of_analysts"),
            "target_price": data.get("target_price"),
            # --- START: ADDED ADVANCED ANALYTICS ---
            "beta": data.get("beta"),
            "sharpe_ratio": data.get("sharpe_ratio"),
            "esg_score": data.get("esg_score"),
            "esg_percentile": data.get("esg_percentile"),
            # --- END: ADDED ADVANCED ANALYTICS ---
        }

        if not all([stock_data["open"], stock_data["high"], stock_data["low"], stock_data["close"]]):
            raise HTTPException(
                status_code=500,
                detail="Incomplete data from financial API. Please try again."
            )

        return stock_data

    except HTTPException as http_e:
        raise http_e
    except Exception as e:
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

    print(f"Attempting to fetch history for {symbol} ({period})")
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period, timeout=20)

        if hist.empty:
            print(f"Initial history fetch empty for {symbol}. Trying with .NS suffix.")
            if not symbol.upper().endswith((".NS", ".BO")):
                 ticker_ns = yf.Ticker(f"{symbol}.NS")
                 hist = ticker_ns.history(period=period, timeout=20)
                 if hist.empty:
                     print(f"History fetch empty even with .NS for {symbol}.")
                     raise HTTPException(status_code=404, detail=f"No historical data found for {symbol} or {symbol}.NS for period {period}.")
            else:
                 print(f"History fetch empty for {symbol} (already had suffix).")
                 raise HTTPException(status_code=404, detail=f"No historical data found for {symbol} for period {period}.")

        hist.reset_index(inplace=True)

        if 'Date' not in hist.columns:
             raise HTTPException(status_code=500, detail="Historical data missing 'Date' column.")
        try:
            hist['Date'] = pd.to_datetime(hist['Date']).dt.tz_localize(None)
            hist['Date'] = hist['Date'].apply(lambda x: x.isoformat() + "Z")
        except Exception as date_err:
             print(f"Error converting Date column: {date_err}")
             raise HTTPException(status_code=500, detail="Error processing date format in historical data.")

        if 'Close' not in hist.columns:
             raise HTTPException(status_code=500, detail="Historical data missing 'Close' column.")

        hist_filtered = hist[['Date', 'Close']].copy()
        hist_filtered.dropna(subset=['Close'], inplace=True)
        records = hist_filtered.to_dict("records")
        print(f"Successfully fetched {len(records)} history records for {symbol} ({period})")
        return records

    except HTTPException as http_exc:
        print(f"HTTP Exception fetching history for {symbol}: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        print(f"Unexpected error fetching history for {symbol} ({period}): {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve historical data: An unexpected error occurred.")