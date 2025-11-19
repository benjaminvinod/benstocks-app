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
    Fetches data in bulk to minimize HTTP requests.
    """
    if not active_symbols:
        return {}
        
    tickers_list = list(active_symbols)
    live_prices = {}
    
    try:
        # Download data. 
        # period='1d' is the smallest reliable chunk.
        # group_by='ticker' makes parsing easier when >1 symbol.
        data = yf.download(
            tickers_list, 
            period="1d", 
            group_by='ticker', 
            threads=True, 
            progress=False
        )
        
        # Case 1: Single Symbol (DataFrame structure is different)
        if len(tickers_list) == 1:
            symbol = tickers_list[0]
            # yfinance sometimes returns empty DF if symbol is bad
            if not data.empty:
                # Get the last valid Close price
                price = data['Close'].iloc[-1]
                if pd.notna(price):
                    live_prices[symbol] = round(float(price), 2)
                    
        # Case 2: Multiple Symbols
        else:
            for symbol in tickers_list:
                try:
                    # Access the specific ticker's dataframe
                    # Note: If data is missing, this key might not exist
                    if symbol in data:
                        symbol_data = data[symbol]
                    elif symbol in data.columns.levels[0]: # Handle MultiIndex safety
                         symbol_data = data[symbol]
                    else:
                        continue

                    if not symbol_data.empty:
                        price = symbol_data['Close'].iloc[-1]
                        if pd.notna(price):
                            live_prices[symbol] = round(float(price), 2)
                except Exception:
                    continue 

    except Exception as e:
        logger.error(f"Bulk fetch error: {e}")
            
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