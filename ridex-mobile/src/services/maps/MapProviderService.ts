/**
 * RIDEX — Map Provider Service
 * Centralized abstraction for map tile providers, attribution, and theme resolution.
 * Ensures zero tight coupling to any specific map vendor or paid cloud API.
 */

import { MAP_CONFIG } from '../../config/maps';
import { MapProviderType, MapTileProviderConfig } from './mapTypes';

class MapProviderService {
  private activeProvider: MapProviderType = MAP_CONFIG.DEFAULT_PROVIDER;

  /**
   * Sets the active map provider.
   */
  public setProvider(provider: MapProviderType): void {
    if (MAP_CONFIG.TILE_PROVIDERS[provider]) {
      this.activeProvider = provider;
    } else {
      console.warn(`[MapProviderService] Unknown provider "${provider}", falling back to default.`);
      this.activeProvider = MAP_CONFIG.DEFAULT_PROVIDER;
    }
  }

  /**
   * Gets the active provider configuration.
   */
  public getActiveProviderConfig(): MapTileProviderConfig {
    return MAP_CONFIG.TILE_PROVIDERS[this.activeProvider] || MAP_CONFIG.TILE_PROVIDERS.osm_dark;
  }

  /**
   * Gets configuration for a specific provider ID.
   */
  public getProviderConfig(provider: MapProviderType): MapTileProviderConfig {
    return MAP_CONFIG.TILE_PROVIDERS[provider] || this.getActiveProviderConfig();
  }

  /**
   * Resolves a tile URL with an automatic subdomain pick.
   */
  public getTileUrl(z: number, x: number, y: number, provider?: MapProviderType): string {
    const config = provider ? this.getProviderConfig(provider) : this.getActiveProviderConfig();
    const subdomains = config.subdomains;
    const s = subdomains.length > 0 ? subdomains[(x + y) % subdomains.length] : 'a';

    return config.urlTemplate
      .replace('{s}', s)
      .replace('{z}', z.toString())
      .replace('{x}', x.toString())
      .replace('{y}', y.toString())
      .replace('{r}', '@2x');
  }

  /**
   * Returns the required legal attribution text for the active provider.
   */
  public getAttribution(provider?: MapProviderType): string {
    const config = provider ? this.getProviderConfig(provider) : this.getActiveProviderConfig();
    return config.attribution;
  }

  /**
   * Returns whether the active provider is dark-themed.
   */
  public isDarkTheme(provider?: MapProviderType): boolean {
    const config = provider ? this.getProviderConfig(provider) : this.getActiveProviderConfig();
    return config.isDark;
  }
}

export const mapProviderService = new MapProviderService();
export { MapProviderService };
