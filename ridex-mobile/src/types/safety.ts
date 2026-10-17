/**
 * RIDEX V2 — Road Safety & 5-Category Help Alert Domain Models
 */

export type HelpCategory =
  | 'FLAT_TYRE'      // 🛞 Flat Tyre
  | 'MECHANICAL'     // 🔧 Bike / Mechanical Problem
  | 'FUEL_EMPTY'     // ⛽ Fuel Empty
  | 'ASSISTANCE'     // 📍 Need Assistance / Route Guidance
  | 'EMERGENCY';     // 🚑 Medical / Roadside Emergency

export interface HelpAlert {
  id: string;
  rideId: string;
  riderId: string;
  riderName: string;
  riderAvatar?: string;
  category: HelpCategory;
  message?: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
}
