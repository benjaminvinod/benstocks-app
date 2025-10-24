# models/portfolio.py
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
import uuid 
# --- ADD THIS IMPORT ---
from bson import ObjectId # Import ObjectId

class Investment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str 
    quantity: float
    buy_price: float # Original price (e.g., in USD)
    buy_date: datetime
    buy_cost_inr: Optional[float] = None # The total cost in INR

class PortfolioDB(BaseModel):
    user_id: str 
    id: Optional[str] = None # Map _id optionally
    investments: List[Investment] = []
    
    model_config = ConfigDict(
        populate_by_name=True, # Allow mapping _id to id
        arbitrary_types_allowed=True, # Allow ObjectId if needed elsewhere
        json_encoders={ObjectId: str} # Ensure ObjectId is serialized correctly
    )

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    symbol: str
    type: str # "BUY" or "SELL"
    quantity: float
    price_per_unit: float # Original price (e.g., USD)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    price_per_unit_inr: Optional[float] = None # Price converted to INR
    total_value_inr: Optional[float] = None # Total transaction value in INR

class SellRequest(BaseModel):
    investment_id: str 
    quantity_to_sell: float

# Custom type for handling MongoDB ObjectId in Pydantic V2
# This helps if you directly use ObjectId fields in your models
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, values):
        # Allow Pydantic V2 to handle potential dicts or existing ObjectIds
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

