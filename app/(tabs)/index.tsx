import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHvacStore } from '../../store/useHvacStore';
import { SummaryStrip } from '../../components/SummaryStrip';
import { UnitCard } from '../../components/UnitCard';
import { AssistantAvatar } from '../../components/AssistantAvatar';
import { CommandHeader } from '../../components/CommandHeader';
import { C, S } from '../../components/theme';

export default function DashboardScreen() {
  const { anomalyResults, insights, insightLoading, resolvedUnits, lastRefreshed, fetchInsight } =
    useHvacStore();
  const { top } = useSafeAreaInsets();

  useEffect(() => {
    anomalyResults
      .filter((r) => r.priority !== 'OK')
      .forEach((r) => fetchInsight(r.unitId));
  }, [anomalyResults]);

  const critical = anomalyResults.filter(
    (r) => r.priority === 'CRITICAL' && !resolvedUnits.includes(r.unitId)
  ).length;
  const warn = anomalyResults.filter(
    (r) => r.priority === 'WARN' && !resolvedUnits.includes(r.unitId)
  ).length;
  const ok = anomalyResults.filter(
    (r) => r.priority === 'OK' || resolvedUnits.includes(r.unitId)
  ).length;

  const refreshed = lastRefreshed
    ? lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <CommandHeader
        title="HVAC Guardian"
        subtitle="Command dashboard"
        icon="hexagon-outline"
        right={
          <View style={styles.headerRight}>
          <Text style={styles.shiftText}>Morning Shift</Text>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account-hard-hat" size={18} color={C.onSurfaceVariant} />
          </View>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              anomalyResults
                .filter((r) => r.priority !== 'OK')
                .forEach((r) => fetchInsight(r.unitId));
            }}
            tintColor={C.secondaryContainer}
          />
        }
      >
        <AssistantAvatar critical={critical} warn={warn} />
        <SummaryStrip critical={critical} warn={warn} ok={ok} />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionLabel}>UNITS SORTED BY SEVERITY</Text>
            <Text style={styles.sectionTitle}>Priority work queue</Text>
          </View>
          <TouchableOpacity style={styles.refreshedBadge}>
            <MaterialCommunityIcons name="clock-outline" size={11} color={C.outline} />
            <Text style={styles.refreshedText}>Updated {refreshed}</Text>
          </TouchableOpacity>
        </View>

        {anomalyResults.map((score) => (
          <UnitCard
            key={score.unitId}
            score={score}
            insight={insights[score.unitId] ?? null}
            insightLoading={insightLoading[score.unitId] ?? false}
            resolved={resolvedUnits.includes(score.unitId)}
          />
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shiftText: { fontSize: 12, fontWeight: '600', color: C.onSurfaceVariant },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  scroll: {
    paddingHorizontal: S.marginX,
    paddingTop: S.stackLg,
    gap: S.stackMd,
    paddingBottom: S.stackLg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: S.stackSm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: C.mutedInk,
    textTransform: 'uppercase',
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: C.ink, marginTop: 3 },
  refreshedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshedText: { fontSize: 11, color: C.outline },
});
