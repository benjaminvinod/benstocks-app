# backend/routes/chat.py
import asyncio
import re
from datetime import datetime
from typing import List, Optional

import ollama
from fastapi import APIRouter, HTTPException, Body
from database import chats_collection
from models.chat_model import ChatSession, ChatMessage, CreateChatRequest
from routes.portfolio import get_portfolio
from utils.fetch_data import fetch_stock_data
from utils.prompts import PORTIFY_SYSTEM_PROMPT, FEW_SHOT_EXAMPLES

router = APIRouter()

# --- CONSTANTS ---
TICKER_BLACKLIST = {
    "AND", "THE", "FOR", "NEW", "BUY", "SELL", "WHO", "WHAT", 
    "ARE", "YOU", "IS", "IT", "NOW", "NOT", "YES", "WHY", 
    "HOW", "CAN", "LOW", "HIGH", "OUT", "GET", "SET", "LONG", 
    "SHORT", "HOLD", "GOOD", "BAD", "TIME", "REAL", "FAKE"
}

# --- HELPERS ---

def sanitize_input(text: str) -> str:
    return re.sub(r'[^\w\s.,?!@#$%^&*()\-]', '', text).strip()

def extract_potential_tickers(text: str) -> List[str]:
    words = text.split()
    candidates = []
    for word in words:
        clean = re.sub(r'[^a-zA-Z.]', '', word).upper()
        if 2 <= len(clean) <= 12 and clean not in TICKER_BLACKLIST:
            candidates.append(clean)
    return list(set(candidates))

async def smart_fetch_stock_data(symbol: str):
    """Fetches data and adds intelligence (Drop from High, etc)."""
    # 1. Try exact match
    data = await asyncio.to_thread(fetch_stock_data, symbol)
    
    # 2. Fallback to .NS
    if ("error" in data or not data.get("close")) and "." not in symbol:
        indian_symbol = f"{symbol}.NS"
        data_ns = await asyncio.to_thread(fetch_stock_data, indian_symbol)
        if "error" not in data_ns:
            data = data_ns
            
    # 3. Smart Calculations
    if "error" not in data and data.get("close"):
        try:
            current = data.get("close", 0)
            high_52 = data.get("week_52_high", current)
            low_52 = data.get("week_52_low", current)
            if high_52:
                dip = ((high_52 - current) / high_52) * 100
                data["smart_dip"] = f"{dip:.1f}% below ATH"
            if low_52:
                rally = ((current - low_52) / low_52) * 100
                data["smart_rally"] = f"{rally:.1f}% above Lows"
        except Exception:
            pass
    return data

# --- ROUTES ---

@router.get("/sessions/{user_id}")
async def get_user_sessions(user_id: str):
    """Returns a list of all chat sessions for the sidebar."""
    cursor = chats_collection.find({"user_id": user_id}).sort("updated_at", -1)
    sessions = await cursor.to_list(length=50)
    return [{"id": s["id"], "title": s["title"], "date": s["updated_at"]} for s in sessions]

@router.get("/history/{session_id}")
async def get_chat_history(session_id: str):
    """Returns the full message history for a specific chat."""
    session = await chats_collection.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.delete("/{session_id}")
async def delete_chat_session(session_id: str):
    result = await chats_collection.delete_one({"id": session_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Deleted"}

@router.post("/")
async def chat_with_advisor(request: CreateChatRequest):
    user_id = request.user_id
    raw_message = request.message
    session_id = request.session_id
    
    if not raw_message:
         raise HTTPException(status_code=400, detail="Empty message")

    user_message = sanitize_input(raw_message)

    # 1. Load or Create Session
    session_data = None
    if session_id:
        session_data = await chats_collection.find_one({"id": session_id})
    
    if not session_data:
        # Create New Session with Auto-Title
        title = " ".join(user_message.split()[:5]) + "..."
        new_session = ChatSession(user_id=user_id, title=title)
        session_data = new_session.dict()
    
    # 2. Build Context (Portfolio + Market Data)
    portfolio_summary = "Cash Only."
    try:
        pf = await get_portfolio(user_id)
        if pf.investments:
            holdings = [f"{inv.symbol} ({inv.quantity:.1f} qty)" for inv in pf.investments]
            portfolio_summary = f"Holdings: {', '.join(holdings)} | Cash: ${pf.history[-1].cash_balance:.0f}"
    except: pass

    tickers = extract_potential_tickers(user_message)
    market_context = ""
    if tickers:
        tasks = [smart_fetch_stock_data(t) for t in tickers]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for data in results:
            if isinstance(data, dict) and "error" not in data:
                market_context += (
                    f"| {data.get('symbol')} | {data.get('currency', '')} {data.get('close')} | "
                    f"PE: {data.get('pe_ratio','N/A')} | "
                    f"{data.get('smart_dip','')} |\n"
                )

    # 3. Build Prompt
    messages_payload = [{'role': 'system', 'content': PORTIFY_SYSTEM_PROMPT}]
    messages_payload.extend(FEW_SHOT_EXAMPLES)
    
    # Add Previous History (Limit to last 6 turns to save context window)
    previous_msgs = session_data.get("messages", [])
    for m in previous_msgs[-6:]: 
        messages_payload.append({"role": m["role"], "content": m["content"]})

    # Add Context + Current Message
    context_block = f"CONTEXT:\nPortfolio: {portfolio_summary}\nMarket Data:\n{market_context}"
    messages_payload.append({'role': 'user', 'content': f"{context_block}\n\nQUERY: {user_message}"})

    # 4. Run AI
    try:
        response = await asyncio.to_thread(ollama.chat, model='llama3.1', messages=messages_payload)
        bot_reply = response['message']['content']
    except Exception as e:
        print(f"AI Error: {e}")
        bot_reply = "My connection to the market server (Ollama) failed. Please check your terminal."

    # 5. Save to DB
    user_msg_obj = ChatMessage(role="user", content=user_message)
    bot_msg_obj = ChatMessage(role="assistant", content=bot_reply)
    
    if session_id and await chats_collection.find_one({"id": session_id}):
        await chats_collection.update_one(
            {"id": session_id}, 
            {
                "$push": {"messages": {"$each": [user_msg_obj.dict(), bot_msg_obj.dict()]}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    else:
        # Insert new session
        session_data["messages"] = [user_msg_obj.dict(), bot_msg_obj.dict()]
        # Ensure we use the session ID we generated
        session_id = session_data["id"] 
        await chats_collection.insert_one(session_data)

    return {"response": bot_reply, "session_id": session_id, "title": session_data["title"]}