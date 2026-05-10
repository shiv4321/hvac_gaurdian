import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C, S } from './theme';

interface Props {
  critical: number;
  warn: number;
  compact?: boolean;
}

export function AssistantAvatar({ critical, warn, compact }: Props) {
  const pulse = useRef(new Animated.Value(0.85)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const hasRisk = critical + warn > 0;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: hasRisk ? 1.18 : 1.04, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.85, duration: 1100, useNativeDriver: true }),
      ])
    );
    const sweepLoop = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 3600, useNativeDriver: true })
    );
    pulseLoop.start();
    sweepLoop.start();
    return () => {
      pulseLoop.stop();
      sweepLoop.stop();
    };
  }, [hasRisk, pulse, sweep]);

  const rotate = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const moodColor = critical > 0 ? C.error : warn > 0 ? C.warn : C.ok;
  const message =
    critical > 0
      ? `${critical} critical unit${critical > 1 ? 's' : ''} need action`
      : warn > 0
      ? `${warn} warning${warn > 1 ? 's' : ''} under watch`
      : 'All units are stable';

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <View style={styles.avatarWrap}>
        <Animated.View
          style={[
            styles.radarRing,
            { borderColor: moodColor, transform: [{ scale: pulse }] },
          ]}
        />
        <Animated.View style={[styles.sweep, { transform: [{ rotate }] }]} />
        <View style={[styles.avatar, { borderColor: moodColor }]}>
          <MaterialCommunityIcons name="robot-industrial" size={compact ? 23 : 30} color={C.onPrimary} />
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={styles.kicker}>AI WATCH</Text>
        <Text style={styles.message}>{message}</Text>
        {!compact && (
          <Text style={styles.sub}>
            Live anomaly scoring, sensor drift, and maintenance context are being monitored.
          </Text>
        )}
      </View>
      <View style={[styles.statusDot, { backgroundColor: moodColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 116,
    backgroundColor: C.darkPanel,
    borderRadius: S.radius,
    padding: S.paddingCard,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
    shadowColor: C.secondaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 5,
  },
  compactCard: { minHeight: 84, padding: 12 },
  avatarWrap: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRing: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    opacity: 0.34,
  },
  sweep: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderTopWidth: 2,
    borderTopColor: C.secondaryContainer,
    opacity: 0.7,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.secondaryContainer,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 3 },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: C.onPrimaryContainer,
  },
  message: { fontSize: 17, fontWeight: '800', color: C.onPrimary, lineHeight: 22 },
  sub: { fontSize: 12, color: '#b8bfd8', lineHeight: 17 },
  statusDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 9,
    height: 9,
    borderRadius: 5,
  },
});
