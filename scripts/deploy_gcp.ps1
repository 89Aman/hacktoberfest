# Deploy Campus Rescue to Google Cloud Run
param(
    [string]$ProjectId = "techfest-508710",
    [string]$Region = "asia-south1",
    [string]$ServiceName = "campus-rescue"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Campus Rescue - GCP Cloud Run Deploy" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Set GCP project
gcloud config set project $ProjectId

Write-Host "`nDeploying service '$ServiceName' in '$Region'..." -ForegroundColor Yellow

# Deploy source directly via Cloud Build / Buildpacks / Dockerfile
gcloud run deploy $ServiceName `
    --source . `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --memory 1Gi `
    --cpu 1 `
    --timeout 300

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDeployment completed successfully!" -ForegroundColor Green
    $url = gcloud run services describe $ServiceName --region $Region --format "value(status.url)"
    Write-Host "Live URL: $url" -ForegroundColor Green
} else {
    Write-Host "`nDeployment failed." -ForegroundColor Red
}
