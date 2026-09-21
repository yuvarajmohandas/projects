import azure.functions as func
from blueprints.api_endpoints import bp_api
from blueprints.cron_schedules import bp_cron

# Instantiate global framework application runtime execution hub
app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# Dynamically bundle and stitch separated blueprints seamlessly
app.register_blueprint(bp_api)
app.register_blueprint(bp_cron)
