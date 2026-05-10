import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHvacStore } from '../../store/useHvacStore';
import { AIPanel } from '../../components/AIPanel';
import { SensorRow } from '../../components/SensorRow';
import { TrendChart } from '../../components/TrendChart';
import { UNIT_LOCATION } from '../../components/UnitCard';
import { AssistantAvatar } from '../../components/AssistantAvatar';
import { MetricTile } from '../../components/MetricTile';
import { C, S } from '../../components/theme';
import type { SensorRow as SensorRowType } from '../../utils/anomalyEngine';

const SENSOR_COLS = ['temp', 'pressure', 'airflow', 'vibration', 'power'];

function extractValues(col: string, readings: SensorRowType[]): number[] {
  return readings
    .map((r) => r[col])
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
}

const STATUS_HERO: Record<string, { title: string; sub: string }> = {
  CRITICAL: {
    title: 'CRITICAL — ESCALATING FAILURE',
    sub: 'Immediate attention required to prevent cascading unit failure.',
  },
  WARN: {
    title: 'WARNING — MONITOR CLOSELY',
    sub: 'Anomalous readings detected. Inspect before next shift.',
  },
  OK: {
    title: 'ALL SYSTEMS NOMINAL',
    sub: 'No anomalies detected in the last 20 readings.',
  },
};

export default function UnitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { anomalyResults, insights, insightLoading, resolvedUnits, fetchInsight, markResolved, markUnresolved } =
    useHvacStore();
  const { top, bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [modalVisible, setModalVisible] = useState(false);
  const [note, setNote] = useState('');

  const score = anomalyResults.find((r) => r.unitId === id);
  const isResolved = resolvedUnits.includes(id ?? '');
  const insight = id ? insights[id] ?? null : null;
  const loading = id ? insightLoading[id] ?? false : false;

  useEffect(() => {
    if (id && score && score.priority !== 'OK') fetchInsight(id);
  }, [id, score]);

  if (!score) {
    return (
      <View style={[styles.root, { paddingTop: top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.onSurface} />
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Unit not found</Text>
        </View>
      </View>
    );
  }

  const { unitId, priority, flagged, last20Readings, trendDirection, anomalyDurationReadings, combinedZ } = score;
  const heroText = STATUS_HERO[isResolved ? 'OK' : priority] ?? STATUS_HERO.OK;
  const primarySensor = flagged[0] ?? 'temp';
  const chartValues = extractValues(primarySensor, last20Readings);
  const chartColor = priority === 'CRITICAL' ? C.error : priority === 'WARN' ? C.warn : C.ok;
  const chartWidth = width - S.marginX * 2 - S.paddingCard * 2;

  const handleMarkInspected = () => {
    setModalVisible(true);
  };

  const confirmResolved = () => {
    if (id) markResolved(id, note.trim() || `Inspected at ${UNIT_LOCATION[id] ?? 'unit'}`);
    setModalVisible(false);
    setNote('');
    router.back();
  };

  const handleEscalate = () => {
    Alert.alert(
      'Escalate to Supervisor',
      `Escalating ${unitId} (${priority}) to shift supervisor.\nCombined anomaly score: ${combinedZ.toFixed(1)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Escalate',
          style: 'destructive',
          onPress: () => Alert.alert('Escalated', 'Supervisor has been notified.'),
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{unitId.replace('_', ' ')}</Text>
        <View
          style={[
            styles.priorityBadge,
            {
              backgroundColor:
                isResolved ? C.ok : priority === 'CRITICAL' ? C.error : priority === 'WARN' ? C.warn : C.ok,
            },
          ]}
        >
          <Text style={styles.priorityBadgeText}>
            {isResolved ? 'RESOLVED' : priority}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {!isResolved && priority !== 'OK' && (
          <AssistantAvatar
            critical={priority === 'CRITICAL' ? 1 : 0}
            warn={priority === 'WARN' ? 1 : 0}
            compact
          />
        )}

        {/* Status Hero */}
        <View
          style={[
            styles.hero,
            {
              borderBottomColor:
                isResolved ? C.ok : priority === 'CRITICAL' ? C.error : priority === 'WARN' ? C.warn : C.ok,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <MaterialCommunityIcons
              name={isResolved ? 'check-circle' : priority === 'CRITICAL' ? 'alert' : priority === 'WARN' ? 'alert-circle-outline' : 'check-circle'}
              size={20}
              color={isResolved ? C.ok : priority === 'CRITICAL' ? C.error : C.warn}
            />
            <Text style={styles.heroLabel}>SYSTEM STATUS</Text>
          </View>
          <Text
            style={[
              styles.heroTitle,
              {
                color:
                  isResolved ? C.ok : priority === 'CRITICAL' ? C.error : priority === 'WARN' ? C.warn : C.ok,
              },
            ]}
          >
            {heroText.title}
          </Text>
          <Text style={styles.heroSub}>{heroText.sub}</Text>
          {!isResolved && priority !== 'OK' && (
            <View style={styles.heroMeta}>
              <MetricTile
                icon="radar"
                label="Score"
                value={combinedZ.toFixed(1)}
                color={chartColor}
              />
              <MetricTile
                icon="timer-outline"
                label="Duration"
                value={`~${anomalyDurationReadings * 5}m`}
                color={C.cyan}
              />
              <MetricTile
                icon="trending-up"
                label="Trend"
                value={trendDirection}
                color={C.warn}
              />
            </View>
          )}
        </View>

        {/* AI Insight */}
        {(insight || loading) && !isResolved && (
          <View style={styles.card}>
            <AIPanel insight={insight} loading={loading} compact={false} />
          </View>
        )}

        {/* Sensors Grid */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>TRIGGERED SENSORS</Text>
          {SENSOR_COLS.filter((col) =>
            last20Readings.some((r) => r[col] != null)
          ).map((col) => (
            <SensorRow
              key={col}
              col={col}
              values={extractValues(col, last20Readings)}
              flagged={flagged.includes(col)}
            />
          ))}
        </View>

        {/* Trend Chart */}
        {chartValues.length > 1 && (
          <View style={styles.card}>
            <TrendChart
              values={chartValues}
              label={primarySensor}
              color={chartColor}
              width={chartWidth}
              height={160}
            />
          </View>
        )}

        {/* Cost Impact (CRITICAL only) */}
        {priority === 'CRITICAL' && !isResolved && (
          <View style={styles.costCard}>
            <MaterialCommunityIcons name="currency-usd" size={18} color={C.error} />
            <View style={styles.costBody}>
              <Text style={styles.costTitle}>POTENTIAL DOWNTIME COST</Text>
              <Text style={styles.costValue}>$5,000 – $15,000 / hr</Text>
              <Text style={styles.costSub}>
                Based on industry average for unplanned HVAC failure in manufacturing.
              </Text>
            </View>
          </View>
        )}

        {/* Location */}
        <View style={styles.locationCard}>
          <MaterialCommunityIcons name="map-marker-outline" size={18} color={C.secondaryContainer} />
          <View>
            <Text style={styles.locationLabel}>LOCATION</Text>
            <Text style={styles.locationValue}>{UNIT_LOCATION[unitId] ?? '—'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      {!isResolved && (
        <View style={[styles.actions, { paddingBottom: bottom + 8 }]}>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleMarkInspected} activeOpacity={0.85}>
            <MaterialCommunityIcons name="check-circle-outline" size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>Mark as Inspected</Text>
          </TouchableOpacity>
          {priority !== 'OK' && (
            <TouchableOpacity style={styles.btnDanger} onPress={handleEscalate} activeOpacity={0.85}>
              <MaterialCommunityIcons name="bullhorn-outline" size={18} color={C.error} />
              <Text style={styles.btnDangerText}>Escalate</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isResolved && (
        <View style={[styles.actions, { paddingBottom: bottom + 8 }]}>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => id && markUnresolved(id)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="undo" size={18} color={C.onSurface} />
            <Text style={styles.btnSecondaryText}>Mark as Unresolved</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Resolution Note Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Inspection Note</Text>
            <Text style={styles.modalSub}>
              Optional — describe what you found. This builds institutional knowledge for your team.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Loose belt on motor, tightened. Vibration reduced."
              placeholderTextColor={C.outlineVariant}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => { setModalVisible(false); setNote(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmResolved}>
                <Text style={styles.modalConfirmText}>Confirm Resolved</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.marginX,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
    gap: 12,
    shadowColor: C.secondaryContainer,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: C.ink, flex: 1 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  priorityBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  scroll: { paddingHorizontal: S.marginX, paddingTop: S.stackMd, gap: S.stackMd },
  hero: {
    backgroundColor: C.darkPanel,
    borderRadius: S.radius,
    padding: S.paddingCard,
    borderBottomWidth: 4,
    gap: 6,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: C.onPrimaryContainer,
    textTransform: 'uppercase',
  },
  heroTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  heroSub: { fontSize: 13, color: C.onPrimaryContainer, lineHeight: 19 },
  heroMeta: { flexDirection: 'row', gap: S.stackMd, marginTop: 4, flexWrap: 'wrap' },
  card: {
    backgroundColor: C.surface,
    borderRadius: S.radius,
    padding: S.paddingCard,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    gap: S.stackSm,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  costCard: {
    backgroundColor: C.errorContainer,
    borderRadius: S.radius,
    padding: S.paddingCard,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: `${C.error}33`,
  },
  costBody: { flex: 1, gap: 3 },
  costTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: C.error,
    textTransform: 'uppercase',
  },
  costValue: { fontSize: 20, fontWeight: '800', color: C.error },
  costSub: { fontSize: 12, color: C.onErrorContainer, lineHeight: 17 },
  locationCard: {
    backgroundColor: C.surface,
    borderRadius: S.radius,
    padding: S.paddingCard,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  locationValue: { fontSize: 15, fontWeight: '600', color: C.onSurface, marginTop: 2 },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
    paddingHorizontal: S.marginX,
    paddingTop: 12,
    flexDirection: 'row',
    gap: S.gutter,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: C.secondaryContainer,
    borderRadius: S.radiusSm,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnDanger: {
    flex: 1,
    borderWidth: 2,
    borderColor: C.error,
    borderRadius: S.radiusSm,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnDangerText: { color: C.error, fontSize: 14, fontWeight: '600' },
  btnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: S.radiusSm,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSecondaryText: { color: C.onSurface, fontSize: 14, fontWeight: '500' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, color: C.onSurfaceVariant },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: S.stackLg,
    gap: S.stackMd,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.onSurface },
  modalSub: { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 19 },
  modalInput: {
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: S.radiusSm,
    padding: 12,
    fontSize: 14,
    color: C.onSurface,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: S.gutter },
  modalCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: S.radiusSm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, color: C.onSurface },
  modalConfirm: {
    flex: 2,
    backgroundColor: C.secondaryContainer,
    borderRadius: S.radiusSm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
