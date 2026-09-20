# Save this file exactly as: .functions/chat_gateway/chat_blueprint.py
import azure.functions as func
import json
import uuid
import logging
import importlib.util
import os
import xmlrpc.client  # Injected native Odoo protocol library

# Load the ai_router module from the hidden .ai_engine folder
ai_router_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '.ai_engine', 'ai_router.py'))
spec = importlib.util.spec_from_file_location('ai_router', ai_router_path)
ai_router = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ai_router)
parse_user_prompt = ai_router.parse_user_prompt

# Initialize a thread-safe blueprint routing node
chat_bp = func.Blueprint()

# Isolated session map to prevent data leakage between different users
SESSION_STORE = {}

def execute_odoo_booking_pipeline(payload: dict) -> str:
    """Programmatically authenticate and inject structured multi-line product items into Odoo 18."""
    url = os.getenv("ODOO_URL", "").rstrip('/')
    db = os.getenv("ODOO_DB", "")
    username = os.getenv("ODOO_USER", "")
    password = os.getenv("ODOO_PASSWORD", "")
    
    if not all([url, db, username, password]):
        logging.warning("⚠️ Odoo environment configurations missing. Skipping data write.")
        return None
        
    try:
        common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
        uid = common.authenticate(db, username, password, {})
        if not uid:
            logging.error("❌ Odoo XML-RPC access profile verification failed.")
            return None
            
        models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')
        email = payload.get("email", "")
        customer_name = payload.get("name", "Guest")
        
        # 1. Deduplicate Customer: Search or Create profile row (res.partner)
        partner_ids = models.execute_kw(db, uid, password, 'res.partner', 'search', [[['email', '=', email]]])
        partner_id = partner_ids[0] if partner_ids else models.execute_kw(db, uid, password, 'res.partner', 'create', [{
            'name': customer_name,
            'email': email,
            'comment': 'Profile generated autonomously via Agentforce.'
        }])
        
        # 2. Package Variables: Fallback defaults if fields are empty
        pkg = payload.get("packageName", "Swiss Alpine Grand Tour")
        check_in = payload.get("checkIn", "2026-10-12")
        check_out = payload.get("checkOut", "2026-10-18")
        
        # 3. Create Detailed Order Entry (sale.order) with Child Order Lines (sale.order.line)
        # We inject the details directly into the order lines array using Odoo's (0, 0, {values}) command structure
        booking_id = models.execute_kw(db, uid, password, 'sale.order', 'create', [{
            'partner_id': partner_id,
            'client_order_ref': 'AGENTFORCE-AI',
            'note': f"Travel Timeline Hold: {check_in} to {check_out}",
            'order_line': [
                # First Row Line Item: The Core Holiday Travel Package Description
                (0, 0, {
                    'name': f"📦 Travel Package: {pkg}",
                    'product_uom_qty': 1,
                    'price_unit': 4200.00
                }),
                # Second Row Line Item: The Associated Fleet Vehicle Transit Element
                (0, 0, {
                    'name': f"🚗 Premium Fleet Rental (Window: {check_in} to {check_out})",
                    'product_uom_qty': 1,
                    'price_unit': 0.00  # Staged as bundled package price value inclusion
                })
            ]
        }])
        
        logging.info(f"✨ Odoo transaction committed successfully. Assigned Order ID: {booking_id}")
        return str(booking_id)
        
    except Exception as e:
        logging.error(f"❌ Odoo Data Integration Failure: {str(e)}")
        return None


@chat_bp.route(route="chat", methods=["POST"])
def chat_gateway(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("⚡ Processing inbound payload via Azure Function Chat Gateway Blueprint.")
    
    try:
        try:
            req_body = req.get_json()
        except ValueError:
            return func.HttpResponse(
                json.dumps({"reply": "Invalid request body format.", "action": "error"}),
                status_code=400,
                mimetype="application/json"
            )

        user_message = req_body.get("message", "").strip()
        session_id = req_body.get("sessionId") or str(uuid.uuid4())

        if not user_message:
            return func.HttpResponse(
                json.dumps({"reply": "Message context buffer empty.", "sessionId": session_id}),
                status_code=400,
                mimetype="application/json"
            )

        # Allocate or pull conversational history tracking states safely
        if session_id not in SESSION_STORE:
            SESSION_STORE[session_id] = []

        # Execute your extracted .ai_engine code logic
        extracted_data = parse_user_prompt(user_message, SESSION_STORE[session_id])
        
        # ⚡ INJECTED ODOO TRIGGER POINT
        # Runs data sync pipelines immediately if validation parameters are clean
        odoo_order_id = None
        action_verb = extracted_data.get("action")
        if action_verb in ["create", "update"] and not extracted_data.get("missingFields"):
            odoo_order_id = execute_odoo_booking_pipeline(extracted_data)

        # Format the backend's extracted JSON parameters into frontend UI actions
        ui_response = translate_data_to_ui(extracted_data, session_id)
        
        # If an Odoo reference record was created, append it to the chat response
        if odoo_order_id and "payload" in ui_response:
            ui_response["reply"] += f" Staged into ERP Dashboard as Order reference: ODOO-{odoo_order_id}."
        
        return func.HttpResponse(
            json.dumps(ui_response),
            status_code=200,
            mimetype="application/json"
        )

    except Exception as e:
        logging.error(f"❌ System failure in Azure Route Handler: {str(e)}")
        return func.HttpResponse(
            json.dumps({"reply": f"Internal execution gateway crash: {str(e)}", "action": "error"}),
            status_code=500,
            mimetype="application/json"
        )

def translate_data_to_ui(data, session_id):
    """Transforms raw structured AI data into interactive components for the frontend."""
    action = data.get("action")
    
    if action == "policy_reply":
        return {"reply": data.get("reply"), "action": "text", "sessionId": session_id}
        
    if action == "validation_failed":
        missing = data.get("missingFields", [])
        field_labels = {"checkIn": "Check-In", "checkOut": "Check-Out", "name": "Name", "email": "Email"}
        missing_readable = [field_labels.get(f, f) for f in missing]
        
        return {
            "reply": f"I can stage this reservation hold. Please provide your missing details: {', '.join(missing_readable)}.",
            "action": "prompt_missing",
            "missingFields": missing,
            "sessionId": session_id
        }
        
    if action in ["create", "update"]:
        return {
            "reply": "Excellent! I have fully cross-validated your travel itinerary. Review the summary block below:",
            "action": "render_receipt",
            "payload": data,
            "sessionId": session_id
        }

    return {"reply": "Processing requests...", "action": "text", "sessionId": session_id}
