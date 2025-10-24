# info.py
from fastapi import APIRouter

router = APIRouter()

# Educational content dictionary
EDUCATION = {
    "stocks": "Stocks represent ownership in a company. When you buy a stock, you become a partial owner and can earn returns through price appreciation or dividends.",
    "mutual_funds": "Mutual funds pool money from many investors to buy a diversified portfolio of stocks, bonds, or other assets. Managed by professionals.",
    "etfs": "Exchange-Traded Funds (ETFs) are like mutual funds but trade on stock exchanges like individual stocks. They usually track an index.",
    "corporate_bonds": "Corporate bonds are loans you give to companies. They pay fixed interest over a period and return the principal at maturity."
}

@router.get("/{instrument}")
async def get_info(instrument: str):
    content = EDUCATION.get(instrument.lower())
    if not content:
        return {"message": "Instrument not found. Options: stocks, mutual_funds, etfs, corporate_bonds"}
    return {"instrument": instrument, "description": content}
