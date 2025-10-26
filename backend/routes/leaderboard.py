# routes/leaderboard.py
from fastapi import APIRouter, HTTPException
from database import users_collection, portfolio_collection
from utils.fetch_data import fetch_stock_data
from utils.currency import get_exchange_rate
from bson import ObjectId
import asyncio

router = APIRouter()

async def calculate_user_portfolio_value(user_doc: dict) -> float:
    # Now uses await
    user_id = str(user_doc["_id"])
    cash_balance = user_doc.get("balance", 0.0)
    
    portfolio_doc = await portfolio_collection.find_one({"user_id": user_id})
    investments = portfolio_doc.get("investments", []) if portfolio_doc else []

    total_investment_value_inr = 0.0
    
    for investment_dict in investments:
        symbol = investment_dict.get("symbol")
        quantity = investment_dict.get("quantity")
        buy_cost_inr_fallback = investment_dict.get("buy_cost_inr", 0.0) 
        
        if not symbol or quantity is None or quantity <= 0:
            continue

        value_inr_for_this_investment = buy_cost_inr_fallback

        try:
            live_data = fetch_stock_data(symbol) 
            live_price = live_data.get("close")
            stock_currency = live_data.get("currency", "USD")
            
            if live_price is not None and live_price > 0:
                value_original_currency = quantity * live_price
                live_value_inr = value_original_currency
                
                if stock_currency != "INR":
                    rate = get_exchange_rate(stock_currency, "INR")
                    if rate:
                        live_value_inr = value_original_currency * rate
                    else: 
                         live_value_inr = buy_cost_inr_fallback
                
                value_inr_for_this_investment = live_value_inr
            
        except Exception as e:
            print(f"Error getting live value for {symbol} during leaderboard calc: {e}. Using fallback.")

        total_investment_value_inr += value_inr_for_this_investment

    return cash_balance + total_investment_value_inr

@router.get("")
async def get_leaderboard(limit: int = 10):
    # Now uses await
    try:
        cursor = users_collection.find({}, {"username": 1, "balance": 1, "_id": 1})
        all_users = await cursor.to_list(length=None) # Fetch all users
        
        tasks = [calculate_user_portfolio_value(user_doc) for user_doc in all_users]
        all_values = await asyncio.gather(*tasks)

        leaderboard_data = []
        for i, user_doc in enumerate(all_users):
             leaderboard_data.append({
                 "username": user_doc.get("username", f"User_{str(user_doc['_id'])[-4:]}"),
                 "total_value_inr": round(all_values[i], 2)
             })
            
        leaderboard_data.sort(key=lambda x: x["total_value_inr"], reverse=True)
        
        return leaderboard_data[:limit]

    except Exception as e:
        print(f"Error generating leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Could not generate leaderboard.")