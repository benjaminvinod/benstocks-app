# auth.py
from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from models.user import UserCreate, UserLogin, UserDB
from database import users_collection
from config import DEFAULT_BALANCE
from bson import ObjectId

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Signup endpoint
@router.post("/signup")
async def signup(user: UserCreate):
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "username": user.username,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "balance": DEFAULT_BALANCE
    }
    
    result = users_collection.insert_one(user_dict)
    return {"message": "User created successfully", "user_id": str(result.inserted_id)}

# Login endpoint
@router.post("/login")
async def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # This is the fix. We return the full user object.
    # In a real app, you would create and return a JWT token.
    # We will add a "fake" token to match what our AuthContext expects.
    
    user_data = {
        "id": str(db_user["_id"]),
        "username": db_user["username"],
        "email": db_user["email"],
        "balance": db_user["balance"],
        "token": "fake-jwt-token-for-demo" # Added a fake token
    }
    
    return {"message": "Login successful", "user": user_data}

# --- ADD THIS NEW FUNCTION ---
# This new endpoint will let us refresh the user's data
@router.get("/me/{user_id}")
async def get_current_user(user_id: str):
    db_user = users_collection.find_one({"_id": ObjectId(user_id)})
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = {
        "id": str(db_user["_id"]),
        "username": db_user["username"],
        "email": db_user["email"],
        "balance": db_user["balance"],
        "token": "fake-jwt-token-for-demo" # Keep the token consistent
    }
    return {"user": user_data}