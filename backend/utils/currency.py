# utils/currency.py
import yfinance as yf
import time
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Cache for exchange rates
exchange_rate_cache = {}
CACHE_DURATION_SECONDS = 3600  # Cache for 1 hour

# Fallback rate (Updated to roughly current market rate)
# This prevents the app from crashing if Yahoo API is down
DEFAULT_USD_INR_RATE = 84.50 

def get_exchange_rate(from_currency: str, to_currency: str) -> float:
    """
    Fetches the exchange rate between two currencies using yfinance.
    Returns a float. Uses a fallback if the API fails to prevent transaction crashes.
    """
    # 1. Handle identical currencies
    if from_currency == to_currency:
        return 1.0

    # 2. Construct Symbol (Standard Yahoo format: "INR=X", "EURUSD=X")
    # For USD to INR, Yahoo uses "INR=X" (which means how many INR for 1 USD)
    if from_currency == "USD" and to_currency == "INR":
        pair = "INR=X"
    else:
        pair = f"{from_currency}{to_currency}=X"

    current_time = time.time()

    # 3. Check Cache
    if pair in exchange_rate_cache:
        rate, timestamp = exchange_rate_cache[pair]
        if current_time - timestamp < CACHE_DURATION_SECONDS:
            return rate

    # 4. Fetch from API
    print(f"Fetching new exchange rate for {pair}...")
    try:
        # Download last 1 day of data
        # progress=False suppresses the progress bar in logs
        data = yf.download(pair, period="1d", progress=False)
        
        if not data.empty:
            # Get the last available close price
            # .iloc[-1] gets the last row, ['Close'] gets the closing price
            # We wrap in float() to ensure it's a native Python float, not numpy
            rate = float(data['Close'].iloc[-1])
            
            # Validate rate (sanity check: USD/INR shouldn't be < 50 or > 120)
            # This protects against API glitches returning bad data
            if from_currency == "USD" and to_currency == "INR" and (rate < 50 or rate > 120):
                logger.warning(f"Anomalous rate detected for {pair}: {rate}. Using fallback.")
                return DEFAULT_USD_INR_RATE

            exchange_rate_cache[pair] = (rate, current_time)
            return rate
            
    except Exception as e:
        logger.error(f"Error fetching exchange rate for {pair}: {e}")

    # 5. Fallback
    logger.warning(f"Using fallback rate ({DEFAULT_USD_INR_RATE}) for {pair}")
    return DEFAULT_USD_INR_RATE