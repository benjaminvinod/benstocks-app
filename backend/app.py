# app.py
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, portfolio, stocks, info, leaderboard, admin, news, mutual_funds, analytics, chat
from websocket_manager import manager, price_updater_task, start_price_updater_on_startup

app = FastAPI(
    title="BenStocks API",
    description="Backend API for BenStocks fake investment simulator",
    version="0.1"
)

@app.on_event("startup")
async def startup_event():
    # Starts the background task to fetch live prices using the new robust startup helper
    # This ensures the cache is primed before the first user connects
    await start_price_updater_on_startup()

# --- SECURITY FIX: Restrict CORS to Frontend URL ---
origins = [
    "http://localhost:3000",      # Standard React local port
    "http://127.0.0.1:3000",      # Alternative local IP
    "http://localhost:8000",      # Backend self-reference
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registering all routes
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio"])
app.include_router(stocks.router, prefix="/stocks", tags=["Stocks"])
app.include_router(info.router, prefix="/info", tags=["Info"])
app.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(news.router, prefix="/news", tags=["News"])
app.include_router(mutual_funds.router, prefix="/mutual-funds", tags=["Mutual Funds"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(chat.router, prefix="/chat", tags=["AI Chat"]) 

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
async def root():
    return {"message": "Welcome to BenStocks!"}