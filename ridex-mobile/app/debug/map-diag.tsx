/**
 * RIDEX — Map Diagnostic Lab
 * Diagnostic suite containing:
 * 1. Minimal Native Google Map (Pure MapView with zero custom overlays for root-cause testing)
 * 2. Full RIDEX Stealth Cockpit Map (Multi-provider, CartoDB Dark Matter, route polylines & telemetry)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  Cpu,
  RotateCcw,
  Navigation,
  Trash2,
  ShieldAlert,
  Info,
} from 'lucide-react-native';
import { RidexMap } from '@/components/maps/RidexMap';
import {
  MapView as NativeMapView,
  Marker as NativeMarker,
  PROVIDER_DEFAULT as NativePROVIDER_DEFAULT,
  PROVIDER_GOOGLE as NativePROVIDER_GOOGLE,
} from '@/components/maps/NativeMapsBridge';
import { MapCoordinate, MapProviderType, MapRegion } from '@/services/maps/mapTypes';
import { MAP_CONFIG } from '@/config/maps';

const PUNE_START: MapCoordinate = {
  latitude: 18.5204,
  longitude: 73.8567,
};

const FC_ROAD_WAYPOINT: MapCoordinate = {
  latitude: 18.5314,
  longitude: 73.8446,
};

const LAVASA_DESTINATION: MapCoordinate = {
  latitude: 18.4089,
  longitude: 73.5024,
};

const SAMPLE_ROUTE: MapCoordinate[] = [
  PUNE_START,
  { latitude: 18.5314, longitude: 73.8446 },
  { latitude: 18.5089, longitude: 73.7924 },
  { latitude: 18.468, longitude: 73.712 },
  { latitude: 18.435, longitude: 73.658 },
  LAVASA_DESTINATION,
];

export default function MapDiagnosticScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'MINIMAL' | 'FULL'>('MINIMAL');
  const [logs, setLogs] = useState<string[]>([]);
  const [key, setKey] = useState(0);

  // Minimal Map State
  const [minimalProvider, setMinimalProvider] = useState<'DEFAULT' | 'GOOGLE'>('DEFAULT');
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [minimalRegion, setMinimalRegion] = useState<MapRegion>({
    latitude: 18.5204,
    longitude: 73.8567,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });

  // Full Map State
  const [mapEngine, setMapEngine] = useState<'auto' | 'native' | 'canvas'>('auto');
  const [selectedProvider, setSelectedProvider] = useState<MapProviderType>('carto_dark');

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 30)]);
  };

  useEffect(() => {
    addLog(`Diagnostic Lab mounted. Mode: ${tab} • Platform: ${Platform.OS.toUpperCase()}`);
  }, [tab]);

  const handleReload = () => {
    setIsMapReady(false);
    setIsMapLoaded(false);
    setKey((k) => k + 1);
    addLog('Map reloaded manually');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>MAP DIAGNOSTIC LAB</Text>
          <Text style={styles.headerSub}>
            {Platform.OS.toUpperCase()} • {tab === 'MINIMAL' ? 'MINIMAL GOOGLE TEST' : 'FULL COCKPIT'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleReload} style={styles.reloadBtn}>
          <RefreshCw size={18} color="#FF6B00" />
        </TouchableOpacity>
      </View>

      {/* Mode Segment Bar */}
      <View style={styles.modeBar}>
        <TouchableOpacity
          style={[styles.modeTab, tab === 'MINIMAL' && styles.modeTabActive]}
          onPress={() => setTab('MINIMAL')}
        >
          <Text style={[styles.modeTabText, tab === 'MINIMAL' && styles.modeTabTextActive]}>
            1. MINIMAL BASE MAP TEST
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, tab === 'FULL' && styles.modeTabActive]}
          onPress={() => setTab('FULL')}
        >
          <Text style={[styles.modeTabText, tab === 'FULL' && styles.modeTabTextActive]}>
            2. RIDEX COCKPIT MAP
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map Viewport Area */}
      <View style={styles.mapContainer}>
        {tab === 'MINIMAL' ? (
          /* ============================================================ */
          /* STEP 2: MINIMAL BARE MAP TEST (Pure Native MapView & Marker) */
          /* ============================================================ */
          NativeMapView && Platform.OS !== 'web' ? (
            <NativeMapView
              key={`minimal-${key}-${minimalProvider}`}
              style={StyleSheet.absoluteFill}
              provider={minimalProvider === 'GOOGLE' ? NativePROVIDER_GOOGLE : NativePROVIDER_DEFAULT}
              initialRegion={minimalRegion}
              onMapReady={() => {
                setIsMapReady(true);
                addLog('EVENT: onMapReady fired (Native Map canvas mounted)');
              }}
              onMapLoaded={() => {
                setIsMapLoaded(true);
                addLog('EVENT: onMapLoaded fired (Native vector tiles downloaded)');
              }}
              onRegionChangeComplete={(reg: MapRegion) => {
                setMinimalRegion(reg);
                addLog(`REGION: ${reg.latitude.toFixed(4)}, ${reg.longitude.toFixed(4)} (Δ: ${reg.latitudeDelta.toFixed(3)})`);
              }}
              onPress={(e) => {
                const c = e.nativeEvent.coordinate;
                addLog(`TAP: ${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`);
              }}
            >
              {NativeMarker && (
                <NativeMarker
                  coordinate={{ latitude: 18.5204, longitude: 73.8567 }}
                  title="Pune Center"
                  description="Standard Native Marker (18.5204° N, 73.8567° E)"
                />
              )}
            </NativeMapView>
          ) : (
            <View style={styles.webFallbackBox}>
              <Info size={28} color="#00E5FF" />
              <Text style={styles.webFallbackTitle}>NATIVE MAPVIEW (MOBILE ONLY)</Text>
              <Text style={styles.webFallbackDesc}>
                Pure Native MapView is designed for physical Android & iOS devices. Switch to Tab 2 for Cross-Platform Universal Dark Tiles.
              </Text>
            </View>
          )
        ) : (
          /* ============================================================ */
          /* FULL RIDEX STEALTH COCKPIT MAP SUITE                         */
          /* ============================================================ */
          <RidexMap
            key={`full-diag-${key}-${mapEngine}-${selectedProvider}`}
            initialRegion={minimalRegion}
            mapEngine={mapEngine}
            tileProvider={selectedProvider}
            startCoordinate={PUNE_START}
            endCoordinate={LAVASA_DESTINATION}
            waypoints={[
              { id: 'wp-1', latitude: FC_ROAD_WAYPOINT.latitude, longitude: FC_ROAD_WAYPOINT.longitude, name: 'FC Road Meetup', sequence: 1 },
            ]}
            routeCoordinates={SAMPLE_ROUTE}
            showsUserLocation={false}
            showsRecenterButton={true}
            onMapReady={() => {
              setIsMapReady(true);
              addLog('EVENT: onMapReady on RidexMap');
            }}
            onRegionChangeComplete={(reg) => {
              setMinimalRegion(reg);
              addLog(`REGION: ${reg.latitude.toFixed(4)}, ${reg.longitude.toFixed(4)}`);
            }}
            onMapPress={(coord) => {
              addLog(`TAP: ${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}`);
            }}
          />
        )}

        {/* Live Diagnostics HUD Overlay */}
        <View style={styles.diagOverlay} pointerEvents="box-none">
          <View style={styles.statusPill}>
            {isMapLoaded ? (
              <CheckCircle2 size={13} color="#00E676" />
            ) : isMapReady ? (
              <CheckCircle2 size={13} color="#00E5FF" />
            ) : (
              <ActivityIndicator size="small" color="#FFB300" />
            )}
            <Text style={styles.statusText}>
              {isMapLoaded
                ? 'BASE TILES LOADED (60 FPS)'
                : isMapReady
                ? 'MAP MOUNTED • AUTH / TILE PENDING'
                : 'INITIALIZING MAP VIEWPORT...'}
            </Text>
          </View>
        </View>

        {/* Floating Quick Stats */}
        <View style={styles.statsPill} pointerEvents="none">
          <Text style={styles.statsText}>
            {minimalRegion.latitude.toFixed(4)}° N, {minimalRegion.longitude.toFixed(4)}° E • Δ: {minimalRegion.latitudeDelta.toFixed(3)}
          </Text>
        </View>
      </View>

      {/* Controls & Diagnosis Panel */}
      <View style={styles.controls}>
        {tab === 'MINIMAL' ? (
          /* Minimal Map Controls */
          <View style={styles.minimalControls}>
            <View style={styles.sectionHeaderRow}>
              <Cpu size={12} color="#8E9BAE" />
              <Text style={styles.sectionTitle}>NATIVE PROVIDER PROP</Text>
            </View>
            <View style={styles.engineToggleRow}>
              <TouchableOpacity
                style={[styles.engineBtn, minimalProvider === 'DEFAULT' && styles.engineBtnActive]}
                onPress={() => {
                  setMinimalProvider('DEFAULT');
                  setIsMapReady(false);
                  setIsMapLoaded(false);
                  addLog('Switched to PROVIDER_DEFAULT');
                }}
              >
                <Text style={[styles.engineBtnText, minimalProvider === 'DEFAULT' && styles.engineBtnTextActive]}>
                  PROVIDER_DEFAULT
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.engineBtn, minimalProvider === 'GOOGLE' && styles.engineBtnActive]}
                onPress={() => {
                  setMinimalProvider('GOOGLE');
                  setIsMapReady(false);
                  setIsMapLoaded(false);
                  addLog('Switched to PROVIDER_GOOGLE');
                }}
              >
                <Text style={[styles.engineBtnText, minimalProvider === 'GOOGLE' && styles.engineBtnTextActive]}>
                  PROVIDER_GOOGLE
                </Text>
              </TouchableOpacity>
            </View>

            {/* Diagnostic Advisory Card */}
            <View style={styles.advisoryCard}>
              <ShieldAlert size={16} color="#FFB300" />
              <Text style={styles.advisoryText}>
                <Text style={{ fontWeight: '900', color: '#FFB300' }}>EXPO GO LIMITATION: </Text>
                Google Maps native vector tiles require an API key in AndroidManifest.xml and restrict requests by package name. In Expo Go, the package is <Text style={{ fontFamily: 'monospace' }}>host.exp.exponent</Text>. To test Google vector tiles, use an unrestricted Google Cloud API key or a Development Build APK (<Text style={{ fontFamily: 'monospace' }}>npx expo run:android</Text>).
              </Text>
            </View>
          </View>
        ) : (
          /* Full Cockpit Map Controls */
          <View style={styles.fullControls}>
            <View style={styles.sectionHeaderRow}>
              <Layers size={12} color="#8E9BAE" />
              <Text style={styles.sectionTitle}>TILE PROVIDER LAYER</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providerScroll}>
              <TouchableOpacity
                style={[styles.providerChip, selectedProvider === 'carto_dark' && styles.providerChipActive]}
                onPress={() => {
                  setSelectedProvider('carto_dark');
                  addLog('Switched to Dark Matter (CARTO)');
                }}
              >
                <Text style={[styles.providerChipText, selectedProvider === 'carto_dark' && styles.providerChipTextActive]}>
                  Dark Matter (CARTO)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.providerChip, selectedProvider === 'esri_dark' && styles.providerChipActive]}
                onPress={() => {
                  setSelectedProvider('esri_dark');
                  addLog('Switched to Esri Dark Canvas');
                }}
              >
                <Text style={[styles.providerChipText, selectedProvider === 'esri_dark' && styles.providerChipTextActive]}>
                  Esri Dark Canvas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.providerChip, selectedProvider === 'carto_voyager' && styles.providerChipActive]}
                onPress={() => {
                  setSelectedProvider('carto_voyager');
                  addLog('Switched to Carto Voyager');
                }}
              >
                <Text style={[styles.providerChipText, selectedProvider === 'carto_voyager' && styles.providerChipTextActive]}>
                  Carto Voyager
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.providerChip, selectedProvider === 'google_vector' && styles.providerChipActive]}
                onPress={() => {
                  setSelectedProvider('google_vector');
                  addLog('Switched to Native Google Vector');
                }}
              >
                <Text style={[styles.providerChipText, selectedProvider === 'google_vector' && styles.providerChipTextActive]}>
                  Native Google / Vector
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Live Logs */}
        <View style={styles.logContainer}>
          <View style={styles.logHeaderRow}>
            <Text style={styles.logHeader}>LIFECYCLE EVENTS ({logs.length})</Text>
            <TouchableOpacity onPress={() => setLogs([])}>
              <Text style={styles.clearLogsText}>CLEAR</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.logBox} showsVerticalScrollIndicator={false}>
            {logs.length === 0 ? (
              <Text style={styles.logPlaceholder}>Pan, zoom, or tap to record native lifecycle events...</Text>
            ) : (
              logs.map((log, i) => (
                <Text key={i} style={styles.logLine}>{log}</Text>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080A0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2234',
    backgroundColor: '#0B0F19',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111722',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  reloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerSub: {
    color: '#8E9BAE',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  modeBar: {
    flexDirection: 'row',
    backgroundColor: '#0E1420',
    borderBottomWidth: 1,
    borderBottomColor: '#1A2234',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modeTabActive: {
    borderBottomColor: '#FF6B00',
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  modeTabText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modeTabTextActive: {
    color: '#FF6B00',
  },
  mapContainer: {
    flex: 1,
    minHeight: 220,
    position: 'relative',
    backgroundColor: '#090D16',
  },
  webFallbackBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  webFallbackTitle: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  webFallbackDesc: {
    color: '#8E9BAE',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  diagOverlay: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 23, 34, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A2234',
    gap: 6,
  },
  statusText: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(11, 15, 25, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1A2234',
  },
  statsText: {
    color: '#8E9BAE',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  controls: {
    padding: 12,
    backgroundColor: '#0F1522',
    borderTopWidth: 1,
    borderTopColor: '#1A2234',
    gap: 8,
  },
  minimalControls: {
    gap: 6,
  },
  fullControls: {
    gap: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: '#8E9BAE',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  engineToggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  engineBtn: {
    flex: 1,
    paddingVertical: 7,
    backgroundColor: '#172234',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1A2234',
    alignItems: 'center',
  },
  engineBtnActive: {
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    borderColor: '#FF6B00',
  },
  engineBtnText: {
    color: '#8E9BAE',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  engineBtnTextActive: {
    color: '#FF6B00',
  },
  advisoryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 179, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.25)',
    borderRadius: 6,
    padding: 8,
    gap: 8,
  },
  advisoryText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 10,
    lineHeight: 14,
  },
  providerScroll: {
    flexDirection: 'row',
  },
  providerChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#172234',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1A2234',
    marginRight: 6,
  },
  providerChipActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: '#00E5FF',
  },
  providerChipText: {
    color: '#8E9BAE',
    fontSize: 10,
    fontWeight: '700',
  },
  providerChipTextActive: {
    color: '#00E5FF',
    fontWeight: '800',
  },
  logContainer: {
    gap: 4,
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logHeader: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  clearLogsText: {
    color: '#8E9BAE',
    fontSize: 9,
    fontWeight: '800',
  },
  logBox: {
    backgroundColor: '#080A0F',
    borderRadius: 6,
    padding: 8,
    maxHeight: 70,
    borderWidth: 1,
    borderColor: '#1A2234',
  },
  logPlaceholder: {
    color: '#475569',
    fontSize: 10,
    fontStyle: 'italic',
  },
  logLine: {
    color: '#00E676',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
  },
});
