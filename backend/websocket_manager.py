# websocket_manager.py

import asyncio
import json
from typing import List, Dict
from fastapi import WebSocket
import yfinance as yf
from database import portfolio_collection, users_collection

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
    """Gets a set of all unique stock symbols currently held by users or on watchlists."""
    symbols = set()
    
    # Get symbols from portfolios
    pipeline = [
        {"$unwind": "$investments"},
        {"$group": {"_id": None, "symbols": {"$addToSet": "$investments.symbol"}}}
    ]
    cursor = portfolio_collection.aggregate(pipeline)
    portfolio_data = await cursor.to_list(length=1)
    if portfolio_data and "symbols" in portfolio_data[0]:
        symbols.update(portfolio_data[0]["symbols"])

    # Get symbols from watchlists
    users_with_watchlists = users_collection.find({"watchlist": {"$exists": True, "$not": {"$size": 0}}}, {"watchlist": 1})
    async for user in users_with_watchlists:
        symbols.update(user.get("watchlist", []))

    return symbols

async def price_updater_task():
    """A background task that fetches and broadcasts stock prices every 15 seconds."""
    while True:
        try:
            active_symbols = await get_active_symbols()
            if active_symbols:
                print(f"LIVE UPDATER: Fetching prices for {len(active_symbols)} symbols: {active_symbols}")
                
                # Fetch all tickers at once using yfinance's fast access
                tickers_str = " ".join(active_symbols)
                tickers = yf.Tickers(tickers_str)
                
                live_prices = {}
                for symbol in active_symbols:
                    try:
                        # Accessing data this way is much faster for multiple tickers
                        ticker_info = tickers.tickers[symbol.upper()].info
                        price = ticker_info.get("currentPrice") or ticker_info.get("regularMarketPrice")
                        if price:
                            live_prices[symbol.upper()] = round(price, 2)
                    except Exception as e:
                        print(f"LIVE UPDATER: Could not get price for {symbol}: {e}")

                if live_prices:
                    await manager.broadcast(json.dumps({"type": "live_prices", "data": live_prices}))

        except Exception as e:
            print(f"An error occurred in the price updater task: {e}")
        
        await asyncio.sleep(15)