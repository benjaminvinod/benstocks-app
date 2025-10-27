# backend/utils/simulate_nav.py
import datetime
import hashlib

# This data is now centralized on the backend.
SIMULATED_FUNDS_DATA = {
    "ICICI-PRU-BLUE": {"name": "ICICI Prudential Bluechip Fund", "baseNav": 75.50},
    "SBI-BLUE": {"name": "SBI BlueChip Fund", "baseNav": 68.90},
    "MIRAE-LARGE": {"name": "Mirae Asset Large Cap Fund", "baseNav": 92.15},
    "AXIS-BLUE": {"name": "Axis Bluechip Fund", "baseNav": 48.20},
    "FRANK-BLUE": {"name": "Franklin India Bluechip Fund", "baseNav": 850.70},
    "HDFC-MID": {"name": "HDFC Mid-Cap Opportunities Fund", "baseNav": 145.30},
    "KOTAK-EMG": {"name": "Kotak Emerging Equity Fund", "baseNav": 95.60},
    "PGIM-MID": {"name": "PGIM India Midcap Opportunities Fund", "baseNav": 45.35},
    "EDEL-MID": {"name": "Edelweiss Mid Cap Fund", "baseNav": 88.25},
    "QUAN-SMALL": {"name": "Quant Small Cap Fund", "baseNav": 190.10},
    "NIPPON-SMALL": {"name": "Nippon India Small Cap Fund", "baseNav": 125.40},
    "PARA-FLEXI": {"name": "Parag Parikh Flexi Cap Fund", "baseNav": 55.80},
    "HDFC-FLEXI": {"name": "HDFC Flexi Cap Fund", "baseNav": 1350.00},
    "DSP-FLEXI": {"name": "DSP Flexi Cap Fund", "baseNav": 82.50},
    "UTINIFTY": {"name": "UTI Nifty 50 Index Fund", "baseNav": 130.45},
    "TATA-DIGITAL": {"name": "Tata Digital India Fund", "baseNav": 38.90},
    "ICICI-TECH": {"name": "ICICI Prudential Technology Fund", "baseNav": 160.20},
    "SBI-CONTRA": {"name": "SBI Contra Fund", "baseNav": 290.80},
    "INV-CONTRA": {"name": "Invesco India Contra Fund", "baseNav": 110.10},
    "VTSAX-SIM": {"name": "Simulated Vanguard Total Stock Market Fund", "baseNav": 108.50},
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
    # This simulates realistic daily market fluctuation for MFs
    daily_change_percent = normalized_val * 0.015 
    
    # Calculate and return the new NAV
    simulated_nav = base_nav * (1 + daily_change_percent)
    
    return round(simulated_nav, 2)