# Task Manager

Applicazione web per la gestione di task, con **frontend** incluso e **REST API** realizzata con **Python**, **FastAPI** e **SQLite**.

## Funzionalità

- Interfaccia web per creare, visualizzare, modificare ed eliminare task
- Filtrare i task per stato (tutti / da fare / completati)
- Segnare un task come completato con un click
- Autenticazione JWT (login con username e password)
- REST API completa con documentazione Swagger UI automatica

## Requisiti

- Python 3.10+

## Avvio rapido

> **Prima installazione** — da fare una volta sola:

```bash
# 1. Crea il virtual environment
python -m venv venv

# 2. Attivalo  (Windows)
venv\Scripts\activate

# 3. Installa le dipendenze
pip install -r requirements.txt
```

> **Ogni volta che vuoi avviare il progetto:**

```bash
# 1. Attiva il virtual environment  (Windows)
venv\Scripts\activate

# 2. Avvia il server
uvicorn app.main:app --reload
```

Poi apri il browser su:

| URL | Descrizione |
|-----|-------------|
| `http://127.0.0.1:8000/` | **Applicazione web** (interfaccia grafica) |
| `http://127.0.0.1:8000/docs` | Swagger UI (documentazione API interattiva) |

Credenziali default: **admin** / **admin**

## Autenticazione

L'API utilizza JWT. Per ottenere un token:

1. Invia una richiesta `POST /auth/token` con le credenziali (default: `admin` / `admin`)
2. Usa il token ricevuto nell'header `Authorization: Bearer <token>`

In Swagger UI puoi cliccare il pulsante **Authorize** e inserire le credenziali direttamente.

## Endpoints

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `POST` | `/auth/token` | Ottieni un JWT token |
| `POST` | `/tasks` | Crea un nuovo task |
| `GET` | `/tasks` | Lista dei task (filtri: `completed`, `skip`, `limit`) |
| `GET` | `/tasks/{id}` | Dettaglio di un singolo task |
| `PUT` | `/tasks/{id}` | Aggiorna un task |
| `PATCH` | `/tasks/{id}/complete` | Segna un task come completato |
| `DELETE` | `/tasks/{id}` | Elimina un task |

### Esempi con curl

```bash
# Login
curl -X POST http://127.0.0.1:8000/auth/token \
  -d "username=admin&password=admin"

# Crea un task (sostituisci <TOKEN> con il token ottenuto)
curl -X POST http://127.0.0.1:8000/tasks \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Comprare il latte", "description": "Al supermercato"}'

# Lista task
curl http://127.0.0.1:8000/tasks \
  -H "Authorization: Bearer <TOKEN>"

# Filtra solo task completati
curl "http://127.0.0.1:8000/tasks?completed=true" \
  -H "Authorization: Bearer <TOKEN>"

# Segna come completato
curl -X PATCH http://127.0.0.1:8000/tasks/1/complete \
  -H "Authorization: Bearer <TOKEN>"

# Elimina un task
curl -X DELETE http://127.0.0.1:8000/tasks/1 \
  -H "Authorization: Bearer <TOKEN>"
```

## Struttura del progetto

```
Task1/
├── app/
│   ├── __init__.py
│   ├── main.py           # Entry point FastAPI + serve frontend
│   ├── config.py          # Configurazione (env vars)
│   ├── database.py        # Engine e sessione SQLAlchemy
│   ├── models.py          # Modello ORM Task
│   ├── schemas.py         # Schemi Pydantic (validazione)
│   ├── crud.py            # Operazioni database
│   ├── auth.py            # Logica JWT
│   └── routers/
│       ├── __init__.py
│       ├── tasks.py       # Endpoints task
│       └── auth.py        # Endpoint autenticazione
├── static/
│   ├── index.html         # Frontend SPA
│   ├── style.css          # Stili
│   └── app.js             # Logica frontend
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Modello dati

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | integer | Identificativo univoco (auto-generato) |
| `title` | string | Titolo del task (obbligatorio, max 200 caratteri) |
| `description` | string \| null | Descrizione opzionale (max 1000 caratteri) |
| `completed` | boolean | Stato di completamento (default: false) |
| `created_at` | datetime | Data e ora di creazione (auto-generata) |
