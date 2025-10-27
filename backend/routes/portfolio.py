# routes/portfolio.py

from fastapi import APIRouter, HTTPException
from typing import List, Dict
from datetime import datetime
from models.portfolio_model import PortfolioDB, Investment, Transaction, SellRequest
from database import portfolio_collection, users_collection, transactions_collection
from utils.fetch_data import fetch_stock_data
from utils.currency import get_exchange_rate
from utils.simulate_nav import get_simulated_nav
from bson import ObjectId
import yfinance as yf

router = APIRouter()

SIMULATED_MF_IDS = [
    "UTINIFTY", "PARA-FLEXI", "AXIS-BLUE", "QUAN-SMALL", "PGIM-MID", "VTSAX-SIM",
    "MIRAE-LARGE", "SBI-BLUE", "HDFC-MID", "KOTAK-EMG", "NIPPON-SMALL", "ICICI-PRU-BLUE",
    "DSP-FLEXI", "EDEL-MID", "INV-CONTRA", "FRANK-BLUE", "TATA-DIGITAL", "ICICI-TECH",
    "SBI-CONTRA", "HDFC-FLEXI"
]

async def get_portfolio(user_id: str) -> PortfolioDB:
    portfolio = await portfolio_collection.find_one({"user_id": user_id})
    if not portfolio:
        result = await portfolio_collection.insert_one({"user_id": user_id, "investments": []})
        portfolio = await portfolio_collection.find_one({"_id": result.inserted_id})
    portfolio["id"] = str(portfolio["_id"])
    return PortfolioDB(**portfolio)

@router.get("/{user_id}")
async def fetch_portfolio(user_id: str):
    return await get_portfolio(user_id)

@router.post("/buy/{user_id}")
async def buy_investment(user_id: str, investment: Investment):
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user: raise HTTPException(status_code=404, detail="User not found")

    if investment.symbol in SIMULATED_MF_IDS:
        cost_in_inr = investment.quantity * investment.buy_price
        investment.buy_cost_inr = cost_in_inr
        rate = 1.0
    else:
        stock_data = fetch_stock_data(investment.symbol)
        if stock_data.get("error"): raise HTTPException(status_code=400, detail=f"Could not fetch data for {investment.symbol}")
        stock_currency = stock_data.get("currency", "USD")
        total_cost_original_currency = investment.quantity * investment.buy_price
        cost_in_inr = total_cost_original_currency
        rate = 1.0
        if stock_currency != "INR":
            rate = get_exchange_rate(stock_currency, "INR")
            if rate is None: raise HTTPException(status_code=500, detail=f"Could not get exchange rate for {stock_currency}/INR")
            cost_in_inr = total_cost_original_currency * rate
        investment.buy_cost_inr = cost_in_inr
        
    if user["balance"] < cost_in_inr: raise HTTPException(status_code=400, detail="Insufficient balance")

    await users_collection.update_one({"_id": ObjectId(user_id)}, {"$inc": {"balance": -cost_in_inr}})
    await get_portfolio(user_id)
    await portfolio_collection.update_one({"user_id": user_id}, {"$push": {"investments": investment.dict()}})
    
    transaction = Transaction(user_id=user_id, symbol=investment.symbol, type="BUY", quantity=investment.quantity, price_per_unit=investment.buy_price, price_per_unit_inr=investment.buy_price * rate, total_value_inr=cost_in_inr)
    await transactions_collection.insert_one(transaction.dict())
    
    return {"message": "Investment purchased successfully"}

@router.post("/sell/{user_id}")
async def sell_investment(user_id: str, sell_request: SellRequest):
    if not ObjectId.is_valid(user_id): raise HTTPException(status_code=400, detail="Invalid user ID format")
    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc: raise HTTPException(status_code=404, detail="User not found")
    
    portfolio_doc = await portfolio_collection.find_one(
        {"user_id": user_id, "investments.id": sell_request.investment_id},
        projection={"investments.$": 1}
    )
    if not portfolio_doc or not portfolio_doc.get("investments"):
        raise HTTPException(status_code=404, detail="Investment not found in portfolio")
    
    investment_to_sell = Investment(**portfolio_doc["investments"][0])
    qty_to_sell = sell_request.quantity_to_sell
    if qty_to_sell <= 1e-9 or qty_to_sell > investment_to_sell.quantity + 1e-9:
        raise HTTPException(status_code=400, detail="Invalid quantity to sell")

    if investment_to_sell.symbol in SIMULATED_MF_IDS:
        live_price = get_simulated_nav(investment_to_sell.symbol)
        if not live_price:
            raise HTTPException(status_code=500, detail="Could not fetch simulated price for mutual fund.")
        stock_currency = "INR"
    else:
        try:
            live_data = fetch_stock_data(investment_to_sell.symbol)
            if live_data.get("error"): raise ValueError(live_data.get("error"))
            live_price = live_data.get("close")
            stock_currency = live_data.get("currency", "USD")
            if live_price is None or live_price <= 0: raise ValueError("Live price is invalid or zero.")
        except Exception as e: raise HTTPException(status_code=500, detail=f"Could not fetch live price for {investment_to_sell.symbol}: {e}")
        
    total_sale_value_original = qty_to_sell * live_price
    sale_value_inr = total_sale_value_original
    rate = 1.0
    if stock_currency != "INR":
        rate = get_exchange_rate(stock_currency, "INR")
        if rate is None: raise HTTPException(status_code=500, detail="Could not get exchange rate")
        sale_value_inr = total_sale_value_original * rate
        
    remaining_quantity = investment_to_sell.quantity - qty_to_sell
    if remaining_quantity < 1e-9:
        update_result = await portfolio_collection.update_one({"user_id": user_id}, {"$pull": {"investments": {"id": sell_request.investment_id}}})
    else:
        update_result = await portfolio_collection.update_one({"user_id": user_id, "investments.id": sell_request.investment_id}, {"$set": {"investments.$.quantity": remaining_quantity}})
        
    if update_result.modified_count == 0: raise HTTPException(status_code=500, detail="Failed to update portfolio in database.")
    
    await users_collection.update_one({"_id": ObjectId(user_id)}, {"$inc": {"balance": sale_value_inr}})
    
    try:
        transaction = Transaction(user_id=user_id, symbol=investment_to_sell.symbol, type="SELL", quantity=qty_to_sell, price_per_unit=live_price, price_per_unit_inr=live_price * rate, total_value_inr=sale_value_inr)
        await transactions_collection.insert_one(transaction.dict())
    except Exception as log_e: print(f"Warning: Failed to log sell transaction: {log_e}")
    
    return {"message": "Investment sold successfully"}

@router.get("/transactions/{user_id}")
async def get_transactions(user_id: str):
    cursor = transactions_collection.find({"user_id": user_id}).sort("timestamp", -1)
    transactions = await cursor.to_list(length=100)
    for t in transactions:
        t["id"] = str(t["_id"])
        del t["_id"]
    return transactions

@router.get("/value/{user_id}")
async def get_live_portfolio_value(user_id: str):
    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    portfolio = await get_portfolio(user_id)
    if not portfolio.investments:
        return {"user_id": user_id, "cash_balance_inr": user_doc["balance"], "total_investment_value_inr": 0.0, "total_portfolio_value_inr": user_doc["balance"], "investment_details": {}, "errors": []}

    symbols_to_fetch = {inv.symbol for inv in portfolio.investments if inv.symbol not in SIMULATED_MF_IDS}

    live_prices_data = {}
    if symbols_to_fetch:
        tickers_str = " ".join(symbols_to_fetch)
        tickers = yf.Tickers(tickers_str)
        for symbol in symbols_to_fetch:
            try:
                info = tickers.tickers[symbol.upper()].info
                price = info.get("currentPrice") or info.get("regularMarketPrice")
                currency = info.get("currency", "USD")
                if price:
                    live_prices_data[symbol] = {"price": price, "currency": currency}
            except Exception:
                print(f"Could not fetch bulk info for {symbol}")

    total_investment_value_inr = 0.0
    investment_details = {}
    fetch_errors = []

    for investment in portfolio.investments:
        value_inr = 0
        if investment.symbol in SIMULATED_MF_IDS:
            live_nav = get_simulated_nav(investment.symbol)
            if live_nav:
                value_inr = investment.quantity * live_nav
            else:
                value_inr = investment.buy_cost_inr or 0
        else:
            live_data = live_prices_data.get(investment.symbol)
            if not live_data:
                fetch_errors.append(f"Could not fetch price for {investment.symbol}")
                value_inr = investment.buy_cost_inr or 0
            else:
                live_price = live_data["price"]
                stock_currency = live_data["currency"]
                value_original_currency = investment.quantity * live_price
                value_inr = value_original_currency
                if stock_currency != "INR":
                    rate = get_exchange_rate(stock_currency, "INR")
                    if rate: value_inr = value_original_currency * rate
                    else:
                        fetch_errors.append(f"Could not get rate for {investment.symbol}")
                        value_inr = investment.buy_cost_inr or 0

        total_investment_value_inr += value_inr
        investment_details[investment.id] = {"live_value_inr": round(value_inr, 2)}

    total_portfolio_value_inr = user_doc["balance"] + total_investment_value_inr

    return {"user_id": user_id, "cash_balance_inr": user_doc["balance"], "total_investment_value_inr": round(total_investment_value_inr, 2), "total_portfolio_value_inr": round(total_portfolio_value_inr, 2), "investment_details": investment_details, "errors": fetch_errors}

@router.get("/watchlist/{user_id}")
async def get_watchlist(user_id: str):
    user = await users_collection.find_one({"_id": ObjectId(user_id)}, {"watchlist": 1})
    if not user: raise HTTPException(status_code=404, detail="User not found")
    return user.get("watchlist", [])

@router.post("/watchlist/{user_id}")
async def add_to_watchlist(user_id: str, stock: Dict[str, str]):
    symbol = stock.get("symbol")
    if not symbol: raise HTTPException(status_code=400, detail="Stock symbol is required")
    result = await users_collection.update_one({"_id": ObjectId(user_id)}, {"$addToSet": {"watchlist": symbol.upper()}})
    if result.matched_count == 0: raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"{symbol.upper()} added to watchlist"}

@router.delete("/watchlist/{user_id}/{symbol}")
async def remove_from_watchlist(user_id: str, symbol: str):
    result = await users_collection.update_one({"_id": ObjectId(user_id)}, {"$pull": {"watchlist": symbol.upper()}})
    if result.modified_count == 0: 
        user_exists = await users_collection.count_documents({"_id": ObjectId(user_id)}) > 0
        if not user_exists:
             raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"{symbol.upper()} removed from watchlist"}