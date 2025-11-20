# backend/websocket_manager.py

import asyncio
import json
import logging
import math
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set, Iterable

import pandas as pd
import yfinance as yf
from fastapi import WebSocket

# Ensure these imports match your project structure
from database import portfolio_collection, users_collection
from routes.portfolio import SIMULATED_MF_IDS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("websocket_manager")

# -------------------------
# Connection Manager
# -------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        # Cache: symbol -> price (or None if unknown)
        self.cached_prices: Dict[str, Optional[float]] = {}
        self.last_updated: Optional[str] = None

    async def connect(self, websocket: WebSocket):
        """Accept connection and immediately send last cached prices (if any)."""
        await websocket.accept()
        self.active_connections.append(websocket)

        # Send a quick hello to confirm connection
        try:
            await websocket.send_text(json.dumps({"type": "hello", "message": "connected"}))
        except Exception as e:
            logger.debug("Failed to send hello to new connection: %s", e)

        # Send cached prices immediately so client doesn't wait for next update loop
        if self.cached_prices:
            payload = {
                "type": "live_prices",
                "data": self.cached_prices,
                "last_updated": self.last_updated,
            }
            try:
                await websocket.send_text(json.dumps(payload))
            except Exception as e:
                logger.error("Error sending initial cached prices: %s", e)

    def disconnect(self, websocket: WebSocket):
        try:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        except ValueError:
            pass

    async def broadcast(self, payload: Dict):
        """Broadcast a JSON-serializable payload to all active websockets (non-blocking)."""
        text = json.dumps(payload)
        # iterate over a shallow copy to prevent modification during iteration
        for conn in list(self.active_connections):
            try:
                await conn.send_text(text)
            except Exception as e:
                logger.info("Removing connection due to send error: %s", e)
                self.disconnect(conn)

    def update_cache(self, prices: Dict[str, Optional[float]]):
        self.cached_prices = prices
        self.last_updated = datetime.now(timezone.utc).isoformat()

manager = ConnectionManager()

# -------------------------
# Helpers: Symbol collection
# -------------------------
async def get_active_symbols() -> Set[str]:
    """
    Collect unique symbols from portfolios and user watchlists.
    Normalizes symbols to uppercase stripped strings.
    Excludes simulated mutual fund IDs (SIMULATED_MF_IDS).
    """
    symbols = set()

    # 1. Get symbols from portfolios (aggregation)
    try:
        pipeline = [
            {"$unwind": {"path": "$investments", "preserveNullAndEmptyArrays": False}},
            {"$group": {"_id": None, "symbols": {"$addToSet": "$investments.symbol"}}},
        ]
        cursor = portfolio_collection.aggregate(pipeline)
        portfolio_data = await cursor.to_list(length=1)
        if portfolio_data and "symbols" in portfolio_data[0]:
            symbols.update([s for s in portfolio_data[0]["symbols"] if s])
    except Exception as e:
        logger.exception("Error fetching symbols from portfolios: %s", e)

    # 2. Get symbols from users' watchlists
    try:
        async for user in users_collection.find({"watchlist": {"$exists": True, "$not": {"$size": 0}}}, {"watchlist": 1}):
            wl = user.get("watchlist") or []
            symbols.update([s for s in wl if s])
    except Exception as e:
        logger.exception("Error fetching symbols from watchlists: %s", e)

    # Normalize and filter out simulated mutual funds and bad entries
    normalized = set()
    for s in symbols:
        try:
            candidate = str(s).strip().upper()
            if candidate and candidate not in SIMULATED_MF_IDS:
                normalized.add(candidate)
        except Exception:
            continue

    return normalized

# -------------------------
# Helpers: Fetching prices robustly
# -------------------------
def chunk_iterable(iterable: Iterable[str], size: int):
    it = list(iterable)
    for i in range(0, len(it), size):
        yield it[i:i + size]

def safe_float(val) -> Optional[float]:
    try:
        f = float(val)
        if math.isnan(f):
            return None
        return f
    except Exception:
        return None

def _parse_yf_dataframe_for_symbol(df: pd.DataFrame, symbol: str) -> Optional[float]:
    """
    Return the latest close price for `symbol` from yfinance download dataframe.
    Handles multi-index and single-index DataFrames.
    """
    try:
        # MultiIndex columns case: columns like ('AAPL', 'Close')
        if isinstance(df.columns, pd.MultiIndex):
            top_level = df.columns.levels[0]
            if symbol in top_level:
                try:
                    col = df[symbol]
                    if "Close" in col.columns:
                        return safe_float(col["Close"].iloc[-1])
                except Exception:
                    # some shapes vary; try direct index
                    try:
                        return safe_float(df[(symbol, "Close")].iloc[-1])
                    except Exception:
                        return None
        else:
            # Single ticker case or single-level columns
            if "Close" in df.columns:
                # df['Close'] may be a Series (single ticker) or DataFrame
                try:
                    return safe_float(df["Close"].iloc[-1])
                except Exception:
                    # fallback: last row 'Close' value
                    try:
                        return safe_float(df.iloc[-1]["Close"])
                    except Exception:
                        return None
    except Exception:
        return None
    return None

def fetch_prices_blocking(active_symbols: Set[str]) -> Dict[str, Optional[float]]:
    """
    Synchronous worker function to fetch prices for the provided symbols.
    - Uses chunking to avoid requesting too many tickers at once.
    - Tries multiple parsing strategies.
    - Falls back to per-symbol yf.Ticker.history if bulk fails.
    - Returns a mapping symbol -> price (or None if not available).
    """
    if not active_symbols:
        return {}

    tickers_list = [s.strip().upper() for s in active_symbols if isinstance(s, str) and s.strip()]
    live_prices: Dict[str, Optional[float]] = {}

    CHUNK_SIZE = 30        # tune depending on provider limits and performance
    SLEEP_BETWEEN_CHUNKS = 0.4

    for chunk in chunk_iterable(tickers_list, CHUNK_SIZE):
        try:
            logger.debug("yfinance.download chunk: %s", chunk)
            # threads=True can be faster but may depend on environment
            df = yf.download(chunk, period="1d", group_by="ticker", threads=True, progress=False, auto_adjust=False)

            if df is None:
                logger.warning("yfinance returned None for chunk: %s", chunk)
                for sym in chunk:
                    live_prices[sym] = None
                time.sleep(SLEEP_BETWEEN_CHUNKS)
                continue

            # If df is empty DataFrame, log and fallback per-symbol
            if isinstance(df, pd.DataFrame) and df.empty:
                logger.warning("yfinance returned empty DataFrame for chunk: %s", chunk)
                # Try fallback per-symbol
                for sym in chunk:
                    price_val = None
                    try:
                        t = yf.Ticker(sym)
                        hist = t.history(period="1d")
                        if hist is not None and not hist.empty:
                            price_val = safe_float(hist["Close"].iloc[-1])
                    except Exception as e:
                        logger.debug("yf.Ticker fallback error for %s: %s", sym, e)
                    live_prices[sym] = round(price_val, 2) if price_val is not None else None
                time.sleep(SLEEP_BETWEEN_CHUNKS)
                continue

            # Parse bulk df
            for sym in chunk:
                price_val = None
                try:
                    price_val = _parse_yf_dataframe_for_symbol(df, sym)
                except Exception as e:
                    logger.debug("Error parsing symbol %s from df: %s", sym, e)

                # if still None, try fallback per-symbol
                if price_val is None:
                    try:
                        t = yf.Ticker(sym)
                        hist = t.history(period="1d")
                        if hist is not None and not hist.empty:
                            price_val = safe_float(hist["Close"].iloc[-1])
                    except Exception as e:
                        logger.debug("yf.Ticker fallback error for %s: %s", sym, e)

                live_prices[sym] = round(price_val, 2) if price_val is not None else None

        except Exception as e:
            logger.exception("Bulk fetch chunk failed for chunk %s: %s", chunk, e)
            # Set None for this chunk to avoid leaving UI in indefinite loading
            for sym in chunk:
                live_prices[sym] = None

        # Be polite to provider
        time.sleep(SLEEP_BETWEEN_CHUNKS)

    logger.info("Fetched prices for %d symbols", len(live_prices))
    return live_prices

# -------------------------
# Price updater background task
# -------------------------
PRICE_UPDATE_INTERVAL_SECONDS = 30

async def price_updater_task():
    """
    Background coroutine to periodically fetch active symbols and broadcast live prices.
    Designed to be started via asyncio.create_task(...) from FastAPI startup.
    """
    logger.info("🚀 Price Updater Service started")
    while True:
        try:
            active_symbols = await get_active_symbols()
            if not active_symbols:
                # If nothing is active, still broadcast an empty payload (or skip)
                logger.debug("No active symbols found; broadcasting empty prices")
                payload = {"type": "live_prices", "data": {}, "last_updated": datetime.now(timezone.utc).isoformat()}
                # update cache and broadcast so clients know we are alive
                manager.update_cache({})
                await manager.broadcast(payload)
                await asyncio.sleep(PRICE_UPDATE_INTERVAL_SECONDS)
                continue

            # Fetch prices in a thread to avoid blocking event loop
            live_prices = await asyncio.to_thread(fetch_prices_blocking, active_symbols)

            # Normalize keys to uppercase and ensure None is JSON-serializable
            normalized: Dict[str, Optional[float]] = {}
            for k, v in (live_prices or {}).items():
                normalized_key = (k or "").strip().upper()
                normalized[normalized_key] = None if v is None else float(v)

            # Update cache and broadcast new payload
            manager.update_cache(normalized)
            payload = {
                "type": "live_prices",
                "data": normalized,
                "last_updated": manager.last_updated,
            }
            await manager.broadcast(payload)
            logger.info("Broadcasted %d prices to %d connections", len(normalized), len(manager.active_connections))
        except Exception as e:
            logger.exception("Critical error in price_updater_task: %s", e)

        await asyncio.sleep(PRICE_UPDATE_INTERVAL_SECONDS)

# -------------------------
# Startup helper / public API
# -------------------------
async def start_price_updater_on_startup():
    """
    Helper to be called on FastAPI startup.
    """
    # Optionally prime the cache once before starting (fetch once synchronously)
    try:
        active_symbols = await get_active_symbols()
        if active_symbols:
            initial_prices = await asyncio.to_thread(fetch_prices_blocking, active_symbols)
            # Normalize and update cache
            normalized = {k.strip().upper(): (None if v is None else float(v)) for k, v in (initial_prices or {}).items()}
            manager.update_cache(normalized)
    except Exception as e:
        logger.warning("Initial cache prime failed: %s", e)

    # Start the periodic updater in the background
    asyncio.create_task(price_updater_task())
    logger.info("Price updater background task scheduled")

# Exported objects
__all__ = [
    "manager",
    "get_active_symbols",
    "price_updater_task",
    "start_price_updater_on_startup",
]