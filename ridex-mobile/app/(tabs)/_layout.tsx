import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Home, Compass, PlusCircle, Radio, User, Users, Bike } from 'lucide-react-native';
import { COLORS } from '@/theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary.DEFAULT,
        tabBarInactiveTintColor: COLORS.text.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size, focused }) => (
            <Compass size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: 'Host',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.createIconWrap, focused && styles.createIconWrapActive]}>
              <PlusCircle size={24} color={focused ? '#080A0F' : COLORS.primary.DEFAULT} strokeWidth={2.5} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: 'Squads',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabIconBox}>
              <Users size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabIconBox}>
              <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      {/* Auxiliary Hidden Tabs */}
      <Tabs.Screen
        name="ride"
        options={{
          href: null,
          title: 'Ride',
        }}
      />

      <Tabs.Screen
        name="garage"
        options={{
          href: null,
          title: 'Garage',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0E131D',
    borderTopColor: '#1A2234',
    borderTopWidth: 1.5,
    height: Platform.OS === 'ios' ? 88 : 66,
    paddingBottom: Platform.OS === 'ios' ? 26 : 8,
    paddingTop: 8,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  tabIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary.DEFAULT,
    marginTop: 2,
  },
  createIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderWidth: 1.5,
    borderColor: COLORS.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary.DEFAULT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  createIconWrapActive: {
    backgroundColor: COLORS.primary.DEFAULT,
  },
});
