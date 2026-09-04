import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from './theme';

/**
 * Blok „Účet“. Přihlášení přes Apple a Google zatím není napojené, tlačítka
 * jsou vidět, ale označená „Již brzy“, aby šlo vyzkoušet rozložení.
 */
export function AccountCard() {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>👤 Účet</Text>
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>JIŽ BRZY</Text>
        </View>
      </View>
      <Text style={styles.text}>
        Přihlášením si uložíš postup do cloudu a budeš moct pokračovat na jiném telefonu nebo v prohlížeči.
        Zatím se postup ukládá jen v tomto zařízení.
      </Text>
      <View style={styles.buttons}>
        <ProviderButton icon={Platform.OS === 'ios' ? '' : ''} label="Pokračovat přes Apple" />
        <ProviderButton icon="G" label="Pokračovat přes Google" />
      </View>
      <Text style={styles.footnote}>Účet a cloudové ukládání připravujeme.</Text>
    </View>
  );
}

function ProviderButton({ icon, label }: { icon: string; label: string }) {
  return (
    <Pressable
      disabled
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      accessibilityLabel={`${label} (již brzy)`}
      style={styles.providerButton}
    >
      <Text style={styles.providerIcon}>{icon}</Text>
      <Text style={styles.providerLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  soonBadge: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  soonText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  text: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  buttons: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    opacity: 0.55,
  },
  providerIcon: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    width: 20,
    textAlign: 'center',
  },
  providerLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  footnote: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
});
