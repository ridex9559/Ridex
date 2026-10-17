/**
 * RIDEX Web — Interactive Adventure Cockpit Map Component
 * Powered by Leaflet + CARTO Dark Matter raster layers.
 * Supports start/end badges, numbered waypoints, polyline tracing, and live rider radar beacons.
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapCoordinate, RideCheckpoint, LiveRiderLocation } from '../../types';
import { isValidCoordinate, evaluateFreshness, calculateDistanceMeters } from '../../utils/geo';
import { useActiveRideStore } from '../../stores/useActiveRideStore';

interface LeafletMapProps {
  start?: MapCoordinate | null;
  destination?: MapCoordinate | null;
  waypoints?: (RideCheckpoint | { name: string; latitude: number; longitude: number; type?: string })[];
  routeCoordinates?: [number, number][]; // [lat, lng]
  riderLocations?: LiveRiderLocation[];
  currentUserId?: string;
  onMapClick?: (coord: { latitude: number; longitude: number }) => void;
  height?: string;
  interactive?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  start,
  destination,
  waypoints = [],
  routeCoordinates = [],
  riderLocations = [],
  currentUserId,
  onMapClick,
  height = '360px',
  interactive = true,
}) => {
  const { myLocation } = useActiveRideStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const bubbleLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] =
        myLocation && isValidCoordinate(myLocation.latitude, myLocation.longitude)
          ? [myLocation.latitude, myLocation.longitude]
          : [18.5204, 73.8567];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 12,
        zoomControl: interactive,
        dragging: interactive,
        touchZoom: interactive,
        scrollWheelZoom: interactive ? 'center' : false,
        attributionControl: true,
      });

      // OpenStreetMap Dark Adventure Theme
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        className: 'dark-map-tiles',
        maxZoom: 19,
      }).addTo(map);

      const bubbleGroup = L.layerGroup().addTo(map);
      bubbleLayerRef.current = bubbleGroup;

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;

      if (onMapClick) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onMapClick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
        });
      }

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Render Markers, Waypoints, Polyline, and Group Pack Radar
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const bubbleLayer = bubbleLayerRef.current;
    if (!map || !markersLayer || !bubbleLayer) return;

    markersLayer.clearLayers();
    bubbleLayer.clearLayers();

    const boundsPoints: L.LatLngExpression[] = [];

    // Helper for HTML marker icons
    const createCustomIcon = (html: string, className = '', iconSize: [number, number] = [32, 32]) => {
      return L.divIcon({
        html,
        className: `custom-leaflet-marker ${className}`,
        iconSize,
        iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
      });
    };

    // A. Start Marker (Checkered / Green Badge)
    if (start && isValidCoordinate(start.latitude, start.longitude)) {
      const latlng: [number, number] = [start.latitude, start.longitude];
      boundsPoints.push(latlng);

      const startIcon = createCustomIcon(`
        <div style="
          width: 34px; height: 34px; border-radius: 50%;
          background: #00E676; border: 3px solid #080A0F;
          display: flex; align-items: center; justify-content: center;
          color: #080A0F; font-weight: 800; font-size: 14px;
          box-shadow: 0 0 16px rgba(0, 230, 118, 0.6);
        ">A</div>
      `);

      L.marker(latlng, { icon: startIcon })
        .bindTooltip(`<b>Start:</b> ${start.name || 'Origin Rendezvous'}`, { direction: 'top' })
        .addTo(markersLayer);
    }

    // B. Intermediate Waypoints (1, 2, 3...)
    waypoints.forEach((wp, idx) => {
      if (!isValidCoordinate(wp.latitude, wp.longitude)) return;
      const latlng: [number, number] = [wp.latitude, wp.longitude];
      boundsPoints.push(latlng);

      const typeLabel = (wp as any).type || 'STOP';
      const typeColor = typeLabel === 'FUEL' ? '#FF6B00' : typeLabel === 'VIEWPOINT' ? '#00E5FF' : '#FFB020';

      const wpIcon = createCustomIcon(`
        <div style="
          width: 28px; height: 28px; border-radius: 50%;
          background: ${typeColor}; border: 2px solid #080A0F;
          display: flex; align-items: center; justify-content: center;
          color: #080A0F; font-weight: 800; font-size: 12px;
          box-shadow: 0 0 12px ${typeColor}88;
        ">${idx + 1}</div>
      `);

      L.marker(latlng, { icon: wpIcon })
        .bindTooltip(`<b>Stop ${idx + 1} (${typeLabel}):</b> ${wp.name || 'Checkpoint'}`, { direction: 'top' })
        .addTo(markersLayer);
    });

    // C. Destination Marker (Finish / Red Badge)
    if (destination && isValidCoordinate(destination.latitude, destination.longitude)) {
      const latlng: [number, number] = [destination.latitude, destination.longitude];
      boundsPoints.push(latlng);

      const destIcon = createCustomIcon(`
        <div style="
          width: 34px; height: 34px; border-radius: 50%;
          background: #FF3B30; border: 3px solid #080A0F;
          display: flex; align-items: center; justify-content: center;
          color: #FFFFFF; font-weight: 800; font-size: 14px;
          box-shadow: 0 0 16px rgba(255, 59, 48, 0.6);
        ">B</div>
      `);

      L.marker(latlng, { icon: destIcon })
        .bindTooltip(`<b>Destination:</b> ${destination.name || 'Finish Point'}`, { direction: 'top' })
        .addTo(markersLayer);
    }

    // D. Filter Active Valid Riders for Group Pack Radar
    const validRiders = riderLocations.filter(
      (r) => isValidCoordinate(r.latitude, r.longitude) && evaluateFreshness(r.updatedAt) !== 'LOST'
    );

    // E. Group Pack Radar Proximity Bubble
    if (validRiders.length >= 2) {
      // Find centroid of the squad
      const latSum = validRiders.reduce((acc, r) => acc + r.latitude, 0);
      const lngSum = validRiders.reduce((acc, r) => acc + r.longitude, 0);
      const centroidLat = latSum / validRiders.length;
      const centroidLng = lngSum / validRiders.length;

      // Calculate distances from centroid
      const riderDists = validRiders.map((r) => ({
        rider: r,
        dist: calculateDistanceMeters(centroidLat, centroidLng, r.latitude, r.longitude),
      }));

      // In-pack riders: within 1500m of centroid
      const inPack = riderDists.filter((rd) => rd.dist <= 1500);
      const detached = riderDists.filter((rd) => rd.dist > 1500);

      if (inPack.length >= 2) {
        const maxPackDist = Math.max(...inPack.map((rd) => rd.dist), 150);
        const bubbleRadius = maxPackDist + 80; // dynamic halo padding

        const packBubble = L.circle([centroidLat, centroidLng], {
          radius: bubbleRadius,
          color: '#00E5FF',
          fillColor: '#00E5FF',
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: '5, 5',
        });

        packBubble.bindTooltip(
          `<b>Squad Formation Radar</b><br/>${inPack.length} riders within pack perimeter`,
          { direction: 'top', permanent: false }
        );
        packBubble.addTo(bubbleLayer);
      }

      // Detached rider alert halos
      detached.forEach(({ rider, dist }) => {
        const detachedHalo = L.circle([rider.latitude, rider.longitude], {
          radius: 120,
          color: '#FF3B30',
          fillColor: '#FF3B30',
          fillOpacity: 0.18,
          weight: 2,
          dashArray: '3, 3',
        });
        detachedHalo.bindTooltip(
          `<b>⚠️ Detached Squad Member:</b> ${rider.riderName}<br/>${(dist / 1000).toFixed(1)} km separation`,
          { direction: 'top' }
        );
        detachedHalo.addTo(bubbleLayer);
      });
    }

    // F. Individual Live Rider Markers
    validRiders.forEach((rider) => {
      const latlng: [number, number] = [rider.latitude, rider.longitude];
      boundsPoints.push(latlng);

      const isMe = rider.userId === currentUserId;
      const speed = rider.speed ? Math.round(rider.speed) : 0;
      const heading = rider.heading || 0;
      const freshness = evaluateFreshness(rider.updatedAt);
      const isStale = freshness === 'STALE';

      const riderHtml = `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute; width: 100%; height: 100%; border-radius: 50%;
            border: 2px solid ${isMe ? '#00E5FF' : isStale ? '#FFB020' : '#FF6B00'};
            animation: radar-pulse 2s infinite; opacity: ${isStale ? '0.4' : '0.8'};
          "></div>
          <div style="
            width: 32px; height: 32px; border-radius: 50%;
            background: #121722; border: 2px solid ${isMe ? '#00E5FF' : isStale ? '#FFB020' : '#FF6B00'};
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 14px ${isMe ? 'rgba(0, 229, 255, 0.6)' : isStale ? 'rgba(255, 176, 32, 0.4)' : 'rgba(255, 107, 0, 0.6)'};
            transform: rotate(${heading}deg);
          ">
            <span style="font-size: 16px; line-height: 1;">🏍️</span>
          </div>
          ${
            speed > 2
              ? `<div style="
                  position: absolute; bottom: -8px; background: #080A0F;
                  border: 1px solid ${isMe ? '#00E5FF' : '#FF6B00'}; border-radius: 6px;
                  padding: 1px 4px; font-size: 9px; font-family: monospace; font-weight: 700; color: #FFF;
                ">${speed} km/h</div>`
              : ''
          }
        </div>
      `;

      const riderIcon = createCustomIcon(riderHtml, '', [44, 44]);
      L.marker(latlng, { icon: riderIcon })
        .bindTooltip(
          `<b>${rider.riderName || 'Rider'}</b> ${isMe ? '(You)' : ''}<br/>${speed > 0 ? `${speed} km/h` : 'Stationary'}${isStale ? ' • [Signal Stale]' : ''}`,
          { direction: 'top' }
        )
        .addTo(markersLayer);
    });

    // G. Road-Following Route Polyline
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 1) {
      const polyline = L.polyline(routeCoordinates, {
        color: '#FF6B00',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routeLayerRef.current = polyline;
      routeCoordinates.forEach((c) => boundsPoints.push(c));
    }

    // H. If no route or peers are on map, but current user GPS is available, show user location dot
    if (
      riderLocations.length === 0 &&
      !start &&
      !destination &&
      myLocation &&
      isValidCoordinate(myLocation.latitude, myLocation.longitude)
    ) {
      const latlng: [number, number] = [myLocation.latitude, myLocation.longitude];
      boundsPoints.push(latlng);

      const myIcon = createCustomIcon(
        `
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid #00E5FF; animation: radar-pulse 2s infinite; opacity: 0.8;"></div>
          <div style="width: 22px; height: 22px; border-radius: 50%; background: #00E5FF; border: 3px solid #080A0F; box-shadow: 0 0 16px rgba(0, 229, 255, 0.8); display: flex; align-items: center; justify-content: center; font-size: 11px;">🏍️</div>
        </div>
      `,
        '',
        [40, 40]
      );

      L.marker(latlng, { icon: myIcon })
        .bindTooltip(
          `<b>Your GPS Location</b><br/>${myLocation.speed ? `${myLocation.speed} km/h` : 'Location Active'}`,
          { direction: 'top' }
        )
        .addTo(markersLayer);
    }

    // Auto-fit Bounds with comfortable padding
    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (myLocation && isValidCoordinate(myLocation.latitude, myLocation.longitude)) {
      map.setView([myLocation.latitude, myLocation.longitude], 13);
    }
  }, [start, destination, waypoints, routeCoordinates, riderLocations, currentUserId, myLocation]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border-card)',
      }}
    >
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
