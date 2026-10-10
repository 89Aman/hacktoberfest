# ==============================================================================
# Multi-stage Dockerfile: Campus Rescue (Full-Stack React + FastAPI + Z3 Solver)
# Optimized for Google Cloud Run (Single-container deployment)
# ==============================================================================

# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python 3.11 Slim Production Server
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Application
COPY backend/ ./backend/

# Copy Compiled Frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8080

# Cloud Run injects $PORT environment variable
CMD exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}
