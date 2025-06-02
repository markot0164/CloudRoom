import json
import os
import azure.functions as func
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
import logging

get_config = func.Blueprint()

@get_config.route(route="get_config", auth_level=func.AuthLevel.ANONYMOUS)
def get_config_handler(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Richiesta ricevuta su /api/get_config")

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
        logging.error(f"Errore durante il recupero dei segreti: {e}")
        return func.HttpResponse(f"Errore: {str(e)}", status_code=500)