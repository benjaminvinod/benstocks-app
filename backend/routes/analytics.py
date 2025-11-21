# backend/routes/analytics.py
import os
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Body
from routes.portfolio import get_portfolio, get_live_portfolio_value
from database import users_collection
from utils.diversification_calculator import calculate_diversification_score
from bson import ObjectId
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime, timezone
from fpdf import FPDF

# --- LOAD ENVIRONMENT VARIABLES ---
load_dotenv()

# --- CONFIGURATION ---
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")

router = APIRouter()

# --- PDF REPORT CLASS ---
class PDFReport(FPDF):
    def header(self):
        # Title
        self.set_font('Arial', 'B', 16)
        self.set_text_color(14, 165, 233) # Brand Blue
        self.cell(0, 10, 'BenStocks Wealth Report', 0, 1, 'C')
        self.ln(2)
        
    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128) # Grey
        self.cell(0, 10, f'BenStocks Educational Simulator - Page {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title):
        self.set_font('Arial', 'B', 12)
        self.set_fill_color(240, 240, 240) # Light Grey background
        self.set_text_color(0, 0, 0)
        self.cell(0, 10, f'  {title}', 0, 1, 'L', 1)
        self.ln(4)

@router.get("/diversification-score/{user_id}")
async def get_diversification_score(user_id: str):
    try:
        portfolio = await get_portfolio(user_id)
        live_data = await get_live_portfolio_value(user_id)
        investment_details = live_data.get("investment_details", {})
        score_data = calculate_diversification_score(portfolio.investments, investment_details)
        return score_data
    except Exception as e:
        print(f"Error calculating diversification score for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not calculate diversification score.")

@router.post("/send-tax-report/{user_id}")
async def send_tax_report(user_id: str, payload: dict = Body(...)):
    """
    Generates and sends a Pro-Level Tax/Portfolio report via email.
    """
    report_format = payload.get("format", "TEXT")
    
    # 1. Fetch Data
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid User ID")
        
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user or "email" not in user:
        raise HTTPException(status_code=404, detail="User email not found")
        
    portfolio = await get_portfolio(user_id)
    live_data = await get_live_portfolio_value(user_id)
    
    # 2. Metrics Calculation
    total_net_worth = live_data.get("total_portfolio_value_inr", 0)
    invested_val = live_data.get("total_investment_value_inr", 0)
    cash_bal = live_data.get("cash_balance_inr", 0)
    inv_details = live_data.get("investment_details", {})
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    # --- Detailed Analysis Loop ---
    loss_harvest_items = []
    ltcg_alert_items = []
    table_rows = []
    
    total_gain_loss = 0
    top_gainer = {"symbol": "N/A", "pct": -9999}
    top_loser = {"symbol": "N/A", "pct": 9999}
    
    today = datetime.now(timezone.utc)

    for inv in portfolio.investments:
        current_val = inv_details.get(inv.id, {}).get("live_value_inr", 0)
        buy_cost = inv.buy_cost_inr or 0
        
        gain_loss = current_val - buy_cost
        total_gain_loss += gain_loss
        
        # Avoid division by zero
        pct_change = ((current_val - buy_cost) / buy_cost * 100) if buy_cost > 0 else 0
        
        # Top Mover Logic
        if pct_change > top_gainer["pct"]:
            top_gainer = {"symbol": inv.symbol, "pct": pct_change}
        if pct_change < top_loser["pct"]:
            top_loser = {"symbol": inv.symbol, "pct": pct_change}

        # LTCG Logic
        try:
            buy_date_obj = datetime.fromisoformat(inv.buy_date.replace("Z", "+00:00"))
            days_held = (today - buy_date_obj).days
        except:
            days_held = 0
            
        is_long_term = days_held > 365
        days_to_ltcg = 365 - days_held
        
        # Harvest Alerts (Loss > 500)
        if gain_loss < -500:
            loss_harvest_items.append((inv.symbol, gain_loss))
            
        # LTCG Alerts (Profit > 0, Short Term, becoming Long Term soon)
        if gain_loss > 0 and not is_long_term and days_to_ltcg <= 60:
            ltcg_alert_items.append((inv.symbol, days_to_ltcg, gain_loss))

        table_rows.append({
            "symbol": inv.symbol,
            "qty": inv.quantity,
            "avg": inv.buy_price,
            "current": current_val / inv.quantity if inv.quantity else 0,
            "pl": gain_loss,
            "pct": pct_change
        })

    # AI Quote Logic (Text Version with Emojis)
    ai_quote_text = "Markets are volatile. Stay disciplined!"
    if total_gain_loss > 0:
        ai_quote_text = "Looking green today, chief! 🟢 Keep up the momentum."
    elif total_gain_loss < 0:
        ai_quote_text = "Markets are rough. Remember, diamond hands win in the end. 🛡️"

    # AI Quote Logic (PDF Version - NO EMOJIS to prevent crash)
    ai_quote_pdf = "Markets are volatile. Stay disciplined!"
    if total_gain_loss > 0:
        ai_quote_pdf = "Looking green today, chief! Keep up the momentum."
    elif total_gain_loss < 0:
        ai_quote_pdf = "Markets are rough. Remember, diamond hands win in the end."

    # 3. Generate PDF
    if report_format == "PDF":
        try:
            pdf = PDFReport()
            pdf.add_page()
            
            # --- SECTION 1: EXECUTIVE SUMMARY ---
            pdf.set_font("Arial", size=11)
            pdf.cell(100, 10, f"User: {user.get('username', 'Trader')}")
            pdf.cell(0, 10, f"Date: {date_str}", ln=True, align='R')
            pdf.line(10, 35, 200, 35) # Draw line
            pdf.ln(5)

            # Big Numbers
            pdf.set_font("Arial", 'B', 12)
            pdf.cell(60, 10, "Total Net Worth")
            pdf.cell(60, 10, "Total P/L")
            pdf.cell(0, 10, "Cash Balance", ln=True)
            
            pdf.set_font("Arial", size=12)
            pdf.cell(60, 10, f"{total_net_worth:,.2f} INR")
            
            # Color code P/L
            if total_gain_loss >= 0:
                pdf.set_text_color(0, 128, 0) # Green
                prefix = "+"
            else:
                pdf.set_text_color(194, 24, 7) # Red
                prefix = ""
            pdf.cell(60, 10, f"{prefix}{total_gain_loss:,.2f} INR")
            
            pdf.set_text_color(0, 0, 0) # Reset Black
            pdf.cell(0, 10, f"{cash_bal:,.2f} INR", ln=True)
            pdf.ln(5)
            
            # --- SECTION 2: PORTFOLIO HEALTH ---
            pdf.chapter_title("2. PORTFOLIO HEALTH")
            pdf.set_font("Arial", size=11)
            
            # Allocation Bar
            total_assets = invested_val + cash_bal
            if total_assets > 0:
                equity_pct = (invested_val / total_assets) * 100
                cash_pct = (cash_bal / total_assets) * 100
                pdf.cell(0, 8, f"Asset Allocation: Equity {equity_pct:.1f}% | Cash {cash_pct:.1f}%", ln=True)
                
                # Visual Bar
                pdf.set_fill_color(14, 165, 233) # Blue for Equity
                pdf.cell(equity_pct * 1.8, 3, "", 0, 0, 'L', 1) 
                pdf.set_fill_color(200, 200, 200) # Grey for Cash
                pdf.cell(cash_pct * 1.8, 3, "", 0, 1, 'L', 1)
                pdf.ln(3)

            # Top Movers (No Emojis)
            pdf.cell(95, 10, f"[Top Gainer] {top_gainer['symbol']} (+{top_gainer['pct']:.2f}%)")
            pdf.cell(0, 10, f"[Top Loser] {top_loser['symbol']} ({top_loser['pct']:.2f}%)", ln=True)
            
            # AI Quote Box (Clean text)
            pdf.ln(2)
            pdf.set_font("Courier", 'I', 10)
            pdf.set_fill_color(230, 240, 255) # Light blue bg
            pdf.multi_cell(0, 10, f"Portify AI: \"{ai_quote_pdf}\"", 0, 'C', 1)
            pdf.ln(5)

            # --- SECTION 3: HOLDINGS TABLE ---
            pdf.chapter_title("3. HOLDINGS BREAKDOWN")
            
            # Table Header
            pdf.set_font("Arial", 'B', 10)
            pdf.set_fill_color(220, 220, 220)
            pdf.cell(40, 8, "Symbol", 1, 0, 'C', 1)
            pdf.cell(30, 8, "Qty", 1, 0, 'C', 1)
            pdf.cell(40, 8, "Avg Price", 1, 0, 'C', 1)
            pdf.cell(40, 8, "Current", 1, 0, 'C', 1)
            pdf.cell(40, 8, "P/L", 1, 1, 'C', 1)
            
            # Table Rows
            pdf.set_font("Arial", size=10)
            for row in table_rows:
                pdf.cell(40, 8, str(row['symbol']), 1)
                pdf.cell(30, 8, f"{row['qty']:.2f}", 1)
                pdf.cell(40, 8, f"{row['avg']:.2f}", 1)
                pdf.cell(40, 8, f"{row['current']:.2f}", 1)
                
                if row['pl'] >= 0:
                    pdf.set_text_color(0, 128, 0)
                else:
                    pdf.set_text_color(194, 24, 7)
                pdf.cell(40, 8, f"{row['pl']:,.2f}", 1, 1)
                pdf.set_text_color(0, 0, 0)

            pdf.ln(5)

            # --- SECTION 4: TAX OPTIMIZATION ALERTS ---
            pdf.chapter_title("4. TAX OPTIMIZATION ALERTS")
            pdf.set_font("Arial", size=11)

            has_alerts = False
            
            # Harvest
            if loss_harvest_items:
                has_alerts = True
                pdf.set_font("Arial", 'B', 11)
                pdf.cell(0, 8, "Loss Harvesting Opportunities (Offset Gains)", ln=True)
                pdf.set_font("Arial", size=11)
                pdf.set_text_color(194, 24, 7) # Red
                for sym, loss in loss_harvest_items:
                    pdf.cell(0, 7, f" - Sell {sym} to realize a loss of {abs(loss):,.2f} INR", ln=True)
                pdf.ln(2)

            # LTCG
            if ltcg_alert_items:
                has_alerts = True
                pdf.set_font("Arial", 'B', 11)
                pdf.set_text_color(0, 0, 0)
                pdf.cell(0, 8, "Long Term Capital Gains (LTCG) Watchlist", ln=True)
                pdf.set_font("Arial", size=11)
                pdf.set_text_color(0, 0, 128) # Navy Blue
                for sym, days, profit in ltcg_alert_items:
                    pdf.cell(0, 7, f" - Hold {sym} for {days} more days. Current Profit: {profit:,.2f} INR", ln=True)

            if not has_alerts:
                pdf.set_text_color(0, 128, 0)
                pdf.cell(0, 10, "No immediate tax actions required. Your portfolio is optimized.", ln=True)

            # Output PDF
            # 'latin-1' with 'ignore' ensures emojis don't crash the generator
            pdf_output = pdf.output(dest='S').encode('latin-1', 'ignore')
            
            # Create Attachment
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(pdf_output)
            encoders.encode_base64(part)
            filename = f"BenStocks_Report_{datetime.now().strftime('%Y%m%d')}.pdf"
            part.add_header('Content-Disposition', f'attachment; filename="{filename}"')
            
            msg = MIMEMultipart()
            msg['From'] = SENDER_EMAIL
            msg['To'] = user['email']
            msg['Subject'] = f"BenStocks Wealth Report: {date_str}"
            msg.attach(part)
            msg.attach(MIMEText(f"Hello {user.get('username')},\n\nPlease find your professional portfolio analysis attached.\n\n- Team BenStocks", 'plain'))
            
        except Exception as e:
            print(f"PDF Gen Failed: {e}")
            # Fallback to text if PDF fails
            report_format = "TEXT"

    if report_format == "TEXT":
        # --- TEXT FALLBACK ---
        report_body = f"""
        BENSTOCKS WEALTH REPORT (Text Version)
        Date: {date_str}
        User: {user.get('username', 'Trader')}
        
        1. EXECUTIVE SUMMARY
        Total Net Worth: ₹{total_net_worth:,.2f}
        Total P/L:       ₹{total_gain_loss:,.2f}
        
        2. PORTFOLIO HEALTH
        Asset Allocation: Equity {(invested_val/total_net_worth*100):.1f}% | Cash {(cash_bal/total_net_worth*100):.1f}%
        Top Gainer: {top_gainer['symbol']} (+{top_gainer['pct']:.2f}%)
        Top Loser:  {top_loser['symbol']} ({top_loser['pct']:.2f}%)
        
        Portify AI says: "{ai_quote_text}"
        
        3. TAX ALERTS
        """
        if loss_harvest_items:
            for sym, loss in loss_harvest_items:
                report_body += f"[LOSS HARVEST] Sell {sym}: Loss of ₹{abs(loss):,.2f}\n"
        
        if ltcg_alert_items:
             for sym, days, profit in ltcg_alert_items:
                report_body += f"[LTCG ALERT] Hold {sym} for {days} days. Profit: ₹{profit:,.2f}\n"
                
        if not loss_harvest_items and not ltcg_alert_items:
            report_body += "No immediate alerts."

        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = user['email']
        msg['Subject'] = f"BenStocks Text Report: {date_str}"
        # Use utf-8 to support Rupee symbol in text email
        msg.attach(MIMEText(report_body, 'plain', 'utf-8'))

    # 4. Send Email
    try:
        if not SENDER_EMAIL or not SENDER_PASSWORD:
            return {"message": "Email simulated (Credentials missing). Check logs."}

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return {"message": f"Email sent successfully to {user['email']}"}

    except Exception as e:
        print(f"Email send failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")