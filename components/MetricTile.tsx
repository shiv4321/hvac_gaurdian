import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C, S } from './theme';

interface Props {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  color: string;
  sub?: string;
}

export function MetricTile({ icon, label, value, color, sub }: Props) {
  return (
    <View style={[styles.tile, { borderColor: `${color}44` }]}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]} numberOfLines={1}>
        {value}
      </Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 96,
    backgroundColor: C.surface,
    borderRadius: S.radiusSm,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: C.mutedInk,
    textTransform: 'uppercase',
  },
  value: { fontSize: 19, fontWeight: '900' },
  sub: { fontSize: 11, color: C.mutedInk },
});
