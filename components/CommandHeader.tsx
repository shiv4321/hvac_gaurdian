import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C, S } from './theme';

interface Props {
  title: string;
  subtitle?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  right?: React.ReactNode;
}

export function CommandHeader({ title, subtitle, icon, right }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <View style={styles.mark}>
          <MaterialCommunityIcons name={icon} size={20} color={C.secondaryContainer} />
        </View>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: S.marginX,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
    shadowColor: C.secondaryContainer,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  title: { fontSize: 18, fontWeight: '800', color: C.ink },
  subtitle: { fontSize: 11, color: C.mutedInk, marginTop: 1, fontWeight: '600' },
});
