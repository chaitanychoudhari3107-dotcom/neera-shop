import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv(Path(__file__).with_name(".env"))

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
SUPABASE_SECRET_KEY = os.environ["SUPABASE_SECRET_KEY"]

# Client for verifying user authentication
auth_client: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)

# Privileged database client - backend only
supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)