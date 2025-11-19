# models/portfolio_model.py
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime
import uuid 
from bson import ObjectId

class Investment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str 
    quantity: float
    buy_price: float 
    buy_date: datetime
    buy_cost_inr: Optional[float] = None 

# --- ADDED: New Model for History ---
class PortfolioHistoryItem(BaseModel):
    date: str # Format YYYY-MM-DD
    total_equity_inr: float
    cash_balance: float
    total_net_worth: float

class PortfolioDB(BaseModel):
    user_id: str 
    id: Optional[str] = None 
    investments: List[Investment] = []
    # --- ADDED: History Array ---
    history: List[PortfolioHistoryItem] = [] 
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    symbol: str
    type: Literal["BUY", "SELL", "DIVIDEND"] 
    quantity: float
    price_per_unit: float 
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    price_per_unit_inr: Optional[float] = None 
    total_value_inr: Optional[float] = None 
    # --- ADDED: Order Metadata ---
    order_type: Optional[Literal["MARKET", "LIMIT"]] = "MARKET"
    limit_price: Optional[float] = None

class SellRequest(BaseModel):
    investment_id: str 
    quantity_to_sell: float

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, values):
        if isinstance(v, ObjectId):
            return v
        if ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")

    @classmethod
    def __get_pydantic_core_schema__(cls, core_schema, handler):
        from pydantic_core import core_schema as cs
        object_id_schema = cs.str_schema()
        return cs.json_or_python_schema(
             json_schema=object_id_schema,
             python_schema=cs.union_schema([
                 cs.is_instance_schema(ObjectId),
                 object_id_schema,
             ]),
             serialization=cs.plain_serializer_function_ser_schema(lambda x: str(x)),
        )