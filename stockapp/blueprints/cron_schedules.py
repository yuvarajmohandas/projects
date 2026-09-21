import os
import logging
import azure.functions as func
import yfinance as yf
from helpers.engine import generate_user_friendly_signals
from helpers.notifications import build_notification_layouts, dispatch_alerts

bp_cron = func.Blueprint()

def get_top_10_market_performers():
    """
    Scans a dynamic broad basket of global tech and market leaders,
    returning the top 10 highest percentage gainers for today.
    """
    # High-velocity pool available on Trade Republic (Expand as desired)
    SCAN_POOL = [
        "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "SAP", "ASML", 
        "AMD", "INTC", "NFLX", "META", "AVGO", "QCOM", "MU", "DELL", "MRVL"
    ]
    
    performance_list = []
    
    for ticker in SCAN_POOL:
        try:
            stock = yf.Ticker(ticker)
            df = stock.history(period="2d") # Get today and yesterday to calculate change
            if len(df) >= 2:
                close_today = df['Close'].iloc[-1]
                close_yesterday = df['Close'].iloc[-2]
                pct_change = ((close_today - close_yesterday) / close_yesterday) * 100
                performance_list.append({"ticker": ticker, "change": pct_change})
        except Exception:
            pass
            
    # Sort descending by today's performance and slice the top 10
    sorted_pool = sorted(performance_list, key=lambda x: x['change'], reverse=True)
    return [item['ticker'] for item in sorted_pool[:10]]

# Pass the setting name inside percent signs (%)
@bp_cron.schedule(schedule="%MORNING_REPORT_SCHEDULE%", arg_name="myTimer", run_on_startup=False, use_monitor=False)
def stock_analyzer_timer(myTimer: func.TimerRequest) -> None:
    logging.info("Automated daily smart broker macro-tracker engaged.")
    
    # 1. Fetch and process your core personal watchlist
    env_watchlist = os.environ.get("WATCHLIST_TICKERS", "AAPL,MSFT,GOOGL,AMZN,TSLA,NVDA")
    personal_tickers = [t.strip().upper() for t in env_watchlist.split(',')]
    personal_reports = [res for t in personal_tickers if (res := generate_user_friendly_signals(t))]
    
    # 2. Dynamically scan and discover today's top 10 performance leaders
    logging.info("Scanning broad index matrices for daily top performers...")
    top_10_tickers = get_top_10_market_performers()
    top_10_reports = [res for t in top_10_tickers if (res := generate_user_friendly_signals(t))]
    
    # 3. Compile layouts and dispatch alert vectors
    tg_text, email_html = build_notification_layouts(personal_reports, top_10_reports)
    dispatch_alerts(tg_text, email_html)
    
    logging.info("Multi-layer strategy distribution batch complete.")
