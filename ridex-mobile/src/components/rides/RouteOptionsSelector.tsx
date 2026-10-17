import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type RouteRoutingProfile = 'FASTEST' | 'SHORTEST' | 'SCENIC';

export interface RoutePreferences {
  profile: RouteRoutingProfile;
  avoidTolls: boolean;
  avoidHighways: boolean;
  motorcycleFriendly: boolean;
}

interface RouteOptionsSelectorProps {
  preferences: RoutePreferences;
  onChange: (preferences: RoutePreferences) => void;
}

export const RouteOptionsSelector: React.FC<RouteOptionsSelectorProps> = ({
  preferences,
  onChange,
}) => {
  const toggleAvoidTolls = () => {
    onChange({ ...preferences, avoidTolls: !preferences.avoidTolls });
  };

  const toggleAvoidHighways = () => {
    onChange({ ...preferences, avoidHighways: !preferences.avoidHighways });
  };

  const toggleMotorcycleFriendly = () => {
    onChange({ ...preferences, motorcycleFriendly: !preferences.motorcycleFriendly });
  };

  const setProfile = (profile: RouteRoutingProfile) => {
    onChange({ ...preferences, profile });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="git-branch" size={16} color="#06B6D4" />
        <Text style={styles.headerTitle}>ROUTING PROFILE & PREFERENCES</Text>
      </View>

      {/* Primary Route Type Selector */}
      <View style={styles.profileRow}>
        <TouchableOpacity
          style={[
            styles.profileChip,
            preferences.profile === 'FASTEST' && styles.profileChipActive,
          ]}
          onPress={() => setProfile('FASTEST')}
        >
          <Ionicons
            name="flash"
            size={14}
            color={preferences.profile === 'FASTEST' ? '#06B6D4' : '#94A3B8'}
          />
          <Text
            style={[
              styles.profileText,
              preferences.profile === 'FASTEST' && styles.profileTextActive,
            ]}
          >
            FASTEST
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.profileChip,
            preferences.profile === 'SHORTEST' && styles.profileChipActive,
          ]}
          onPress={() => setProfile('SHORTEST')}
        >
          <Ionicons
            name="navigate"
            size={14}
            color={preferences.profile === 'SHORTEST' ? '#06B6D4' : '#94A3B8'}
          />
          <Text
            style={[
              styles.profileText,
              preferences.profile === 'SHORTEST' && styles.profileTextActive,
            ]}
          >
            SHORTEST
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.profileChip,
            preferences.profile === 'SCENIC' && styles.profileChipActive,
          ]}
          onPress={() => setProfile('SCENIC')}
        >
          <Ionicons
            name="trail-sign"
            size={14}
            color={preferences.profile === 'SCENIC' ? '#06B6D4' : '#94A3B8'}
          />
          <Text
            style={[
              styles.profileText,
              preferences.profile === 'SCENIC' && styles.profileTextActive,
            ]}
          >
            SCENIC GHATS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Avoidances Toggles */}
      <View style={styles.togglesRow}>
        <TouchableOpacity
          style={[
            styles.toggleChip,
            preferences.motorcycleFriendly && styles.toggleChipActive,
          ]}
          onPress={toggleMotorcycleFriendly}
        >
          <Ionicons
            name="bicycle"
            size={12}
            color={preferences.motorcycleFriendly ? '#10B981' : '#64748B'}
          />
          <Text
            style={[
              styles.toggleText,
              preferences.motorcycleFriendly && styles.toggleTextActive,
            ]}
          >
            🏍️ Moto-Friendly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleChip,
            preferences.avoidTolls && styles.toggleChipActive,
          ]}
          onPress={toggleAvoidTolls}
        >
          <Text
            style={[
              styles.toggleText,
              preferences.avoidTolls && styles.toggleTextActive,
            ]}
          >
            🚫 Avoid Tolls
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleChip,
            preferences.avoidHighways && styles.toggleChipActive,
          ]}
          onPress={toggleAvoidHighways}
        >
          <Text
            style={[
              styles.toggleText,
              preferences.avoidHighways && styles.toggleTextActive,
            ]}
          >
            🛣️ Avoid Highways
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 8,
  },
  profileChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1120',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 6,
  },
  profileChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: '#06B6D4',
  },
  profileText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  profileTextActive: {
    color: '#06B6D4',
  },
  togglesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 4,
  },
  toggleChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  toggleText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#10B981',
  },
});
