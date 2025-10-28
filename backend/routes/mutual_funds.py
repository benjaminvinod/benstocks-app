# backend/routes/mutual_funds.py
from fastapi import APIRouter, HTTPException
from utils.simulate_nav import get_simulated_nav, SIMULATED_FUNDS_DATA

router = APIRouter()

@router.get("")
async def get_all_mutual_funds():
    """
    Returns the list of all available simulated mutual funds, including their category.
    """
    fund_list = [
        {
            "id": fund_id,
            "name": details["name"],
            "baseNav": details["baseNav"],
            "category": details.get("category", "Uncategorized") # Include the category
        }
        for fund_id, details in SIMULATED_FUNDS_DATA.items()
    ]
    return fund_list

@router.get("/nav/{fund_id}")
async def get_mutual_fund_nav(fund_id: str):
    """
    Returns the consistent, simulated NAV for a specific mutual fund for the current day.
    """
    nav = get_simulated_nav(fund_id)
    if nav is None:
        raise HTTPException(status_code=404, detail="Mutual fund not found.")
    return {"fund_id": fund_id, "simulated_nav": nav}