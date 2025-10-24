from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from models.portfolio_model import PortfolioDB, Investment, Transaction, SellRequest
from database import portfolio_collection, users_collection, transactions_collection
from utils.fetch_data import fetch_stock_data
from utils.currency import get_exchange_rate
from bson import ObjectId

router = APIRouter()

# (The get_portfolio and buy_investment functions remain the same as the previous step)
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
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user: raise HTTPException(status_code=404, detail="User not found")
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
    users_collection.update_one({"_id": ObjectId(user_id)}, {"$inc": {"balance": -cost_in_inr}})
    get_portfolio(user_id) # Ensure portfolio exists
    portfolio_collection.update_one({"user_id": user_id}, {"$push": {"investments": investment.dict()}})
    transaction = Transaction(user_id=user_id, symbol=investment.symbol, type="BUY", quantity=investment.quantity, price_per_unit=investment.buy_price, price_per_unit_inr=investment.buy_price * rate, total_value_inr=cost_in_inr)
    transactions_collection.insert_one(transaction.dict())
    return {"message": "Investment purchased successfully"}

@router.post("/sell/{user_id}")
async def sell_investment(user_id: str, sell_request: SellRequest):
    print(f"--- Sell Request ---") # LOGGING
    print(f"User ID: {user_id}")
    print(f"Investment ID to Sell: {sell_request.investment_id}")
    print(f"Quantity to Sell: {sell_request.quantity_to_sell}")

    # Validate User ID format
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format")
        
    user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    # --- Refined Investment Finding ---
    # Use a projection to only get the matching investment sub-document first
    portfolio_projection = {"investments": {"$elemMatch": {"id": sell_request.investment_id}}}
    portfolio_doc = portfolio_collection.find_one(
        {"user_id": user_id},
        projection=portfolio_projection
    )

    if not portfolio_doc or not portfolio_doc.get("investments"):
        print(f"Investment ID {sell_request.investment_id} not found for user {user_id}") # LOGGING
        raise HTTPException(status_code=404, detail="Investment not found in portfolio")

    investment_to_sell_dict = portfolio_doc["investments"][0] # $elemMatch returns an array with one item
    investment_to_sell = Investment(**investment_to_sell_dict)
    print(f"Found Investment: {investment_to_sell.symbol}, Qty: {investment_to_sell.quantity}") # LOGGING

    # Validate Quantity
    qty_to_sell = sell_request.quantity_to_sell
    # Use tolerance for float comparison
    if qty_to_sell <= 1e-9 or qty_to_sell > investment_to_sell.quantity + 1e-9:
        print(f"Invalid quantity: {qty_to_sell} vs owned {investment_to_sell.quantity}") # LOGGING
        raise HTTPException(status_code=400, detail="Invalid quantity to sell")

    # Get live price
    try:
        live_data = fetch_stock_data(investment_to_sell.symbol)
        if live_data.get("error"):
            raise ValueError(live_data.get("error")) # Treat fetch error as an exception
        live_price = live_data.get("close")
        stock_currency = live_data.get("currency", "USD")
        if live_price is None or live_price <= 0:
             raise ValueError("Live price is invalid or zero.")
        print(f"Live Price: {live_price} {stock_currency}") # LOGGING
    except Exception as e:
        print(f"Failed to get live price for sell: {e}") # LOGGING
        raise HTTPException(status_code=500, detail=f"Could not fetch live price for {investment_to_sell.symbol}: {e}")

    # Convert sale value to INR
    total_sale_value_original = qty_to_sell * live_price
    sale_value_inr = total_sale_value_original
    rate = 1.0
    if stock_currency != "INR":
        rate = get_exchange_rate(stock_currency, "INR")
        if rate is None:
             print(f"Failed to get exchange rate for {stock_currency}/INR") # LOGGING
             raise HTTPException(status_code=500, detail="Could not get exchange rate")
        sale_value_inr = total_sale_value_original * rate
    print(f"Sale Value (INR): {sale_value_inr}") # LOGGING

    # --- Database Update Logic ---
    remaining_quantity = investment_to_sell.quantity - qty_to_sell
    
    # Use update_one result to confirm success
    update_result = None 
    if remaining_quantity < 1e-9: # Selling all or very close to all
        print(f"Removing investment {investment_to_sell.id} entirely.") # LOGGING
        update_result = portfolio_collection.update_one(
            {"user_id": user_id},
            {"$pull": {"investments": {"id": sell_request.investment_id}}}
        )
    else: # Selling partial quantity
        print(f"Updating quantity for {investment_to_sell.id} to {remaining_quantity}.") # LOGGING
        update_result = portfolio_collection.update_one(
            # Match specific investment within the array
            {"user_id": user_id, "investments.id": sell_request.investment_id}, 
            # Use positional operator $ to update the matched element
            {"$set": {"investments.$.quantity": remaining_quantity}} 
        )

    # Verify update was successful
    if update_result.modified_count == 0:
        print(f"DB portfolio update failed. Matched: {update_result.matched_count}, Modified: {update_result.modified_count}") # LOGGING
        # Possible race condition or ID mismatch, maybe the investment was already sold?
        raise HTTPException(status_code=500, detail="Failed to update portfolio in database.")

    # Add money back to user's balance
    balance_update_result = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"balance": sale_value_inr}}
    )
    if balance_update_result.modified_count == 0:
         # This should be rare, but indicates a problem updating user balance
         print(f"CRITICAL: Failed to update user balance for {user_id} after successful portfolio update.") # LOGGING
         # Consider how to handle this - maybe try to revert portfolio change? For now, raise error.
         raise HTTPException(status_code=500, detail="Failed to update user balance.")


    # Log the transaction
    try:
        transaction = Transaction(user_id=user_id, symbol=investment_to_sell.symbol, type="SELL", quantity=qty_to_sell, price_per_unit=live_price, price_per_unit_inr=live_price * rate, total_value_inr=sale_value_inr)
        transactions_collection.insert_one(transaction.dict())
        print(f"Sell transaction logged successfully.") # LOGGING
    except Exception as log_e:
        # Log error but don't fail the whole operation if logging fails
        print(f"Warning: Failed to log sell transaction: {log_e}") 

    print(f"--- Sell Request Completed Successfully ---") # LOGGING
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

    portfolio = get_portfolio(user_id) # Reuse existing helper
    
    total_investment_value_inr = 0.0
    fetch_errors = []

    for investment in portfolio.investments:
        try:
            live_data = fetch_stock_data(investment.symbol) # Get live data
            if live_data.get("error"):
                fetch_errors.append(f"Could not fetch price for {investment.symbol}")
                # Use buy price as fallback? Or skip? For now, skip.
                continue 
                
            live_price = live_data.get("close")
            stock_currency = live_data.get("currency", "USD")
            
            value_original_currency = investment.quantity * live_price
            value_inr = value_original_currency
            
            if stock_currency != "INR":
                rate = get_exchange_rate(stock_currency, "INR")
                if rate:
                    value_inr = value_original_currency * rate
                else:
                    fetch_errors.append(f"Could not get rate for {investment.symbol}")
                    # Use buy cost as fallback?
                    value_inr = investment.buy_cost_inr if investment.buy_cost_inr else 0
            
            total_investment_value_inr += value_inr
            
        except Exception as e:
            fetch_errors.append(f"Error processing {investment.symbol}: {e}")

    total_portfolio_value_inr = user_doc["balance"] + total_investment_value_inr

    return {
        "user_id": user_id,
        "cash_balance_inr": user_doc["balance"],
        "total_investment_value_inr": round(total_investment_value_inr, 2),
        "total_portfolio_value_inr": round(total_portfolio_value_inr, 2),
        "errors": fetch_errors # Optionally return errors
    }