# Production Deployment Guide: SIH26056 Airfare Price Index Platform

This guide provides step-by-step instructions for deploying the **Real-time Airfare Price Index for India (MoSPI / SIH 2026)** to cloud hosting platforms or local production environments.

---

## 🏗️ Architecture Overview

The system consists of two primary layers designed to deploy either as a **unified all-in-one container** or as **decoupled microservices**:

1. **Frontend (React 19 + TypeScript + Vite)**:
   - Command-center analytical dashboard inspired by *flyindex.vercel.app* and *airfareidx.manus.space*.
   - Zero-dependency styling using modular CSS tokens (`--background`, `--surface`, `--accent`, `--accent-glow`).
   - Production bundle compiled into `frontend/dist`.

2. **Backend (Python 3.12 + FastAPI + SQLite)**:
   - High-performance asynchronous REST API with typed Pydantic v2 schemas.
   - Built-in deterministic data seeding (15,208 verified domestic flight quotes).
   - In production, FastAPI automatically serves the compiled `frontend/dist` Single Page Application at `/` and mounts assets at `/assets`, with API endpoints at `/api/v1` and Swagger documentation at `/docs`.

---

## 🚀 Option 1: 1-Click Free Cloud Deployment on Render (Recommended)

Render can build and run the multi-stage Docker container directly from GitHub for free.

### Steps:
1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Production deployment ready"
   git push origin main
   ```
2. **Deploy on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com/) and click **New +** → **Web Service**.
   - Connect your GitHub repository.
   - Select **Docker** as the Environment (Render will automatically detect the root `Dockerfile`).
   - Set the instance type to **Free**.
3. **Environment Variables** (Auto-configured by `render.yaml`):
   - `PORT`: `10000` (or `8000`)
   - `DATABASE_PATH`: `/app/airfare.db`
4. Click **Create Web Service**.

Render will automatically build the React frontend, set up Python, seed the 15,208 quotes, and start the application. Your dashboard will be live at `https://<your-app-name>.onrender.com`.

---

## ⚡ Option 2: 1-Click Cloud Deployment on Railway

Railway supports multi-stage Docker builds natively with zero configuration.

### Steps:
1. Go to [railway.app](https://railway.app/) and click **New Project** → **Deploy from GitHub repo**.
2. Select your repository.
3. Railway will detect the root `Dockerfile` and build both the frontend and backend.
4. Under **Settings** → **Networking**, click **Generate Domain**.
5. Your application is immediately live on `https://<your-subdomain>.up.railway.app`.

---

## 🌐 Option 3: Decoupled Deployment (Vercel Frontend + Render/Railway Backend)

If you prefer hosting the React frontend on Vercel's Edge Global CDN and the FastAPI backend on Render or Railway:

### Backend Deployment (Render or Railway):
1. Deploy the `backend/` folder to Render or Railway using `backend/Dockerfile` or Python runtime.
2. Note the public URL (e.g. `https://airfare-api.onrender.com`).

### Frontend Deployment (Vercel):
1. Go to [vercel.com](https://vercel.com/) and click **Add New...** → **Project**.
2. Import your GitHub repository.
3. If deploying from the root repository, Vercel will automatically read `vercel.json`:
   - Framework Preset: `Vite`
   - Root Directory: `./` (or `frontend`)
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
4. Under **Environment Variables**, add:
   - `VITE_API_BASE`: `https://airfare-api.onrender.com/api/v1`
   - `VITE_DOCS_URL`: `https://airfare-api.onrender.com/docs`
5. Click **Deploy**.

---

## 🐳 Option 4: Local Production Run with Docker Compose

To test the complete production environment locally using Docker:

```bash
# Build and start the production all-in-one container
docker compose up --build app
```

Once started:
- **Dashboard UI**: [http://localhost:8000/](http://localhost:8000/)
- **API Health**: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 💻 Option 5: Local Single-Port Production Run (Without Docker)

You can build and run the full production application locally on a single port (`8000`) with zero external software:

### On Windows:
Double click `run_production.bat` or execute in PowerShell:
```cmd
run_production.bat
```

### On Linux / macOS:
```bash
chmod +x run_production.sh
./run_production.sh
```

The script automatically:
1. Compiles the React frontend using `npm run build`.
2. Verifies Python dependencies in `backend/requirements.txt`.
3. Seeds the SQLite database if not already seeded.
4. Starts FastAPI on `http://127.0.0.1:8000/`.

---

## ⚙️ Environment Variables Reference

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `8000` | Port for the Uvicorn HTTP web server. |
| `DATABASE_PATH` | `/app/airfare.db` or `backend/airfare.db` | Absolute or relative file path to the SQLite database. |
| `VITE_API_BASE` | `/api/v1` (prod) or `http://localhost:8000/api/v1` (dev) | Base URL for REST API endpoints consumed by the frontend. |
| `VITE_DOCS_URL` | `/docs` (prod) or `http://localhost:8000/docs` (dev) | Target URL for the "Interactive Swagger Docs" button. |

---

## 🛡️ Healthcheck & Verification Endpoints

Once deployed, verify your deployment using the following endpoints:

| Endpoint | Expected Status | Description |
| :--- | :---: | :--- |
| `GET /` | `200 OK` (HTML) | Serves the production React dashboard. |
| `GET /api/health` | `200 OK` (JSON) | `{"status": "ok"}` healthcheck for uptime monitors. |
| `GET /api/v1/analytics/summary` | `200 OK` (JSON) | Returns live national index, MoM change, and data quality metrics. |
| `GET /api/v1/flights/recent?limit=5` | `200 OK` (JSON) | Returns verified flight quotes with SHA-256 fingerprints. |
| `GET /docs` | `200 OK` (HTML) | Interactive Swagger UI API documentation. |
