# websocket_manager.py

import asyncio
import json
import logging
from typing import List, Set
from fastapi import WebSocket
import yfinance as yf
import pandas as pd
from database import portfolio_collection, users_collection
from routes.portfolio import SIMULATED_MF_IDS

# Configure logging to see errors without crashing
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        # Iterate over a copy to avoid modification errors during iteration
        for connection in self.active_connections[:]:
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

async def get_active_symbols() -> Set[str]:
    """Collects all symbols currently owned or watched by users."""
    symbols = set()
    
    # 1. Get symbols from portfolios (Aggregation for speed)
    pipeline = [
        {"$unwind": "$investments"},
        {"$group": {"_id": None, "symbols": {"$addToSet": "$investments.symbol"}}}
    ]
    try:
        cursor = portfolio_collection.aggregate(pipeline)
        portfolio_data = await cursor.to_list(length=1)
        if portfolio_data and "symbols" in portfolio_data[0]:
            symbols.update(portfolio_data[0]["symbols"])
    except Exception as e:
        logger.error(f"Error fetching portfolio symbols: {e}")
    
    # 2. Get symbols from watchlists
    try:
        users_with_watchlists = users_collection.find(
            {"watchlist": {"$exists": True, "$not": {"$size": 0}}}, 
            {"watchlist": 1}
        )
        async for user in users_with_watchlists:
            symbols.update(user.get("watchlist", []))
    except Exception as e:
        logger.error(f"Error fetching watchlist symbols: {e}")
    
    # Filter out Mutual Funds (which are simulated) and bad data
    real_symbols = {s.upper() for s in symbols if s and s not in SIMULATED_MF_IDS}
    return real_symbols

def fetch_prices_blocking(active_symbols: Set[str]) -> dict:
    """
    Synchronous function to be run in a separate thread.
    Fetches data in bulk and ensures EVERY requested symbol gets a value.
    """
    if not active_symbols:
        return {}
        
    tickers_list = list(active_symbols)
    live_prices = {}
    
    try:
        # Download data. 
        # threads=False is safer for stability in loops
        data = yf.download(
            tickers_list, 
            period="1d", 
            group_by='ticker', 
            threads=False, 
            progress=False
        )
        
        # --- FIX FOR WATCHLIST LOADING FOREVER ---
        # We must iterate through the REQUESTED list, not just what Yahoo returned.
        # If Yahoo drops a symbol, we must provide a fallback (0.0) so the UI stops spinning.
        
        for symbol in tickers_list:
            price_found = False
            
            # Case 1: Single Symbol download structure
            if len(tickers_list) == 1:
                if not data.empty and 'Close' in data:
                    # Check if 'Close' is a Series or Scalar (depends on yfinance version)
                    try:
                        price = float(data['Close'].iloc[-1])
                        live_prices[symbol] = round(price, 2)
                        price_found = True
                    except: pass
            
            # Case 2: Multiple Symbols
            else:
                try:
                    if symbol in data:
                         # If symbol is a top-level key (standard behavior)
                         col = data[symbol]
                         if 'Close' in col:
                             price = float(col['Close'].iloc[-1])
                             live_prices[symbol] = round(price, 2)
                             price_found = True
                    elif symbol in data.columns.levels[0]:
                         # MultiIndex handling
                         price = float(data[symbol]['Close'].iloc[-1])
                         live_prices[symbol] = round(price, 2)
                         price_found = True
                except Exception:
                    pass

            # Fallback: If we requested it but didn't find it, send 0.0
            # This stops the frontend spinner.
            if not price_found:
                live_prices[symbol] = 0.0

    except Exception as e:
        logger.error(f"Bulk fetch error: {e}")
        # Emergency fallback: set everything to 0.0 so UI loads
        for symbol in tickers_list:
            live_prices[symbol] = 0.0
            
    return live_prices

async def price_updater_task():
    """
    Background task that updates prices every 30 seconds.
    """
    print("🚀 Price Updater Service Started")
    while True:
        try:
            # 1. Find out what to fetch
            active_symbols = await get_active_symbols()
            
            if active_symbols:
                # 2. Fetch in a separate thread to keep the server responsive
                live_prices = await asyncio.to_thread(fetch_prices_blocking, active_symbols)
                
                if live_prices:
                    # 3. Broadcast to frontend
                    await manager.broadcast(json.dumps({
                        "type": "live_prices", 
                        "data": live_prices
                    }))
            
        except Exception as e:
            logger.error(f"Critical error in price updater: {e}")
        
        await asyncio.sleep(30)