# websocket_manager.py

import asyncio
import json
from typing import List
from fastapi import WebSocket
import yfinance as yf
from database import portfolio_collection, users_collection
from routes.portfolio import SIMULATED_MF_IDS

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

async def get_active_symbols() -> set:
    symbols = set()
    # 1. Get symbols from portfolios
    pipeline = [{"$unwind": "$investments"}, {"$group": {"_id": None, "symbols": {"$addToSet": "$investments.symbol"}}}]
    cursor = portfolio_collection.aggregate(pipeline)
    portfolio_data = await cursor.to_list(length=1)
    if portfolio_data and "symbols" in portfolio_data[0]:
        symbols.update(portfolio_data[0]["symbols"])
    
    # 2. Get symbols from watchlists
    users_with_watchlists = users_collection.find({"watchlist": {"$exists": True, "$not": {"$size": 0}}}, {"watchlist": 1})
    async for user in users_with_watchlists:
        symbols.update(user.get("watchlist", []))
    
    real_symbols = {s for s in symbols if s not in SIMULATED_MF_IDS}
    return real_symbols

# --- FIX: Define the blocking fetch function outside the async loop ---
def fetch_prices_blocking(active_symbols):
    tickers_str = " ".join(active_symbols)
    tickers = yf.Tickers(tickers_str)
    live_prices = {}
    
    for symbol in active_symbols:
        try:
            # Check if ticker object exists
            ticker_obj = tickers.tickers.get(symbol.upper())
            if not ticker_obj:
                continue

            # Fast fetch using .fast_info if available (newer yfinance), else fallback
            # .info is very slow, using fast_info or history is better for bulk
            try:
                price = ticker_obj.fast_info.last_price
            except:
                # Fallback to regular info if fast_info fails
                info = ticker_obj.info
                price = info.get("currentPrice") or info.get("regularMarketPrice")
            
            if price:
                live_prices[symbol.upper()] = round(price, 2)

        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            
    return live_prices

async def price_updater_task():
    while True:
        try:
            active_symbols = await get_active_symbols()
            if active_symbols:
                print(f"LIVE UPDATER: Fetching prices for {len(active_symbols)} symbols...")
                
                # --- FIX: Run the blocking fetch in a separate thread ---
                live_prices = await asyncio.to_thread(fetch_prices_blocking, active_symbols)
                
                if live_prices:
                    await manager.broadcast(json.dumps({"type": "live_prices", "data": live_prices}))
                    print("LIVE UPDATER: Broadcasted updates.")

        except Exception as e:
            print(f"An error occurred in the price updater: {e}")
        
        await asyncio.sleep(15)