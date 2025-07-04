import azure.functions as func
import logging
import os
import json
from pymongo import MongoClient
import jwt
from bson import ObjectId, json_util
from azure.storage.blob import generate_blob_sas, BlobSasPermissions, BlobServiceClient
from datetime import datetime, timedelta
import requests
import re
import unicodedata
import fitz 
from openai import AzureOpenAI

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

mongo_uri = os.environ["MONGO_URI"]
client = MongoClient(mongo_uri)
db = client[os.environ["MONGO_DB_NAME"]]

def serialize_objectid(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    raise TypeError(f"Tipo non serializzabile: {type(obj)}")

def get_oid_from_token(token: str):
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        return decoded.get("oid")
    except Exception:
        return None

@app.route(route="ensure_user_registered", methods=["POST", "OPTIONS"])
def ensure_user_registered(req: func.HttpRequest) -> func.HttpResponse:
    if req.method == "OPTIONS":
        return func.HttpResponse("", status_code=204)

    try:
        data = req.get_json()
        user_id = data.get("userId")
        name = data.get("name")
        email = data.get("email")

        if not user_id or not name or not email:
            return func.HttpResponse(
                json.dumps({"error": "Missing userId, name or email"}),
                status_code=400,
                mimetype="application/json"
            )

        collection = db["users"]

        existing_user = collection.find_one({"userId": user_id})
        if existing_user:
            return func.HttpResponse(
                json.dumps({"status": "Utente già registrato"}),
                status_code=200,
                mimetype="application/json"
            )

        collection.insert_one({
            "userId": user_id,
            "name": name,
            "email": email
        })

        return func.HttpResponse(
            json.dumps({"status": "registered"}),
            status_code=201,
            mimetype="application/json"
        )

    except Exception as e:
        logging.error(f"Errore nella registrazione utente: {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )
    
@app.route(route="create_checklist", methods=["POST", "OPTIONS"])
def create_checklist(req: func.HttpRequest) -> func.HttpResponse:
    
    if req.method == "OPTIONS":
        return func.HttpResponse("", status_code=204)

    try:
        data = req.get_json()
        user_id = data.get("userId")
        title = data.get("title")
        items = data.get("items")

        if not user_id or not title or not isinstance(items, list):
            return func.HttpResponse("Dati checklist mancanti o invalidi", status_code=400)

        checklist = {
            "userId": user_id,
            "title": title.strip(),
            "items": [
                {
                    "id": str(i),
                    "text": item.get("text", "").strip(),
                    "done": item.get("done", False)
                }
                for i, item in enumerate(items)
                if item.get("text", "").strip()
            ]
        }

        result = db["Checklists"].insert_one(checklist)
        checklist["_id"] = result.inserted_id  

        return func.HttpResponse(
            json.dumps(checklist, default=serialize_objectid),
            status_code=201,
            mimetype="application/json"
        )

    except Exception as e:
        logging.error(f"Errore nella creazione checklist: {e}")
        return func.HttpResponse(
            str(e),
            status_code=500
        )
    
@app.route(route="get_checklists", methods=["POST"])    
def get_checklists(req: func.HttpRequest) -> func.HttpResponse:
    try:
        data = req.get_json()
        user_id = data.get("userId")

        if not user_id:
            return func.HttpResponse("userId mancante", status_code=400)

        results = list(db["Checklists"].find({"userId": user_id}))

        return func.HttpResponse(
            json_util.dumps(results),
            status_code=200,
            mimetype="application/json"
        )

    except Exception as e:
        logging.error(f"Errore nel recupero checklist: {e}")
        return func.HttpResponse(str(e), status_code=500)
    
@app.route(route="update_checklist_item", methods=["POST", "OPTIONS"])
def update_checklist_item(req: func.HttpRequest) -> func.HttpResponse:

    if req.method == "OPTIONS":
        return func.HttpResponse(
            "",
            status_code=204
        )

    try:
        data = req.get_json()
        checklist_id = data.get("checklistId")
        items = data.get("items")

        if isinstance(checklist_id, dict) and "$oid" in checklist_id:
            checklist_id = checklist_id["$oid"]

        if not checklist_id or not isinstance(items, list):
            return func.HttpResponse("Dati mancanti o invalidi", status_code=400)

        result = db["Checklists"].find_one_and_update(
            {"_id": ObjectId(checklist_id)},
            {"$set": {"items": items}},
            return_document=True 
        )

        if result is None:
            return func.HttpResponse("Checklist non trovata", status_code=404)

        return func.HttpResponse(
            json_util.dumps(result),
            status_code=200,
            mimetype="application/json"
        )

    except Exception as e:
        logging.error(f"Errore nell'aggiornamento checklist: {e}")
        return func.HttpResponse(
            str(e),
            status_code=500
        )
    
@app.route(route="delete_checklist", methods=["POST", "OPTIONS"])
def delete_checklist(req: func.HttpRequest) -> func.HttpResponse:
    if req.method == "OPTIONS":
        return func.HttpResponse(
            "",
            status_code=204
        )

    try:
        data = req.get_json()
        checklist_id = data.get("checklistId")

        if isinstance(checklist_id, dict) and "$oid" in checklist_id:
            checklist_id = checklist_id["$oid"]

        if not checklist_id:
            return func.HttpResponse("checklistId mancante", status_code=400)

        result = db["Checklists"].delete_one({"_id": ObjectId(checklist_id)})

        if result.deleted_count == 1:
            return func.HttpResponse(
                "Checklist eliminata con successo.",
                status_code=200
            )
        else:
            return func.HttpResponse("Checklist non trovata", status_code=404)

    except Exception as e:
        logging.error(f"Errore durante l'eliminazione della checklist: {e}")
        return func.HttpResponse(
            str(e),
            status_code=500
        )
    
@app.route(route="get_notifications")
def get_notifications(req: func.HttpRequest) -> func.HttpResponse:
    user_id = req.params.get("userId")
    if not user_id:
        return func.HttpResponse("userId mancante", status_code=400)

    access_token = req.headers.get("Authorization", "").replace("Bearer ", "")
    if not access_token:
        return func.HttpResponse("Token mancante", status_code=401)

    try:
        today = datetime.utcnow().date()
        start_of_day = f"{today}T00:00:00Z"
        end_of_day = f"{today}T23:59:59Z"

        url = f"https://graph.microsoft.com/v1.0/me/calendarView?startDateTime={start_of_day}&endDateTime={end_of_day}"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Prefer": 'outlook.timezone="Romance Standard Time"'
        }
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            logging.error(f"Errore nella chiamata Graph API: {response.text}")
            return func.HttpResponse("Errore nel recupero degli eventi", status_code=500)

        events = response.json().get("value", [])
        notifications = []

        for event in events:
            event_time = event["start"]["dateTime"]
            event_name = event.get("subject", "Evento senza nome")

            event_hour = datetime.fromisoformat(event_time).strftime("%H:%M")
            message = f"Ehi, ti ricordo che oggi alle {event_hour}, hai l'evento: {event_name}"
            notifications.append({
                "title": "Promemoria Calendario",
                "message": message,
                "date": event_time
            })

        return func.HttpResponse(
            body=json.dumps(notifications),
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        logging.exception("Errore durante il controllo notifiche.")
        return func.HttpResponse("Errore interno", status_code=500)

@app.route(route="upload_document", methods=["GET", "OPTIONS"])
def upload_document(req: func.HttpRequest) -> func.HttpResponse:
    if req.method == "OPTIONS":
        return func.HttpResponse("", status_code=204)

    filename = req.params.get("filename")
    if not filename:
        return func.HttpResponse("filename mancante", status_code=400)

    try:
        account_name = os.environ["BLOB_ACCOUNT_NAME"]
        account_key = os.environ["BLOB_ACCOUNT_KEY"]
        container_name = os.environ["BLOB_CONTAINER_NAME"]

        sas_token = generate_blob_sas(
            account_name=account_name,
            container_name=container_name,
            blob_name=filename,
            account_key=account_key,
            permission=BlobSasPermissions(write=True, create=True),
            expiry=datetime.utcnow() + timedelta(minutes=15)
        )

        sas_url = f"https://{account_name}.blob.core.windows.net/{container_name}/{filename}?{sas_token}"

        return func.HttpResponse(sas_url, status_code=200)

    except Exception as e:
        return func.HttpResponse(f"Errore nella generazione del SAS token: {str(e)}", status_code=500)

@app.route(route="get_documents", methods=["GET", "OPTIONS"])
def get_documents(req: func.HttpRequest) -> func.HttpResponse:
    if req.method == "OPTIONS":
        return func.HttpResponse("", status_code=204)

    try:
        connect_str = os.environ["AZURE_STORAGE_CONNECTION_STRING"]
        container_name = os.environ["BLOB_CONTAINER_NAME"]

        azure_openai_endpoint = os.environ["AZURE_OPENAI_ENDPOINT"]
        azure_openai_key = os.environ["AZURE_OPENAI_KEY"]
        azure_openai_model_name = os.environ["AZURE_OPENAI_MODEL_NAME"]

        blob_service_client = BlobServiceClient.from_connection_string(connect_str)
        container_client = blob_service_client.get_container_client(container_name)

        openai_client = AzureOpenAI(
            api_key=azure_openai_key,
            azure_endpoint=azure_openai_endpoint,
            api_version="2024-02-01" 
        )

        documents_collection = db["Documents"]
        
        documents = []
        blobs = container_client.list_blobs()

        for blob in blobs:
            if blob.name.lower().endswith(".pdf"):
                blob_client = container_client.get_blob_client(blob.name)
                blob_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{container_name}/{blob.name}"
                
                summary_text = "Riassunto non disponibile." 
                
                existing_document_summary = documents_collection.find_one({
                    "_id": blob.name 
                })

                if existing_document_summary:
                    summary_text = existing_document_summary.get("summary", "Riassunto precedentemente salvato non disponibile.")
                else:
                    extracted_text_content = "" 
                    try:
                        stream_data = blob_client.download_blob().readall()
                        
                        pdf_document = fitz.open(stream=stream_data, filetype="pdf")
                        
                        for page_num in range(pdf_document.page_count):
                            page = pdf_document.load_page(page_num)
                            extracted_text_content += page.get_text("text") 
                        
                        pdf_document.close()

                        if extracted_text_content:
                            final_cleaned_text = unicodedata.normalize('NFKC', extracted_text_content)
                            final_cleaned_text = re.sub(r'\s+', ' ', final_cleaned_text).strip()
                            final_cleaned_text = final_cleaned_text.encode('utf-8', 'ignore').decode('utf-8')

                            max_chars_for_openai = 100000 
                            truncated_text = final_cleaned_text[:max_chars_for_openai] if len(final_cleaned_text) > max_chars_for_openai else final_cleaned_text

                            try:
                                response = openai_client.chat.completions.create(
                                    model=azure_openai_model_name,
                                    messages=[
                                        {"role": "system", "content": "Sei un assistente che riassume documenti. Il tuo obiettivo è fornire un riassunto conciso in italiano, con un massimo di 250 caratteri. Assicurati che il riassunto termini sempre con una frase completa, senza tagliare parole a metà."},
                                        {"role": "user", "content": f"Riassumi il seguente documento in italiano, con un massimo di 250 caratteri. Il riassunto deve essere sintetico e terminare con una frase completa, senza tagliare le parole. Concentrati sui punti essenziali:\n\n{truncated_text}"}
                                    ],
                                    max_tokens=80,
                                    temperature=0.7
                                )
                                
                                if response.choices and response.choices[0].message and response.choices[0].message.content:
                                    summary_raw = response.choices[0].message.content.strip()
                                    
                                    char_limit = 250 
                                    if len(summary_raw) > char_limit:
                                        last_full_stop_index = -1
                                        for i in range(min(len(summary_raw), char_limit) -1, -1, -1):
                                            if summary_raw[i] in ['.', '?', '!']:
                                                last_full_stop_index = i
                                                break
                                        
                                        if last_full_stop_index != -1:
                                            if last_full_stop_index + 1 < len(summary_raw) and summary_raw[last_full_stop_index + 1] == ' ':
                                                summary_text = summary_raw[:last_full_stop_index + 2].strip()
                                            else:
                                                summary_text = summary_raw[:last_full_stop_index + 1].strip()
                                        else:
                                            summary_text = summary_raw[:char_limit].rsplit(' ', 1)[0] + "..." if ' ' in summary_raw[:char_limit] else summary_raw[:char_limit] + "..."
                                    else:
                                        summary_text = summary_raw


                                    document_to_save = {
                                        "_id": blob.name,
                                        "filename": blob.name,
                                        "blob_url": blob_url,
                                        "summary": summary_text,
                                        "generated_at": datetime.utcnow().isoformat() + 'Z'
                                    }
                                        
                                    documents_collection.insert_one(document_to_save)

                                else:
                                    summary_text = "Riassunto non disponibile da Azure OpenAI."

                            except Exception as openai_e:
                                logging.error(f"Errore durante la chiamata ad Azure OpenAI per '{blob.name}': {str(openai_e)}")
                                summary_text = f"Errore Azure OpenAI: {str(openai_e)}"
                        else:
                            summary_text = "Riassunto non disponibile (testo vuoto da PDF)."

                    except Exception as e:
                        logging.warning(f"Errore durante l'elaborazione del PDF con PyMuPDF o la successiva summarization per '{blob.name}': {str(e)}")
                        summary_text = f"Errore interno elaborazione PyMuPDF/OpenAI: {str(e)}"

                documents.append({
                    "title": blob.name,
                    "url": blob_url,
                    "summary": summary_text
                })

        return func.HttpResponse(
            json.dumps(documents, default=serialize_objectid),
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        logging.error(f"Errore interno generale in get_documents: {str(e)}")
        return func.HttpResponse(
            f"Errore interno del server: {str(e)}",
            status_code=500
        )