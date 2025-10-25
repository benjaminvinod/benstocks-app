from fastapi import APIRouter, HTTPException
from typing import List, Dict
from datetime import datetime
from models.portfolio_model import PortfolioDB, Investment, Transaction, SellRequest
from database import portfolio_collection, users_collection, transactions_collection
from utils.fetch_data import fetch_stock_data
from utils.currency import get_exchange_rate
from bson import ObjectId

router = APIRouter()

# --- START: MODIFIED CODE ---
# A list of our simulated Mutual Fund IDs. The backend will use this as a special checklist.
SIMULATED_MF_IDS = [
    "UTINIFTY", "PARA-FLEXI", "AXIS-BLUE", "QUAN-SMALL", "PGIM-MID", "VTSAX-SIM",
    "MIRAE-LARGE", "SBI-BLUE", "HDFC-MID", "KOTAK-EMG", "NIPPON-SMALL", "ICICI-PRU-BLUE",
    "DSP-FLEXI", "EDEL-MID", "INV-CONTRA", "FRANK-BLUE", "TATA-DIGITAL", "ICICI-TECH",
    "SBI-CONTRA", "HDFC-FLEXI"
]
# --- END: MODIFIED CODE ---

def get_portfolio(user_id: str) -> PortfolioDB:
    portfolio = portfolio_collection.find_one({"user_id": user_id})
    if not portfolio:
        portfolio_id = portfolio_collection.insert_one({"user_id": user_id, "investments": []}).inserted_id
        portfolio = portfolio_collection.find_one({"_id": portfolio_id})
    portfolio["id"] = str(portfolio["_id"])
    return PortfolioDB(**portfolio)

@router.get("/{user_id}")
async def fetch_portfolio(user_id: str):
    return get_portfolio(user_id)

@router.post("/buy/{user_id}")
async def buy_investment(user_id: str, investment: Investment):
    # This is the full, corrected function
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # This is the new conditional logic
    if investment.symbol in SIMULATED_MF_IDS:
        # --- PATH 1: This is a Simulated Mutual Fund ---
        print(f"Processing simulated MF purchase for: {investment.symbol}")
        # We trust the NAV (buy_price) from the frontend
        cost_in_inr = investment.quantity * investment.buy_price
        investment.buy_cost_inr = cost_in_inr
        rate = 1.0 # Assumed INR
    else:
        # --- PATH 2: This is a real Stock or ETF (Original Logic) ---
        print(f"Processing live stock/ETF purchase for: {investment.symbol}")
        stock_data = fetch_stock_data(investment.symbol)
        if stock_data.get("error"):
            raise HTTPException(status_code=400, detail=f"Could not fetch data for {investment.symbol}")
        
        stock_currency = stock_data.get("currency", "USD")
        total_cost_original_currency = investment.quantity * investment.buy_price
        cost_in_inr = total_cost_original_currency
        rate = 1.0
        if stock_currency != "INR":
            rate = get_exchange_rate(stock_currency, "INR")
            if rate is None:
                raise HTTPException(status_code=500, detail=f"Could not get exchange rate for {stock_currency}/INR")
            cost_in_inr = total_cost_original_currency * rate
        investment.buy_cost_inr = cost_in_inr

    # The rest of the function is the same for both paths
    if user["balance"] < cost_in_inr:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    users_collection.update_one({"_id": ObjectId(user_id)}, {"$inc": {"balance": -cost_in_inr}})
    get_portfolio(user_id)  # Ensure portfolio exists
    portfolio_collection.update_one({"user_id": user_id}, {"$push": {"investments": investment.dict()}})
    
    transaction = Transaction(
        user_id=user_id,
        symbol=investment.symbol,
        type="BUY",
        quantity=investment.quantity,
        price_per_unit=investment.buy_price,
        price_per_unit_inr=investment.buy_price * rate,
        total_value_inr=cost_in_inr
    )
    transactions_collection.insert_one(transaction.dict())
    
    return {"message": "Investment purchased successfully"}


@router.post("/sell/{user_id}")
async def sell_investment(user_id: str, sell_request: SellRequest):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    portfolio_projection = {"investments": {"$elemMatch": {"id": sell_request.investment_id}}}
    portfolio_doc = portfolio_collection.find_one({"user_id": user_id}, projection=portfolio_projection)
    if not portfolio_doc or not portfolio_doc.get("investments"):
        raise HTTPException(status_code=404, detail="Investment not found in portfolio")
    investment_to_sell_dict = portfolio_doc["investments"][0]
    investment_to_sell = Investment(**investment_to_sell_dict)
    qty_to_sell = sell_request.quantity_to_sell
    if qty_to_sell <= 1e-9 or qty_to_sell > investment_to_sell.quantity + 1e-9:
        raise HTTPException(status_code=400, detail="Invalid quantity to sell")
    
    # --- START: MODIFIED SELL LOGIC ---
    # We must also teach the sell function to handle simulated MFs
    if investment_to_sell.symbol in SIMULATED_MF_IDS:
        # For simulated MFs, we'll use the buy price as the sell price for simplicity
        live_price = investment_to_sell.buy_price
        stock_currency = "INR" # Assume INR
    else:
        # Original logic for real stocks/ETFs
        try:
            live_data = fetch_stock_data(investment_to_sell.symbol)
            if live_data.get("error"): raise ValueError(live_data.get("error"))
            live_price = live_data.get("close")
            stock_currency = live_data.get("currency", "USD")
            if live_price is None or live_price <= 0: raise ValueError("Live price is invalid or zero.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not fetch live price for {investment_to_sell.symbol}: {e}")
    # --- END: MODIFIED SELL LOGIC ---

    total_sale_value_original = qty_to_sell * live_price
    sale_value_inr = total_sale_value_original
    rate = 1.0
    if stock_currency != "INR":
        rate = get_exchange_rate(stock_currency, "INR")
        if rate is None: raise HTTPException(status_code=500, detail="Could not get exchange rate")
        sale_value_inr = total_sale_value_original * rate
    
    remaining_quantity = investment_to_sell.quantity - qty_to_sell
    if remaining_quantity < 1e-9:
        update_result = portfolio_collection.update_one({"user_id": user_id}, {"$pull": {"investments": {"id": sell_request.investment_id}}})
    else:
        update_result = portfolio_collection.update_one({"user_id": user_id, "investments.id": sell_request.investment_id}, {"$set": {"investments.$.quantity": remaining_quantity}})
    
    if update_result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update portfolio in database.")
    
    balance_update_result = users_collection.update_one({"_id": ObjectId(user_id)}, {"$inc": {"balance": sale_value_inr}})
    if balance_update_result.modified_count == 0:
         raise HTTPException(status_code=500, detail="Failed to update user balance.")
    
    try:
        transaction = Transaction(user_id=user_id, symbol=investment_to_sell.symbol, type="SELL", quantity=qty_to_sell, price_per_unit=live_price, price_per_unit_inr=live_price * rate, total_value_inr=sale_value_inr)
        transactions_collection.insert_one(transaction.dict())
    except Exception as log_e:
        print(f"Warning: Failed to log sell transaction: {log_e}")
        
    return {"message": "Investment sold successfully"}


@router.get("/transactions/{user_id}")
async def get_transactions(user_id: str):
    transactions = list(transactions_collection.find({"user_id": user_id}).sort("timestamp", -1))
    for t in transactions:
        t["id"] = str(t["_id"])
        del t["_id"]
    return transactions


@router.get("/value/{user_id}")
async def get_live_portfolio_value(user_id: str):
    user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    portfolio = get_portfolio(user_id)
    
    total_investment_value_inr = 0.0
    investment_details = {}
    fetch_errors = []

    for investment in portfolio.investments:
        value_inr = 0
        try:
            # --- START: MODIFIED VALUE LOGIC ---
            # Also teach the value function to handle simulated MFs
            if investment.symbol in SIMULATED_MF_IDS:
                # For MFs, the "live" value is the same as the buy cost for this simulation
                value_inr = investment.buy_cost_inr if investment.buy_cost_inr else 0
            else:
                # Original logic for real stocks/ETFs
                live_data = fetch_stock_data(investment.symbol)
                if live_data.get("error"):
                    fetch_errors.append(f"Could not fetch price for {investment.symbol}")
                    continue
                live_price = live_data.get("close")
                stock_currency = live_data.get("currency", "USD")
                value_original_currency = investment.quantity * live_price
                value_inr = value_original_currency
                if stock_currency != "INR":
                    rate = get_exchange_rate(stock_currency, "INR")
                    if rate: value_inr = value_original_currency * rate
                    else:
                        fetch_errors.append(f"Could not get rate for {investment.symbol}")
                        value_inr = investment.buy_cost_inr if investment.buy_cost_inr else 0
            # --- END: MODIFIED VALUE LOGIC ---

            total_investment_value_inr += value_inr
            investment_details[investment.id] = {"live_value_inr": round(value_inr, 2)}
            
        except Exception as e:
            fetch_errors.append(f"Error processing {investment.symbol}: {e}")

    total_portfolio_value_inr = user_doc["balance"] + total_investment_value_inr

    return {
        "user_id": user_id,
        "cash_balance_inr": user_doc["balance"],
        "total_investment_value_inr": round(total_investment_value_inr, 2),
        "total_portfolio_value_inr": round(total_portfolio_value_inr, 2),
        "investment_details": investment_details,
        "errors": fetch_errors
    }


@router.get("/watchlist/{user_id}")
async def get_watchlist(user_id: str):
    user = users_collection.find_one({"_id": ObjectId(user_id)}, {"watchlist": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.get("watchlist", [])

@router.post("/watchlist/{user_id}")
async def add_to_watchlist(user_id: str, stock: Dict[str, str]):
    symbol = stock.get("symbol")
    if not symbol:
        raise HTTPException(status_code=400, detail="Stock symbol is required")
    result = users_collection.update_one({"_id": ObjectId(user_id)}, {"$addToSet": {"watchlist": symbol.upper()}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"{symbol.upper()} added to watchlist"}

@router.delete("/watchlist/{user_id}/{symbol}")
async def remove_from_watchlist(user_id: str, symbol: str):
    result = users_collection.update_one({"_id": ObjectId(user_id)}, {"$pull": {"watchlist": symbol.upper()}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"{symbol.upper()} removed from watchlist"}