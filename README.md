# 🏍️ RIDEX — Complete Free-to-Run Motorcycle Touring Platform

> **Ride together. Ride smarter.**
>
> A serious, production-grade cross-platform motorcycle touring and group-riding ecosystem engineered for **₹0 / $0 operating cost**.

---

## 🌟 Key Highlights & Features

- **🔴 ₹0 / $0 Operating Cost**: 100% free of paid cloud services (No Azure, AWS, Google Maps billing, or Firebase paid tiers required).
- **📱 Cross-Platform Mobile Client (.NET MAUI)**: Native Android and iOS support with MVVM (`CommunityToolkit.Mvvm`), local SQLite storage, SignalR client, and adaptive tracking.
- **⚡ ASP.NET Core Web API + SignalR**: Real-time group coordination hub with in-memory live state storage and periodic batch database persistence.
- **🗺️ Free OpenStreetMap + OSRM Routing**: Full routing with waypoint reordering, turn-by-turn guidance, and SQLite route caching.
- **🌦️ Free Weather Telemetry (Open-Meteo)**: Hourly forecasts, precipitation probability, wind alerts, and route checkpoint weather with zero API key requirement.
- **👥 Group Rides & Smart Join Codes**: 8-character join codes (`RX-8F29K`), role-based permissions (Owner, Co-Leader, Member), and real-time live map markers.
- **⚠️ Rider Separation Alert Engine**: Configurable distance thresholds (1km, 2km, 5km, 10km) with automated cooldown alerts to prevent group detachment.
- **🔋 Adaptive Background GPS Tracking**: Android Foreground Service & iOS CoreLocation background updates with velocity-adjusted intervals (3s to 30s) for all-day battery longevity.
- **🛡️ Offline-First & Sync Engine**: Full SQLite local persistence (`sqlite-net-pcl`) with idempotent batch queueing and automatic sync on reconnect.
- **⛽ Fuel Planning & Mileage Analytics**: `FuelRequired = Distance / Mileage`, refueling stop estimations, odometer tracking, and running km/L averages.
- **💰 Smart Expense Splitter & Settlement**: Debt minimization algorithm resolving multi-payer group expenses into minimal bilateral cash transfers.
- **🔧 Motorcycle Maintenance Reminders**: Service reminders by distance and date (Engine Oil due in 280 km, Chain lube, Brake pads, Tyres, Insurance, PUC).
- **🚨 SOS & Emergency Safety**: 5-second cancelable countdown emergency trigger with SignalR group broadcast and offline SMS/Call coordinates fallback.
- **📊 Touring Analytics & Interactive Replay**: Douglas-Peucker GPS polyline simplification, 1x/2x/5x/10x interactive track replay, elevation, speed graphs, and stops.
- **🖥️ Modern Web Admin Dashboard**: Live fleet map, telemetry monitors, rider directory, and system health status served directly from `http://localhost:5000/admin`.
- **🎮 Built-In GPS Simulator**: Replays multi-rider movements along the scenic Western Ghats corridor (Nashik → Pune) for single-machine live SignalR testing!

---

## 🏗️ Architecture & Project Structure

```text
RIDEX/
├── RIDEX.Core/                 # Domain entities, base interfaces, business rules
│   ├── Entities/               # User, Motorcycle, Ride, Route, FuelLog, Expense, etc.
│   └── Interfaces/             # IRoutingService, IWeatherService, ISyncEngine, etc.
│
├── RIDEX.Shared/               # DTOs, Enums, Join Code Generator, Algorithms
│   ├── Algorithms/             # ExpenseSettlementAlgorithm, DouglasPeuckerReducer, GeoMath
│   ├── DTOs/                   # Auth, Ride, Route, Location, Expense, Fuel, Weather
│   └── Enums/                  # RideRole, RideStatus, ServiceType, ExpenseCategory
│
├── RIDEX.Infrastructure/       # EF Core, PostGIS / SQLite dual DB, External Providers
│   ├── Data/                   # RideXDbContext, Entity Configurations
│   ├── Providers/              # OSRMRoutingService, OpenMeteoWeatherService, Nominatim
│   ├── Services/               # InMemoryLiveRideStateStore, LocalFileStorage, SyncEngine
│   └── Seed/                   # Instant demo data initializer
│
├── RIDEX.API/                  # ASP.NET Core 8.0 Web API & SignalR Hub
│   ├── Controllers/            # Auth, Motorcycles, Rides, Routes, Expenses, Fuel, Admin, Simulation
│   ├── Hubs/                   # RideHub (SignalR live group events)
│   ├── Middleware/             # ExceptionHandlingMiddleware
│   └── wwwroot/                # Admin Dashboard (HTML/CSS/JS) & Uploaded Avatars
│
├── RIDEX.Mobile/               # .NET MAUI Mobile App (Android & iOS)
│   ├── Models/                 # SQLite local entities (sqlite-net-pcl)
│   ├── Services/               # LocalDatabaseService, ApiClient, SignalRClient, LocationTracking
│   ├── ViewModels/             # MVVM ViewModels for all screens
│   ├── Controls/               # Interactive Leaflet/OSM map HTML bridge, HUD metrics
│   └── Platforms/              # Android Foreground Service, iOS CoreLocation manager
│
├── RIDEX.Admin/                # Modern Responsive Web Admin Dashboard
│   ├── index.html              # Dark adventure UI layout
│   ├── styles.css              # Custom styling & animations
│   └── app.js                  # SignalR stream & GPS simulator client
│
├── RIDEX.Tests/                # Automated xUnit Test Suite
│   ├── Algorithms/             # Expense Settlement, Douglas-Peucker, GeoMath tests
│   └── Services/               # Fuel calculations, BCrypt hashing, SyncEngine tests
│
├── docs/                       # Architectural & Zero-Cost Guides
│   ├── realtime-architecture.md
│   ├── offline-architecture.md
│   └── free-infrastructure.md
│
├── docker-compose.yml          # Optional local PostgreSQL + API launch
└── .env.example                # Zero-cost environment configuration
```

---

## 🚀 Quick Start & Running Locally

### 1. Prerequisites
- **.NET 8 SDK** (Installed locally)
- Any IDE: Visual Studio 2022, JetBrains Rider, or VS Code
- *(Optional)* Docker Desktop (if you wish to use PostgreSQL instead of the default zero-config SQLite)

---

### 2. Running the Backend API & Admin Dashboard

The backend runs out of the box with **zero configuration** using the local SQLite database.

```bash
# Navigate to the workspace
cd c:\Users\prati\OneDrive\Desktop\RideX

# Build the solution
dotnet build RIDEX.sln

# Run the API
dotnet run --project RIDEX.API/RIDEX.API.csproj
```

Once running:
- 🌐 **API Base & Welcome**: `http://localhost:5000`
- 📑 **Swagger API Documentation**: `http://localhost:5000/swagger`
- 🖥️ **Admin Dashboard**: `http://localhost:5000/admin`
- 📡 **SignalR Real-Time Hub**: `ws://localhost:5000/hubs/rides`

---

### 3. Pre-Seeded Development Accounts

When the API launches, it automatically populates demo data:

| Account | Email | Password | Role | Motorcycle |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@ridex.local` | `Admin@123` | Admin | — |
| **Aryan Deshmukh (Leader)** | `rider@ridex.local` | `Rider@123` | User | Himalayan 450 (18,450 km) |
| **Vikram Patil** | `vikram@ridex.local` | `Rider@123` | User | KTM 390 Adventure |
| **Neha Sharma** | `neha@ridex.local` | `Rider@123` | User | BMW G310 GS |
| **Rohan Mehta** | `rohan@ridex.local` | `Rider@123` | User | Triumph Scrambler 400X |

- **Demo Group Ride**: "Monsoon Western Ghats Expedition" (`RX-8F29K`) with 4 riders along Nashik → Trimbakeshwar → Bhandardara → Malshej → Pune.

---

### 4. Running the Single-Device GPS Simulator

You can test real-time multi-rider tracking, live map pins, and separation alerts on a single machine:

1. Open `http://localhost:5000/admin` in your web browser.
2. Click on the **GPS Simulator** tab.
3. Click **"▶ Start Multi-Rider Simulation"**.
4. The simulator will stream live GPS positions of Aryan (Leader), Vikram, Neha, and Rohan over SignalR, demonstrating speed adjustments, map marker updates, and Rohan's separation warning alert!

---

### 5. Running Automated Unit & Integration Tests

```bash
dotnet test RIDEX.Tests/RIDEX.Tests.csproj
```

The test suite validates:
- `ExpenseSettlementAlgorithm`: Resolving multi-rider uneven payments into minimum bilateral debt transfers.
- `DouglasPeuckerReducer`: Polyline compression preserving sharp mountain hairpin curves.
- `GeoMath`: Haversine geographic distances, bearings, and separation threshold violations.
- `FuelCalculations`: Liters required, tank comparisons, and fuel cost estimates.
- `SyncEngine`: Offline queueing, idempotency, and batch processing.

---

## 📱 Mobile Application (.NET MAUI) Setup

### Android Execution
1. Open `RIDEX.sln` in Visual Studio or Visual Studio Code.
2. Select `RIDEX.Mobile` as startup project and set target to `Android Emulator` or physical Android device.
3. Press **F5** / Run.
4. Android uses `RideLocationForegroundService` with notification channel for background GPS tracking.

### iOS Execution
1. Connect a macOS build host or physical iOS test device.
2. Target `RIDEX.Mobile` with `net8.0-ios`.
3. Press **F5** / Run.
4. iOS uses `IosLocationManager` with `AllowsBackgroundLocationUpdates = true`.

---

## 🐳 Optional Docker Deployment

```bash
docker-compose up -d
```
This launches a PostGIS/PostgreSQL container on port 5432 and the RIDEX API container on port 5000.

---

## 📄 Documentation Links
- [Real-Time Telemetry & SignalR Architecture](docs/realtime-architecture.md)
- [Offline-First & Sync Engine Architecture](docs/offline-architecture.md)
- [Zero-Cost Operating Infrastructure Guide](docs/free-infrastructure.md)

---

## 🏍️ RIDEX — Ride together. Ride smarter.
Built with .NET 8, C#, .NET MAUI, ASP.NET Core, SignalR, SQLite, OpenStreetMap, and Open-Meteo.
