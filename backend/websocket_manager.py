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
        self.active_connections.remove(websocket)
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

async def get_active_symbols() -> set:
    symbols = set()
    pipeline = [{"$unwind": "$investments"}, {"$group": {"_id": None, "symbols": {"$addToSet": "$investments.symbol"}}}]
    cursor = portfolio_collection.aggregate(pipeline)
    portfolio_data = await cursor.to_list(length=1)
    if portfolio_data and "symbols" in portfolio_data[0]:
        symbols.update(portfolio_data[0]["symbols"])
    users_with_watchlists = users_collection.find({"watchlist": {"$exists": True, "$not": {"$size": 0}}}, {"watchlist": 1})
    async for user in users_with_watchlists:
        symbols.update(user.get("watchlist", []))
    real_symbols = {s for s in symbols if s not in SIMULATED_MF_IDS}
    return real_symbols

async def price_updater_task():
    while True:
        try:
            active_symbols = await get_active_symbols()
            if active_symbols:
                print(f"LIVE UPDATER: Fetching prices for {len(active_symbols)} real symbols: {active_symbols}")
                
                tickers_str = " ".join(active_symbols)
                tickers = yf.Tickers(tickers_str)
                
                live_prices = {}
                for symbol in active_symbols:
                    try:
                        # --- START: MODIFIED CODE ---
                        # This is the new, more robust logic.
                        
                        # Safety Check 1: Make sure the ticker object exists
                        ticker_obj = tickers.tickers.get(symbol.upper())
                        if not ticker_obj:
                            print(f"LIVE UPDATER: Ticker object for {symbol} not found in yfinance response.")
                            continue

                        # Safety Check 2: Make sure the 'info' dictionary is not empty
                        ticker_info = ticker_obj.info
                        if not ticker_info:
                            print(f"LIVE UPDATER: Incomplete data for {symbol}. Skipping.")
                            continue
                        
                        price = ticker_info.get("currentPrice") or ticker_info.get("regularMarketPrice")
                        if price:
                            live_prices[symbol.upper()] = round(price, 2)
                        else:
                            # This helps debug if a valid symbol just doesn't have a price
                            print(f"LIVE UPDATER: Price not found for {symbol}, though data was received.")
                        # --- END: MODIFIED CODE ---

                    except Exception as e:
                        # This will now catch any other unexpected errors for a single symbol
                        print(f"LIVE UPDATER: Error processing symbol '{symbol}': {e}")

                if live_prices:
                    await manager.broadcast(json.dumps({"type": "live_prices", "data": live_prices}))

        except Exception as e:
            # This catches errors in the overall task (e.g., cannot connect to yfinance)
            print(f"An error occurred in the main price updater task: {e}")
        
        await asyncio.sleep(15) 