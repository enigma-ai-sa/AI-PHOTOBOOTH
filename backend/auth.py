"""
Authentication middleware for Supabase JWT verification
"""
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import os
import jwt
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer(auto_error=False)

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

class AuthUser:
    """Authenticated user from JWT token"""
    def __init__(self, user_id: str, email: str, role: str = "operations"):
        self.user_id = user_id
        self.email = email
        self.role = role
    
    def is_admin(self) -> bool:
        return self.role == "admin"


def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Optional[AuthUser]:
    """
    Verify Supabase JWT token and return user info.
    Returns None if no token provided (for public endpoints).
    """
    if credentials is None:
        return None
    
    token = credentials.credentials
    
    try:
        # Decode the JWT token
        # Note: In production, you should verify with the Supabase JWT secret
        if SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
        else:
            # If no secret configured, decode without verification (development only)
            payload = jwt.decode(token, options={"verify_signature": False})
        
        user_id = payload.get("sub")
        email = payload.get("email", "")
        
        # Get role from user metadata or default to operations
        user_metadata = payload.get("user_metadata", {})
        role = user_metadata.get("role", "operations")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
        
        return AuthUser(user_id=user_id, email=email, role=role)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def require_auth(credentials: HTTPAuthorizationCredentials = Security(security)) -> AuthUser:
    """
    Require authentication - raises 401 if no valid token.
    """
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user = verify_token(credentials)
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    return user


def require_admin(user: AuthUser = Depends(require_auth)) -> AuthUser:
    """
    Require admin role - raises 403 if not admin.
    """
    if not user.is_admin():
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user
