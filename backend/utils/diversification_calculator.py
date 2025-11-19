# backend/utils/diversification_calculator.py

# A simplified mapping of symbols to sectors.
# In a real-world scenario, this would come from a comprehensive API or database.
SECTOR_MAPPING = {
    # US Tech
    "AAPL": "Technology", "MSFT": "Technology", "GOOGL": "Technology", "TSLA": "Consumer Discretionary", "NVDA": "Technology", "AMD": "Technology", "AMZN": "Consumer Discretionary",
    # Indian IT
    "TCS.NS": "Technology", "INFY.NS": "Technology", "TATA-DIGITAL": "Technology", "ICICI-TECH": "Technology", "HCLTECH.NS": "Technology", "WIPRO.NS": "Technology",
    # Indian Banking/Financials
    "HDFCBANK.NS": "Financials", "BANKBEES.NS": "Financials", "ICICIBANK.NS": "Financials", "SBIN.NS": "Financials", "KOTAKBANK.NS": "Financials",
    # Indian FMCG
    "HINDUNILVR.NS": "Consumer Staples", "ITC.NS": "Consumer Staples", "NESTLEIND.NS": "Consumer Staples",
    # Energy/Conglomerate
    "RELIANCE.NS": "Energy", "ONGC.NS": "Energy",
    # Pharma
    "JNJ": "Healthcare", "SUNPHARMA.NS": "Healthcare", "DRREDDY.NS": "Healthcare",
    # Index/Diversified Funds
    "NIFTYBEES.NS": "Diversified", "JUNIORBEES.NS": "Diversified", "UTINIFTY": "Diversified",
    "PARA-FLEXI": "Diversified", "VTSAX-SIM": "Diversified", "MON100.NS": "Diversified",
    # Gold (Commodity)
    "GOLDBEES.NS": "Commodity",
    # Debt/Bonds
    "LIQUIDBEES.NS": "Debt", "GSEC.NS": "Debt",
}

def get_sector(symbol):
    return SECTOR_MAPPING.get(symbol.upper(), "Other") 

def calculate_diversification_score(portfolio, investment_details):
    if not portfolio or not investment_details:
        return {
            "score": 0, 
            "feedback": "Start investing to see your diversification score.", 
            "color": "#E53E3E",
            "suggestions": ["Make your first trade to get started!"]
        }

    total_value = sum(detail['live_value_inr'] for detail in investment_details.values())
    if total_value == 0:
        return {
            "score": 0, 
            "feedback": "Portfolio value is zero.", 
            "color": "#E53E3E",
            "suggestions": ["Invest in assets to build value."]
        }

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

    sector_weights = {sector: (value / total_value) for sector, value in sector_values.items()}
    max_sector_weight = max(sector_weights.values()) if sector_weights else 0

    if max_sector_weight > 0.6:
        sector_score = 5
    elif max_sector_weight > 0.4:
        sector_score = 15
    else:
        sector_score = 30

    # --- Final Score Calculation ---
    final_score = asset_count_score + concentration_score + sector_score
    
    # --- Generate Smart Suggestions ---
    suggestions = []
    
    # Asset Count Logic
    if num_assets < 3:
        suggestions.append("📉 Your portfolio is very small. Consider adding at least 2-3 more distinct assets.")
    
    # Concentration Logic
    if max_weight > 0.40:
        suggestions.append("⚠️ You are heavily reliant on one single asset. Consider trimming it to reduce risk.")
        
    # Sector Logic
    tech_weight = sector_weights.get("Technology", 0)
    if tech_weight > 0.40:
        suggestions.append(f"💻 Your portfolio is heavy in IT ({int(tech_weight*100)}%). Consider adding defensive sectors like FMCG or Pharma.")
        
    fin_weight = sector_weights.get("Financials", 0)
    if fin_weight > 0.40:
         suggestions.append(f"🏦 You have high exposure to Banks ({int(fin_weight*100)}%). Diversify into other sectors.")

    # Missing Asset Classes
    if "Commodity" not in sector_weights:
        suggestions.append("🥇 You have no Gold exposure. Adding Gold (e.g., GOLDBEES) can hedge against market crashes.")
        
    if "Debt" not in sector_weights:
        suggestions.append("🛡️ You have no Debt/Bonds. Adding Liquid Funds (e.g., LIQUIDBEES) adds stability.")

    if "Diversified" not in sector_weights and num_assets < 5:
        suggestions.append("🌏 Consider adding an Index Fund (e.g., NIFTYBEES) for instant broad market exposure.")

    if not suggestions:
        suggestions.append("✅ Your portfolio looks well-balanced! Keep monitoring your allocation periodically.")

    # Feedback Text
    if final_score < 40:
        feedback = "High Risk / Concentrated"
        color = "#E53E3E" # Red
    elif final_score < 75:
        feedback = "Moderately Diversified"
        color = "#DD6B20" # Orange
    else:
        feedback = "Excellent Diversification"
        color = "#48BB78" # Green

    return {
        "score": final_score, 
        "feedback": feedback, 
        "color": color,
        "suggestions": suggestions[:4] # Return top 4 suggestions
    }