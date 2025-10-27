# app.py
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, portfolio, stocks, info, leaderboard, admin, news, mutual_funds
from websocket_manager import manager, price_updater_task

app = FastAPI(
    title="BenStocks API",
    description="Backend API for BenStocks fake investment simulator",
    version="0.1"
)

@app.on_event("startup")
async def startup_event():
    """On startup, create the background task for price updates."""
    asyncio.create_task(price_updater_task())

# CORS middleware remains the same
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all the existing, working routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio"])
app.include_router(stocks.router, prefix="/stocks", tags=["Stocks"])
app.include_router(info.router, prefix="/info", tags=["Info"])
app.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(news.router, prefix="/news", tags=["News"])
app.include_router(mutual_funds.router, prefix="/mutual-funds", tags=["Mutual Funds"])


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