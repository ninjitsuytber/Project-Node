\
\
   

import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

supabase_client = None

if SUPABASE_URL and SUPABASE_KEY and SUPABASE_URL != "https://xyzcompany.supabase.co":
    try:
        from supabase import create_client, Client
        supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Connected successfully to Supabase.")
    except Exception as e:
        print(f"Warning: Could not connect to Supabase: {e}. Falling back to in-memory store.")
else:
    print("Notice: No live Supabase credentials provided in .env. Running in standalone mock mode.")
