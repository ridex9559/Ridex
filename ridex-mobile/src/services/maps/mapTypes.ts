/**
 * RIDEX — Map & Geospatial Type Definitions
 * Strict TypeScript types for coordinate representations, regions, bounding boxes,
 * markers, tile providers, camera states, and map statuses.
 */

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export interface MapCoordinateWithAltitude extends MapCoordinate {
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp?: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface RouteBounds {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
  centerLatitude: number;
  centerLongitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type MapProviderType =
  | 'carto_dark'
  | 'esri_dark'
  | 'carto_voyager'
  | 'osm_dark'
  | 'osm_standard'
  | 'opentopo'
  | 'google_vector'
  | 'system_default';

export interface MapTileProviderConfig {
  id: MapProviderType;
  name: string;
  urlTemplate: string;
  subdomains: string[];
  maxZoom: number;
  minZoom: number;
  tileSize: number;
  attribution: string;
  isDark: boolean;
  filter?: string;
}

export type MapCameraMode = 'idle' | 'follow_rider' | 'free_pan' | 'fit_route';

export interface MapCameraState {
  center: MapCoordinate;
  zoom: number;
  bearing: number;
  pitch: number;
  mode: MapCameraMode;
  isFollowing: boolean;
}

export type MapStatus = 'uninitialized' | 'loading' | 'ready' | 'offline' | 'error';

export interface MapError {
  code: 'MAP_NOT_READY' | 'MAP_PROVIDER_ERROR' | 'INVALID_COORDINATE' | 'ROUTE_NOT_FOUND' | 'LOCATION_UNAVAILABLE' | 'TILE_LOAD_FAILED';
  message: string;
  originalError?: unknown;
}

export interface StartMarkerProps {
  coordinate: MapCoordinate;
  title?: string;
  description?: string;
}

export interface EndMarkerProps {
  coordinate: MapCoordinate;
  title?: string;
  description?: string;
}

export interface MapWaypoint {
  id?: string;
  name?: string;
  latitude: number;
  longitude: number;
  type?: string;
  category?: string;
  orderIndex?: number;
  estimatedStopMinutes?: number;
}

export interface CurrentLocationMarkerProps {
  coordinate: MapCoordinate;
  heading?: number | null;
  speedKmh?: number | null;
  isRiding?: boolean;
}

export interface RidePolylineProps {
  coordinates: MapCoordinate[];
  strokeColor?: string;
  strokeWidth?: number;
  glowColor?: string;
  glowWidth?: number;
}

export interface RidexMapProps {
  initialRegion?: MapRegion;
  currentLocation?: MapCoordinate | null;
  currentHeading?: number | null;
  routeCoordinates?: MapCoordinate[];
  startCoordinate?: MapCoordinate | null;
  endCoordinate?: MapCoordinate | null;
  waypoints?: (MapWaypoint | any)[];
  isTracking?: boolean;
  followRider?: boolean;
  onFollowModeChange?: (following: boolean) => void;
  onRegionChangeComplete?: (region: MapRegion) => void;
  onMapPress?: (coordinate: MapCoordinate) => void;
  onMapReady?: () => void;
  onTileLoadError?: (error: string) => void;
  showsUserLocation?: boolean;
  showsRecenterButton?: boolean;
  mapPadding?: Partial<MapPadding>;
  tileProvider?: MapProviderType;
  mapEngine?: 'auto' | 'native' | 'canvas';
  isLoading?: boolean;
  error?: MapError | null;
  peerRiders?: any[];
  children?: React.ReactNode;
  style?: any;
}
