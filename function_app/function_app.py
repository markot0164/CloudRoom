import json
import os
import azure.functions as func
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

app = func.FunctionApp()

@app.function_name(name="GetMicrosoftEntraIDKey")
@app.route(route="get_microsoft_entra_id_key", auth_level=func.AuthLevel.ANONYMOUS)
def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        key_vault_url = os.environ["KEY_VAULT_URL"]
        credential = DefaultAzureCredential()
        client = SecretClient(vault_url=key_vault_url, credential=credential)

        client_id = client.get_secret("AAD_CLIENT_ID").value
        authority = client.get_secret("AAD_AUTHORITY").value

        return func.HttpResponse(
            body=json.dumps({
                "clientId": client_id,
                "authority": authority
            }),
            mimetype="application/json"
        )
    except Exception as e:
        return func.HttpResponse(f"Errore: {str(e)}", status_code=500)