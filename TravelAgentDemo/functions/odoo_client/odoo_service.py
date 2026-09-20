import xmlrpc.client
import logging
import os

class OdooIntegrationClient:
    def __init__(self):
        # Dynamically reads VM connection criteria from local.settings.json variables
        self.url = os.getenv("ODOO_URL", "").rstrip('/')
        self.db = os.getenv("ODOO_DB", "")
        self.username = os.getenv("ODOO_USER", "")
        self.password = os.getenv("ODOO_PASSWORD", "")
        self.uid = None

    def authenticate(self):
        """Establishes an authentication token handshake session with the Odoo 18 server."""
        if not all([self.url, self.db, self.username, self.password]):
            logging.error("❌ Odoo environmental values missing inside configuration setup files.")
            return False
        try:
            common = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/common')
            self.uid = common.authenticate(self.db, self.username, self.password, {})
            if self.uid:
                logging.info(f"🔒 Odoo session authentication successful. Allocated UID: {self.uid}")
                return True
            logging.error("❌ Odoo access profile denied. Check database login keys.")
            return False
        except Exception as e:
            logging.error(f"❌ Failed to reach Odoo server via XML-RPC network socket: {str(e)}")
            return False

    def create_package_booking(self, customer_name: str, email: str, package_name: str, check_in: str, check_out: str) -> int:
        """Saves a multi-asset travel itinerary record into the Odoo CRM/Sales tables."""
        if not self.uid and not self.authenticate():
            raise ConnectionError("No active operational session channel to the Odoo ERP environment.")

        models = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/object')

        try:
            # 1. Deduplicate Customer: Search if customer exists by email (res.partner)
            partner_ids = models.execute_kw(self.db, self.uid, self.password, 'res.partner', 'search', [[['email', '=', email]]])
            
            if partner_ids:
                partner_id = partner_ids[0]
                logging.info(f"👤 Found existing Odoo Customer ID: {partner_id}")
            else:
                partner_id = models.execute_kw(self.db, self.uid, self.password, 'res.partner', 'create', [{
                    'name': customer_name,
                    'email': email,
                    'comment': 'Profile generated autonomously via Agentforce Chat Widget gateway.'
                }])
                logging.info(f"👤 Created new Odoo Customer ID: {partner_id}")

            # 2. Draft the Quotation Booking Record (sale.order)
            booking_id = models.execute_kw(self.db, self.uid, self.password, 'sale.order', 'create', [{
                'partner_id': partner_id,
                'note': f"Autonomous Reservation Hold: {package_name}. Scheduled window: {check_in} to {check_out}.",
                'client_order_ref': 'AGENTFORCE-AI'
            }])

            logging.info(f"✨ Success! Odoo transaction committed. Generated Quotation ID: {booking_id}")
            return booking_id

        except Exception as e:
            logging.error(f"❌ Failed to commit database records to Odoo matrix: {str(e)}")
            raise e
