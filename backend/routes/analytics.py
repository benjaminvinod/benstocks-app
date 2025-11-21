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
from email.mime.base import MIMEBase # Required for attachments
from email import encoders             # Required for attachments
from datetime import datetime
from fpdf import FPDF                  # The PDF Library

# --- LOAD ENVIRONMENT VARIABLES ---
load_dotenv()

# --- CONFIGURATION ---
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")

router = APIRouter()

# --- PDF GENERATOR CLASS ---
class PDFReport(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'BenStocks Portfolio Report', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

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
    Generates and sends a Tax/Portfolio report via email (Text or PDF).
    """
    report_format = payload.get("format", "TEXT")
    
    # 1. Fetch User & Data
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid User ID")
        
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user or "email" not in user:
        raise HTTPException(status_code=404, detail="User email not found")
        
    portfolio = await get_portfolio(user_id)
    live_data = await get_live_portfolio_value(user_id)
    
    # Data Prep
    total_value = live_data.get("total_portfolio_value_inr", 0)
    invested_value = live_data.get("total_investment_value_inr", 0)
    cash = live_data.get("cash_balance_inr", 0)
    inv_details = live_data.get("investment_details", {})
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    # 2. Calculate Tax Data
    loss_harvest_items = []
    for inv in portfolio.investments:
        curr_val = inv_details.get(inv.id, {}).get("live_value_inr", 0)
        gain_loss = curr_val - (inv.buy_cost_inr or 0)
        if gain_loss < -500:
            loss_harvest_items.append((inv.symbol, abs(gain_loss)))

    # 3. Generate PDF or Text
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = user['email']
    msg['Subject'] = f"BenStocks {report_format} Report: {datetime.now().strftime('%Y-%m-%d')}"

    if report_format == "PDF":
        # --- PDF GENERATION LOGIC ---
        pdf = PDFReport()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        
        # Summary Section
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(200, 10, f"User: {user.get('username', 'Trader')} | Date: {date_str}", ln=True)
        pdf.ln(5)
        
        pdf.set_font("Arial", size=12)
        pdf.cell(200, 10, f"Total Net Worth: {total_value:,.2f} INR", ln=True)
        pdf.cell(200, 10, f"Cash Balance:    {cash:,.2f} INR", ln=True)
        pdf.cell(200, 10, f"Invested Amount: {invested_value:,.2f} INR", ln=True)
        pdf.ln(10)

        # Tax Alerts Section
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(200, 10, "Tax Optimization Alerts", ln=True)
        pdf.set_font("Arial", size=12)
        
        if loss_harvest_items:
            pdf.set_text_color(194, 24, 7) # Red color for losses
            for symbol, loss in loss_harvest_items:
                pdf.cell(200, 10, f"[LOSS HARVEST] {symbol}: Loss of {loss:,.2f} INR", ln=True)
            pdf.set_text_color(0, 0, 0) # Reset to black
        else:
            pdf.cell(200, 10, "No major tax harvesting opportunities found.", ln=True)

        # Output PDF to a variable (string)
        pdf_output = pdf.output(dest='S').encode('latin-1') # Encode to bytes

        # Attach PDF
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(pdf_output)
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f'attachment; filename="BenStocks_Report_{date_str}.pdf"')
        msg.attach(part)
        
        # Add a simple body text
        msg.attach(MIMEText("Please find your detailed portfolio report attached as a PDF.", 'plain'))

    else:
        # --- TEXT GENERATION LOGIC (Fallback) ---
        report_body = f"""
        BENSTOCKS PORTFOLIO REPORT
        --------------------------
        Date: {date_str}
        User: {user.get('username', 'Trader')}
        
        SUMMARY
        -------
        Total Net Worth: ₹{total_value:,.2f}
        Cash Balance:    ₹{cash:,.2f}
        Invested Amount: ₹{invested_value:,.2f}
        
        TAX ALERTS
        ----------
        """
        if loss_harvest_items:
            for symbol, loss in loss_harvest_items:
                report_body += f"[LOSS HARVEST] {symbol}: Loss of ₹{loss:,.2f}\n"
        else:
            report_body += "No major tax harvesting opportunities found.\n"

        msg.attach(MIMEText(report_body, 'plain'))

    # 4. Send Email
    try:
        if not SENDER_EMAIL or not SENDER_PASSWORD:
            return {"message": "Email simulated (Credentials missing)."}

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return {"message": f"Email sent successfully to {user['email']}"}

    except Exception as e:
        print(f"Email send failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")