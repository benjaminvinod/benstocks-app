# backend/routes/chat.py
import asyncio
import re
import requests
import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Optional

# --- NEW IMPORTS FOR STREAMING ---
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from ollama import AsyncClient

from database import chats_collection
from models.chat_model import ChatSession, ChatMessage, CreateChatRequest
from routes.portfolio import get_portfolio
from routes.news import get_financial_news
from utils.fetch_data import fetch_stock_data
from utils.prompts import FEW_SHOT_EXAMPLES

router = APIRouter()

# --- CONSTANTS & STOP WORDS ---
STOP_WORDS = {
    "AND", "THE", "FOR", "NEW", "BUY", "SELL", "WHO", "WHAT", 
    "ARE", "YOU", "IS", "IT", "NOW", "NOT", "YES", "WHY", 
    "HOW", "CAN", "LOW", "HIGH", "OUT", "GET", "SET", "LONG", 
    "SHORT", "HOLD", "GOOD", "BAD", "TIME", "REAL", "FAKE",
    "TELL", "ME", "ABOUT", "STOCK", "STOCKS", "PRICE", "VALUE",
    "TODAY", "YESTERDAY", "TOMORROW", "ANALYSIS", "PREDICT", "FORECAST",
    "SHOULD", "I", "MY", "PORTFOLIO", "THINK"
}

# --- ENHANCED SYSTEM PROMPT (ROAST MODE + PRO TRADER) ---
ENHANCED_SYSTEM_PROMPT = """
You are Portify, a witty, sharp-tongued Wall Street veteran and the user's financial wingman.
Your goal is to help them win the BenStocks simulation.

### YOUR PERSONALITY
- **Direct & Punchy:** Don't waffle. Get to the point.
- **Witty & Sarcastic:** If the user owns bad stocks (high losses, terrible P/E), gently roast them.
- **Not a Robot:** Use emojis (🚀, 📉, 🤡, 💰) and casual trader slang (HODL, Bagholder, Mooning, Dead Cat Bounce).
- **Analyst:** Use the provided MACD, RSI, and Bollinger Bands to justify your view. (e.g., "MACD is bearish, so don't catch the falling knife.").

### YOUR DATA SOURCES (Use these strict priorities)
1. **User's Portfolio:** Check if they OWN the stock. Tailor advice to their position.
2. **Technical Analysis:** Use RSI (Overbought > 70, Oversold < 30), MACD (Crossovers), and Bollinger Bands (Volatility).
3. **News:** Reference the provided headlines if relevant.

### HALLUCINATION PROTOCOL
- If the "Market Data" section says "No Data", **DO NOT** invent a price. Admit you can't see it.
- If you assumed a ticker (e.g., AAPL for "Apple"), mention it: "I'm looking at Apple Inc (AAPL)..."
"""

# --- ADVANCED TECHNICAL ANALYSIS ENGINE ---
def calculate_technicals(history_df):
    """Calculates RSI, Trend, MACD, and Bollinger Bands."""
    if history_df.empty or len(history_df) < 26:
        return "Not enough data for technicals."

    # 1. RSI (14-day)
    delta = history_df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    current_rsi = rsi.iloc[-1]
    
    rsi_verdict = "Neutral"
    if current_rsi > 70: rsi_verdict = "Overbought (Sell Signal?)"
    elif current_rsi < 30: rsi_verdict = "Oversold (Buy Dip?)"

    # 2. Trend (SMA 50)
    trend = "Sideways"
    if len(history_df) > 50:
        sma_50 = history_df['Close'].rolling(window=50).mean().iloc[-1]
        current_price = history_df['Close'].iloc[-1]
        trend = "Uptrend 🐂" if current_price > sma_50 else "Downtrend 🐻"

    # 3. MACD (12, 26, 9)
    exp1 = history_df['Close'].ewm(span=12, adjust=False).mean()
    exp2 = history_df['Close'].ewm(span=26, adjust=False).mean()
    macd = exp1 - exp2
    signal = macd.ewm(span=9, adjust=False).mean()
    
    curr_macd = macd.iloc[-1]
    curr_sig = signal.iloc[-1]
    macd_verdict = "Bullish Crossover 🟢" if curr_macd > curr_sig else "Bearish Crossover 🔴"

    # 4. Bollinger Bands (20, 2)
    sma_20 = history_df['Close'].rolling(window=20).mean()
    std_20 = history_df['Close'].rolling(window=20).std()
    upper_band = sma_20 + (std_20 * 2)
    lower_band = sma_20 - (std_20 * 2)
    
    current_price = history_df['Close'].iloc[-1]
    bb_status = "Normal"
    if current_price > upper_band.iloc[-1]: bb_status = "Breaking Out (High)"
    if current_price < lower_band.iloc[-1]: bb_status = "Oversold (Low)"

    return (
        f"RSI: {current_rsi:.1f} ({rsi_verdict}) | "
        f"Trend: {trend} | "
        f"MACD: {macd_verdict} | "
        f"Bollinger: {bb_status}"
    )

# --- SMART SEARCH & DATA FETCHING ---

def search_ticker_from_query(query: str) -> List[str]:
    """Finds tickers via Yahoo. Prioritizes Stocks over Funds."""
    url = f"https://query1.finance.yahoo.com/v1/finance/search?q={query}"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        response = requests.get(url, headers=headers, timeout=2)
        data = response.json()
        quotes = data.get("quotes", [])
        
        found_tickers = []
        if quotes:
            # Priority 1: Equity (Stock)
            for q in quotes:
                if q.get("quoteType") == "EQUITY":
                    found_tickers.append(q.get("symbol"))
                    break 
            # Priority 2: If no equity, take first result (could be Crypto/ETF)
            if not found_tickers and quotes:
                found_tickers.append(quotes[0].get("symbol"))
                
        return found_tickers
    except:
        return []

def extract_potential_entities(text: str) -> List[str]:
    clean_text = re.sub(r'[^\w\s]', '', text)
    words = clean_text.split()
    return list(set([w for w in words if w.upper() not in STOP_WORDS and len(w) >= 2]))

async def resolve_context_and_fetch(user_message: str, user_id: str):
    """
    The Brain: Fetches Portfolio, News, and Market Data (Price + Technicals).
    """
    # 1. FETCH USER PORTFOLIO
    portfolio_context = "User holds NO stocks. Cash Only."
    user_holdings_map = {}
    try:
        pf = await get_portfolio(user_id)
        if pf.investments:
            holdings_desc = []
            for inv in pf.investments:
                status = "New"
                user_holdings_map[inv.symbol] = inv
                holdings_desc.append(f"{inv.symbol} ({inv.quantity} units)")
            portfolio_context = f"User Holdings: {', '.join(holdings_desc)}. Cash: ${pf.history[-1].cash_balance:.0f}"
    except: pass

    # 2. FETCH NEWS HEADLINES
    news_context = "No recent major news."
    try:
        news_items = await get_financial_news()
        if news_items:
            # Take top 3 headlines
            headlines = [f"- {n['title']} ({n['sentiment']})" for n in news_items[:3]]
            news_context = "\n".join(headlines)
    except: pass

    # 3. DETECT & FETCH MARKET DATA (With Technicals)
    candidates = extract_potential_entities(user_message)
    candidates = sorted(candidates, key=len, reverse=True)[:3]
    
    detected_tickers = set()
    
    # A. Check if user mentioned a stock they OWN (Context Awareness)
    for word in candidates:
        # Simple check if word matches a holding symbol
        for holding_symbol in user_holdings_map.keys():
            if word.upper() in holding_symbol:
                detected_tickers.add(holding_symbol)

    # B. Search Yahoo for new tickers
    loop = asyncio.get_event_loop()
    search_tasks = [loop.run_in_executor(None, search_ticker_from_query, word) for word in candidates]
    if search_tasks:
        search_results = await asyncio.gather(*search_tasks)
        for res in search_results:
            detected_tickers.update(res)
    
    market_data_str = ""
    if not detected_tickers:
        market_data_str = "[No specific ticker identified in query]"
    else:
        import yfinance as yf
        
        def fetch_full_analysis(symbol):
            try:
                ticker = yf.Ticker(symbol)
                # Get 3mo history for MACD calculation
                hist = ticker.history(period="3mo")
                info = ticker.info or {}
                
                if hist.empty: return None

                current_price = hist['Close'].iloc[-1]
                technicals = calculate_technicals(hist)
                
                holding_info = ""
                if symbol in user_holdings_map:
                    inv = user_holdings_map[symbol]
                    pnl = (current_price - inv.buy_price) / inv.buy_price * 100
                    holding_info = f" | [USER OWNS THIS: Avg Buy {inv.buy_price:.2f}, P/L: {pnl:.1f}%]"

                return (
                    f"| {symbol} | Price: {current_price:.2f} {info.get('currency','')} | "
                    f"PE: {info.get('trailingPE','N/A')} | {technicals}{holding_info} |"
                )
            except: return None

        analysis_tasks = [asyncio.to_thread(fetch_full_analysis, t) for t in list(detected_tickers)[:3]]
        results = await asyncio.gather(*analysis_tasks)
        
        valid_rows = [r for r in results if r]
        if valid_rows:
            market_data_str = "\n".join(valid_rows)
        else:
            market_data_str = "[System: Could not fetch live data for detected names. Do not hallucinate prices.]"

    return portfolio_context, news_context, market_data_str

# --- ROUTES ---

@router.get("/sessions/{user_id}")
async def get_user_sessions(user_id: str):
    cursor = chats_collection.find({"user_id": user_id}).sort("updated_at", -1)
    sessions = await cursor.to_list(length=50)
    return [{"id": s["id"], "title": s["title"], "date": s["updated_at"]} for s in sessions]

@router.get("/history/{session_id}")
async def get_chat_history(session_id: str):
    session = await chats_collection.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["_id"] = str(session["_id"])
    return session

@router.delete("/{session_id}")
async def delete_chat_session(session_id: str):
    await chats_collection.delete_one({"id": session_id})
    return {"message": "Deleted"}

@router.post("/")
async def chat_with_advisor(request: CreateChatRequest):
    """
    Phase 2: Streaming Response Implementation.
    Returns a Server-Sent Stream of text while saving history in the background.
    """
    user_id = request.user_id
    raw_message = request.message
    session_id = request.session_id
    
    if not raw_message: raise HTTPException(status_code=400, detail="Empty message")
    user_message = re.sub(r'[^\w\s.,?!@#$%^&*()\-]', '', raw_message).strip()

    # 1. Manage Session (Create Immediately if New)
    session_data = None
    if session_id:
        session_data = await chats_collection.find_one({"id": session_id})
    
    if not session_data:
        title = " ".join(user_message.split()[:5]) + "..."
        new_session = ChatSession(user_id=user_id, title=title)
        session_data = new_session.dict()
        await chats_collection.insert_one(session_data)
        session_id = session_data["id"]

    # 2. GATHER INTELLIGENCE
    portfolio_ctx, news_ctx, market_ctx = await resolve_context_and_fetch(user_message, user_id)

    # 3. CONSTRUCT PROMPT
    messages_payload = [{'role': 'system', 'content': ENHANCED_SYSTEM_PROMPT}]
    messages_payload.extend(FEW_SHOT_EXAMPLES)
    
    previous_msgs = session_data.get("messages", [])
    for m in previous_msgs[-6:]: 
        messages_payload.append({"role": m["role"], "content": m["content"]})

    full_context = (
        f"--- REAL-TIME DATA ---\n"
        f"USER PORTFOLIO: {portfolio_ctx}\n"
        f"MARKET DATA: {market_ctx}\n"
        f"NEWS HEADLINES: {news_ctx}\n"
        f"----------------------"
    )
    messages_payload.append({'role': 'user', 'content': f"{full_context}\n\nUSER QUERY: {user_message}"})

    # 4. STREAM GENERATOR WITH RETRY
    async def response_generator():
        full_reply = ""
        client = AsyncClient() # Use Async Ollama Client
        stream_started = False
        
        for attempt in range(3): # Retry loop for Cold Start
            try:
                async for part in await client.chat(model='llama3.1', messages=messages_payload, stream=True):
                    stream_started = True
                    chunk = part['message']['content']
                    full_reply += chunk
                    yield chunk
                break # Success
            except Exception as e:
                print(f"Stream Error (Attempt {attempt+1}): {e}")
                if stream_started:
                    yield f"\n[Connection Error: {e}]"
                    break
                else:
                    await asyncio.sleep(2) # Wait for model load
                    if attempt == 2:
                        yield "My brain (Ollama) is offline. Check terminal."

        # 5. SAVE TO DB (After stream finishes)
        user_msg_obj = ChatMessage(role="user", content=user_message)
        bot_msg_obj = ChatMessage(role="assistant", content=full_reply)
        
        await chats_collection.update_one(
            {"id": session_id}, 
            {
                "$push": {"messages": {"$each": [user_msg_obj.dict(), bot_msg_obj.dict()]}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

    # Return Streaming Response with Session Metadata in Headers
    return StreamingResponse(
        response_generator(), 
        media_type="text/plain",
        headers={
            "X-Session-Id": session_id,
            "X-Title": session_data["title"]
        }
    )