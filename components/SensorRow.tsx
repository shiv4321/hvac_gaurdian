import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Sparkline } from './Sparkline';
import { C, S } from './theme';

const SENSOR_META: Record<string, { label: string; icon: string; unit: string; decimals: number }> = {
  temp: { label: 'Temperature', icon: 'thermometer', unit: '°C', decimals: 1 },
  pressure: { label: 'Pressure', icon: 'gauge', unit: ' bar', decimals: 3 },
  airflow: { label: 'Airflow', icon: 'weather-windy', unit: ' CFM', decimals: 0 },
  vibration: { label: 'Vibration', icon: 'vibrate', unit: ' g', decimals: 4 },
  power: { label: 'Power Draw', icon: 'lightning-bolt', unit: ' kW', decimals: 2 },
};

interface Props {
  col: string;
  values: number[];
  flagged: boolean;
}

export function SensorRow({ col, values, flagged }: Props) {
  const meta = SENSOR_META[col] ?? { label: col, icon: 'chart-line', unit: '', decimals: 2 };
  const latest = values.at(-1);
  const color = flagged ? C.error : C.ok;

  return (
    <View
      style={[
        styles.row,
        {
          borderColor: flagged ? `${C.error}44` : C.outlineVariant,
          backgroundColor: flagged ? C.errorSoft : C.surfaceContainerLow,
        },
      ]}
    >
      <View style={styles.left}>
        <MaterialCommunityIcons name={meta.icon as any} size={20} color={color} />
        <View>
          <Text style={styles.name}>{meta.label}</Text>
          {latest != null && (
            <Text style={[styles.value, { color }]}>
              {latest.toFixed(meta.decimals)}{meta.unit}
            </Text>
          )}
        </View>
      </View>
      <Sparkline values={values} color={`${color}CC`} width={72} height={28} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: S.radiusSm,
    borderWidth: 1,
    marginBottom: S.stackSm,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 13, fontWeight: '600', color: C.onSurface },
  value: { fontSize: 10, fontWeight: '600', marginTop: 2 },
});
