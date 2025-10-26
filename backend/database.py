# database.py

# We are switching from the synchronous Pymongo to the asynchronous Motor.
from motor.motor_asyncio import AsyncIOMotorClient

from config import MONGO_URI, DB_NAME

# Connect to MongoDB Atlas using the asynchronous client
client = AsyncIOMotorClient(MONGO_URI)

# Accessing the database remains the same
db = client[DB_NAME] 

try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")

# The collections are now asynchronous-ready
users_collection = db["users"]
portfolio_collection = db["portfolios"]
transactions_collection = db["transactions"]