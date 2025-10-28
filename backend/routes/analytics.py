# backend/routes/analytics.py
from fastapi import APIRouter, HTTPException
from routes.portfolio import get_portfolio, get_live_portfolio_value
from utils.diversification_calculator import calculate_diversification_score

router = APIRouter()

@router.get("/diversification-score/{user_id}")
async def get_diversification_score(user_id: str):
    """
    Analyzes a user's portfolio and returns a diversification score and feedback.
    """
    try:
        portfolio = await get_portfolio(user_id)
        live_data = await get_live_portfolio_value(user_id)
        
        investment_details = live_data.get("investment_details", {})
        
        score_data = calculate_diversification_score(portfolio.investments, investment_details)
        
        return score_data

    except Exception as e:
        print(f"Error calculating diversification score for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not calculate diversification score.")