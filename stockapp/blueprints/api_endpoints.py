import json
import os
import azure.functions as func
from helpers.engine import generate_user_friendly_signals, search_ticker_by_name

# Initialize the blueprint architecture
bp_api = func.Blueprint()

@bp_api.route(route="analyze", methods=["GET"])
def stock_analyzer_api(req: func.HttpRequest) -> func.HttpResponse:
    search_query = req.params.get('search')
    tickers_param = req.params.get('tickers')
    
    watchlist = []
    
    # 1. Process name query string if it exists
    if search_query:
        discovered = search_ticker_by_name(search_query)
        if discovered:
            watchlist = [discovered]
        else:
            return func.HttpResponse(
                json.dumps({"status": "error", "message": f"Could not map asset: '{search_query}'"}),
                status_code=404,
                mimetype="application/json"
            )
            
    # 2. Process custom array block parameter if it exists
    elif tickers_param:
        watchlist = [t.strip().upper() for t in tickers_param.split(',')]
        
    # 3. Securely fallback to your system watchlist stored in Azure Environment Variables
    else:
        env_watchlist = os.environ.get("WATCHLIST_TICKERS", "AAPL,MSFT,GOOGL,AMZN,TSLA,NVDA")
        watchlist = [t.strip().upper() for t in env_watchlist.split(',')]

    # Execute math analytics tracking
    reports = [res for ticker in watchlist if (res := generate_user_friendly_signals(ticker))]
    
    return func.HttpResponse(
        json.dumps({"status": "success", "results": reports}, indent=4),
        mimetype="application/json",
        status_code=200
    )
