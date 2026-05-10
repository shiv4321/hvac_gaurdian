import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { C, S } from './theme';

interface Props {
  values: number[];
  label: string;
  color: string;
  width: number;
  height?: number;
}

export function TrendChart({ values, label, color, width, height = 160 }: Props) {
  if (values.length < 2) return null;

  const padLeft = 4;
  const padRight = 4;
  const padTop = 8;
  const padBottom = 8;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const thresholdVal = mean + (max - mean) * 0.4;

  const toX = (i: number) => padLeft + (i / (values.length - 1)) * chartW;
  const toY = (v: number) => padTop + (1 - (v - min) / range) * chartH;

  const pathD = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(' ');
  const areaD = `${pathD} L${toX(values.length - 1).toFixed(1)},${(padTop + chartH).toFixed(
    1
  )} L${padLeft.toFixed(1)},${(padTop + chartH).toFixed(1)} Z`;

  const thresholdY = toY(thresholdVal);
  const lastPt = { x: toX(values.length - 1), y: toY(values.at(-1)!) };

  return (
    <View>
      <Text style={styles.label}>{label.toUpperCase()} — LAST 20 READINGS</Text>
      <Svg width={width} height={height} style={{ marginTop: 4 }}>
        <Defs>
          <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.18" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <Line
            key={t}
            x1={padLeft}
            y1={padTop + t * chartH}
            x2={padLeft + chartW}
            y2={padTop + t * chartH}
            stroke={C.outlineVariant}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        ))}
        <Line
          x1={padLeft}
          y1={thresholdY}
          x2={padLeft + chartW}
          y2={thresholdY}
          stroke={C.error}
          strokeWidth={1}
          strokeDasharray="6,3"
          opacity={0.6}
        />
        <Path d={areaD} fill="url(#trendFill)" />
        <Path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={lastPt.x} cy={lastPt.y} r={5} fill={color} opacity={0.9} />
      </Svg>
      <View style={styles.axisRow}>
        <Text style={styles.axisLabel}>{min.toFixed(2)}</Text>
        <Text style={[styles.axisLabel, { color: C.error }]}>
          ▶ threshold {thresholdVal.toFixed(2)}
        </Text>
        <Text style={styles.axisLabel}>{max.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  axisLabel: { fontSize: 9, color: C.outline },
});
