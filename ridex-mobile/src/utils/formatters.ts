/**
 * RIDEX Formatting Utilities
 */

export function formatDistance(distanceKm: number | undefined): string {
  if (distanceKm === undefined || isNaN(distanceKm)) return '0.0 KM';
  return `${distanceKm.toFixed(1)} KM`;
}

export function formatSpeed(speedKmh: number | undefined): string {
  if (speedKmh === undefined || isNaN(speedKmh)) return '0 KM/H';
  return `${Math.round(speedKmh)} KM/H`;
}

export function formatDuration(durationSeconds: number | undefined): string {
  if (!durationSeconds || durationSeconds <= 0) return '0m';
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatTimer(elapsedSeconds: number): string {
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatTimeAgo(dateStringOrTimestamp: string | number): string {
  const date = new Date(dateStringOrTimestamp);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return 'Just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
