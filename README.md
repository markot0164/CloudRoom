# CloudRoom

## Introduzione

Questa repository contiene il codice sorgente e la documentazione per una piattaforma cloud sviluppata come progetto per l’esame di Cloud Computing. L’obiettivo del progetto è supportare gli studenti nella gestione dei documenti legati agli esami universitari, integrando funzionalità come archiviazione sicura, checklist collaborative e pianificazione tramite calendario.

## Abstract

Il progetto propone lo sviluppo di una piattaforma autogestita per la gestione dei documenti legati agli esami universitari, integrando funzionalità di checklist e pianificazione tramite calendario. L’obiettivo è creare uno strumento che consenta agli utenti di caricare, organizzare e condividere risorse come documenti, attività e scadenze. Ogni utente avrà il pieno controllo sui propri contenuti, con la possibilità di creare e gestire checklist personali o condivise, una funzione di sintesi dei documenti caricati per fornire una panoramica rapida dei contenuti, pianificare eventi tramite un calendario integrato e collaborare con altri membri attraverso la condivisione di risorse. La piattaforma, sviluppata utilizzando i servizi di Microsoft Azure come Azure Blob Storage, Cosmos DB e Azure Functions, consentirà di sfruttare un sistema scalabile e sicuro, senza una gerarchia amministrativa tradizionale. L’integrazione con Microsoft Graph API permetterà la sincronizzazione automatica con i calendari degli utenti, garantendo una gestione flessibile e collaborativa delle attività legate agli esami.

## Servizi Cloud utilizzati

- Azure Blob Storage: Utilizzato per la gestione e l’archiviazione sicura dei documenti caricati dagli utenti, con accesso controllato tramite URL protetti generati con Shared Access Signatures.
- Azure Cosmos DB: Impiegato per la memorizzazione dei dati strutturati della piattaforma, come checklist, metadati dei documenti e configurazioni degli utenti, garantendo scalabilità e disponibilità globale.
- Azure Functions: per Implementare la logica applicativa, sarà utilizzato per operazioni come la creazione di checklist, la generazione di URL sicuri per i documenti e l’interazione con gli altri servizi.
- Microsoft Graph API: Consente la sincronizzazione degli eventi creati dagli utenti con i loro calendari personali, migliorando la pianificazione e l’organizzazione delle attività legate agli esami.
- Azure Key Vault: Protegge chiavi critiche e credenziali di accesso ai servizi, garantendo un elevato livello di sicurezza per le operazioni della piattaforma.
- Azure OpenAI: Utilizzato per implementare una funzione di riassunto automatico dei documenti caricati, facilitando agli utenti la comprensione rapida dei contenuti.
- Microsoft EntraID: Fornisce un sistema di login sicuro e facile da integrare.
