# utils/currency.py
import yfinance as yf
import time

# Cache for exchange rates
exchange_rate_cache = {}
CACHE_DURATION_SECONDS = 3600  # Cache for 1 hour

def get_exchange_rate(from_currency: str, to_currency: str) -> float | None:
    """
    Fetches the exchange rate between two currencies using yfinance.
    Caches the result for performance.
    Example: get_exchange_rate("USD", "INR")
    """
    pair = f"{from_currency}{to_currency}=X"
    current_time = time.time()

    # Check cache first
    if pair in exchange_rate_cache:
        rate, timestamp = exchange_rate_cache[pair]
        if current_time - timestamp < CACHE_DURATION_SECONDS:
            print(f"CACHE HIT: Returning cached rate for {pair}")
            return rate

    print(f"CACHE MISS: Fetching new rate for {pair} from yfinance")
    try:
        ticker = yf.Ticker(pair)
        # Get the most recent closing price as the rate
        history = ticker.history(period="1d")
        if not history.empty:
            rate = history['Close'].iloc[-1]
            exchange_rate_cache[pair] = (rate, current_time)
            return rate
        else:
            print(f"Warning: No data found for currency pair {pair}")
            # Fallback or error handling
            # For USD/INR, a rough fallback might be okay for a simulator
            if from_currency == "USD" and to_currency == "INR":
                return 83.5 # Provide a rough fallback
            return None
    except Exception as e:
        print(f"Error fetching exchange rate for {pair}: {e}")
        # Fallback or error handling
        if from_currency == "USD" and to_currency == "INR":
            return 83.5 # Provide a rough fallback
        return None