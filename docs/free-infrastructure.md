# 💰 RIDEX Zero-Cost (₹0 / $0) Operating Infrastructure Guide

## Philosophy: 100% Free Development & Low-Cost Deployment
RIDEX is architected to eliminate all mandatory cloud bills. Developers can develop, test, and run the complete ecosystem on their personal computer with zero external subscriptions, and deploy to free-tier cloud environments.

---

## 1. Zero-Cost Technology Comparison

| Platform Component | Traditional (Paid) Cloud | RIDEX Zero-Cost Alternative | Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Maps & Tiles** | Google Maps Platform / Mapbox | **OpenStreetMap + Leaflet.js** | **$0 / ₹0** |
| **Routing Engine** | Google Directions API | **OSRM (Project OSRM) + Cache** | **$0 / ₹0** |
| **Weather Forecasts** | AccuWeather / OpenWeatherMap Paid | **Open-Meteo API (10k free/day)** | **$0 / ₹0** |
| **Geocoding** | Google Geocoding API | **OpenStreetMap Nominatim** | **$0 / ₹0** |
| **Real-time Engine** | Azure SignalR Service / PubNub | **In-Memory Live State Hub** | **$0 / ₹0** |
| **Database** | Azure SQL / AWS RDS | **PostgreSQL (Docker) / SQLite** | **$0 / ₹0** |
| **File Storage** | Azure Blob / AWS S3 | **Local Disk / Static Files** | **$0 / ₹0** |
| **Push Notifications**| Firebase Paid / OneSignal Paid | **Local Notifications + SignalR** | **$0 / ₹0** |

---

## 2. Running in Mode A (Local / Demo Mode)
In local development mode, RIDEX requires **no external services**:
- Database runs on local **SQLite** (`ridex_dev.db`), created automatically with zero installation.
- Real-time communication runs through local SignalR on `http://localhost:5000/hubs/rides`.
- Route and weather lookups are cached in the SQLite `RouteCaches` table for instant sub-millisecond retrieval.
- Multi-rider demo simulation (`SimulationController`) simulates real-time group riding on a single machine.

---

## 3. Running in Mode B (Free-Tier Cloud Deployment)
For public staging or club touring deployment, RIDEX can be deployed on generous free-tier platforms:

### Option 1: Render / Fly.io (Free / Low Cost)
- **API**: Host `RIDEX.API` as a Docker container on Render Free Tier or Fly.io.
- **Database**: Free Managed PostgreSQL from **Neon.tech** (0.5 GB free storage) or **Supabase** (500 MB free storage).
- Configure environment variable in Render/Fly:
  ```env
  ConnectionStrings__PostgreSQL=postgresql://user:pass@ep-cool-neon.tech/ridex_db?sslmode=require
  ```

### Option 2: Self-Hosted VPS ($0 if home server / Oracle Cloud Always Free)
- Oracle Cloud Free Tier provides 4 ARM cores and 24 GB RAM permanently free.
- Run `docker-compose up -d` to launch PostgreSQL + PostGIS and the RIDEX API.

---

## 4. API Cost Protection & Rate Limiting
To ensure you never exceed free limits:
1. **Route Caching**: Generated routes are hashed by start/destination/waypoints and stored in SQLite for 7 days.
2. **Weather Caching**: Weather forecasts are cached in memory for 60 minutes per coordinate coordinate.
3. **Adaptive GPS**: Location updates use speed-based intervals (3s to 30s) instead of constant 1-second pings.
4. **Douglas-Peucker Compression**: GPS point reductions minimize storage footprints by up to 80%.
