"""
Supabase client configuration for AI Photobooth backend
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Initialize Supabase client with service role key for backend operations
_supabase_client: Client | None = None

def get_supabase() -> Client:
    """Get Supabase client instance (singleton pattern)"""
    global _supabase_client
    
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables"
            )
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    return _supabase_client

def get_supabase_url() -> str:
    """Get Supabase URL for storage operations"""
    if not SUPABASE_URL:
        raise ValueError("SUPABASE_URL must be set in environment variables")
    return SUPABASE_URL
