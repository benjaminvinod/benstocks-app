# routes/auth.py
from fastapi import APIRouter, HTTPException, status
from passlib.context import CryptContext
from models.user import UserCreate, UserLogin
from database import users_collection
from config import DEFAULT_BALANCE
from bson import ObjectId
from datetime import datetime, timedelta
from jose import jwt, JWTError # Requires: pip install python-jose[cryptography]

router = APIRouter()

# --- CONFIGURATION ---
# In a real production app, put this SECRET_KEY in your .env file
SECRET_KEY = "benstocks_secret_key_change_this_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Token valid for 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    """Generates a real, signed JWT token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/signup")
async def signup(user: UserCreate):
    # Check if email exists
    if await users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "username": user.username,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "balance": DEFAULT_BALANCE
    }
    
    result = await users_collection.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
    # Create a REAL access token
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "message": "User created successfully", 
        "user_id": user_id,
        # Return the user object so frontend can auto-login
        "user": {
            "id": user_id,
            "username": user.username,
            "email": user.email,
            "balance": DEFAULT_BALANCE,
            "token": access_token 
        }
    }

@router.post("/login")
async def login(user: UserLogin):
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    user_id = str(db_user["_id"])
    
    # Create a REAL access token
    access_token = create_access_token(data={"sub": user_id})
    
    user_data = {
        "id": user_id,
        "username": db_user["username"],
        "email": db_user["email"],
        "balance": db_user["balance"],
        "token": access_token 
    }
    
    return {"message": "Login successful", "user": user_data}

@router.get("/me/{user_id}")
async def get_current_user(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")

    db_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = {
        "id": str(db_user["_id"]),
        "username": db_user["username"],
        "email": db_user["email"],
        "balance": db_user["balance"],
        "token": "valid-session" 
    }
    return {"user": user_data}