# routes/leaderboard.py
from fastapi import APIRouter, HTTPException
from database import users_collection, portfolio_collection # Correct imports
from utils.fetch_data import fetch_stock_data
from utils.currency import get_exchange_rate
from models.portfolio_model import PortfolioDB 
from bson import ObjectId
import asyncio

router = APIRouter()

# --- Refined Portfolio Value Calculation ---
async def calculate_user_portfolio_value(user_doc: dict) -> float:
    """Calculates the TOTAL portfolio value (Cash + Live Investment Value in INR)."""
    user_id = str(user_doc["_id"])
    cash_balance = user_doc.get("balance", 0.0)
    
    portfolio_doc = portfolio_collection.find_one({"user_id": user_id})
    investments = []
    if portfolio_doc and "investments" in portfolio_doc:
        investments = portfolio_doc["investments"]

    total_investment_value_inr = 0.0
    
    # --- Potentially optimize fetching prices ---
    # You could fetch prices concurrently for better performance
    # For simplicity, we keep sequential fetching here.
    
    for investment_dict in investments:
        symbol = investment_dict.get("symbol")
        quantity = investment_dict.get("quantity")
        # Use buy_cost_inr as a fallback if live price fails
        buy_cost_inr_fallback = investment_dict.get("buy_cost_inr", 0.0) 
        
        if not symbol or quantity is None or quantity <= 0:
            continue

        value_inr_for_this_investment = buy_cost_inr_fallback # Start with fallback

        try:
            live_data = fetch_stock_data(symbol) 
            live_price = live_data.get("close")
            stock_currency = live_data.get("currency", "USD")
            
            if live_price is not None and live_price > 0: # Check if live price is valid
                value_original_currency = quantity * live_price
                live_value_inr = value_original_currency
                rate = 1.0
                
                if stock_currency != "INR":
                    rate = get_exchange_rate(stock_currency, "INR")
                    if rate:
                        live_value_inr = value_original_currency * rate
                    else: 
                         # If rate fails, use fallback value calculated earlier
                         live_value_inr = buy_cost_inr_fallback
                
                # Use the calculated live value if successful
                value_inr_for_this_investment = live_value_inr
            # else: keep using the buy_cost_inr_fallback initialized earlier
            
        except Exception as e:
            print(f"Error getting live value for {symbol} during leaderboard calc: {e}. Using fallback.")
            # Keep using the buy_cost_inr_fallback if any error occurs

        total_investment_value_inr += value_inr_for_this_investment

    # Total Value = Cash + Sum of Live Investment Values (INR)
    return cash_balance + total_investment_value_inr


# --- Leaderboard Endpoint (mostly unchanged, uses refined calculation) ---
@router.get("")
async def get_leaderboard(limit: int = 10):
    """Retrieves the top users ranked by their total portfolio value (live)."""
    try:
        # Fetch only necessary fields to reduce data transfer
        all_users = list(users_collection.find({}, {"username": 1, "balance": 1, "_id": 1})) 
        
        leaderboard_data = []
        
        # Calculate value for each user sequentially (can be slow)
        # For better performance with many users, consider asyncio.gather
        tasks = [calculate_user_portfolio_value(user_doc) for user_doc in all_users]
        all_values = await asyncio.gather(*tasks) # Run calculations concurrently

        for i, user_doc in enumerate(all_users):
             leaderboard_data.append({
                 "username": user_doc.get("username", f"User_{str(user_doc['_id'])[-4:]}"), # Use part of ID if no username
                 "total_value_inr": round(all_values[i], 2)
             })
            
        # Sort by value descending
        leaderboard_data.sort(key=lambda x: x["total_value_inr"], reverse=True)
        
        return leaderboard_data[:limit]

    except Exception as e:
        print(f"Error generating leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Could not generate leaderboard.")