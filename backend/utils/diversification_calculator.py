# backend/utils/diversification_calculator.py

# A simplified mapping of symbols to sectors.
# In a real-world scenario, this would come from a comprehensive API or database.
SECTOR_MAPPING = {
    # US Tech
    "AAPL": "Technology", "MSFT": "Technology", "GOOGL": "Technology", "TSLA": "Consumer Discretionary",
    # Indian IT
    "TCS.NS": "Technology", "INFY.NS": "Technology", "TATA-DIGITAL": "Technology", "ICICI-TECH": "Technology",
    # Indian Banking/Financials
    "HDFCBANK.NS": "Financials", "BANKBEES.NS": "Financials",
    # Indian FMCG
    "HINDUNILVR.NS": "Consumer Staples", "ITC.NS": "Consumer Staples",
    # Indian Conglomerate
    "RELIANCE.NS": "Energy",
    # Pharma
    "JNJ": "Healthcare",
    # Consumer Goods
    "PG": "Consumer Staples",
    # Index/Diversified Funds
    "NIFTYBEES.NS": "Diversified", "JUNIORBEES.NS": "Diversified", "UTINIFTY": "Diversified",
    "PARA-FLEXI": "Diversified", "VTSAX-SIM": "Diversified",
    # Gold (Commodity)
    "GOLDBEES.NS": "Commodity",
    # Others
    "LIQUIDBEES.NS": "Debt",
}

def get_sector(symbol):
    return SECTOR_MAPPING.get(symbol.upper(), "Other") # Default to 'Other' if not found

def calculate_diversification_score(portfolio, investment_details):
    if not portfolio or not investment_details:
        return {"score": 0, "feedback": "Invest in at least 3-5 assets to get a score.", "color": "#E53E3E"}

    total_value = sum(detail['live_value_inr'] for detail in investment_details.values())
    if total_value == 0:
        return {"score": 0, "feedback": "Invest in at least 3-5 assets to get a score.", "color": "#E53E3E"}

    # --- 1. Asset Count Score (Max 30 points) ---
    num_assets = len(portfolio)
    if num_assets <= 2:
        asset_count_score = 5
    elif num_assets <= 4:
        asset_count_score = 15
    elif num_assets <= 7:
        asset_count_score = 25
    else:
        asset_count_score = 30
        
    # --- 2. Single Asset Concentration Score (Max 40 points) ---
    weights = [(investment_details.get(inv.id, {}).get('live_value_inr', 0) / total_value) for inv in portfolio]
    max_weight = max(weights) if weights else 0
    
    if max_weight > 0.5:
        concentration_score = 5
    elif max_weight > 0.35:
        concentration_score = 15
    elif max_weight > 0.25:
        concentration_score = 30
    else:
        concentration_score = 40

    # --- 3. Sector Concentration Score (Max 30 points) ---
    sector_values = {}
    for inv in portfolio:
        sector = get_sector(inv.symbol)
        value = investment_details.get(inv.id, {}).get('live_value_inr', 0)
        sector_values[sector] = sector_values.get(sector, 0) + value

    sector_weights = [value / total_value for value in sector_values.values()]
    max_sector_weight = max(sector_weights) if sector_weights else 0

    if max_sector_weight > 0.6:
        sector_score = 5
    elif max_sector_weight > 0.4:
        sector_score = 15
    else:
        sector_score = 30

    # --- Final Score Calculation ---
    final_score = asset_count_score + concentration_score + sector_score
    
    if final_score < 40:
        feedback = "Highly Concentrated. Consider adding more assets and diversifying across sectors."
        color = "#E53E3E" # Red
    elif final_score < 75:
        feedback = "Moderately Diversified. Good start, but watch for over-concentration in one asset or sector."
        color = "#DD6B20" # Orange
    else:
        feedback = "Well Diversified. Your portfolio is spread nicely across multiple assets and sectors."
        color = "#48BB78" # Green

    return {"score": final_score, "feedback": feedback, "color": color}