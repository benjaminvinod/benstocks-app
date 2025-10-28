# backend/utils/simulate_nav.py
import datetime
import hashlib

# Centralized simulated funds data with categories
SIMULATED_FUNDS_DATA = {
    # Index Funds
    "NIPPON-NIFTY50": {"name": "Nippon India Index Fund – Nifty 50 Plan", "baseNav": 47.55, "category": "Index Funds"},
    "UTINIFTY": {"name": "UTI Nifty 50 Index Fund", "baseNav": 181.35, "category": "Index Funds"},
    "ICICI-SENSEX": {"name": "ICICI Prudential S&P BSE Sensex Index Fund", "baseNav": 27.77, "category": "Index Funds"},
    "HDFC-SENSEX": {"name": "HDFC Index Fund – S&P BSE Sensex Plan", "baseNav": 806.11, "category": "Index Funds"},
    "ADITYA-NEXT50": {"name": "Aditya Birla Sun Life Nifty Next 50 Index Fund", "baseNav": 17.24, "category": "Index Funds"},
    "MOTILAL-MID150": {"name": "Motilal Oswal Nifty Midcap 150 Index Fund", "baseNav": 50.00, "category": "Index Funds"},
    "ADITYA-SMALL50": {"name": "Aditya Birla Sun Life Nifty Smallcap 50 Index Fund", "baseNav": 21.50, "category": "Index Funds"},
    "KOTAK-NEXT50": {"name": "Kotak Nifty Next 50 Index Fund", "baseNav": 20.30, "category": "Index Funds"},
    "DSP-NEXT50": {"name": "DSP Nifty Next 50 Index Fund", "baseNav": 27.47, "category": "Index Funds"},
    "MOTILAL-SMALL250": {"name": "Motilal Oswal Nifty Smallcap 250 Index Fund", "baseNav": 38.79, "category": "Index Funds"},

    # Midcap Funds
    "MOTILAL-MIDCAP": {"name": "Motilal Oswal Midcap Fund", "baseNav": 120.56, "category": "Midcap Funds"},
    "HDFC-MID": {"name": "HDFC Mid Cap Opportunities Fund", "baseNav": 221.62, "category": "Midcap Funds"},
    "NIPPON-MIDCAP": {"name": "Nippon India Growth Mid Cap Fund", "baseNav": 4678.59, "category": "Midcap Funds"},
    "EDEL-MID": {"name": "Edelweiss Mid Cap Fund", "baseNav": 121.31, "category": "Midcap Funds"},
    "ICICI-MID": {"name": "ICICI Prudential Midcap Fund", "baseNav": 309.30, "category": "Midcap Funds"},
    "PGIM-MID": {"name": "PGIM India Midcap Opportunities Fund", "baseNav": 76.77, "category": "Midcap Funds"},
    "SBI-MID": {"name": "SBI Midcap Fund", "baseNav": 216.97, "category": "Midcap Funds"},
    "QUANT-MID": {"name": "Quant Mid Cap Fund", "baseNav": 99.20, "category": "Midcap Funds"},
    "UTI-MID": {"name": "UTI Mid Cap Fund", "baseNav": 211.72, "category": "Midcap Funds"},
    "MAHINDRA-MID": {"name": "Mahindra Manulife Mid Cap Fund", "baseNav": 18.67, "category": "Midcap Funds"},

    # Smallcap Funds
    "QUAN-SMALL": {"name": "Quant Small Cap Fund", "baseNav": 285.04, "category": "Smallcap Funds"},
    "NIPPON-SMALL": {"name": "Nippon India Small Cap Fund", "baseNav": 192.19, "category": "Smallcap Funds"},
    "HDFC-SMALL": {"name": "HDFC Small Cap Fund", "baseNav": 164.14, "category": "Smallcap Funds"},
    "FRANK-SMALL": {"name": "Franklin India Small Cap Fund", "baseNav": 194.99, "category": "Smallcap Funds"},
    "TATA-SMALL": {"name": "Tata Small Cap Fund", "baseNav": 44.24, "category": "Smallcap Funds"},
    "INV-SMALL": {"name": "Invesco India Smallcap Fund", "baseNav": 48.15, "category": "Smallcap Funds"},
    "BANDHAN-SMALL": {"name": "Bandhan Small Cap Fund", "baseNav": 28.41, "category": "Smallcap Funds"},
    "DSP-SMALL": {"name": "DSP Small Cap Fund", "baseNav": 215.47, "category": "Smallcap Funds"},
    "AXIS-SMALL": {"name": "Axis Small Cap Fund", "baseNav": 124.88, "category": "Smallcap Funds"},
    "SUNDARAM-SMALL": {"name": "Sundaram Small Cap Fund", "baseNav": 293.77, "category": "Smallcap Funds"},

    # Flexicap Funds
    "HDFC-FLEXI": {"name": "HDFC Flexi Cap Fund", "baseNav": 2278.43, "category": "Flexicap Funds"},
    "PARA-FLEXI": {"name": "Parag Parikh Flexi Cap Fund", "baseNav": 95.77, "category": "Flexicap Funds"},
    "JM-FLEXI": {"name": "JM Flexicap Fund", "baseNav": 114.27, "category": "Flexicap Funds"},
    "QUANT-FLEXI": {"name": "Quant Flexi Cap Fund", "baseNav": 110.59, "category": "Flexicap Funds"},
    "FRANK-FLEXI": {"name": "Franklin India Flexi Cap Fund", "baseNav": 1873.80, "category": "Flexicap Funds"},
    "EDEL-FLEXI": {"name": "Edelweiss Flexi Cap Fund", "baseNav": 45.82, "category": "Flexicap Funds"},
    "DSP-FLEXI": {"name": "DSP Flexi Cap Fund", "baseNav": 68.79, "category": "Flexicap Funds"},
    "HSBC-FLEXI": {"name": "HSBC Flexi Cap Fund", "baseNav": 17.39, "category": "Flexicap Funds"},
    "KOTAK-FLEXI": {"name": "Kotak Flexicap Fund", "baseNav": 109.68, "category": "Flexicap Funds"},
    "BOI-FLEXI": {"name": "Bank of India Flexi Cap Fund", "baseNav": 22.95, "category": "Flexicap Funds"},

    # ELSS Funds
    "QUANT-ELSS": {"name": "Quant ELSS Tax Saver Fund", "baseNav": 425.59, "category": "ELSS Funds"},
    "SBI-ELSS": {"name": "SBI Long Term Equity Fund (ELSS)", "baseNav": 485.47, "category": "ELSS Funds"},
    "MOTILAL-ELSS": {"name": "Motilal Oswal ELSS Tax Saver Fund", "baseNav": 61.05, "category": "ELSS Funds"},
    "PARA-ELSS": {"name": "Parag Parikh ELSS Tax Saver Fund", "baseNav": 26.48, "category": "ELSS Funds"},
    "HDFC-ELSS": {"name": "HDFC ELSS Tax Saver Fund", "baseNav": 165.55, "category": "ELSS Funds"},
    "BOI-ELSS": {"name": "Bank of India ELSS Tax Saver Fund", "baseNav": 62.82, "category": "ELSS Funds"},
    "JM-ELSS": {"name": "JM ELSS Tax Saver Fund", "baseNav": 34.95, "category": "ELSS Funds"},
    "DSP-ELSS": {"name": "DSP ELSS Tax Saver Fund", "baseNav": 116.62, "category": "ELSS Funds"},
    "WHITEOAK-ELSS": {"name": "WhiteOak Capital ELSS Tax Saver Fund", "baseNav": 13.50, "category": "ELSS Funds"},
    "AXIS-ELSS": {"name": "Axis ELSS Tax Saver Fund", "baseNav": 97.45, "category": "ELSS Funds"},

    # Contra & Value Funds
    "SBI-CONTRA": {"name": "SBI Contra Fund", "baseNav": 429.71, "category": "Contra & Value Funds"},
    "INV-CONTRA": {"name": "Invesco India Contra Fund", "baseNav": 162.13, "category": "Contra & Value Funds"},
    "KOTAK-CONTRA": {"name": "Kotak India EQ Contra Fund", "baseNav": 182.99, "category": "Contra & Value Funds"},
    "HDFC-VALUE": {"name": "HDFC Equity Fund (Flexi/Value)", "baseNav": 2278.43, "category": "Contra & Value Funds"},
    "FRANK-VALUE": {"name": "Franklin India Equity Fund", "baseNav": 217.78, "category": "Contra & Value Funds"},
    "PGIM-VALUE": {"name": "PGIM India Equity Fund", "baseNav": 419.27, "category": "Contra & Value Funds"},
    "ICICI-VALUE": {"name": "ICICI Prudential Value Discovery Fund", "baseNav": 537.59, "category": "Contra & Value Funds"},
    "AXIS-VALUE": {"name": "Axis Value Fund", "baseNav": 20.38, "category": "Contra & Value Funds"},
    "NIPPON-VALUE": {"name": "Nippon India Value Fund", "baseNav": 254.57, "category": "Contra & Value Funds"},
    "BANDHAN-VALUE": {"name": "Bandhan Value Fund", "baseNav": 171.18, "category": "Contra & Value Funds"},
}

def get_simulated_nav(fund_id: str) -> float | None:
    """
    Generates a consistent, simulated NAV for a given fund ID based on the current date.
    This ensures the NAV is the same for the entire day but changes the next day.
    """
    fund_details = SIMULATED_FUNDS_DATA.get(fund_id)
    if not fund_details:
        return None

    base_nav = fund_details["baseNav"]
    
    # Create a seed from the fund ID and the current date to ensure consistency for the day
    today_str = datetime.date.today().isoformat()
    seed_str = f"{fund_id}-{today_str}"
    
    # Use a hash to generate a pseudo-random but deterministic number from the seed
    hash_object = hashlib.sha256(seed_str.encode())
    hash_hex = hash_object.hexdigest()
    # Convert a part of the hash to an integer
    hash_int = int(hash_hex[:8], 16)
    
    # Normalize the hash to a value between -1 and 1
    max_hash_val = int('ffffffff', 16)
    normalized_val = (hash_int / max_hash_val) * 2 - 1
    
    # Create a daily percentage change (e.g., between -1.5% and +1.5%)
    daily_change_percent = normalized_val * 0.015 
    
    # Calculate and return the new NAV
    simulated_nav = base_nav * (1 + daily_change_percent)
    
    return round(simulated_nav, 2)