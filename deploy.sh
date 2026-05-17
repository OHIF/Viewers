#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Build → Push → Deploy to Cloud Run + Firebase Hosting
#
# Usage:
#   ./deploy.sh            # full deploy (build + push + cloud run + hosting)
#   ./deploy.sh --skip-build  # redeploy existing image without rebuilding
# =============================================================================

set -euo pipefail

# ---------- Windows: point gcloud at its bundled Python ----------
# On Windows, the system `python` is a Store alias stub; gcloud needs a real interpreter.
if [[ -n "${LOCALAPPDATA:-}" ]]; then
  _BUNDLED_PY="${LOCALAPPDATA}/Google/Cloud SDK/google-cloud-sdk/platform/bundledpython/python.exe"
  if [[ -f "$_BUNDLED_PY" ]]; then
    export CLOUDSDK_PYTHON="$_BUNDLED_PY"
  fi
fi

# ---------- config (edit if needed) ----------
GCP_PROJECT="x7-dental"
GCP_REGION="us-central1"
SERVICE_NAME="ohif-dental-viewer"
IMAGE="gcr.io/${GCP_PROJECT}/${SERVICE_NAME}"

# Load Firebase env vars from platform/app/.env
ENV_FILE="platform/app/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found"
  exit 1
fi
source <(grep "^REACT_APP_FIREBASE" "$ENV_FILE" | sed 's/ *= */=/')

# ---------- build & push ----------
if [[ "${1:-}" != "--skip-build" ]]; then
  echo "==> Building Docker image..."
  docker build \
    --build-arg REACT_APP_FIREBASE_API_KEY="$REACT_APP_FIREBASE_API_KEY" \
    --build-arg REACT_APP_FIREBASE_AUTH_DOMAIN="$REACT_APP_FIREBASE_AUTH_DOMAIN" \
    --build-arg REACT_APP_FIREBASE_PROJECT_ID="$REACT_APP_FIREBASE_PROJECT_ID" \
    --build-arg REACT_APP_FIREBASE_STORAGE_BUCKET="$REACT_APP_FIREBASE_STORAGE_BUCKET" \
    --build-arg REACT_APP_FIREBASE_MESSAGING_SENDER_ID="$REACT_APP_FIREBASE_MESSAGING_SENDER_ID" \
    --build-arg REACT_APP_FIREBASE_APP_ID="$REACT_APP_FIREBASE_APP_ID" \
    -t "$IMAGE" \
    .

  echo "==> Pushing image to Google Container Registry..."
  docker push "$IMAGE"
fi

# ---------- deploy to Cloud Run ----------
echo "==> Deploying to Cloud Run ($GCP_REGION)..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --platform managed \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT" \
  --port 8080 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 3 \
  --memory 512Mi \
  --cpu 1

# ---------- deploy Firebase Hosting ----------
echo "==> Deploying Firebase Hosting rules..."
firebase deploy --only hosting --project "$GCP_PROJECT"

echo ""
echo "Done! Your app is live at:"
echo "  https://${GCP_PROJECT}.web.app"
