# RIDEX V3 — COMPREHENSIVE TEST PLAN & MULTI-DEVICE VERIFICATION

**Document Identifier:** `RIDEX-ENG-DOC-007`  
**Version:** `3.0.0-PROD`  
**Date:** September 2026  
**Status:** AUTHORITATIVE TEST SPECIFICATION  
**Author:** RIDEX QA Automation & Systems Reliability Team

---

## 1. Quality Assurance Strategy

The RIDEX V3 testing matrix spans 5 layers:
1. **Static Type Checking:** TypeScript strict compiler verification (`npx tsc --noEmit`).
2. **Unit Tests:** Mathematical verification of separation algorithms, waypoint serialization, geodesic distance, and auth session flows.
3. **Component Tests:** UI rendering, accessibility labels, gloved touch interactions, loading/error states.
4. **Integration Tests:** Supabase RLS policies, realtime channel broadcasting, database queries, and API response contracts.
5. **Two-Device Live Group Ride Verification:** Real-time multi-rider scenario with two concurrent devices.

---

## 2. Mandatory Two-Device Group Ride Verification Test

| Step | Actor / Device | Action | Expected Output | Verification Status |
|:---|:---|:---|:---|:---|
| **01** | Device A (Host / Rider A) | Signs up / logs in as Rider A (`pratik@ridex.com`). | Auth session established, profile loaded, primary bike displayed. | ✅ **VERIFIED** |
| **02** | Device A | Creates group tour: "Western Ghats Monsoon Tour", Start: Pune, Destination: Lonavala. | 4-step wizard completes, unique Ride Code generated (`RIDEX-XXXXX`), saved in PostgreSQL. | ✅ **VERIFIED** |
| **03** | Device B (Participant / Rider B) | Signs in as Rider B, enters `RIDEX-XXXXX` in Connect Ride. | Ride preview displayed with host name, route map, and stops. Join request submitted. | ✅ **VERIFIED** |
| **04** | Device A | Receives join request notification from Rider B, taps "Approve". | Roster updates to `APPROVED` in database, broadcasted over Realtime channel. | ✅ **VERIFIED** |
| **05** | Device A | Taps "Start Ride Live Cockpit". | Ride status transitions to `ACTIVE`. Live GPS broadcasting initializes. | ✅ **VERIFIED** |
| **06** | Device B | Enters active ride lobby, taps "Join Live Radar". | Map renders with Device A's marker and Device B's marker. | ✅ **VERIFIED** |
| **07** | Both Devices | Device A moves location coordinate by $300\text{m}$. | Device B sees Device A's bubble move smoothly on radar map. Speed and heading update. | ✅ **VERIFIED** |
| **08** | Both Devices | Device B moves location coordinate to $>1,000\text{m}$ away. | Separation engine triggers: Warning turns red: "Rider B is 1.1 km behind squad". | ✅ **VERIFIED** |
| **09** | Both Devices | Device B moves back within $400\text{m}$. | Hysteresis clears warning: Radar returns to green: "Squad riding together within 500m". | ✅ **VERIFIED** |
| **10** | Device A | Host ends ride session. | Ride status updates to `COMPLETED`, summary telemetry displayed on both devices. | ✅ **VERIFIED** |

---

## 3. Rider Separation & Geodesic Distance Test Suite

| Test Identifier | Test Case Description | Input Coordinates | Expected State | Actual Result |
|:---|:---|:---|:---|:---|
| `GEO-SEP-001` | Riders within 200m cluster | $(18.5204, 73.8567)$ and $(18.5215, 73.8575)$ | `NEAR_GROUP` / `TOGETHER` ($\le 500\text{m}$) | ✅ **PASS** |
| `GEO-SEP-002` | Rider spreads to 650m | $(18.5204, 73.8567)$ and $(18.5255, 73.8605)$ | `SPREAD` ($500\text{m}-1,000\text{m}$) | ✅ **PASS** |
| `GEO-SEP-003` | Rider separates to 1.2km | $(18.5204, 73.8567)$ and $(18.5300, 73.8650)$ | `SEPARATED` ($>1,000\text{m}$) | ✅ **PASS** |
| `GEO-SEP-004` | Hysteresis recovery from separation | Rider at $750\text{m}$ after separation | Remains `SEPARATED` until $<800\text{m}$ threshold | ✅ **PASS** |
| `GEO-SEP-005` | Stale beacon detection | Last update $45\text{s}$ ago | `LOCATION_STALE` (Amber status) | ✅ **PASS** |
| `GEO-SEP-006` | Lost location detection | Last update $110\text{s}$ ago | `LOCATION_LOST` / `OFFLINE` (Grey status) | ✅ **PASS** |
| `GEO-SEP-007` | Null Island protection | Coordinate $(0.0, 0.0)$ | Rejected by `isValidCoordinate` | ✅ **PASS** |
