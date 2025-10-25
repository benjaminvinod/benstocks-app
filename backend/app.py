# app.py
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
# --- START: MODIFIED CODE ---
# The 'mutual_funds' import is removed
from routes import auth, portfolio, stocks, info, leaderboard, admin
# --- END: MODIFIED CODE ---
from websocket_manager import manager, price_updater_task

app = FastAPI(
    title="BenStocks API",
    description="Backend API for BenStocks fake investment simulator",
    version="0.1"
)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(price_updater_task())

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio"])
app.include_router(stocks.router, prefix="/stocks", tags=["Stocks"])
app.include_router(info.router, prefix="/info", tags=["Info"])
app.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
# --- START: MODIFIED CODE ---
# The mutual_funds router is removed from here
# --- END: MODIFIED CODE ---

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