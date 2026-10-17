/**
 * RIDEX — Live Group Ride Configuration & Throttling Parameters
 * Balances real-time radar fidelity, battery efficiency, and network payload.
 */

export const LIVE_RIDE_CONFIG = {
  /**
   * Broadcast interval when moving (milliseconds)
   * Broadcasts position every 4.5 seconds if meaningful movement occurs.
   */
  BROADCAST_INTERVAL_MS: 4500,

  /**
   * Minimum distance threshold to trigger broadcast (meters)
   * Prevents spamming Supabase while waiting at traffic signals or toll plazas.
   */
  MIN_MOVEMENT_DISTANCE_METERS: 6.0,

  /**
   * Stale status threshold (milliseconds)
   * If no position packet is received from a peer rider in 25s, mark as STALE.
   */
  STALE_THRESHOLD_MS: 25000,

  /**
   * Offline status threshold (milliseconds)
   * If silence exceeds 75s, mark peer rider as OFFLINE.
   */
  OFFLINE_THRESHOLD_MS: 75000,

  /**
   * Minimum GPS accuracy required to broadcast live location (meters)
   */
  MAX_BROADCAST_ACCURACY_METERS: 35.0,

  /**
   * Realtime reconnection retry backoff (milliseconds)
   */
  RECONNECT_BACKOFF_MS: [1000, 2500, 5000, 10000],
};
