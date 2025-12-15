# backend/websocket_manager.py

import asyncio
import json
import logging
import math
import time
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set, Iterable

import pandas as pd
import yfinance as yf
from fastapi import WebSocket
from dotenv import load_dotenv

# Ensure these imports match your project structure
from database import portfolio_collection, users_collection, alerts_collection
from routes.portfolio import SIMULATED_MF_IDS

# Load Env for Email
load_dotenv()
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("websocket_manager")

# -------------------------
# Connection Manager
# -------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.cached_prices: Dict[str, Optional[float]] = {}
        self.last_updated: Optional[str] = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        try:
            await websocket.send_text(json.dumps({"type": "hello", "message": "connected"}))
        except Exception as e:
            logger.debug("Failed to send hello to new connection: %s", e)

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
        text = json.dumps(payload)
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
    symbols = set()
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

    try:
        async for user in users_collection.find({"watchlist": {"$exists": True, "$not": {"$size": 0}}}, {"watchlist": 1}):
            wl = user.get("watchlist") or []
            symbols.update([s for s in wl if s])
    except Exception as e:
        logger.exception("Error fetching symbols from watchlists: %s", e)
    
    # --- NEW: Add Alert Symbols to Monitoring ---
    try:
        async for alert in alerts_collection.find({"status": "ACTIVE"}, {"symbol": 1}):
            if alert.get("symbol"):
                symbols.add(alert.get("symbol"))
    except Exception as e:
        logger.exception("Error fetching symbols from alerts: %s", e)

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
    try:
        if isinstance(df.columns, pd.MultiIndex):
            top_level = df.columns.levels[0]
            if symbol in top_level:
                try:
                    col = df[symbol]
                    if "Close" in col.columns:
                        return safe_float(col["Close"].iloc[-1])
                except Exception:
                    try:
                        return safe_float(df[(symbol, "Close")].iloc[-1])
                    except Exception:
                        return None
        else:
            if "Close" in df.columns:
                try:
                    return safe_float(df["Close"].iloc[-1])
                except Exception:
                    try:
                        return safe_float(df.iloc[-1]["Close"])
                    except Exception:
                        return None
    except Exception:
        return None
    return None

def fetch_prices_blocking(active_symbols: Set[str]) -> Dict[str, Optional[float]]:
    if not active_symbols:
        return {}

    tickers_list = [s.strip().upper() for s in active_symbols if isinstance(s, str) and s.strip()]
    live_prices: Dict[str, Optional[float]] = {}

    CHUNK_SIZE = 30        
    SLEEP_BETWEEN_CHUNKS = 0.4

    for chunk in chunk_iterable(tickers_list, CHUNK_SIZE):
        try:
            logger.debug("yfinance.download chunk: %s", chunk)
            df = yf.download(chunk, period="1d", group_by="ticker", threads=True, progress=False, auto_adjust=False)

            if df is None:
                for sym in chunk: live_prices[sym] = None
                time.sleep(SLEEP_BETWEEN_CHUNKS)
                continue

            if isinstance(df, pd.DataFrame) and df.empty:
                for sym in chunk:
                    price_val = None
                    try:
                        t = yf.Ticker(sym)
                        hist = t.history(period="1d")
                        if hist is not None and not hist.empty:
                            price_val = safe_float(hist["Close"].iloc[-1])
                    except Exception: pass
                    live_prices[sym] = round(price_val, 2) if price_val is not None else None
                time.sleep(SLEEP_BETWEEN_CHUNKS)
                continue

            for sym in chunk:
                price_val = None
                try:
                    price_val = _parse_yf_dataframe_for_symbol(df, sym)
                except Exception: pass

                if price_val is None:
                    try:
                        t = yf.Ticker(sym)
                        hist = t.history(period="1d")
                        if hist is not None and not hist.empty:
                            price_val = safe_float(hist["Close"].iloc[-1])
                    except Exception: pass

                live_prices[sym] = round(price_val, 2) if price_val is not None else None

        except Exception as e:
            logger.exception("Bulk fetch chunk failed for chunk %s: %s", chunk, e)
            for sym in chunk: live_prices[sym] = None

        time.sleep(SLEEP_BETWEEN_CHUNKS)

    return live_prices

# -------------------------
# NEW: Alert Processing Logic
# -------------------------
def send_alert_email(to_email: str, subject: str, body: str):
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        logger.warning("Email credentials missing. Skipping alert email.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Alert email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send alert email: {e}")

async def check_and_process_alerts(current_prices: Dict[str, float]):
    """
    Checks active alerts against current prices and triggers email/notifications.
    """
    try:
        # Fetch all active alerts
        active_alerts = await alerts_collection.find({"status": "ACTIVE"}).to_list(length=1000)
        
        triggered_ids = []

        for alert in active_alerts:
            symbol = alert.get("symbol")
            target = alert.get("target_price")
            condition = alert.get("condition")
            user_id = alert.get("user_id")

            if not symbol or symbol not in current_prices:
                continue

            current_price = current_prices[symbol]
            if current_price is None: 
                continue

            triggered = False
            if condition == "ABOVE" and current_price >= target:
                triggered = True
            elif condition == "BELOW" and current_price <= target:
                triggered = True

            if triggered:
                # 1. Fetch User Email
                from bson import ObjectId
                user = await users_collection.find_one({"_id": ObjectId(user_id)})
                
                if user and user.get("email"):
                    subject = f"🔔 BenStocks Alert: {symbol} hit {current_price}!"
                    body = f"Hello {user.get('username')},\n\nYour alert for {symbol} has been triggered.\n\nCurrent Price: {current_price}\nTarget: {target} ({condition})\n\nHappy Trading,\nTeam BenStocks"
                    
                    # Run email in thread
                    await asyncio.to_thread(send_alert_email, user.get("email"), subject, body)

                triggered_ids.append(alert["_id"])

        # 2. Mark triggered alerts as TRIGGERED (One-time alert)
        if triggered_ids:
            await alerts_collection.update_many(
                {"_id": {"$in": triggered_ids}},
                {"$set": {"status": "TRIGGERED"}}
            )
            logger.info(f"Processed {len(triggered_ids)} alerts.")

    except Exception as e:
        logger.error(f"Error processing alerts: {e}")

# -------------------------
# Price updater background task
# -------------------------
PRICE_UPDATE_INTERVAL_SECONDS = 30

async def price_updater_task():
    logger.info("🚀 Price Updater Service started")
    while True:
        try:
            active_symbols = await get_active_symbols()
            if not active_symbols:
                manager.update_cache({})
                await asyncio.sleep(PRICE_UPDATE_INTERVAL_SECONDS)
                continue

            live_prices = await asyncio.to_thread(fetch_prices_blocking, active_symbols)

            normalized: Dict[str, Optional[float]] = {}
            for k, v in (live_prices or {}).items():
                normalized_key = (k or "").strip().upper()
                val = float(v) if v is not None else None
                normalized[normalized_key] = val

            manager.update_cache(normalized)
            
            # --- Broadcast to Frontend ---
            payload = {
                "type": "live_prices",
                "data": normalized,
                "last_updated": manager.last_updated,
            }
            await manager.broadcast(payload)
            
            # --- Check Alerts ---
            # Filter out Nones for alert checking
            valid_prices = {k: v for k, v in normalized.items() if v is not None}
            if valid_prices:
                await check_and_process_alerts(valid_prices)

        except Exception as e:
            logger.exception("Critical error in price_updater_task: %s", e)

        await asyncio.sleep(PRICE_UPDATE_INTERVAL_SECONDS)

# -------------------------
# Startup helper / public API
# -------------------------
async def start_price_updater_on_startup():
    try:
        active_symbols = await get_active_symbols()
        if active_symbols:
            initial_prices = await asyncio.to_thread(fetch_prices_blocking, active_symbols)
            normalized = {k.strip().upper(): (None if v is None else float(v)) for k, v in (initial_prices or {}).items()}
            manager.update_cache(normalized)
    except Exception as e:
        logger.warning("Initial cache prime failed: %s", e)

    asyncio.create_task(price_updater_task())
    logger.info("Price updater background task scheduled")

__all__ = [
    "manager",
    "get_active_symbols",
    "price_updater_task",
    "start_price_updater_on_startup",
]