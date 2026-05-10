import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHvacStore } from '../../store/useHvacStore';
import { UnitCard } from '../../components/UnitCard';
import { AssistantAvatar } from '../../components/AssistantAvatar';
import { CommandHeader } from '../../components/CommandHeader';
import { C, S } from '../../components/theme';

export default function AlertsScreen() {
  const { anomalyResults, insights, insightLoading, resolvedUnits, fetchInsight } = useHvacStore();
  const { top } = useSafeAreaInsets();

  const openAlerts = anomalyResults.filter(
    (r) => r.priority !== 'OK' && !resolvedUnits.includes(r.unitId)
  );

  useEffect(() => {
    openAlerts.forEach((r) => fetchInsight(r.unitId));
  }, [anomalyResults]);

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <CommandHeader
        title="Open Alerts"
        subtitle="Active maintenance queue"
        icon="bell-alert-outline"
        right={openAlerts.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{openAlerts.length}</Text>
          </View>
        )}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {openAlerts.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="check-circle-outline" size={48} color={C.ok} />
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptySubtitle}>No open alerts right now.</Text>
          </View>
        ) : (
          <>
            <AssistantAvatar
              critical={openAlerts.filter((r) => r.priority === 'CRITICAL').length}
              warn={openAlerts.filter((r) => r.priority === 'WARN').length}
              compact
            />
            <Text style={styles.sectionLabel}>
              {openAlerts.length} UNIT{openAlerts.length > 1 ? 'S' : ''} NEED ATTENTION
            </Text>
            {openAlerts.map((score) => (
              <UnitCard
                key={score.unitId}
                score={score}
                insight={insights[score.unitId] ?? null}
                insightLoading={insightLoading[score.unitId] ?? false}
                resolved={false}
              />
            ))}
          </>
        )}
        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  countBadge: {
    backgroundColor: C.error,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  scroll: { paddingHorizontal: S.marginX, paddingTop: S.stackLg, gap: S.stackMd },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: C.mutedInk,
    textTransform: 'uppercase',
    marginBottom: S.stackSm,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.ok },
  emptySubtitle: { fontSize: 14, color: C.onSurfaceVariant },
});
