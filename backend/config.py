# config.py
import os
from dotenv import load_dotenv

load_dotenv() 

# MongoDB connection string (Atlas)
MONGO_URI = "mongodb+srv://benji:apple%402003@benstocks-cluster.rkvl00b.mongodb.net/?retryWrites=true&w=majority&appName=benstocks-cluster"

# Name of the database to use
DB_NAME = "benstocks_db"

# Default fake money balance for new users
DEFAULT_BALANCE = 100000  # ₹100,000

# Alpha Vantage API Key for Mutual Fund NAVs
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")