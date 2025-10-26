import os
from dotenv import load_dotenv

load_dotenv() 

MONGO_URI = os.getenv("MONGO_URI")

# Name of the database to use
DB_NAME = "benstocks_db"

# Default fake money balance for new users
DEFAULT_BALANCE = 100000  # ₹100,000

# Alpha Vantage API Key for Mutual Fund NAVs
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")

# NewsData.io API Key for news fetching
NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY")