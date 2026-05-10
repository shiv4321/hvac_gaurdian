import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHvacStore } from '../../store/useHvacStore';
import { UNIT_LOCATION } from '../../components/UnitCard';
import { CommandHeader } from '../../components/CommandHeader';
import { C, S } from '../../components/theme';
import type { Priority } from '../../utils/anomalyEngine';

type Filter = 'all' | 'critical' | 'resolved' | 'warn';

const FILTER_OPTIONS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warn', label: 'Warnings' },
  { key: 'resolved', label: 'Resolved' },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const PRIORITY_COLOR: Record<Priority, string> = {
  CRITICAL: C.error,
  WARN: C.warn,
  OK: C.ok,
};

export default function HistoryScreen() {
  const { anomalyResults, resolutionLog, resolvedUnits, lastRefreshed } = useHvacStore();
  const { top } = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');

  const openItems = anomalyResults
    .filter((r) => r.priority !== 'OK' && !resolvedUnits.includes(r.unitId))
    .map((r) => ({
      id: `open-${r.unitId}`,
      unitId: r.unitId,
      priority: r.priority,
      status: 'open' as const,
      time: lastRefreshed?.toISOString() ?? new Date().toISOString(),
      note: '',
    }));

  const resolvedItems = resolutionLog.map((entry, i) => ({
    id: `resolved-${i}`,
    unitId: entry.unitId,
    priority: entry.priority,
    status: 'resolved' as const,
    time: entry.resolvedAt,
    note: entry.note,
  }));

  const allItems = [...openItems, ...resolvedItems].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
  );

  const filtered = allItems.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'resolved') return item.status === 'resolved';
    if (filter === 'critical') return item.priority === 'CRITICAL';
    if (filter === 'warn') return item.priority === 'WARN';
    return true;
  });

  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach((item) => {
    const key = formatDate(item.time);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      <CommandHeader
        title="Alert History"
        subtitle={`${filtered.length} incident${filtered.length === 1 ? '' : 's'} in view`}
        icon="timeline-clock-outline"
        right={
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account-hard-hat" size={18} color={C.onSurfaceVariant} />
        </View>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {FILTER_OPTIONS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {Object.entries(grouped).map(([date, items]) => (
          <View key={date} style={styles.group}>
            <Text style={styles.dateLabel}>{date.toUpperCase()}</Text>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.row,
                  item.status === 'open' && item.priority === 'CRITICAL' && styles.criticalRow,
                  item.status === 'resolved' && styles.resolvedRow,
                ]}
                activeOpacity={0.8}
                onPress={() => router.push(`/unit/${item.unitId}`)}
              >
                {item.status === 'open' && item.priority === 'CRITICAL' && (
                  <View style={styles.leftAccent} />
                )}
                <View style={styles.dotCol}>
                  {item.status === 'resolved' ? (
                    <MaterialCommunityIcons name="check-circle" size={18} color={C.ok} />
                  ) : item.priority === 'CRITICAL' ? (
                    <View style={styles.pingDot}>
                      <View style={[styles.innerDot, { backgroundColor: C.error }]} />
                    </View>
                  ) : (
                    <MaterialCommunityIcons name="alert" size={18} color={C.warn} />
                  )}
                </View>
                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowTitle}>
                      {item.unitId.replace('_', ' ')}
                      {item.priority !== 'OK' ? ` — ${item.priority}` : ''}
                    </Text>
                    <Text style={styles.rowTime}>{formatTime(item.time)}</Text>
                  </View>
                  <Text style={styles.rowSub} numberOfLines={2}>
                    {item.status === 'resolved'
                      ? item.note || `Inspected at ${UNIT_LOCATION[item.unitId] ?? '—'}`
                      : `Active anomaly at ${UNIT_LOCATION[item.unitId] ?? '—'}`}
                  </Text>
                  <View style={styles.tagRow}>
                    <View
                      style={[
                        styles.tag,
                        {
                          backgroundColor:
                            item.priority === 'CRITICAL'
                              ? C.errorContainer
                              : item.priority === 'WARN'
                              ? C.warnBg
                              : C.okBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          { color: PRIORITY_COLOR[item.priority] },
                        ]}
                      >
                        {item.priority}
                      </Text>
                    </View>
                    <View style={[styles.tag, { backgroundColor: C.surfaceContainer }]}>
                      <Text style={[styles.tagText, { color: C.onSurfaceVariant }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="inbox-outline" size={44} color={C.outlineVariant} />
            <Text style={styles.emptyText}>No entries match this filter</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
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
  filterBar: { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: C.outlineVariant },
  filterBarContent: {
    paddingHorizontal: S.marginX,
    paddingVertical: 10,
    gap: S.gutter,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  chipActive: { backgroundColor: C.secondary, borderColor: C.secondary },
  chipText: { fontSize: 11, fontWeight: '800', color: C.onSurfaceVariant, letterSpacing: 0.5 },
  chipTextActive: { color: '#fff' },
  scroll: { paddingHorizontal: S.marginX, paddingTop: S.stackMd, gap: S.stackLg },
  group: { gap: S.stackSm },
  dateLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: C.outline,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  row: {
    backgroundColor: C.surface,
    borderRadius: S.radiusSm,
    padding: S.paddingCard,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: C.outlineVariant,
    position: 'relative',
    overflow: 'hidden',
  },
  criticalRow: { borderColor: C.error, backgroundColor: C.errorSoft },
  resolvedRow: { opacity: 0.8 },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: C.error,
  },
  dotCol: { marginTop: 2 },
  pingDot: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  innerDot: { width: 10, height: 10, borderRadius: 5 },
  rowBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: C.onSurface, flex: 1 },
  rowTime: { fontSize: 12, color: C.outline },
  rowSub: { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 19 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: C.onSurfaceVariant },
});
