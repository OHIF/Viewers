"""
MIMPS Audit Service — JWT verification endpoint.

Nginx delegates auth via `auth_request /auth/verify`. This service validates
RS256 JWTs issued by 1_blackvoxel against the platform's JWKS endpoint.

JWKS is cached in-process with a 1-hour TTL to avoid fetching on every request.
"""

import time
import logging
from typing import Optional

import httpx
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from jose import jwt as jose_jwt, JWTError, jwk
from pydantic_settings import BaseSettings

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

class Settings(BaseSettings):
    BLACKVOXEL_JWKS_URL: str = "http://localhost:8000/api/auth/.well-known/jwks.json"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("audit-service")

# ---------------------------------------------------------------------------
# JWKS cache — module-level, shared across all requests in this process.
# Re-fetched only when the cached copy is older than JWKS_TTL_SECONDS.
# ---------------------------------------------------------------------------

JWKS_TTL_SECONDS = 3600  # 1 hour — matches Cache-Control: max-age=3600 from platform

_jwks_cache: dict = {}
_jwks_fetched_at: float = 0.0


async def fetch_jwks() -> dict:
    """Return the cached JWKS, refreshing if older than JWKS_TTL_SECONDS."""
    global _jwks_cache, _jwks_fetched_at

    now = time.time()
    age = now - _jwks_fetched_at

    if _jwks_cache and age < JWKS_TTL_SECONDS:
        return _jwks_cache

    logger.info(
        "Fetching JWKS from %s (cache age: %.0fs)",
        settings.BLACKVOXEL_JWKS_URL,
        age,
    )
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get(settings.BLACKVOXEL_JWKS_URL)
        response.raise_for_status()

    _jwks_cache = response.json()
    _jwks_fetched_at = now
    logger.info("JWKS refreshed; %d key(s) loaded", len(_jwks_cache.get("keys", [])))
    return _jwks_cache


def _get_rsa_key(jwks: dict, kid: str) -> Optional[dict]:
    """Return the JWK matching `kid`, or None if not found."""
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


async def validate_token(token: str) -> dict:
    """
    Validate an RS256 JWT against the platform JWKS.

    Returns the decoded payload on success.
    Raises ValueError or JWTError on any failure.
    """
    jwks = await fetch_jwks()

    try:
        header = jose_jwt.get_unverified_header(token)
    except JWTError as exc:
        raise ValueError(f"Malformed JWT header: {exc}") from exc

    kid = header.get("kid", "")
    rsa_key = _get_rsa_key(jwks, kid)

    if not rsa_key:
        # kid not in cache — attempt one cache refresh before failing
        logger.warning("kid '%s' not found in cached JWKS; forcing refresh", kid)
        global _jwks_fetched_at
        _jwks_fetched_at = 0.0
        jwks = await fetch_jwks()
        rsa_key = _get_rsa_key(jwks, kid)
        if not rsa_key:
            raise ValueError(f"No matching key for kid '{kid}'")

    public_key = jwk.construct(rsa_key, algorithm="RS256")
    payload = jose_jwt.decode(
        token,
        public_key.to_pem().decode(),
        algorithms=["RS256"],
        options={"verify_aud": False},
    )
    return payload


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="MIMPS Audit Service")


@app.get("/health")
async def health() -> dict:
    """Liveness probe — returns 200 as long as the process is up."""
    return {"status": "ok"}


@app.get("/auth/verify")
async def auth_verify(request: Request) -> JSONResponse:
    """
    Nginx auth_request target.

    Returns 200 {"valid": true, "user_id": "<sub>"} on success.
    Returns 401 {"detail": "..."} on any auth failure.

    Nginx auth_request treats any 2xx as pass and any non-2xx as deny.
    """
    authorization: str = request.headers.get("Authorization", "")

    if not authorization.startswith("Bearer "):
        logger.info("auth/verify: missing or malformed Authorization header")
        return JSONResponse(status_code=401, content={"detail": "Missing token"})

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = await validate_token(token)
    except (ValueError, JWTError, httpx.HTTPError) as exc:
        logger.info("auth/verify: token rejected — %s", exc)
        return JSONResponse(
            status_code=401, content={"detail": "Invalid or expired token"}
        )

    user_id: str = payload.get("sub", "")
    logger.info("auth/verify: accepted sub=%s", user_id)
    return JSONResponse(status_code=200, content={"valid": True, "user_id": user_id})


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
