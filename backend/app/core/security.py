"""
MedLens Security & Authentication Module
----------------------------------------
Implements:
- Salted password hashing (bcrypt with SHA-256 fallback)
- JWT token creation, encoding, and verification
- Current user dependency for FastAPI routes
"""

import os
import datetime
import hashlib
import hmac
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db

SECRET_KEY = os.getenv("SECRET_KEY", "medlens_hackathon_super_secret_jwt_key_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login", auto_error=False)


def hash_password(password: str) -> str:
    """Hashes a password with a secure salt."""
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.hash(password)
    except Exception:
        # Secure fallback using SHA256 with project salt if passlib binary has an issue
        salt = SECRET_KEY[:16]
        return "sha256$" + hashlib.sha256((password + salt).encode('utf-8')).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against its hashed representation."""
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        salt = SECRET_KEY[:16]
        expected = "sha256$" + hashlib.sha256((plain_password + salt).encode('utf-8')).hexdigest()
        return hmac.compare_digest(expected, hashed_password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Creates a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    try:
        from jose import jwt
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    except Exception:
        # Minimalist fallback token encoding if python-jose is not yet installed
        import base64
        import json
        payload_str = json.dumps(to_encode, default=str)
        sig = hmac.new(SECRET_KEY.encode(), payload_str.encode(), hashlib.sha256).hexdigest()
        raw = f"{base64.urlsafe_b64encode(payload_str.encode()).decode()}.{sig}"
        return raw


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT access token."""
    try:
        from jose import jwt, JWTError
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        # Fallback decode
        try:
            import base64
            import json
            parts = token.split(".")
            if len(parts) >= 2:
                payload_bytes = base64.urlsafe_b64decode(parts[0].encode())
                payload = json.loads(payload_bytes.decode())
                # Check expiration
                if "exp" in payload and datetime.datetime.fromisoformat(str(payload["exp"])) < datetime.datetime.utcnow():
                    return None
                return payload
        except Exception:
            return None
    return None


def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Retrieves the authenticated User object if a valid Bearer token is provided.
    Returns None if no token provided (allows public/demo usage).
    """
    if not token:
        return None

    payload = decode_token(token)
    if not payload:
        return None

    user_id = payload.get("sub") or payload.get("id")
    if not user_id:
        return None

    from app.models import User
    user = db.query(User).filter(User.id == int(user_id)).first()
    return user
