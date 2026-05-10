import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { C } from './theme';
import type { Priority } from '../utils/anomalyEngine';

const CONFIG: Record<Priority, { bg: string; text: string; label: string }> = {
  CRITICAL: { bg: C.error, text: '#fff', label: 'CRITICAL' },
  WARN: { bg: C.warn, text: '#fff', label: 'WARN' },
  OK: { bg: C.ok, text: '#fff', label: 'OK' },
};

export function StatusBadge({ priority }: { priority: Priority }) {
  const pulse = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (priority !== 'CRITICAL') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [priority]);

  const { bg, text, label } = CONFIG[priority];

  return (
    <View style={styles.wrapper}>
      {priority === 'CRITICAL' && (
        <Animated.View
          style={[styles.ring, { borderColor: C.error, transform: [{ scale: pulse }] }]}
        />
      )}
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.label, { color: text }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 60,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    opacity: 0.4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
});
