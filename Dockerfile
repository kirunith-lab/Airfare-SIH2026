# Multi-Stage Production Dockerfile for SIH26056 Airfare Price Index Platform
# Stage 1: Build React Production Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend + Static SPA Serving
FROM python:3.12-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/backend \
    PORT=8000 \
    DATABASE_PATH=/app/airfare.db

# Install backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend source code
COPY backend/ ./backend/

# Copy compiled frontend distribution from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Pre-seed deterministic database on image build (15,208 verified quotes)
WORKDIR /app/backend
RUN python -m app.database.seed

WORKDIR /app
EXPOSE 8000

# Start server bound to 0.0.0.0 with dynamic $PORT support for cloud platforms (Render, Railway, Fly, Heroku)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
