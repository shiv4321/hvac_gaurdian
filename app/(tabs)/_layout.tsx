import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../../components/theme';

function BottomNav() {
  const router = useRouter();
  const path = usePathname();
  const { bottom } = useSafeAreaInsets();

  const tabs = [
    { icon: 'view-grid', label: 'Dashboard', route: '/' },
    { icon: 'bell', label: 'Alerts', route: '/alerts' },
    { icon: 'history', label: 'History', route: '/history' },
  ] as const;

  return (
    <View style={[styles.nav, { paddingBottom: bottom + 8 }]}>
      {tabs.map((tab) => {
        const active =
          tab.route === '/'
            ? path === '/' || path === '/index'
            : path.startsWith(tab.route);
        return (
          <TouchableOpacity
            key={tab.route}
            style={styles.navItem}
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.7}
          >
            {active ? (
              <View style={styles.activeCircle}>
                <MaterialCommunityIcons name={tab.icon as any} size={22} color="#fff" />
              </View>
            ) : (
              <MaterialCommunityIcons name={tab.icon as any} size={22} color="#64748b" />
            )}
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={() => <BottomNav />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="alerts" />
      <Tabs.Screen name="history" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  nav: {
    backgroundColor: C.darkPanel2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: C.secondaryContainer,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 10,
  },
  navItem: { alignItems: 'center', gap: 4, flex: 1 },
  activeCircle: {
    backgroundColor: C.secondaryContainer,
    borderRadius: 999,
    padding: 10,
    shadowColor: C.secondaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  navLabel: { fontSize: 10, color: '#64748b', fontWeight: '500' },
  navLabelActive: { color: '#fff' },
});
