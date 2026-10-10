#!/bin/bash
set -e

PROJECT_ID="${1:-techfest-508710}"
REGION="${2:-asia-south1}"
SERVICE_NAME="${3:-campus-rescue}"

echo "========================================="
echo "  Campus Rescue - GCP Cloud Run Deploy"
echo "========================================="

gcloud config set project "$PROJECT_ID"

echo "Deploying service '$SERVICE_NAME' in '$REGION'..."

gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300

URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format="value(status.url)")
echo ""
echo "Deployment completed successfully!"
echo "Live URL: $URL"
