# models/portfolio_model.py
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal # Import Literal
from datetime import datetime
import uuid 
from bson import ObjectId

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
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    symbol: str
    # --- START: MODIFIED CODE ---
    # We now strictly define the allowed transaction types.
    type: Literal["BUY", "SELL", "DIVIDEND"] 
    # --- END: MODIFIED CODE ---
    quantity: float
    price_per_unit: float # Original price (e.g., USD)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    price_per_unit_inr: Optional[float] = None # Price converted to INR
    total_value_inr: Optional[float] = None # Total transaction value in INR

class SellRequest(BaseModel):
    investment_id: str 
    quantity_to_sell: float

# Custom type for handling MongoDB ObjectId in Pydantic V2
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