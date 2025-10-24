# app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, portfolio, stocks, info, leaderboard

from routes import auth, portfolio, stocks, info

app = FastAPI(
    title="BenStocks API",
    description="Backend API for BenStocks fake investment simulator",
    version="0.1"
)

# CORS middleware to allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio"])
app.include_router(stocks.router, prefix="/stocks", tags=["Stocks"])
app.include_router(info.router, prefix="/info", tags=["Info"])
app.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])

@app.get("/")
async def root():
    return {"message": "Welcome to BenStocks!"}
