import { Platform } from 'react-native';
import * as Network from 'expo-network';
import { logger } from '@/utils/logger';

export type NetworkStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  status: NetworkStatus;
  connectionType?: string;
}

export type NetworkListener = (state: NetworkState) => void;

class NetworkService {
  private static instance: NetworkService | null = null;
  private currentState: NetworkState = {
    isConnected: true,
    isInternetReachable: true,
    status: 'ONLINE',
  };
  private listeners: Set<NetworkListener> = new Set();
  private isListening = false;

  private constructor() {
    this.initNetworkMonitoring();
  }

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  private async initNetworkMonitoring() {
    if (this.isListening) return;
    this.isListening = true;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const updateWebStatus = () => {
          const online = window.navigator.onLine;
          this.updateState({
            isConnected: online,
            isInternetReachable: online,
            status: online ? 'ONLINE' : 'OFFLINE',
          });
        };

        window.addEventListener('online', updateWebStatus);
        window.addEventListener('offline', updateWebStatus);
        updateWebStatus();
      }
      return;
    }

    try {
      const networkState = await Network.getNetworkStateAsync();
      this.updateState({
        isConnected: !!networkState.isConnected,
        isInternetReachable: networkState.isInternetReachable !== false,
        status: networkState.isConnected && networkState.isInternetReachable !== false ? 'ONLINE' : 'OFFLINE',
        connectionType: networkState.type?.toString(),
      });

      // Poll periodically or listen to state changes on native
      setInterval(async () => {
        try {
          const latest = await Network.getNetworkStateAsync();
          const isOnline = !!latest.isConnected && latest.isInternetReachable !== false;
          if (isOnline !== (this.currentState.status === 'ONLINE')) {
            this.updateState({
              isConnected: !!latest.isConnected,
              isInternetReachable: latest.isInternetReachable !== false,
              status: isOnline ? 'ONLINE' : 'OFFLINE',
              connectionType: latest.type?.toString(),
            });
          }
        } catch {
          // Ignore background check errors
        }
      }, 5000);
    } catch (error) {
      logger.warn('[NetworkService] Could not initialize native expo-network, defaulting to online:', error);
      this.updateState({ isConnected: true, isInternetReachable: true, status: 'ONLINE' });
    }
  }

  private updateState(newState: NetworkState) {
    const hasChanged = this.currentState.status !== newState.status;
    this.currentState = newState;
    if (hasChanged) {
      logger.info(`[NetworkService] Network status changed: ${newState.status}`);
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentState);
      } catch (err) {
        logger.error('[NetworkService] Listener notification error:', err);
      }
    });
  }

  public async isOnline(): Promise<boolean> {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.navigator.onLine;
    }
    return this.currentState.status === 'ONLINE';
  }

  public getNetworkState(): NetworkState {
    return this.currentState;
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState); // Immediately emit current state
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const networkService = NetworkService.getInstance();
