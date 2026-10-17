/**
 * RIDEX Web — Interactive Adventure Cockpit Map Component
 * Powered by Leaflet + CARTO Dark Matter raster layers.
 * Supports start/end badges, numbered waypoints, polyline tracing, and live rider radar beacons.
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapCoordinate, RideCheckpoint, LiveRiderLocation } from '../../types';

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [18.5204, 73.8567], // Default: Pune / Western Ghats
        zoom: 11,
        zoomControl: interactive,
        dragging: interactive,
        touchZoom: interactive,
        scrollWheelZoom: interactive ? 'center' : false,
        attributionControl: true,
      });

      // CARTO Dark Matter Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

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

  // 2. Render Markers, Waypoints, Polyline, and Riders
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

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
    if (start && start.latitude && start.longitude) {
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

    // B. Intermediate Waypoints ($1, 2, 3, \dots$)
    waypoints.forEach((wp, idx) => {
      if (!wp.latitude || !wp.longitude) return;
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
    if (destination && destination.latitude && destination.longitude) {
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

    // D. Live Rider Radar Markers
    riderLocations.forEach((rider) => {
      if (!rider.latitude || !rider.longitude) return;
      const latlng: [number, number] = [rider.latitude, rider.longitude];
      boundsPoints.push(latlng);

      const isMe = rider.userId === currentUserId;
      const speed = rider.speed ? Math.round(rider.speed) : 0;
      const heading = rider.heading || 0;

      const riderHtml = `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute; width: 100%; height: 100%; border-radius: 50%;
            border: 2px solid ${isMe ? '#00E5FF' : '#FF6B00'};
            animation: radar-pulse 2s infinite; opacity: 0.8;
          "></div>
          <div style="
            width: 30px; height: 30px; border-radius: 50%;
            background: #121722; border: 2px solid ${isMe ? '#00E5FF' : '#FF6B00'};
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 12px ${isMe ? 'rgba(0, 229, 255, 0.5)' : 'rgba(255, 107, 0, 0.5)'};
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
        .bindTooltip(`<b>${rider.riderName || 'Rider'}</b> ${isMe ? '(You)' : ''}<br/>${speed} km/h`, {
          direction: 'top',
        })
        .addTo(markersLayer);
    });

    // E. Route Polyline Tracing
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
    } else if (boundsPoints.length >= 2) {
      // Direct segment connecting line if turn-by-turn route is pending
      const polyline = L.polyline(boundsPoints, {
        color: '#FF6B00',
        weight: 3,
        dashArray: '8, 8',
        opacity: 0.6,
      }).addTo(map);
      routeLayerRef.current = polyline;
    }

    // Auto-fit Bounds with comfortable padding
    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [start, destination, waypoints, routeCoordinates, riderLocations, currentUserId]);

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
