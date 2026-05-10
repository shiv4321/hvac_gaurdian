import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C, S } from './theme';
import type { LLMInsight } from '../utils/llmService';

interface Props {
  insight: LLMInsight | null;
  loading?: boolean;
  compact?: boolean;
}

export function AIPanel({ insight, loading, compact }: Props) {
  if (loading) {
    return (
      <View style={[styles.panel, compact && styles.compact, styles.loadingRow]}>
        <ActivityIndicator color={C.secondaryContainer} size="small" />
        <Text style={styles.loadingText}>Analyzing with AI…</Text>
      </View>
    );
  }

  if (!insight) return null;

  return (
    <View style={[styles.panel, compact && styles.compact]}>
      <View style={styles.headerRow}>
        <View style={styles.robotBadge}>
          <MaterialCommunityIcons name="robot-industrial" size={compact ? 13 : 15} color={C.onPrimary} />
        </View>
        <Text style={styles.headerLabel}>{compact ? 'AI TRIAGE' : 'AI ANALYSIS'}</Text>
      </View>
      <Text
        style={[styles.reason, compact && styles.reasonCompact]}
        numberOfLines={compact ? 2 : undefined}
      >
        {insight.reason}
      </Text>

      {!compact && (
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>PROBABLE CAUSE</Text>
            <Text style={styles.footerValue}>{insight.likelyCause}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>URGENCY</Text>
            <Text style={[styles.footerValue, { color: C.error }]}>
              {insight.urgency.replace(/-/g, ' ')}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>ACTION</Text>
            <Text style={styles.footerValue}>{insight.recommendedAction}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: C.darkPanel,
    borderLeftWidth: 4,
    borderLeftColor: C.secondaryContainer,
    padding: S.paddingCard,
    gap: S.stackSm,
  },
  compact: { padding: 12, gap: 6 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: C.onPrimaryContainer },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  robotBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: C.onPrimaryContainer,
    textTransform: 'uppercase',
  },
  reason: { fontSize: 15, lineHeight: 24, color: '#c8cce0' },
  reasonCompact: { fontSize: 13, lineHeight: 20 },
  footer: {
    backgroundColor: C.surface,
    borderRadius: S.radiusSm,
    padding: S.paddingCard,
    gap: S.stackSm,
    marginTop: 4,
  },
  footerItem: {},
  footerLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  footerValue: { fontSize: 13, fontWeight: '600', color: C.onSurface },
  divider: { height: 1, backgroundColor: C.outlineVariant, opacity: 0.5 },
});
