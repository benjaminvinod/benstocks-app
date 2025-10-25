# routes/admin.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import users_collection, portfolio_collection, transactions_collection
from models.portfolio_model import Transaction
from datetime import datetime
import random
from bson import ObjectId # Make sure ObjectId is imported

router = APIRouter()

class DividendRequest(BaseModel):
    symbol: str
    dividend_per_share_inr: float

SAMPLE_DIVIDEND_STOCKS = [
    "AAPL", "MSFT", "JNJ", "PG", "RELIANCE.NS", "TCS.NS", "HINDUNILVR.NS", "ITC.NS"
]

# --- START: CORRECTED CODE ---
# This helper function is now fully corrected to use `await` and `async for` properly.
async def _issue_dividend_for_symbol(symbol: str, dividend_per_share: float):
    """Internal helper function to issue a dividend for one stock."""
    # `find` returns an AsyncIOMotorCursor, which MUST be iterated with `async for`.
    portfolios_cursor = portfolio_collection.find({"investments.symbol": symbol})
    users_paid = 0
    
    # Use `async for` to correctly iterate over the database cursor.
    async for portfolio in portfolios_cursor: # THIS WAS THE MAIN BUG FIX
        user_id = str(portfolio.get("user_id"))
        if not user_id:
            continue
            
        for investment in portfolio.get("investments", []):
            if investment.get("symbol") == symbol:
                quantity = investment.get("quantity", 0)
                dividend_amount = quantity * dividend_per_share
                
                if dividend_amount > 0:
                    # Add `await` before the database update operation.
                    update_result = await users_collection.update_one(
                        {"_id": ObjectId(user_id)},
                        {"$inc": {"balance": dividend_amount}}
                    )

                    # Optional: Check if update was successful
                    if update_result.matched_count == 0:
                        print(f"Warning: Could not find user {user_id} to update balance for dividend.")
                        continue # Skip to next user if this one failed

                    dividend_transaction = Transaction(
                        user_id=user_id,
                        symbol=symbol,
                        type="DIVIDEND",
                        quantity=quantity,
                        price_per_unit=dividend_per_share,
                        timestamp=datetime.utcnow(),
                        total_value_inr=dividend_amount
                    )
                    
                    # Add `await` before the database insert operation.
                    await transactions_collection.insert_one(dividend_transaction.dict())
                    
                    users_paid += 1
                break # Stop after finding the right investment in this portfolio
    return users_paid
# --- END: CORRECTED CODE ---


@router.post("/run-dividend-cycle")
async def run_dividend_cycle():
    """
    Simulates a dividend cycle.
    """
    dividends_issued = []
    total_users_paid_in_cycle = 0
    for symbol in SAMPLE_DIVIDEND_STOCKS:
        random_dividend = round(random.uniform(5.0, 50.0), 2)
        try:
            users_paid_for_symbol = await _issue_dividend_for_symbol(symbol, random_dividend)
            if users_paid_for_symbol > 0:
                dividends_issued.append({
                    "symbol": symbol,
                    "dividend_per_share_inr": random_dividend,
                    "users_paid": users_paid_for_symbol
                })
                total_users_paid_in_cycle += users_paid_for_symbol
        except Exception as e:
            print(f"Error issuing dividend for {symbol}: {e}") # Log errors but continue cycle
    
    if not dividends_issued:
        return {"message": "Dividend cycle ran, but no users owned any eligible dividend stocks or an error occurred."}

    return {
        "message": "Dividend cycle completed.",
        "details": dividends_issued,
        "total_users_paid_in_cycle": total_users_paid_in_cycle
    }

@router.post("/issue-dividend")
async def issue_dividend(request: DividendRequest):
    """
    (Manual) Issues a dividend to all users holding a specific stock.
    """
    try:
        users_paid = await _issue_dividend_for_symbol(request.symbol.upper(), request.dividend_per_share_inr)
        return {
            "message": f"Dividend for {request.symbol.upper()} processed.",
            "users_paid": users_paid
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to issue dividend for {request.symbol}: {e}")