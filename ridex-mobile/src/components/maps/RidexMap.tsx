/**
 * RIDEX — Base Map Component (RidexMap)
 * Premium motorcycle-focused cross-platform map engine.
 * Supports Native Google / Vector, CartoDB Dark Matter, Esri Dark Canvas,
 * Universal Tile Canvas Engine, live GPS polylines, animated rider markers,
 * start/end pins, smart follow-mode camera, and resilient offline fallbacks.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Platform,
  Dimensions,
  PanResponder,
  Image,
  LayoutChangeEvent,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AlertTriangle, RotateCcw, MapPin, Navigation, Flag, Plus, Minus } from 'lucide-react-native';
import { RidexMapProps, MapRegion, MapCoordinate, MapWaypoint } from '../../services/maps/mapTypes';
import { MAP_CONFIG } from '../../config/maps';
import { mapProviderService } from '../../services/maps/MapProviderService';
import { CurrentLocationMarker } from './CurrentLocationMarker';
import { StartMarker } from './StartMarker';
import { EndMarker } from './EndMarker';
import { WaypointMarker } from './WaypointMarker';
import { RidePolyline } from './RidePolyline';
import { MapControls } from './MapControls';
import { isValidCoordinate, calculateRouteBounds } from '../../utils/geo/routeBounds';
import { getRegionFromCoordinate } from '../../utils/geo/mapRegion';

import {
  MapView as NativeMapView,
  Marker as NativeMarker,
  UrlTile as NativeUrlTile,
  PROVIDER_DEFAULT as NativePROVIDER_DEFAULT,
} from './NativeMapsBridge';

export const RidexMap: React.FC<RidexMapProps> = ({
  initialRegion,
  currentLocation,
  currentHeading,
  routeCoordinates = [],
  startCoordinate,
  endCoordinate,
  waypoints = [],
  peerRiders = [],
  isTracking = false,
  followRider = true,
  onFollowModeChange,
  onRegionChangeComplete,
  onMapPress,
  onMapReady,
  onTileLoadError,
  showsUserLocation = false,
  showsRecenterButton = true,
  mapPadding = MAP_CONFIG.DEFAULT_PADDING,
  tileProvider = MAP_CONFIG.DEFAULT_PROVIDER,
  mapEngine = 'auto',
  isLoading = false,
  error = null,
  children,
  style,
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(error ? error.message : null);
  const [isFollowing, setIsFollowing] = useState(followRider);
  const [retryKey, setRetryKey] = useState(0);
  const mapRef = useRef<any>(null);

  const providerConfig = useMemo(
    () => mapProviderService.getProviderConfig(tileProvider),
    [tileProvider]
  );

  // Active map region
  const defaultInitialRegion = useMemo(() => {
    if (initialRegion && isValidCoordinate(initialRegion)) return initialRegion;

    // Compute multi-point bounding box across all points
    const allPoints: MapCoordinate[] = [];
    if (startCoordinate && isValidCoordinate(startCoordinate)) {
      allPoints.push({ latitude: Number(startCoordinate.latitude), longitude: Number(startCoordinate.longitude) });
    }
    if (waypoints && waypoints.length > 0) {
      waypoints.forEach((wp: any) => {
        if (wp && isValidCoordinate(wp.latitude, wp.longitude)) {
          allPoints.push({ latitude: Number(wp.latitude), longitude: Number(wp.longitude) });
        }
      });
    }
    if (endCoordinate && isValidCoordinate(endCoordinate)) {
      allPoints.push({ latitude: Number(endCoordinate.latitude), longitude: Number(endCoordinate.longitude) });
    }

    if (allPoints.length >= 2) {
      const bounds = calculateRouteBounds(allPoints, 1.4);
      return {
        latitude: bounds.centerLatitude,
        longitude: bounds.centerLongitude,
        latitudeDelta: bounds.latitudeDelta,
        longitudeDelta: bounds.longitudeDelta,
      };
    }

    if (startCoordinate && isValidCoordinate(startCoordinate)) {
      return getRegionFromCoordinate(startCoordinate, MAP_CONFIG.ZOOM.ROUTE_OVERVIEW);
    }
    if (currentLocation && isValidCoordinate(currentLocation)) {
      return getRegionFromCoordinate(currentLocation, MAP_CONFIG.ZOOM.ACTIVE_RIDE);
    }
    return MAP_CONFIG.DEFAULT_REGION;
  }, [initialRegion, startCoordinate, endCoordinate, waypoints, currentLocation]);

  const [currentRegion, setCurrentRegion] = useState<MapRegion>(defaultInitialRegion);

  // Compute effective route coordinates connecting start -> waypoints -> end
  const effectiveRouteCoordinates = useMemo(() => {
    if (routeCoordinates && routeCoordinates.length >= 2) {
      return routeCoordinates;
    }
    const points: MapCoordinate[] = [];
    if (startCoordinate && isValidCoordinate(startCoordinate)) {
      points.push({ latitude: Number(startCoordinate.latitude), longitude: Number(startCoordinate.longitude) });
    }
    if (waypoints && waypoints.length > 0) {
      const sorted = [...waypoints].sort((a, b) => (a.orderIndex ?? a.sequence ?? 0) - (b.orderIndex ?? b.sequence ?? 0));
      sorted.forEach((wp: any) => {
        if (wp && isValidCoordinate(wp.latitude, wp.longitude)) {
          points.push({ latitude: Number(wp.latitude), longitude: Number(wp.longitude) });
        }
      });
    }
    if (endCoordinate && isValidCoordinate(endCoordinate)) {
      points.push({ latitude: Number(endCoordinate.latitude), longitude: Number(endCoordinate.longitude) });
    }
    return points;
  }, [routeCoordinates, startCoordinate, waypoints, endCoordinate]);

  // Synchronize bounding region when route points change (if not actively following rider)
  useEffect(() => {
    if (initialRegion) return;
    const allPoints: MapCoordinate[] = [];
    if (startCoordinate && isValidCoordinate(startCoordinate)) {
      allPoints.push({ latitude: Number(startCoordinate.latitude), longitude: Number(startCoordinate.longitude) });
    }
    if (waypoints && waypoints.length > 0) {
      waypoints.forEach((wp: any) => {
        if (wp && isValidCoordinate(wp.latitude, wp.longitude)) {
          allPoints.push({ latitude: Number(wp.latitude), longitude: Number(wp.longitude) });
        }
      });
    }
    if (endCoordinate && isValidCoordinate(endCoordinate)) {
      allPoints.push({ latitude: Number(endCoordinate.latitude), longitude: Number(endCoordinate.longitude) });
    }

    if (allPoints.length >= 2 && !isTracking) {
      const bounds = calculateRouteBounds(allPoints, 1.4);
      const newReg: MapRegion = {
        latitude: bounds.centerLatitude,
        longitude: bounds.centerLongitude,
        latitudeDelta: bounds.latitudeDelta,
        longitudeDelta: bounds.longitudeDelta,
      };
      setCurrentRegion(newReg);
      if (mapRef.current && NativeMapView) {
        try {
          mapRef.current.animateToRegion(newReg, 400);
        } catch {}
      }
    }
  }, [
    startCoordinate?.latitude,
    startCoordinate?.longitude,
    endCoordinate?.latitude,
    endCoordinate?.longitude,
    waypoints?.length,
    isTracking,
  ]);

  // Follow Mode synchronization
  useEffect(() => {
    setIsFollowing(followRider);
  }, [followRider]);

  const setFollowMode = useCallback(
    (following: boolean) => {
      setIsFollowing(following);
      onFollowModeChange?.(following);
    },
    [onFollowModeChange]
  );

  // Synchronize region when initialRegion prop changes
  useEffect(() => {
    if (initialRegion && isValidCoordinate(initialRegion)) {
      setCurrentRegion(initialRegion);
      if (mapRef.current && NativeMapView) {
        try {
          mapRef.current.animateToRegion(initialRegion, 400);
        } catch {}
      }
    }
  }, [initialRegion?.latitude, initialRegion?.longitude, initialRegion?.latitudeDelta, initialRegion?.longitudeDelta]);

  // Recenter Camera Action
  const handleRecenter = useCallback(() => {
    const targetCoord = currentLocation && isValidCoordinate(currentLocation)
      ? currentLocation
      : startCoordinate && isValidCoordinate(startCoordinate)
      ? startCoordinate
      : { latitude: currentRegion.latitude, longitude: currentRegion.longitude };

    const newRegion = getRegionFromCoordinate(targetCoord, MAP_CONFIG.ZOOM.ACTIVE_RIDE);
    setCurrentRegion(newRegion);
    setFollowMode(true);

    if (mapRef.current && NativeMapView) {
      try {
        mapRef.current.animateToRegion(newRegion, MAP_CONFIG.FOLLOW_MODE.CAMERA_ANIMATION_MS);
      } catch {}
    }
  }, [currentLocation, startCoordinate, currentRegion, setFollowMode]);

  // Smooth camera tracking when rider position moves and follow mode is active
  useEffect(() => {
    if (!isFollowing || !currentLocation || !isValidCoordinate(currentLocation) || !mapReady) return;

    const newRegion: MapRegion = {
      ...currentRegion,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    };

    setCurrentRegion(newRegion);

    if (mapRef.current && NativeMapView) {
      try {
        mapRef.current.animateToRegion(newRegion, 400);
      } catch {}
    }
  }, [currentLocation?.latitude, currentLocation?.longitude, isFollowing, mapReady]);

  const handleRegionChangeComplete = (region: MapRegion) => {
    setCurrentRegion(region);
    onRegionChangeComplete?.(region);
  };

  const handlePanDrag = () => {
    if (isFollowing) {
      setFollowMode(false);
    }
  };

  const handleRetry = () => {
    setMapError(null);
    setRetryKey((k) => k + 1);
  };

  // Determine effective rendering engine:
  // - 'canvas': Renders universal tile canvas engine (works on Android, iOS, Web without Google Maps API keys)
  // - 'native': Renders react-native-maps MapView (on Android/iOS)
  // - 'auto': Uses Native on mobile if available & not in error; uses Canvas on Web or as fallback
  const isWeb = Platform.OS === 'web';
  const effectiveEngine = useMemo<'native' | 'canvas'>(() => {
    if (mapEngine === 'canvas') return 'canvas';
    if (mapEngine === 'native') return 'native';
    if (isWeb) return 'canvas';
    return NativeMapView && !mapError ? 'native' : 'canvas';
  }, [mapEngine, mapError, isWeb]);

  const handleMapReadyEvent = () => {
    setMapReady(true);
    onMapReady?.();
  };

  // Web / Universal Pan Responder
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
        onPanResponderGrant: () => {
          if (isFollowing) {
            setFollowMode(false);
          }
        },
        onPanResponderMove: (_, gestureState) => {
          const factor = (currentRegion.latitudeDelta || 0.08) / 350;
          setCurrentRegion((prev) => ({
            ...prev,
            latitude: prev.latitude + gestureState.dy * factor * 0.15,
            longitude: prev.longitude - gestureState.dx * factor * 0.15,
          }));
        },
      }),
    [isFollowing, setFollowMode, currentRegion.latitudeDelta]
  );

  return (
    <View style={[styles.container, style]}>
      {/* 1. NATIVE MAP IMPLEMENTATION (Android APK / iOS) */}
      {effectiveEngine === 'native' && NativeMapView && !mapError ? (
        <NativeMapView
          key={`native-map-${retryKey}-${tileProvider}`}
          ref={mapRef}
          provider={NativePROVIDER_DEFAULT}
          style={StyleSheet.absoluteFill}
          initialRegion={defaultInitialRegion}
          customMapStyle={Platform.OS === 'android' ? MAP_CONFIG.DARK_MAP_STYLE : undefined}
          userInterfaceStyle="dark"
          onMapReady={handleMapReadyEvent}
          onRegionChangeComplete={handleRegionChangeComplete}
          onPress={(e) => onMapPress?.(e.nativeEvent.coordinate)}
          onPanDrag={handlePanDrag}
          showsUserLocation={showsUserLocation}
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          mapType="standard"
          loadingEnabled={false}
          mapPadding={{
            top: mapPadding.top || 0,
            right: mapPadding.right || 0,
            bottom: mapPadding.bottom || 0,
            left: mapPadding.left || 0,
          }}
        >
          {/* Custom Raster Tile Layer on Android using CartoDB Dark Matter / Esri / OSM */}
          {Platform.OS === 'android' &&
            NativeUrlTile &&
            providerConfig?.urlTemplate &&
            tileProvider !== 'google_vector' && (
              <NativeUrlTile
                urlTemplate={providerConfig.urlTemplate}
                shouldReplaceMapContent={true}
                maximumZ={providerConfig?.maxZoom || 19}
                minimumZ={providerConfig?.minZoom || 1}
                tileSize={256}
                zIndex={1}
              />
            )}

          {/* Route Polyline */}
          {effectiveRouteCoordinates.length >= 2 && (
            <RidePolyline coordinates={effectiveRouteCoordinates} />
          )}

          {/* Start Marker */}
          {startCoordinate && isValidCoordinate(startCoordinate) && NativeMarker && (
            <NativeMarker
              coordinate={startCoordinate}
              anchor={{ x: 0.5, y: 1.0 }}
              zIndex={4}
            >
              <StartMarker coordinate={startCoordinate} />
            </NativeMarker>
          )}

          {/* Waypoint Stop Markers */}
          {waypoints &&
            waypoints.map((wp: any, idx: number) => {
              const coord = {
                latitude: wp.latitude,
                longitude: wp.longitude,
              };
              if (!isValidCoordinate(coord)) return null;

              return (
                NativeMarker && (
                  <NativeMarker
                    key={wp.id || `native-wp-${idx}`}
                    coordinate={coord}
                    anchor={{ x: 0.5, y: 1.0 }}
                    zIndex={4}
                  >
                    <WaypointMarker waypoint={wp} index={idx} />
                  </NativeMarker>
                )
              );
            })}

          {/* End Marker */}
          {endCoordinate && isValidCoordinate(endCoordinate) && NativeMarker && (
            <NativeMarker
              coordinate={endCoordinate}
              anchor={{ x: 0.5, y: 1.0 }}
              zIndex={4}
            >
              <EndMarker coordinate={endCoordinate} />
            </NativeMarker>
          )}

          {/* Current Rider Marker */}
          {currentLocation && isValidCoordinate(currentLocation) && NativeMarker && (
            <NativeMarker
              coordinate={currentLocation}
              anchor={{ x: 0.5, y: 0.5 }}
              flat={true}
              zIndex={5}
            >
              <CurrentLocationMarker
                coordinate={currentLocation}
                heading={currentHeading}
                isRiding={isTracking}
              />
            </NativeMarker>
          )}

          {children}
        </NativeMapView>
      ) : (
        /* 2. UNIVERSAL FREE DARK TILE CANVAS MAP ENGINE */
        <WebMapCanvas
          key={`canvas-map-${retryKey}-${tileProvider}`}
          region={currentRegion}
          providerConfig={providerConfig}
          routeCoordinates={effectiveRouteCoordinates}
          startCoordinate={startCoordinate}
          endCoordinate={endCoordinate}
          waypoints={waypoints}
          currentLocation={currentLocation}
          currentHeading={currentHeading}
          peerRiders={peerRiders}
          isTracking={isTracking}
          panResponder={panResponder}
          onMapPress={onMapPress}
          onReady={handleMapReadyEvent}
          onError={(msg) => {
            setMapError(msg);
            onTileLoadError?.(msg);
          }}
          onZoomIn={() => {
            setCurrentRegion((prev) => ({
              ...prev,
              latitudeDelta: Math.max(prev.latitudeDelta * 0.5, 0.002),
              longitudeDelta: Math.max(prev.longitudeDelta * 0.5, 0.002),
            }));
          }}
          onZoomOut={() => {
            setCurrentRegion((prev) => ({
              ...prev,
              latitudeDelta: Math.min(prev.latitudeDelta * 2.0, 1.0),
              longitudeDelta: Math.min(prev.longitudeDelta * 2.0, 1.0),
            }));
          }}
        />
      )}

      {/* 3. FLOATING MAP CONTROLS & DYNAMIC LEGAL ATTRIBUTION */}
      <MapControls
        isFollowing={isFollowing}
        onRecenter={handleRecenter}
        heading={currentHeading}
        provider={tileProvider}
        showRecenter={showsRecenterButton && !!currentLocation && isValidCoordinate(currentLocation)}
        showAttribution={true}
        showCompass={isTracking}
      />

      {/* 4. LOADING INDICATOR */}
      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>LOADING MAP RADAR...</Text>
        </View>
      )}

      {/* 5. RESILIENT FALLBACK / ERROR CARD (Never a blank map!) */}
      {mapError && (
        <View style={styles.fallbackOverlay}>
          <View style={styles.fallbackCard}>
            <View style={styles.fallbackHeader}>
              <AlertTriangle size={22} color="#FF6B00" />
              <Text style={styles.fallbackTitle}>MAP RADAR OFFLINE</Text>
            </View>
            <Text style={styles.fallbackDesc}>
              {mapError || 'Map tiles unavailable. Route waypoints remain saved.'}
            </Text>

            {/* Route Summary Pill */}
            {(startCoordinate || endCoordinate) && (
              <View style={styles.fallbackRouteBox}>
                <View style={styles.routeItem}>
                  <MapPin size={14} color="#00E676" />
                  <Text style={styles.routeItemText}>
                    Start: {startCoordinate?.latitude.toFixed(4)}, {startCoordinate?.longitude.toFixed(4)}
                  </Text>
                </View>
                <View style={styles.routeItem}>
                  <Flag size={14} color="#FF3B30" />
                  <Text style={styles.routeItemText}>
                    Dest: {endCoordinate?.latitude.toFixed(4)}, {endCoordinate?.longitude.toFixed(4)}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
              <RotateCcw size={16} color="#080B12" />
              <Text style={styles.retryBtnText}>RETRY RADAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

/**
 * Universal High-Performance Map Canvas renderer with CartoDB Dark Matter / Esri tile grid
 * and vector route overlay. Works 100% reliably on Android Expo Go, iOS, and Web.
 */
interface WebMapCanvasProps {
  region: MapRegion;
  providerConfig: any;
  routeCoordinates: MapCoordinate[];
  startCoordinate?: MapCoordinate | null;
  endCoordinate?: MapCoordinate | null;
  waypoints?: (MapWaypoint | any)[];
  currentLocation?: MapCoordinate | null;
  currentHeading?: number | null;
  peerRiders?: any[];
  isTracking?: boolean;
  panResponder: any;
  onMapPress?: (coordinate: MapCoordinate) => void;
  onReady: () => void;
  onError?: (error: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

const WebMapCanvas: React.FC<WebMapCanvasProps> = ({
  region,
  providerConfig,
  routeCoordinates,
  startCoordinate,
  endCoordinate,
  waypoints = [],
  currentLocation,
  currentHeading,
  peerRiders = [],
  isTracking,
  panResponder,
  onMapPress,
  onReady,
  onError,
  onZoomIn,
  onZoomOut,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onReady();
    }, 50);
    return () => clearTimeout(timer);
  }, [onReady]);

  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: Dimensions.get('window').width || 360,
    height: 300,
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    if (w > 0 && h > 0) {
      setContainerSize({ width: w, height: h });
    }
  };

  const mapW = Math.max(containerSize.width, 300);
  const mapH = Math.max(containerSize.height, 240);

  // Convert lat/lng coordinates to screen pixels relative to current region center
  const coordToPixel = useCallback(
    (coord: MapCoordinate) => {
      const deltaLng = Math.max(region.longitudeDelta, 0.001);
      const deltaLat = Math.max(region.latitudeDelta, 0.001);
      const x = mapW / 2 + ((coord.longitude - region.longitude) / deltaLng) * mapW;
      const y = mapH / 2 - ((coord.latitude - region.latitude) / deltaLat) * mapH;
      return { x, y };
    },
    [region, mapW, mapH]
  );

  // Calculate web/canvas tile coordinates
  const zoom = Math.max(3, Math.min(18, Math.round(Math.log2(360 / Math.max(region.latitudeDelta, 0.001)))));
  const centerTileX = Math.floor(((region.longitude + 180) / 360) * Math.pow(2, zoom));
  const latRad = (region.latitude * Math.PI) / 180;
  const centerTileY = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );

  // Generate 5x3 surrounding tile grid centered on container
  const tiles: { key: string; url: string; xOffset: number; yOffset: number }[] = [];
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const tileX = centerTileX + dx;
      const tileY = centerTileY + dy;
      const url = mapProviderService.getTileUrl(zoom, tileX, tileY, providerConfig?.id);

      tiles.push({
        key: `${zoom}_${tileX}_${tileY}`,
        url,
        xOffset: mapW / 2 + dx * 256 - 128,
        yOffset: mapH / 2 + dy * 256 - 128,
      });
    }
  }

  // Determine stealth dark filter for web tiles
  const tileFilter = providerConfig?.filter || (providerConfig?.isDark ? 'invert(100%) hue-rotate(180deg) brightness(85%) contrast(92%)' : 'none');

  // Build SVG Path for Route Polyline
  const polylinePath = useMemo(() => {
    if (routeCoordinates.length < 2) return '';
    return routeCoordinates
      .map((coord, idx) => {
        const pt = coordToPixel(coord);
        return `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      })
      .join(' ');
  }, [routeCoordinates, coordToPixel]);

  const currentPixel = currentLocation && isValidCoordinate(currentLocation) ? coordToPixel(currentLocation) : null;
  const startPixel = startCoordinate && isValidCoordinate(startCoordinate) ? coordToPixel(startCoordinate) : null;
  const endPixel = endCoordinate && isValidCoordinate(endCoordinate) ? coordToPixel(endCoordinate) : null;

  // Convert screen pixels to lat/lng coordinates
  const pixelToCoord = useCallback(
    (x: number, y: number) => {
      const deltaLng = Math.max(region.longitudeDelta, 0.001);
      const deltaLat = Math.max(region.latitudeDelta, 0.001);
      const lng = region.longitude + ((x - mapW / 2) / mapW) * deltaLng;
      const lat = region.latitude - ((y - mapH / 2) / mapH) * deltaLat;
      return { latitude: lat, longitude: lng };
    },
    [region, mapW, mapH]
  );

  const handleWebClick = (e: any) => {
    if (onMapPress) {
      const rect = e.currentTarget?.getBoundingClientRect?.();
      if (rect) {
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const coord = pixelToCoord(clickX, clickY);
        onMapPress(coord);
      }
    }
  };

  return (
    <View
      style={styles.webContainer}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
      // @ts-ignore Web-only click handler
      onClick={handleWebClick}
    >
      {/* Background Dark Cockpit Canvas */}
      <View style={styles.darkBackground} />

      {/* Map Tile Layers */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {tiles.map((t) => (
          <View
            key={t.key}
            style={[
              styles.tileWrapper,
              { left: t.xOffset, top: t.yOffset, width: 256, height: 256 },
            ]}
          >
            {Platform.OS === 'web' ? (
              <img
                src={t.url}
                alt="map-tile"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: tileFilter,
                  opacity: 0.95,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
                onError={(e) => {
                  const target = e.target as any;
                  if (!target.src.includes('basemaps.cartocdn.com')) {
                    target.src = `https://a.basemaps.cartocdn.com/dark_all/${t.key.replace(/_/g, '/')}.png`;
                  }
                }}
              />
            ) : (
              <Image
                source={{ uri: t.url }}
                style={{ width: 256, height: 256, opacity: 0.95 }}
                resizeMode="cover"
              />
            )}
          </View>
        ))}
      </View>

      {/* Route SVG Polyline Layer (Universal Cross-Platform) */}
      {polylinePath !== '' && (
        <Svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: mapW,
            height: mapH,
            zIndex: 2,
          }}
          pointerEvents="none"
        >
          {/* Glowing Trail Shadow */}
          <Path
            d={polylinePath}
            fill="none"
            stroke="rgba(255, 107, 0, 0.4)"
            strokeWidth={MAP_CONFIG.STYLE.ROUTE_GLOW_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Razor Sharp Foreground Line */}
          <Path
            d={polylinePath}
            fill="none"
            stroke={MAP_CONFIG.STYLE.ROUTE_COLOR}
            strokeWidth={MAP_CONFIG.STYLE.ROUTE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}

      {/* Start Marker */}
      {startPixel && startCoordinate && (
        <View
          style={[
            styles.markerWrapper,
            { left: startPixel.x - 30, top: startPixel.y - 45, zIndex: 4 },
          ]}
          pointerEvents="none"
        >
          <StartMarker coordinate={startCoordinate} />
        </View>
      )}

      {/* Waypoint Stop Markers */}
      {waypoints &&
        waypoints.map((wp: any, idx: number) => {
          const coord = {
            latitude: wp.latitude,
            longitude: wp.longitude,
          };
          if (!isValidCoordinate(coord)) return null;
          const px = coordToPixel(coord);

          return (
            <View
              key={wp.id || `canvas-wp-${idx}`}
              style={[
                styles.markerWrapper,
                { left: px.x - 45, top: px.y - 50, zIndex: 4 },
              ]}
              pointerEvents="none"
            >
              <WaypointMarker waypoint={wp} index={idx} />
            </View>
          );
        })}

      {/* End Marker */}
      {endPixel && endCoordinate && (
        <View
          style={[
            styles.markerWrapper,
            { left: endPixel.x - 30, top: endPixel.y - 45, zIndex: 4 },
          ]}
          pointerEvents="none"
        >
          <EndMarker coordinate={endCoordinate} />
        </View>
      )}

      {/* Peer Squad Riders */}
      {peerRiders &&
        peerRiders.map((peer) => {
          const coord = {
            latitude: peer.coordinate?.latitude ?? peer.latitude ?? 18.5204,
            longitude: peer.coordinate?.longitude ?? peer.longitude ?? 73.8567,
          };
          const px = coordToPixel(coord);
          const name = peer.user?.name || peer.name || 'Rider';
          return (
            <View
              key={peer.userId || peer.id}
              style={[
                styles.markerWrapper,
                { left: px.x - 30, top: px.y - 30, zIndex: 6 },
              ]}
              pointerEvents="none"
            >
              <View style={styles.peerMarkerCircle}>
                <Text style={styles.peerMarkerLetter}>{(name || 'R')[0].toUpperCase()}</Text>
              </View>
              <Text style={styles.peerMarkerName} numberOfLines={1}>
                {name}
              </Text>
            </View>
          );
        })}

      {/* Current Rider Marker */}
      {currentPixel && currentLocation && (
        <View
          style={[
            styles.markerWrapper,
            { left: currentPixel.x - 30, top: currentPixel.y - 30, zIndex: 5 },
          ]}
          pointerEvents="none"
        >
          <CurrentLocationMarker
            coordinate={currentLocation}
            heading={currentHeading}
            isRiding={isTracking}
          />
        </View>
      )}

      {/* Quick Canvas Zoom Controls */}
      <View style={styles.zoomControls} pointerEvents="box-none">
        <TouchableOpacity style={styles.zoomBtn} onPress={onZoomIn} activeOpacity={0.7}>
          <Plus size={16} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={onZoomOut} activeOpacity={0.7}>
          <Minus size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 200,
    backgroundColor: '#080B12',
    overflow: 'hidden',
  },
  webContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#080B12',
    overflow: 'hidden',
  },
  darkBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#080B12',
  },
  tileWrapper: {
    position: 'absolute',
    overflow: 'hidden',
  },
  markerWrapper: {
    position: 'absolute',
    width: 60,
    alignItems: 'center',
  },
  zoomControls: {
    position: 'absolute',
    top: 70,
    left: 16,
    flexDirection: 'column',
    gap: 8,
    zIndex: 15,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(17, 23, 34, 0.85)',
    borderWidth: 1,
    borderColor: '#1A2234',
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerMarkerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#06B6D4',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  peerMarkerLetter: {
    fontSize: 13,
    fontWeight: '900',
    color: '#090D16',
  },
  peerMarkerName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
    maxWidth: 60,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 11, 18, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  fallbackOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 11, 18, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 25,
  },
  fallbackCard: {
    backgroundColor: '#111722',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 0, 0.4)',
    padding: 16,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 10,
  },
  fallbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fallbackTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  fallbackDesc: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
  fallbackRouteBox: {
    width: '100%',
    backgroundColor: '#171E2B',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeItemText: {
    fontSize: 11,
    color: '#F8FAFC',
    fontWeight: '700',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#080B12',
    letterSpacing: 0.8,
  },
});
