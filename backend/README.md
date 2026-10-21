# Project Node - Backend (Python & Supabase)

This backend supports **Project Node**, a residential community web application connecting neighbors in a residential area.

## Tech Stack
- **Python 3.10+ / 3.13**
- **FastAPI**: Modern, fast RESTful API
- **Supabase**: PostgreSQL database with real-time updates and Row Level Security (RLS)
- **Uvicorn**: High-performance ASGI server

---

## Getting Started

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Supabase (Optional for full cloud persistence)
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard and run the script in [`schema.sql`](./schema.sql).
3. Copy your project URL and Anon/Service Key.
4. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
5. Enter your `SUPABASE_URL` and `SUPABASE_KEY` into `.env`.

> **Note**: If you don't configure Supabase immediately, the backend automatically runs in **standalone mock mode**, persisting state in-memory and in frontend `localStorage`.

### 3. Run the Server
From the `backend` directory:
```bash
python main.py
```
Or with uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

### 4. Access the Application
- **Web App**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & database connection status |
| `GET` | `/api/profile` | Retrieve resident profile & sharable name card |
| `POST` | `/api/profile` | Update appearance name & name card (Name and Phone mandatory) |
| `GET` | `/api/notifications` | Get live rectangle notifications & urgent notices |
| `DELETE` | `/api/notifications/{id}` | Dismiss a notification |
| `GET` | `/api/feed` | Get community live stream posts |
| `POST` | `/api/feed` | Create a new community post / notice |
| `POST` | `/api/feed/{id}/like` | Toggle like reaction on a post |
