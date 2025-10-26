# routes/auth.py
from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from models.user import UserCreate, UserLogin
from database import users_collection
from config import DEFAULT_BALANCE
from bson import ObjectId

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

@router.post("/signup")
async def signup(user: UserCreate):
    # Now uses await
    if await users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "username": user.username,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "balance": DEFAULT_BALANCE
    }
    
    result = await users_collection.insert_one(user_dict)
    return {"message": "User created successfully", "user_id": str(result.inserted_id)}

@router.post("/login")
async def login(user: UserLogin):
    # Now uses await
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    user_data = {
        "id": str(db_user["_id"]),
        "username": db_user["username"],
        "email": db_user["email"],
        "balance": db_user["balance"],
        "token": "fake-jwt-token-for-demo"
    }
    
    return {"message": "Login successful", "user": user_data}

@router.get("/me/{user_id}")
async def get_current_user(user_id: str):
    # Now uses await
    db_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = {
        "id": str(db_user["_id"]),
        "username": db_user["username"],
        "email": db_user["email"],
        "balance": db_user["balance"],
        "token": "fake-jwt-token-for-demo"
    }
    return {"user": user_data}