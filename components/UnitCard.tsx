import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { C, S } from './theme';
import { AIPanel } from './AIPanel';
import { Sparkline } from './Sparkline';
import type { UnitScore } from '../utils/anomalyEngine';
import type { LLMInsight } from '../utils/llmService';

export const UNIT_LOCATION: Record<string, string> = {
  HVAC_1: 'Bay 3 · Floor 2',
  HVAC_2: 'Compressor Bay · Floor 1',
  HVAC_3: 'Duct Line C · Floor 3',
  HVAC_4: 'Roof Unit · Zone A',
  HVAC_5: 'Roof Unit · Zone B',
};

interface Props {
  score: UnitScore;
  insight: LLMInsight | null;
  insightLoading: boolean;
  resolved: boolean;
}

export function UnitCard({ score, insight, insightLoading, resolved }: Props) {
  const { unitId, priority, flagged, last20Readings } = score;
  const isOk = priority === 'OK' || resolved;
  const isCritical = priority === 'CRITICAL' && !resolved;
  const isWarn = priority === 'WARN' && !resolved;

  const latest = last20Readings.at(-1);
  const statusColor = isCritical ? C.error : isWarn ? C.warn : C.ok;
  const statusLabel = resolved ? 'INSPECTED' : isCritical ? 'CRITICAL' : isWarn ? 'WATCH' : 'NORMAL';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCritical && styles.criticalBorder,
        isWarn && styles.warnBorder,
        resolved && styles.dimmed,
      ]}
      activeOpacity={0.85}
      onPress={() => router.push(`/unit/${unitId}`)}
    >
      <View style={[styles.severityRail, { backgroundColor: statusColor }]} />
      <View style={styles.header}>
        <View>
          <Text style={styles.unitName}>{unitId.replace('_', ' ')}</Text>
          <Text style={styles.location}>{UNIT_LOCATION[unitId] ?? '—'}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${statusColor}18` }]}>
          <MaterialCommunityIcons
            name={(isOk || resolved) ? 'check-circle' : isCritical ? 'alert' : 'alert-circle-outline'}
            size={15}
            color={statusColor}
          />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {isOk && !resolved && (
        <View style={styles.okRow}>
          <Text style={styles.okText}>All systems normal</Text>
        </View>
      )}

      {resolved && (
        <View style={styles.okRow}>
          <MaterialCommunityIcons name="check-circle-outline" size={14} color={C.ok} />
          <Text style={styles.okText}>Marked as inspected</Text>
        </View>
      )}

      {!isOk && !resolved && latest && (
        <>
          <View style={styles.sensorGrid}>
            {(['temp', 'pressure', 'airflow', 'vibration'] as const)
              .filter((col) => latest[col] != null)
              .slice(0, 3)
              .map((col) => {
                const v = latest[col] as number;
                const hot = flagged.includes(col);
                const values = last20Readings
                  .map((r) => r[col])
                  .filter((item): item is number => typeof item === 'number' && !isNaN(item));
                return (
                  <View key={col} style={[styles.sensorCell, hot && styles.hotSensor]}>
                    <Text style={styles.sensorLabel}>{col.toUpperCase()}</Text>
                    <Text style={[styles.sensorValue, hot && { color: C.error }]} numberOfLines={1}>
                      {v.toFixed(col === 'vibration' ? 3 : 1)}
                    </Text>
                    <Sparkline values={values} color={hot ? C.error : C.cyan} width={58} height={20} />
                  </View>
                );
              })}
          </View>
          <AIPanel insight={insight} loading={insightLoading} compact />
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: S.radius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.outlineVariant,
    shadowColor: C.secondaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  criticalBorder: { borderColor: C.error },
  warnBorder: { borderColor: C.warn },
  dimmed: { opacity: 0.65 },
  severityRail: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, zIndex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: S.paddingCard,
    paddingBottom: S.stackSm,
  },
  unitName: { fontSize: 21, fontWeight: '900', color: C.ink },
  location: { fontSize: 13, color: C.onSurfaceVariant, marginTop: 2 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  okRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: S.paddingCard,
    paddingBottom: S.paddingCard,
  },
  okText: { fontSize: 13, color: C.ok, fontWeight: '500' },
  sensorGrid: {
    flexDirection: 'row',
    gap: S.gutter,
    paddingHorizontal: S.paddingCard,
    paddingBottom: S.paddingCard,
  },
  sensorCell: {
    flex: 1,
    backgroundColor: C.surfaceContainerLow,
    borderRadius: S.radiusXs,
    padding: 9,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  hotSensor: { backgroundColor: C.errorSoft, borderColor: `${C.error}33` },
  sensorLabel: { fontSize: 10, color: C.onSurfaceVariant, marginBottom: 2, fontWeight: '800' },
  sensorValue: { fontSize: 20, fontWeight: '900', color: C.onSurface },
});
