import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useT } from '../i18n';
import { colors, radius, spacing } from './theme';

export type BuyAmount = 1 | 10 | 100 | 'max';

export const BUY_AMOUNTS: BuyAmount[] = [1, 10, 100, 'max'];

interface Props {
  value: BuyAmount;
  onChange: (value: BuyAmount) => void;
}

export function AmountSelector({ value, onChange }: Props) {
  const { t } = useT();
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('buy.label')}</Text>
      <View style={styles.group}>
        {BUY_AMOUNTS.map((amount) => {
          const active = amount === value;
          return (
            <Pressable
              key={String(amount)}
              onPress={() => onChange(amount)}
              style={[styles.pill, active && styles.pillActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {amount === 'max' ? t('buy.max') : `×${amount}`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  group: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 3,
    gap: 3,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  pillActive: {
    backgroundColor: colors.accent,
  },
  pillText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 13,
  },
  pillTextActive: {
    color: colors.text,
  },
});
