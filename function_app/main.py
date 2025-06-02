import azure.functions as func
from . import get_config

app = func.FunctionApp()
app.register_functions(get_config)