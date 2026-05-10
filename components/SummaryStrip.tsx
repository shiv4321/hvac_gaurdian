import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C, S } from './theme';

interface Props {
  critical: number;
  warn: number;
  ok: number;
}

export function SummaryStrip({ critical, warn, ok }: Props) {
  const pulse = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (critical === 0) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.7, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.9, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [critical]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionLabel}>SYSTEM OVERVIEW</Text>
          <Text style={styles.title}>Fleet health snapshot</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
      <View style={styles.grid}>
        <View style={[styles.cell, { backgroundColor: C.errorSoft, borderColor: `${C.error}33` }]}>
          {critical > 0 && (
            <Animated.View
              style={[styles.ring, { borderColor: C.error, transform: [{ scale: pulse }] }]}
            />
          )}
          <MaterialCommunityIcons name="alert-octagon" size={18} color={C.error} />
          <Text style={[styles.count, { color: C.error }]}>{critical}</Text>
          <Text style={styles.cellLabel}>CRITICAL</Text>
        </View>
        <View style={[styles.cell, { backgroundColor: C.warnBg, borderColor: `${C.warn}44` }]}>
          <MaterialCommunityIcons name="alert-outline" size={18} color={C.warn} />
          <Text style={[styles.count, { color: C.onTertiaryFixedVariant }]}>{warn}</Text>
          <Text style={styles.cellLabel}>WARNING</Text>
        </View>
        <View style={[styles.cell, { backgroundColor: C.okBg, borderColor: `${C.ok}33` }]}>
          <MaterialCommunityIcons name="check-decagram" size={18} color={C.ok} />
          <Text style={[styles.count, { color: C.ok }]}>{ok}</Text>
          <Text style={styles.cellLabel}>NORMAL</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: S.radius,
    padding: S.paddingCard,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: C.mutedInk,
    textTransform: 'uppercase',
  },
  title: { fontSize: 18, fontWeight: '900', color: C.ink, marginTop: 4 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.okBg,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.ok },
  liveText: { fontSize: 10, fontWeight: '900', color: C.ok },
  grid: { flexDirection: 'row', gap: S.gutter, marginTop: S.stackMd },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: S.radiusSm,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
  },
  ring: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: S.radiusSm,
    borderWidth: 2,
    opacity: 0.3,
  },
  count: { fontSize: 25, fontWeight: '900', marginTop: 4 },
  cellLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.onSurfaceVariant,
    marginTop: 4,
    letterSpacing: 0.7,
  },
});
