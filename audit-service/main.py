"""
MIMPS Audit Service — JWT verification + structured access log.

Nginx delegates auth via `auth_request /auth/verify`. This service validates
RS256 JWTs issued by 1_blackvoxel against the platform's JWKS endpoint.

Structured access events are emitted as NDJSON to stdout (captured by journald
on the VPS, and to ./access.log when ACCESS_LOG_FILE is set). Format per
ANVISA RDC 657/2022 groundwork requirements:
  {ts, event, user_id, email, uri, study_uid, remote_addr}

JWKS is cached in-process with a 1-hour TTL to avoid fetching on every request.
"""

import json
import re
import time
import logging
import sys
from datetime import datetime, timezone
from typing import Optional

import httpx
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic_settings import BaseSettings
from jose import jwt as jose_jwt, JWTError, jwk

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

class Settings(BaseSettings):
    BLACKVOXEL_JWKS_URL: str = "http://localhost:8000/api/auth/.well-known/jwks.json"
    ACCESS_LOG_FILE: str = ""  # optional path; empty = stdout only

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# ---------------------------------------------------------------------------
# Logging — two channels:
#   - logger: plain-text operational logs (startup, JWKS refresh, errors)
#   - access_log: NDJSON per-request audit events
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("audit-service")

_access_log_fh = None
if settings.ACCESS_LOG_FILE:
    try:
        _access_log_fh = open(settings.ACCESS_LOG_FILE, "a", buffering=1)  # line-buffered
        logger.info("Access log file: %s", settings.ACCESS_LOG_FILE)
    except OSError as _e:
        logger.warning("Cannot open ACCESS_LOG_FILE %s: %s — falling back to stdout", settings.ACCESS_LOG_FILE, _e)


def _emit_access_event(event: dict) -> None:
    """Write a single NDJSON access event to stdout and optionally to a file."""
    line = json.dumps(event, ensure_ascii=False)
    print(line, flush=True)
    if _access_log_fh:
        _access_log_fh.write(line + "\n")


_STUDY_UID_RE = re.compile(r"studies/([0-9.]+)")


def _extract_study_uid(uri: str) -> Optional[str]:
    """Extract a StudyInstanceUID from a DICOMweb URI, or return None."""
    m = _STUDY_UID_RE.search(uri)
    return m.group(1) if m else None


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

    Token sources, in order:
      1. `Authorization: Bearer <jwt>` header (API-style callers)
      2. `blackvoxel_jwt` cookie — set by the viewer's jwtBridge so that
         browser XHR image loads to /pacs/ carry a credential nginx can
         forward here (cornerstone requests can't set Authorization headers)

    Extra headers from nginx (forwarded by the outer /pacs/ location):
      X-Original-URI: the original client request URI
      X-Real-IP:      the real client IP (after any Cloudflare/proxy unwrap)
    """
    authorization: str = request.headers.get("Authorization", "")

    if authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
    else:
        token = request.cookies.get("blackvoxel_jwt", "").strip()

    # Audit context — populated from nginx-forwarded headers.
    original_uri: str = request.headers.get("X-Original-URI", "")
    remote_addr: str = (
        request.headers.get("X-Real-IP")
        or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        or (request.client.host if request.client else "")
    )
    ts = datetime.now(timezone.utc).isoformat()

    if not token:
        logger.info("auth/verify: no Bearer header and no blackvoxel_jwt cookie")
        _emit_access_event({
            "ts": ts,
            "event": "access_denied",
            "reason": "missing_token",
            "user_id": None,
            "email": None,
            "uri": original_uri,
            "study_uid": _extract_study_uid(original_uri),
            "remote_addr": remote_addr,
        })
        return JSONResponse(status_code=401, content={"detail": "Missing token"})

    try:
        payload = await validate_token(token)
    except (ValueError, JWTError, httpx.HTTPError) as exc:
        logger.info("auth/verify: token rejected — %s", exc)
        _emit_access_event({
            "ts": ts,
            "event": "access_denied",
            "reason": "invalid_token",
            "user_id": None,
            "email": None,
            "uri": original_uri,
            "study_uid": _extract_study_uid(original_uri),
            "remote_addr": remote_addr,
        })
        return JSONResponse(
            status_code=401, content={"detail": "Invalid or expired token"}
        )

    user_id: str = payload.get("sub", "")
    email: str = payload.get("email", "")
    logger.info("auth/verify: accepted sub=%s uri=%s", user_id, original_uri or "(none)")
    _emit_access_event({
        "ts": ts,
        "event": "access_granted",
        "user_id": user_id,
        "email": email,
        "uri": original_uri,
        "study_uid": _extract_study_uid(original_uri),
        "remote_addr": remote_addr,
    })
    return JSONResponse(status_code=200, content={"valid": True, "user_id": user_id})


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
