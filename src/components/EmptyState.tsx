import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { brand, getTheme } from '@/constants/theme';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Versão mais baixa, para dentro de cartões e listas pequenas. */
  compact?: boolean;
}

/** Estado vazio com ícone num círculo, título, texto de apoio e (opcional) um botão. */
export function EmptyState({ icon, title, subtitle, actionLabel, onAction, compact }: EmptyStateProps) {
  const t = getTheme(useColorScheme() === 'dark');
  return (
    <View style={[styles.wrap, compact ? styles.wrapCompact : styles.wrapFull]}>
      <View style={[styles.circle, compact && styles.circleCompact]}>
        <Ionicons name={icon} size={compact ? 24 : 30} color={brand.forest} />
      </View>
      <Text style={[styles.title, { color: t.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: t.textMuted }]}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={styles.action}
          onPress={() => {
            Haptics.selectionAsync();
            onAction();
          }}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 24 },
  wrapFull: { paddingVertical: 56 },
  wrapCompact: { paddingVertical: 26 },
  circle: { width: 68, height: 68, borderRadius: 34, backgroundColor: brand.forestMuted, alignItems: 'center', justifyContent: 'center' },
  circleCompact: { width: 52, height: 52, borderRadius: 26 },
  title: { fontSize: 16, fontWeight: '800', marginTop: 14, textAlign: 'center' },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: 'center' },
  action: { marginTop: 18, backgroundColor: brand.forest, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 10 },
  actionText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
});
