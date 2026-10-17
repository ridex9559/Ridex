/**
 * RIDEX V3 — Connect Ride Constants & Realtime Telemetry Thresholds
 */

export const CONNECT_RIDE_CONFIG = {
  // Geodesic Distance & Hysteresis thresholds for group separation
  SEPARATION: {
    GROUP_TOGETHER_MAX_METERS: 500,        // <= 500m: 🟢 Group Together
    WARNING_SEPARATION_METERS: 500,        // 500m: 🟡 Group Spread Warning
    SIGNIFICANT_SEPARATION_METERS: 1000,   // > 1000m: 🔴 Significant Separation ("Rider Left Behind")
    RECOVERY_WARNING_METERS: 400,          // Hysteresis recovery for warning (must come within 400m)
    RECOVERY_SIGNIFICANT_METERS: 800,      // Hysteresis recovery for critical (must come within 800m)
    RIDER_SEPARATED_MIN_METERS: 1000,      // Backward compatibility alias
    GROUP_SPREAD_MAX_METERS: 1000,         // Backward compatibility alias
    ALERT_DEBOUNCE_MS: 15000,              // 15-second alert cooldown to prevent notification spam
  },

  // Location Freshness & Beacon States
  FRESHNESS: {
    STALE_LOCATION_MS: 30000,              // 30 seconds: 🟡 Location Stale
    LOST_LOCATION_MS: 90000,               // 90 seconds: ⚪ Location Lost / Offline
    HEARTBEAT_INTERVAL_MS: 5000,           // 5-second GPS broadcast frequency
  },

  // Checkpoints auto-detection
  CHECKPOINT: {
    PROXIMITY_RADIUS_METERS: 250,          // Within 250m considers rider reached stop
    DEFAULT_STOP_MINUTES: {
      BREAKFAST: 35,
      FUEL: 15,
      VIEWPOINT: 20,
      REGROUP: 10,
      DESTINATION: 0,
      START: 0,
    },
  },

  // SOS Priorities & Emergency Channels
  SOS: {
    AUTO_DISMISS_RESOLVED_MS: 30000,
  },
};

