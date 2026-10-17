import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RidexMap } from '../maps/RidexMap';
import { MapCoordinate } from '../../services/maps/mapTypes';

interface RideReplayModalProps {
  visible: boolean;
  onClose: () => void;
  rideTitle: string;
  routeCoordinates: MapCoordinate[];
  totalDistanceKm: number;
  totalDurationMin: number;
  avgSpeedKmh?: number;
  maxSpeedKmh?: number;
}

export const RideReplayModal: React.FC<RideReplayModalProps> = ({
  visible,
  onClose,
  rideTitle,
  routeCoordinates,
  totalDistanceKm,
  totalDurationMin,
  avgSpeedKmh = 64,
  maxSpeedKmh = 108,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5 | 10>(2);
  const [progress, setProgress] = useState(0); // 0 to 1

  const animationFrameRef = useRef<NodeJS.Timeout | null>(null);

  // Fallback route coordinates if empty
  const activeCoordinates = useMemo(() => {
    if (routeCoordinates && routeCoordinates.length >= 2) {
      return routeCoordinates;
    }
    // Default Pune to Lavasa demo route
    return [
      { latitude: 18.5204, longitude: 73.8567 },
      { latitude: 18.512, longitude: 73.815 },
      { latitude: 18.498, longitude: 73.765 },
      { latitude: 18.468, longitude: 73.712 },
      { latitude: 18.435, longitude: 73.658 },
      { latitude: 18.411, longitude: 73.578 },
      { latitude: 18.408, longitude: 73.509 },
    ];
  }, [routeCoordinates]);

  // Interpolate current coordinate based on progress
  const currentCoordinate = useMemo(() => {
    if (activeCoordinates.length === 0) return null;
    const exactIndex = progress * (activeCoordinates.length - 1);
    const lowerIdx = Math.floor(exactIndex);
    const upperIdx = Math.min(activeCoordinates.length - 1, lowerIdx + 1);
    const subProgress = exactIndex - lowerIdx;

    const p1 = activeCoordinates[lowerIdx];
    const p2 = activeCoordinates[upperIdx];

    return {
      latitude: p1.latitude + (p2.latitude - p1.latitude) * subProgress,
      longitude: p1.longitude + (p2.longitude - p1.longitude) * subProgress,
    };
  }, [activeCoordinates, progress]);

  // Calculate current heading
  const currentHeading = useMemo(() => {
    const exactIndex = progress * (activeCoordinates.length - 1);
    const lowerIdx = Math.floor(exactIndex);
    const upperIdx = Math.min(activeCoordinates.length - 1, lowerIdx + 1);
    if (lowerIdx === upperIdx) return 0;

    const p1 = activeCoordinates[lowerIdx];
    const p2 = activeCoordinates[upperIdx];
    const dLon = p2.longitude - p1.longitude;
    const dLat = p2.latitude - p1.latitude;
    const angle = (Math.atan2(dLon, dLat) * 180) / Math.PI;
    return (angle + 360) % 360;
  }, [activeCoordinates, progress]);

  // Current distance & speed telemetry
  const currentDistance = (progress * totalDistanceKm).toFixed(1);
  const currentSpeed = isPlaying
    ? Math.round(avgSpeedKmh + Math.sin(progress * 20) * 18)
    : 0;

  const currentDurationMins = Math.round(progress * totalDurationMin);
  const formatTime = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:00`;
  };

  useEffect(() => {
    if (isPlaying) {
      const stepInterval = 100; // 100ms
      const stepIncrement = (0.005 * playbackSpeed);

      animationFrameRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) {
            setIsPlaying(false);
            return 1;
          }
          return Math.min(1, prev + stepIncrement);
        });
      }, stepInterval);
    } else {
      if (animationFrameRef.current) {
        clearInterval(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        clearInterval(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed]);

  const handleTogglePlay = () => {
    if (progress >= 1) {
      setProgress(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSpeedToggle = () => {
    const speeds: (1 | 2 | 5 | 10)[] = [1, 2, 5, 10];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Floating Control Bar */}
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{rideTitle}</Text>
            <Text style={styles.headerSub}>INTERACTIVE GPS RIDE REPLAY</Text>
          </View>
          <TouchableOpacity onPress={handleSpeedToggle} style={styles.speedPill}>
            <Ionicons name="speedometer" size={14} color="#FF5722" />
            <Text style={styles.speedPillText}>{playbackSpeed}x SPEED</Text>
          </TouchableOpacity>
        </View>

        {/* Live Replay Map */}
        <View style={styles.mapContainer}>
          <RidexMap
            currentLocation={currentCoordinate}
            currentHeading={currentHeading}
            routeCoordinates={activeCoordinates}
            startCoordinate={activeCoordinates[0]}
            endCoordinate={activeCoordinates[activeCoordinates.length - 1]}
            isTracking={isPlaying}
            followRider={true}
          />

          {/* Floating Telemetry HUD */}
          <View style={styles.telemetryHUD}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryVal}>{currentSpeed}</Text>
              <Text style={styles.telemetryUnit}>KM/H SPEED</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryVal}>{currentDistance}</Text>
              <Text style={styles.telemetryUnit}>/ {totalDistanceKm} KM</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryVal}>{formatTime(currentDurationMins)}</Text>
              <Text style={styles.telemetryUnit}>ELAPSED</Text>
            </View>
          </View>
        </View>

        {/* Bottom Playback Scrubber & Control Console */}
        <View style={styles.bottomConsole}>
          {/* Interactive Scrubber Bar */}
          <View style={styles.scrubberContainer}>
            <View style={styles.scrubberTrack}>
              <View style={[styles.scrubberFill, { width: `${progress * 100}%` }]} />
            </View>
            {/* Quick jump step markers */}
            <View style={styles.scrubJumpRow}>
              {[0, 0.25, 0.5, 0.75, 1].map((step) => (
                <TouchableOpacity
                  key={step}
                  onPress={() => setProgress(step)}
                  style={styles.stepTouch}
                >
                  <View style={[styles.stepDot, progress >= step && styles.stepDotActive]} />
                  <Text style={styles.stepText}>{Math.round(step * 100)}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Main Controls Row */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              onPress={() => setProgress(Math.max(0, progress - 0.1))}
              style={styles.skipBtn}
            >
              <Ionicons name="play-back" size={22} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTogglePlay}
              style={[styles.playBtn, isPlaying && styles.pauseBtn]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={28}
                color="#FFFFFF"
                style={!isPlaying ? { marginLeft: 3 } : undefined}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setProgress(Math.min(1, progress + 0.1))}
              style={styles.skipBtn}
            >
              <Ionicons name="play-forward" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(9, 13, 22, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 12,
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    color: '#FF5722',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  speedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 34, 0.3)',
    gap: 4,
  },
  speedPillText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '800',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  telemetryHUD: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  telemetryItem: {
    alignItems: 'center',
  },
  telemetryVal: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
  },
  telemetryUnit: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  telemetryDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  bottomConsole: {
    backgroundColor: '#0B1120',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 16,
  },
  scrubberContainer: {
    gap: 8,
  },
  scrubberTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: '#FF5722',
  },
  scrubJumpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepTouch: {
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  stepDotActive: {
    backgroundColor: '#FF5722',
  },
  stepText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  skipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  pauseBtn: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
});
