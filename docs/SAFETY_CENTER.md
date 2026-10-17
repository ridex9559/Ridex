# RIDEX Safety Center & Emergency Assistance Architecture

## 1. Overview
The RIDEX Safety Center (`/safety` and `/safety/:id`) provides a motorcycle touring emergency command cockpit. It gives riders and Road Captains real-time visibility into GPS tracking health, connection latency, peer rider separation, 2-step emergency SOS broadcasts, and Web Audio Push-to-Talk (PTT) walkie-talkie communication.

## 2. Key Capabilities & Technical Contracts

### A. SOS & Emergency Assistance Flow
1. **Trigger & Confirmation**: Accessible via the dedicated SOS button in the live radar cockpit (`/rides/live/:id`) and Safety Center dashboard. Requires explicit 2-step rider confirmation to prevent accidental activation during high-vibration riding conditions.
2. **5 Emergency Classifications**:
   - `MECHANICAL`: Engine, drivetrain, brake, or electrical breakdown.
   - `FLAT_TYRE`: Puncture, tube leak, or rim damage.
   - `OUT_OF_FUEL`: Fuel exhaustion between highway fuel stops.
   - `LOST`: Separated from squad or lost navigation trail.
   - `MEDICAL`: Physical distress, crash, or first aid requirement.
3. **Database Persistence**: Alerts are persisted directly to `public.ride_sos_alerts` in Supabase PostgreSQL:
   ```sql
   INSERT INTO ride_sos_alerts (ride_id, user_id, issue_type, latitude, longitude, note, status)
   VALUES ($rideId, $userId, $issueType, $lat, $lng, $note, 'ACTIVE');
   ```
4. **Real-time Broadcast**: Simultaneously broadcast across the Supabase Realtime channel `ride:${rideId}`:
   - Event: `sos_alert`
   - Payload: Full `SosAlert` record with user coordinates, issue category, timestamp, and optional voice/text note.
5. **Resolution by Road Captain or Rider**:
   - `safetyService.resolveSos(alertId, rideId, userId)` marks the database record status as `'RESOLVED'`, updates timestamp, and broadcasts `sos_resolved` to clear warnings across all participant cockpits.
6. **Direct Dial Links**: Immediate 1-tap browser links to emergency services (Police `112`, Ambulance `108`).

### B. Geodesic Rider Separation Monitoring
- Proximity between all active squad participants is continuously evaluated using the Haversine geodesic distance algorithm:
  - **Normal Proximity (< 2.0 km)**: Safe squad formation.
  - **Separation Warning (2.0 km - 5.0 km)**: Rider is falling behind the main pack.
  - **Critical Lost-Rider Alert (> 5.0 km)**: Urgent warning displayed to the Road Captain and sweeper.
- Stale location filter: Coordinates older than 120 seconds are automatically marked degraded/stale and excluded from false separation triggers.

### C. Connection & GPS Tracking Telemetry
- **Tracking States**:
  - `Tracking Active`: Hardware GPS watchPosition streaming coordinates.
  - `Tracking Paused`: Manually stopped.
  - `Permission Denied`: Browser blocked geolocation access.
  - `GPS Unavailable`: Hardware GPS or cellular triangulation offline.
  - `Location Stale`: Last recorded ping is older than 45 seconds.
  - `Network Disconnected`: Offline fallback active.
- **Signal Freshness Latency**: Evaluates elapsed seconds since last valid ping:
  - `< 15s`: Live (optimal).
  - `15s - 45s`: Recent ping.
  - `45s - 120s`: Degraded signal.
  - `> 120s`: Signal Lost.

### D. Honest Browser Capabilities & Limitations
- **Foreground Restriction**: Mobile Safari (iOS) and Chrome (Android) aggressively suspend JavaScript timers and throttle `navigator.geolocation` when the browser tab is minimized or the screen is locked.
- **Honest Communication**: The interface explicitly alerts riders to keep the screen unlocked or use our native Expo app (`ridex-mobile`) when reliable continuous background tracking is required.
- **PTT Intercom**: Uses Web AudioContext and `MediaRecorder` audio slicing over Supabase Realtime broadcast channel `voice:${rideId}`. Transparent capability detection informs users if browser audio APIs are restricted.
