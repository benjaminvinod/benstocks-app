# backend/routes/alerts.py
from fastapi import APIRouter, HTTPException, Body
from typing import List
from models.portfolio_model import PriceAlert
from database import alerts_collection
from bson import ObjectId

router = APIRouter()

@router.post("/")
async def create_alert(alert: PriceAlert):
    """
    Creates a new price alert.
    """
    alert_dict = alert.dict()
    await alerts_collection.insert_one(alert_dict)
    return {"message": f"Alert set for {alert.symbol} {alert.condition} {alert.target_price}"}

@router.get("/{user_id}")
async def get_user_alerts(user_id: str):
    """
    Fetches all active alerts for a user.
    """
    cursor = alerts_collection.find({"user_id": user_id, "status": "ACTIVE"})
    alerts = await cursor.to_list(length=100)
    for a in alerts:
        a["_id"] = str(a["_id"])
    return alerts

@router.delete("/{alert_id}")
async def delete_alert(alert_id: str):
    """
    Deletes an alert.
    """
    result = await alerts_collection.delete_one({"id": alert_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert deleted"}