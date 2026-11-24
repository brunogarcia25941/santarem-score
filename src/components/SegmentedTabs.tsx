import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { brand, getTheme } from '@/constants/theme';

export interface SegmentedTab<T extends string> {
  id: T;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

/** Separadores de largura igual, num contentor arredondado (o selecionado fica a verde). */
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  const t = getTheme(useColorScheme() === 'dark');
  return (
    <View style={[styles.wrap, { backgroundColor: t.surface, borderColor: t.border }]}>
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, selected && { backgroundColor: brand.forest }]}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync();
              onChange(tab.id);
            }}
          >
            <Ionicons name={tab.icon} size={16} color={selected ? '#ffffff' : t.textMuted} />
            <Text style={[styles.label, { color: selected ? '#ffffff' : t.textMuted }]} numberOfLines={1}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 16, gap: 2 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 8, borderRadius: 11 },
  label: { fontSize: 11.5, fontWeight: '700' },
});
