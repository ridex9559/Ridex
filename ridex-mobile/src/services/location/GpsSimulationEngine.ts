/**
 * RIDEX — Multi-Rider GPS Simulation Sandbox Engine
 * Simulates real-time multi-rider squad telemetry along route coordinates.
 * Generates realistic bearing, velocity curves, and separation for demo & testing.
 */

import { LiveRiderLocation } from '../../types/liveRide';
import { MapCoordinate } from '../maps/mapTypes';

export interface SimRiderSpec {
  userId: string;
  name: string;
  username: string;
  avatarUrl: string;
  motorcycleName: string;
  offsetProgress: number; // offset behind the leader (0 to 1)
  baseSpeed: number;
}

const DEFAULT_SIM_SQUAD: SimRiderSpec[] = [
  {
    userId: 'sim-leader-pratik',
    name: 'Pratik (Lead)',
    username: 'pratik_rider',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    motorcycleName: 'Ducati Multistrada V4',
    offsetProgress: 0,
    baseSpeed: 78,
  },
  {
    userId: 'sim-marshal-amit',
    name: 'Amit (Marshal)',
    username: 'amit_gs',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    motorcycleName: 'BMW R 1250 GS',
    offsetProgress: 0.04,
    baseSpeed: 74,
  },
  {
    userId: 'sim-sweeper-rahul',
    name: 'Rahul (Sweeper)',
    username: 'rahul_adv',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    motorcycleName: 'KTM 390 Adventure',
    offsetProgress: 0.09,
    baseSpeed: 68,
  },
];

class GpsSimulationEngineImpl {
  private timer: NodeJS.Timeout | null = null;
  private progress: number = 0;
  private isRunning: boolean = false;
  private route: MapCoordinate[] = [];
  private onTickCallback: ((riders: LiveRiderLocation[]) => void) | null = null;

  public isSimulating(): boolean {
    return this.isRunning;
  }

  public startSimulation(
    routeCoordinates: MapCoordinate[],
    onTick: (riders: LiveRiderLocation[]) => void
  ): void {
    if (this.isRunning) {
      this.stopSimulation();
    }

    if (!routeCoordinates || routeCoordinates.length < 2) {
      // Default fallback demo track (Pune to Lavasa Ghats)
      this.route = [
        { latitude: 18.5204, longitude: 73.8567 },
        { latitude: 18.512, longitude: 73.815 },
        { latitude: 18.498, longitude: 73.765 },
        { latitude: 18.468, longitude: 73.712 },
        { latitude: 18.435, longitude: 73.658 },
        { latitude: 18.411, longitude: 73.578 },
        { latitude: 18.408, longitude: 73.509 },
      ];
    } else {
      this.route = routeCoordinates;
    }

    this.isRunning = true;
    this.progress = 0;
    this.onTickCallback = onTick;

    this.timer = setInterval(() => {
      this.tick();
    }, 1000);

    // Initial tick
    this.tick();
  }

  public stopSimulation(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    this.progress = 0;
    this.onTickCallback = null;
  }

  private tick(): void {
    if (!this.isRunning || this.route.length === 0 || !this.onTickCallback) return;

    this.progress += 0.012; // Advance progress along route
    if (this.progress >= 1.0) {
      this.progress = 0; // Loop back
    }

    const liveRiders: LiveRiderLocation[] = DEFAULT_SIM_SQUAD.map((spec) => {
      const riderProgress = Math.max(0, (this.progress - spec.offsetProgress + 1) % 1);
      const { coordinate, heading } = this.interpolateCoordinateAndHeading(riderProgress);

      const speedVariation = Math.sin(Date.now() / 3000 + spec.offsetProgress * 10) * 8;
      const currentSpeed = Math.max(20, Math.round(spec.baseSpeed + speedVariation));

      return {
        sessionId: 'sim-session',
        userId: spec.userId,
        user: {
          id: spec.userId,
          name: spec.name,
          fullName: spec.name,
          username: spec.username,
          email: `${spec.userId}@ridex.club`,
          avatarUrl: spec.avatarUrl,
          createdAt: new Date().toISOString(),
        },
        motorcycle: {
          id: `bike-${spec.userId}`,
          userId: spec.userId,
          brand: spec.motorcycleName.split(' ')[0],
          make: spec.motorcycleName.split(' ')[0],
          model: spec.motorcycleName.split(' ').slice(1).join(' '),
          year: 2024,
          displacementCc: 1200,
          mileageKm: 8500,
          category: 'ADVENTURE',
          isPrimary: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        coordinate,
        heading,
        speedKmh: currentSpeed,
        accuracy: 4,
        updatedAt: new Date().toISOString(),
        presenceStatus: 'LIVE',
        isCurrentUser: false,
      };
    });

    this.onTickCallback(liveRiders);
  }

  private interpolateCoordinateAndHeading(progress: number): { coordinate: MapCoordinate; heading: number } {
    const totalPoints = this.route.length;
    const exactIndex = progress * (totalPoints - 1);
    const lowerIdx = Math.floor(exactIndex);
    const upperIdx = Math.min(totalPoints - 1, lowerIdx + 1);
    const fraction = exactIndex - lowerIdx;

    const p1 = this.route[lowerIdx];
    const p2 = this.route[upperIdx];

    const lat = p1.latitude + (p2.latitude - p1.latitude) * fraction;
    const lng = p1.longitude + (p2.longitude - p1.longitude) * fraction;

    const dLon = p2.longitude - p1.longitude;
    const dLat = p2.latitude - p1.latitude;
    const angle = (Math.atan2(dLon, dLat) * 180) / Math.PI;
    const heading = (angle + 360) % 360;

    return {
      coordinate: { latitude: lat, longitude: lng },
      heading: isNaN(heading) ? 0 : Math.round(heading),
    };
  }
}

export const GpsSimulationEngine = new GpsSimulationEngineImpl();
