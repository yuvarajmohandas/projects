# Save this file exactly as: C:\Git\personal\poc\TravelAgentDemo\functions\function_app.py
import azure.functions as func
import sys
import os

# Dynamic Path Injector: Ensures the runtime can find your .ai_engine directory sideways
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Initialize the modern corporate Azure Function Application Context
app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# Import your route blueprints from your sub-folders
from chat_gateway.chat_blueprint import chat_bp

# Register your chat endpoint into the core runtime engine
app.register_blueprint(chat_bp)
