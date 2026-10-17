/**
 * RIDEX — Centralized Map Configuration
 * Free & Open Geospatial Providers, Themes, Default Regions, and HUD Padding.
 */

import { MapPadding, MapProviderType, MapRegion, MapTileProviderConfig } from '../services/maps/mapTypes';

export const MAP_CONFIG = {
  /**
   * Default free map provider
   * Uses CartoDB Dark Matter / Esri Canvas for the signature premium stealth RIDEX motorcycle cockpit.
   */
  DEFAULT_PROVIDER: 'carto_dark' as MapProviderType,

  /**
   * Default fallback region (Pune / Western Ghats Motorcycling Hub)
   */
  DEFAULT_REGION: {
    latitude: 18.5204,
    longitude: 73.8567,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  } as MapRegion,

  /**
   * Default zoom levels
   */
  ZOOM: {
    ACTIVE_RIDE: 15,
    ROUTE_OVERVIEW: 12,
    EXPLORE: 13,
    MIN_ZOOM: 3,
    MAX_ZOOM: 19,
  },

  /**
   * Map view padding so markers and routes aren't hidden behind HUD panels & safe areas
   */
  DEFAULT_PADDING: {
    top: 70,
    right: 20,
    bottom: 240,
    left: 20,
  } as MapPadding,

  SUMMARY_PADDING: {
    top: 60,
    right: 32,
    bottom: 120,
    left: 32,
  } as MapPadding,

  /**
   * Follow mode settings
   */
  FOLLOW_MODE: {
    DEFAULT_ENABLED: true,
    CAMERA_ANIMATION_MS: 500,
    HEADING_FILTER_THRESHOLD_DEG: 5,
  },

  /**
   * Route Polyline visual styles
   */
  STYLE: {
    ROUTE_COLOR: '#FF6B00', // RIDEX Primary Orange
    ROUTE_GLOW_COLOR: 'rgba(255, 107, 0, 0.4)',
    ROUTE_WIDTH: 4,
    ROUTE_GLOW_WIDTH: 10,
    ROUTE_ALT_COLOR: '#00E5FF', // Telemetry Cyan
    START_MARKER_COLOR: '#00E676', // Bright Green
    END_MARKER_COLOR: '#FF3B30', // Red Pin
    RIDER_MARKER_COLOR: '#FF6B00',
  },

  /**
   * Open & Free Tile Providers (Zero API Key Dependencies & Zero Watermarks)
   */
  TILE_PROVIDERS: {
    carto_dark: {
      id: 'carto_dark',
      name: 'Dark Matter (CARTO)',
      urlTemplate: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 19,
      minZoom: 1,
      tileSize: 256,
      attribution: '© OpenStreetMap contributors, © CARTO',
      isDark: true,
    },
    esri_dark: {
      id: 'esri_dark',
      name: 'Esri Dark Canvas',
      urlTemplate: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      subdomains: [],
      maxZoom: 16,
      minZoom: 1,
      tileSize: 256,
      attribution: '© Esri, HERE, Garmin, © OpenStreetMap',
      isDark: true,
    },
    carto_voyager: {
      id: 'carto_voyager',
      name: 'Voyager (CARTO)',
      urlTemplate: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 19,
      minZoom: 1,
      tileSize: 256,
      attribution: '© OpenStreetMap contributors, © CARTO',
      isDark: false,
    },
    osm_dark: {
      id: 'osm_dark',
      name: 'OpenStreetMap Stealth Dark',
      urlTemplate: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 19,
      minZoom: 1,
      tileSize: 256,
      attribution: '© OpenStreetMap contributors, © CARTO',
      isDark: true,
    },
    osm_standard: {
      id: 'osm_standard',
      name: 'OpenStreetMap Standard',
      urlTemplate: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 19,
      minZoom: 1,
      tileSize: 256,
      attribution: '© OpenStreetMap contributors, © CARTO',
      isDark: false,
    },
    opentopo: {
      id: 'opentopo',
      name: 'OpenTopoMap',
      urlTemplate: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 17,
      minZoom: 1,
      tileSize: 256,
      attribution: '© OpenTopoMap, © OpenStreetMap contributors',
      isDark: false,
    },
    google_vector: {
      id: 'google_vector',
      name: 'Native Google / Vector',
      urlTemplate: '',
      subdomains: [],
      maxZoom: 20,
      minZoom: 1,
      tileSize: 256,
      attribution: '© Google',
      isDark: true,
    },
    system_default: {
      id: 'system_default',
      name: 'System Default (Dark Matter)',
      urlTemplate: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 19,
      minZoom: 1,
      tileSize: 256,
      attribution: '© OpenStreetMap contributors, © CARTO',
      isDark: true,
    },
  } as Record<MapProviderType, MapTileProviderConfig>,

  /**
   * High-contrast Dark Cockpit JSON styling for React Native Maps
   */
  DARK_MAP_STYLE: [
    { elementType: 'geometry', stylers: [{ color: '#090D16' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#090D16' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#F8FAFC' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#64748B' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#0F1A24' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#1E293B' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#111827' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#334155' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#F8FAFC' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#080C14' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#38BDF8' }],
    },
  ],
};
