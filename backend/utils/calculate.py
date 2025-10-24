# calculate.py

def calculate_future_value(amount: float, years: int, cagr: float) -> float:
    """
    Calculate future value using Compound Annual Growth Rate (CAGR)
    Formula: FV = amount * (1 + cagr/100)^years
    """
    return round(amount * ((1 + cagr / 100) ** years), 2)
