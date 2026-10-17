/**
 * RIDEX V2 — 5-Category Emergency Assistance (SOS) Service
 */

import { HelpAlert, HelpCategory } from '../../types/safety';

type AlertListener = (alerts: HelpAlert[]) => void;

class SafetyService {
  private activeAlerts: HelpAlert[] = [];
  private listeners: Set<AlertListener> = new Set();

  public subscribe(listener: AlertListener): () => void {
    this.listeners.add(listener);
    listener([...this.activeAlerts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const list = [...this.activeAlerts];
    this.listeners.forEach((fn) => fn(list));
  }

  public getActiveAlerts(): HelpAlert[] {
    return [...this.activeAlerts];
  }

  public async broadcastAlert(params: {
    rideId: string;
    riderId: string;
    riderName: string;
    riderAvatar?: string;
    category: HelpCategory;
    message?: string;
    latitude: number;
    longitude: number;
  }): Promise<HelpAlert> {
    const alert: HelpAlert = {
      id: `alert-${Date.now()}`,
      rideId: params.rideId,
      riderId: params.riderId,
      riderName: params.riderName,
      riderAvatar: params.riderAvatar,
      category: params.category,
      message: params.message,
      latitude: params.latitude,
      longitude: params.longitude,
      timestamp: Date.now(),
      status: 'ACTIVE',
    };

    this.activeAlerts = [alert, ...this.activeAlerts];
    this.notify();
    return alert;
  }

  public resolveAlert(alertId: string) {
    this.activeAlerts = this.activeAlerts.filter((a) => a.id !== alertId);
    this.notify();
  }
}

export const safetyService = new SafetyService();
