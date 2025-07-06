# CloudRoom

## Introduzione

Questa repository contiene il codice sorgente e la documentazione per una piattaforma cloud sviluppata come progetto per l’esame di Cloud Computing. L’obiettivo del progetto è supportare gli studenti nella gestione dei documenti legati agli esami universitari, integrando funzionalità come archiviazione dei documenti con breve descrizione di quest ultimo, pianificazione tramite checklist e calendario.

## Abstract

Il progetto propone lo sviluppo di una piattaforma autogestita per la gestione dei documenti legati agli esami universitari, integrando funzionalità di checklist e pianificazione tramite calendario. L’obiettivo è creare un sistema che aiuti gli studenti ad organizzarsi per le sessioni di esame. Ogni utente avrà il pieno controllo sui propri contenuti, con la possibilità di creare e gestire checklist personali, una funzione di sintesi dei documenti caricati per fornire una panoramica rapida dei contenuti, pianificare eventi tramite il calendario integrato, un sistema di notificazione per gli eventi del giorno che sono nel calendario e collaborare con altri membri attraverso la condivisione dei documenti. La piattaforma, sviluppata utilizzando i servizi di Microsoft Azure come Azure Blob Storage, Cosmos DB e Azure Functions, consentirà di sfruttare un sistema scalabile e sicuro, senza una gerarchia amministrativa tradizionale. L’integrazione con Microsoft Graph API permetterà la sincronizzazione automatica con i calendari degli utenti, garantendo una gestione flessibile delle attività legate agli esami.

## Servizi Cloud utilizzati

- Azure Blob Storage: Utilizzato per la gestione e l’archiviazione sicura dei documenti caricati dagli utenti, con accesso controllato tramite URL protetti.
- Azure Cosmos DB: Impiegato per la memorizzazione dei dati strutturati della piattaforma, come checklist, documenti, utenti, garantendo scalabilità e disponibilità globale.
- Azure Functions: per Implementare la logica applicativa utilizzato ad esempio per operazioni come la creazione di checklist, il sistema di notifica o il salvataggio dei dati sul database ecc...
- - Microsoft Graph API: Consente la sincronizzazione degli eventi creati dagli utenti con i loro calendari personali, migliorando la pianificazione e l’organizzazione delle attività legate agli esami.
- Azure Key Vault: Protegge chiavi critiche e credenziali di accesso ai servizi, garantendo un elevato livello di sicurezza per le operazioni della piattaforma.
- Azure OpenAI: Utilizzato per implementare una funzione di riassunto automatico dei documenti caricati, facilitando agli utenti la comprensione rapida dei contenuti.
- Microsoft EntraID: Fornisce un sistema di login sicuro.
- Static Web App: Consente di hostare la piattaforma, semplifica lo sviluppo e la distribuzione basata su contenuti statici.
