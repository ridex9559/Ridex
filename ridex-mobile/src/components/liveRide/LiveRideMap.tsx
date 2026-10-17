import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { RidexMap } from '../maps/RidexMap';
import { RiderMarker } from './RiderMarker';
import { LiveRiderLocation } from '../../types/liveRide';
import { MapCoordinate, MapRegion } from '../../services/maps/mapTypes';
import { isValidCoordinate } from '../../utils/geo/routeBounds';

import { Marker as NativeMarker } from '../maps/NativeMapsBridge';

interface LiveRideMapProps {
  initialRegion?: MapRegion;
  currentLocation?: MapCoordinate | null;
  currentHeading?: number | null;
  routeCoordinates?: MapCoordinate[];
  startCoordinate?: MapCoordinate | null;
  endCoordinate?: MapCoordinate | null;
  waypoints?: any[];
  peerRiders?: LiveRiderLocation[];
  currentUserId?: string;
  selectedRiderId?: string | null;
  onSelectRider?: (rider: LiveRiderLocation) => void;
  followRider?: boolean;
  onFollowModeChange?: (following: boolean) => void;
  style?: any;
}

export const LiveRideMap: React.FC<LiveRideMapProps> = ({
  initialRegion,
  currentLocation,
  currentHeading,
  routeCoordinates = [],
  startCoordinate,
  endCoordinate,
  waypoints = [],
  peerRiders = [],
  currentUserId,
  selectedRiderId,
  onSelectRider,
  followRider = true,
  onFollowModeChange,
  style,
}) => {
  // Filter other riders (excluding self if self is already represented by currentLocation)
  const peerList = useMemo(() => {
    return peerRiders.filter((r) => {
      if (r.userId === currentUserId) return false;
      const coord = r.coordinate || { latitude: r.latitude, longitude: r.longitude };
      return isValidCoordinate(coord);
    });
  }, [peerRiders, currentUserId]);

  return (
    <View style={[styles.container, style]}>
      <RidexMap
        initialRegion={initialRegion}
        currentLocation={currentLocation}
        currentHeading={currentHeading}
        routeCoordinates={routeCoordinates}
        startCoordinate={startCoordinate}
        endCoordinate={endCoordinate}
        waypoints={waypoints}
        peerRiders={peerList}
        isTracking={true}
        followRider={followRider}
        onFollowModeChange={onFollowModeChange}
        showsRecenterButton={false} // Handled by LiveRideControls
      >
        {/* Render Peer Rider Markers on Native Map */}
        {NativeMarker &&
          peerList.map((rider) => (
            <NativeMarker
              key={rider.userId}
              coordinate={{
                latitude: rider.coordinate?.latitude ?? rider.latitude ?? 18.5204,
                longitude: rider.coordinate?.longitude ?? rider.longitude ?? 73.8567,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              flat={true}
              zIndex={10}
              onPress={() => onSelectRider?.(rider)}
            >
              <RiderMarker
                rider={rider}
                isSelected={rider.userId === selectedRiderId}
                onPress={() => onSelectRider?.(rider)}
              />
            </NativeMarker>
          ))}
      </RidexMap>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
    overflow: 'hidden',
  },
});
