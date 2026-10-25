import os

from fastapi import Header, HTTPException
from database import auth_client


def require_admin(authorization: str = Header(default=None)):

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    token = authorization.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        response = auth_client.auth.get_user(token)
        user = response.user

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )

    admin_id = os.getenv("NEERA_ADMIN_USER_ID")

    if not admin_id:
        raise HTTPException(
            status_code=503,
            detail="Admin authentication is not configured"
        )

    if not user or user.id != admin_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return user