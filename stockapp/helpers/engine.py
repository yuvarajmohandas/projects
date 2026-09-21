import requests
import yfinance as yf

def calculate_rsi(data, window=14):
    delta = data['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def get_usd_eur_rate():
    try:
        fx = yf.Ticker("USDEUR=X")
        fx_hist = fx.history(period="1d")
        if not fx_hist.empty:
            return float(fx_hist['Close'].iloc[-1])
    except Exception:
        pass
    return 0.89

def search_ticker_by_name(company_name):
    try:
        search_results = yf.Search(company_name, max_results=1).quotes
        if search_results:
            return search_results['symbol']
    except Exception:
        pass
    return None

def fetch_latest_stock_news(ticker):
    try:
        stock_obj = yf.Ticker(ticker)
        news_list = stock_obj.news
        if news_list and len(news_list) > 0:
            latest_story = news_list[0]
            title = latest_story.get('title')
            publisher = latest_story.get('publisher', 'Market Feed')
            if title:
                return f'"{title}" (via {publisher})'
    except Exception:
        pass
    return "No major company-specific breaking headlines reported recently."

def generate_user_friendly_signals(ticker):
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period="3mo")
        if df.empty or len(df) < 15:
            return None
            
        # NEW: Fetch the official full company name, default to the ticker symbol if missing
        company_fullname = stock.info.get('longName', ticker)
            
        stock_currency = stock.info.get('currency', 'USD')
        df['RSI'] = calculate_rsi(df)
        df['SMA50'] = df['Close'].rolling(window=min(50, len(df))).mean()
        
        latest, prev = df.iloc[-1], df.iloc[-2]
        current_price, rsi, sma50 = float(latest['Close']), float(latest['RSI']), float(latest['SMA50'])
        
        display_currency_symbol = "$"
        if stock_currency == "USD":
            usd_to_eur_multiplier = get_usd_eur_rate()
            current_price = current_price * usd_to_eur_multiplier
            sma50 = sma50 * usd_to_eur_multiplier
            display_currency_symbol = "€"
        elif stock_currency == "EUR":
            display_currency_symbol = "€"
            
        energy_score = "🔥 High" if rsi >= 65 else ("🥶 Low" if rsi <= 38 else "⚖️ Stable")
        trend_health = "📈 Growth" if latest['Close'] >= latest['SMA50'] else "📉 Pressure"

        signal, user_reason = "HOLD", "Asset consolidating in neutral comfort zone."
        breaking_news = "N/A - Monitor routine resting."
        
        if rsi > 65:
            signal = "SELL"
            user_reason = "Stock overextended short term. Risk of profit-taking pullback."
            breaking_news = fetch_latest_stock_news(ticker)
        elif latest['Close'] < latest['SMA50'] and prev['Close'] >= df['SMA50'].iloc[-2]:
            signal = "SELL"
            user_reason = f"Price fell below the 50-day SMA floor line ({display_currency_symbol}{sma50:.2f}). Bearish trend shift."
            breaking_news = fetch_latest_stock_news(ticker)
        elif rsi < 38:
            signal = "BUY"
            user_reason = "Deep short-term pullback. Stock temporarily on sale."
            breaking_news = fetch_latest_stock_news(ticker)
        elif latest['Close'] > latest['SMA50'] and abs(latest['Close'] - latest['SMA50']) / latest['SMA50'] < 0.02 and rsi < 50:
            signal = "BUY"
            user_reason = f"Healthy dip bounce directly on 50-day structural support line ({display_currency_symbol}{sma50:.2f})."
            breaking_news = fetch_latest_stock_news(ticker)
        elif latest['Close'] > latest['SMA50'] and prev['Close'] <= df['SMA50'].iloc[-2]:
            signal = "BUY"
            user_reason = f"Bullish structural breakout above overhead line ({display_currency_symbol}{sma50:.2f}) on high momentum."
            breaking_news = fetch_latest_stock_news(ticker)
            
        return {
            "ticker": ticker,
            "company_display_name": company_fullname,  # NEW FIELD PASSING NAME
            "current_price": f"{display_currency_symbol}{current_price:.2f}",
            "market_energy": energy_score,
            "overall_trend": trend_health,
            "recommended_action": signal,
            "broker_advice": user_reason,
            "breaking_news_reason": breaking_news
        }
    except Exception:
        return None
