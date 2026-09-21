import datetime
import os
import re
import requests
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def build_notification_layouts(personal_reports, top_10_reports):
    today_str = datetime.date.today().strftime('%Y-%m-%d')
    
    # ==================== HTML EMAIL DESIGN LAYER ====================
    email_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 650px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #34495e; padding-bottom: 10px;">📊 Personal Portfolio Tracking ({today_str})</h2>
    """
    
    p_buys = [r for r in personal_reports if r['recommended_action'] == "BUY"]
    p_sells = [r for r in personal_reports if r['recommended_action'] == "SELL"]
    p_holds = [r for r in personal_reports if r['recommended_action'] == "HOLD"]
    
    if p_buys:
        email_html += "<h3 style='color: #27ae60;'>🟢 Your Watchlist: BUY SIGNALS</h3>"
        for b in p_buys:
            email_html += f"<p><b>{b['company_display_name']}</b> ({b['ticker']}) - {b['current_price']}<br/><b>Signal:</b> {b['market_energy']} | <b>Advice:</b> {b['broker_advice']}<br/><i>News:</i> {b['breaking_news_reason']}</p><br/>"
            
    if p_sells:
        email_html += "<h3 style='color: #c0392b;'>🔴 Your Watchlist: SELL SUGGESTIONS</h3>"
        for s in p_sells:
            email_html += f"<p><b>{s['company_display_name']}</b> ({s['ticker']}) - {s['current_price']}<br/><b>Signal:</b> {s['market_energy']} | <b>Advice:</b> {s['broker_advice']}<br/><i>News:</i> {s['breaking_news_reason']}</p><br/>"

    if p_holds:
        email_html += "<h4 style='color: #7f8c8d;'>⚪ Your Watchlist: Neutral Hold States</h4>"
        email_html += "<p>" + ", ".join([f"<b>{h['company_display_name']}</b>" for h in p_holds]) + "</p>"

    # Block B: Top 10 Performers Dynamic Scan Table with Action Guidance
    email_html += """
        <br/><br/>
        <h2 style="color: #2c3e50; border-bottom: 2px solid #34495e; padding-bottom: 10px;">🔥 Today's Top 10 Market Performers & Guidance</h2>
        <p>These assets experienced the highest positive trading velocity today. Review their specific broker guidance before chasing momentum:</p>
        <table border='1' cellpadding='8' style='border-collapse: collapse; width: 100%; text-align: left; border-color: #eee;'>
            <tr style='background-color: #f4f6f7; color: #2c3e50;'>
                <th>Company Name</th> <!-- UPDATED COLUMN HEADER -->
                <th>Price (EUR)</th>
                <th>Energy Profile</th>
                <th style='text-align: center;'>Action Trigger</th>
                <th>Actionable Guidance Reason</th>
            </tr>
    """
    
    for t in top_10_reports:
        bg_color = "#ffffff"
        action_text = f"<b>{t['recommended_action']}</b>"
        if t['recommended_action'] == "BUY":
            bg_color = "#e8f8f5"
            action_text = "<span style='color: #27ae60;'><b>🟢 BUY</b></span>"
        elif t['recommended_action'] == "SELL":
            bg_color = "#fdf2f2"
            action_text = "<span style='color: #c0392b;'><b>🔴 SELL</b></span>"
            
        email_html += f"""
            <tr style='background-color: {bg_color};'>
                <td><b>{t['company_display_name']}</b><br/><small style='color:#7f8c8d;'>Ticker: {t['ticker']}</small></td>
                <td>{t['current_price']}</td>
                <td>{t['market_energy']}</td>
                <td style='text-align: center;'>{action_text}</td>
                <td style='font-size: 13px; color: #555;'>{t['broker_advice']}<br/><small style='color: #7f8c8d;'><i>News: {t['breaking_news_reason']}</i></small></td>
            </tr>
        """
        
    email_html += """
        </table>
        <hr style='border:0; border-top:1px solid #eee; margin-top: 30px;'/>
        <p style='font-size:11px; color:#95a5a6; text-align: center;'><i>Manual execution required inside your Trade Republic application.</i></p>
    </body>
    </html>
    """
    
    tg = f"🚨 *DAILY BROKER ALERTS ({today_str})*\n\nYour portfolio scan is ready! Today's daily market-wide scanner tracked down top trending assets with full company names and advice tables inside your email inbox!"
    return tg, email_html

def dispatch_alerts(tg_text, email_html):
    raw_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    
    if raw_token and chat_id:
        try:
            token_match = re.search(r"(\d+:[A-Za-z0-9_-]+)", str(raw_token))
            if token_match:
                clean_token = token_match.group(1)
                url = f"https://telegram.org{clean_token}/sendMessage"
                payload = {
                    "chat_id": str(chat_id).strip(),
                    "text": tg_text,
                    "parse_mode": "Markdown"
                }
                requests.post(url, json=payload, timeout=5)
        except Exception as e:
            logging.error(f"Telegram failed: {str(e)}")
            
    server_host = os.environ.get("SMTP_SERVER")
    sender = os.environ.get("SENDER_EMAIL")
    password = os.environ.get("SENDER_PASSWORD")
    receiver = os.environ.get("RECEIVER_EMAIL")
    
    if all([server_host, sender, password, receiver]):
        try:
            msg = MIMEMultipart()
            msg['From'] = sender
            msg['To'] = receiver
            msg['Subject'] = f"📊 Daily Stock Brief & Top Performers - {datetime.date.today().strftime('%Y-%m-%d')}"
            msg.attach(MIMEText(email_html, 'html'))
            
            server = smtplib.SMTP(server_host, int(os.environ.get("SMTP_PORT", 587)))
            server.starttls()
            server.login(sender, password)
            server.sendmail(sender, receiver, msg.as_string())
            server.quit()
            logging.info("Stock report email dispatched successfully!")
        except Exception as e:
            logging.error(f"Email delivery pipeline failed: {str(e)}")
