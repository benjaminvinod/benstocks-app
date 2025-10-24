# database.py
from pymongo import MongoClient
from config import MONGO_URI, DB_NAME # Import both variables

# Connect to MongoDB Atlas
client = MongoClient(MONGO_URI)

# Create / access database
# This now correctly gets the database name from your config
db = client[DB_NAME] 

try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")

# Collections
users_collection = db["users"]
portfolio_collection = db["portfolios"]
transactions_collection = db["transactions"]