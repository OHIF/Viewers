# MIMPS audit-service (INT-05) — JWT verification target for nginx auth_request.
# Validates RS256 JWTs against the BlackVoxel platform JWKS.
#
# Build:  docker compose --profile full build audit-service
# Config: BLACKVOXEL_JWKS_URL (see ../.env.example)
#
# Production note: on the VPS this service runs on the host under systemd
# (mimps-audit.service), NOT in this container. This image is for local dev
# and on-prem/pilot deployments via the compose "full" profile (MIMPS-13).

FROM python:3.12-slim

# Non-root runtime user (least privilege).
RUN useradd --create-home --uid 10001 audit

WORKDIR /app

# Install pinned deps first for layer caching.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py ./

USER audit
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
