# RIDEX — WEB APPLICATION DEPLOYMENT & OPERATIONS GUIDE

**Document Identifier:** `RIDEX-ENG-DOC-013`  
**Date:** October 2026  
**Status:** PRODUCTION DEPLOYMENT READY  
**Application:** RIDEX Web & PWA (`ridex-web`)  

---

## 1. Overview & Build Artifacts

The RIDEX web application builds into a high-performance, static Single Page Application (SPA) bundle inside `ridex-web/dist/`. It can be hosted on any HTTPS static web host (Vercel, Cloudflare Pages, Netlify, AWS S3 + CloudFront, or directly served via ASP.NET Core Static Files).

---

## 2. Environment Variables Configuration

### Public Browser Variables (`ridex-web/.env.example`)
These variables are baked into the client-side JavaScript bundle and are completely safe for browser exposure:

```env
# Supabase Cloud Project URL
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Public Anon Key (Protected by PostgreSQL RLS)
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional .NET Web API Base URL (if proxying secondary calculations)
VITE_API_URL=http://localhost:5000/api/v1

# Optional SignalR Realtime Hub URL
VITE_SIGNALR_URL=http://localhost:5000/hubs/rides

# Tile Provider Style: carto_dark (default) | osm_standard | opentopo
VITE_DEFAULT_MAP_THEME=carto_dark
```

### Server-Only Secrets (NEVER Bundle in Web Client!)
The following secrets MUST NEVER be placed in `ridex-web/.env` or browser code:
- Supabase `service_role` key
- Database PostgreSQL connection strings / passwords
- JWT signing secret (`JWT_SECRET`)
- Cloud hosting access tokens

---

## 3. Build & Local Preview Commands

```bash
# 1. Navigate to the web project
cd d:/RideX/ridex-web

# 2. Install dependencies
npm install

# 3. Typecheck
npm run typecheck

# 4. Run automated tests
npm run test

# 5. Build production bundle
npm run build

# 6. Preview production build locally
npm run preview
```

---

## 4. SPA Routing & Fallback Configuration

Because `ridex-web` uses client-side routing (React Router), deep URLs (e.g. `/rides/RIDEX-7X92K` or `/garage`) must fall back to `/index.html`:

### Netlify (`ridex-web/public/_redirects`)
```text
/*    /index.html   200
```

### Vercel (`ridex-web/vercel.json`)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Nginx
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 5. Supabase Dashboard URL Configuration

Ensure the deployed web domain is authorized in your Supabase dashboard:
1. Navigate to **Authentication -> URL Configuration**.
2. Add your deployed web URL to **Site URL** (e.g. `https://ridex-touring.vercel.app`).
3. Add the callback redirects to **Redirect URLs**:
   - `https://ridex-touring.vercel.app/**`
   - `http://localhost:5173/**` (for local development)

---

## 6. PWA & Mobile Installation

1. **HTTPS Enforcement:** Service workers and browser geolocation strictly require HTTPS.
2. **Web App Manifest (`public/manifest.json`):**
   - `display: standalone`
   - `theme_color: #121417`
   - `background_color: #0d0f12`
   - Maskable SVG and PNG icons
3. **Android Chrome Installation:**
   - Tap Chrome menu (3 dots) -> **"Install app"** or **"Add to Home Screen"**.
   - Boots full screen without browser address bar.
4. **iPhone Safari Installation:**
   - Tap Safari Share icon -> **"Add to Home Screen"**.
   - Launches in standalone mode with iOS safe-area padding.

---

## 7. Rollback & Isolation Guarantee

The `ridex-web` project is located completely in its own directory (`d:/RideX/ridex-web`). 
- The existing mobile app (`d:/RideX/ridex-mobile`) has not been altered or modified.
- The existing .NET API (`d:/RideX/RIDEX.API`) remains unmodified.
- To roll back the web application, delete the `ridex-web` directory. The mobile app and backend continue operating completely uninterrupted.
