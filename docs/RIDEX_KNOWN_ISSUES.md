# RIDEX V3 — KNOWN ISSUES & ENGINEERING LIMITATIONS

**Document Identifier:** `RIDEX-ENG-DOC-009`  
**Version:** `3.0.0-PROD`  
**Date:** September 2026  
**Status:** ACTIVE TRACKING  
**Author:** RIDEX Senior Systems Engineering Team

---

## 1. Operating System & Platform Limitations

### A. Background Location Tracking on iOS / Android
- **Platform Constraint:** Mobile operating systems (especially iOS 14+ and Android 12+) aggressively restrict continuous background GPS polling when the app is suspended to preserve battery.
- **Engineering Implementation:** RIDEX requests appropriate background location permissions with clear rider explanations and utilizes distance-filter thresholds ($10\text{m}$) to minimize OS throttling.
- **Limitation Note:** If the rider manually force-quits the application from the app switcher, GPS updates will pause until the application is reopened.

### B. Chrome Geolocation on Insecure HTTP Origins (LAN IP)
- **Platform Constraint:** Modern Chromium browsers restrict `navigator.geolocation` API access on plain HTTP connections when accessing via LAN IP (e.g. `http://192.168.1.7:5000`), requiring `HTTPS` or `localhost`.
- **Engineering Fallback:** RIDEX automatically detects browser HTTP geolocation security restrictions and seamlessly provides default rendezvous coordinates (`18.5204, 73.8567` / Pune) to prevent map initialization failures while allowing interactive manual coordinate simulation.

### C. Offline Voice Intercom
- **Platform Constraint:** Real-time WebRTC audio streaming requires active network data connectivity.
- **Offline Behavior:** Voice intercom gracefully notifies the rider if network connection is lost, while queuing text announcements for broadcast once connectivity is restored.

---

## 2. Engineering Maintenance & Future Roadmap

1. **Native Turn-by-Turn Voice Navigation:** In-app audio turn prompts for complex twisty routes.
2. **Offline Vector Map Tile Packs:** Pre-downloadable offline terrain tile bundles for remote mountain passes.
3. **Bluetooth Headset Button Integration:** Hardware PTT button triggers for Cardo / Sena motorcycle intercoms.
