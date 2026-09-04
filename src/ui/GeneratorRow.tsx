import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatNumber, formatRate } from '../engine/format';
import { GeneratorDef } from '../engine/types';
import { useT } from '../i18n';
import { colors, radius, spacing } from './theme';

interface Props {
  def: GeneratorDef;
  owned: number;
  production: number;
  /** Kolik jednotek se koupí při klepnutí (už vyřešené MAX). */
  buyCount: number;
  cost: number;
  affordable: boolean;
  onBuy: () => void;
}

export const GeneratorRow = React.memo(function GeneratorRow({
  def,
  owned,
  production,
  buyCount,
  cost,
  affordable,
  onBuy,
}: Props) {
  const { t, name, description } = useT();
  const title = name('generator', def);
  return (
    <View style={styles.row}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{def.icon}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.owned}>{owned}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {description('generator', def)}
        </Text>
        <Text style={styles.production}>
          {owned > 0
            ? t('header.perSecond', { rate: formatRate(production) })
            : t('generator.perUnit', { rate: formatRate(def.baseProduction) })}
        </Text>
      </View>
      <Pressable
        onPress={onBuy}
        disabled={!affordable}
        style={({ pressed }) => [
          styles.buyButton,
          !affordable && styles.buyButtonDisabled,
          pressed && affordable && styles.buyButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('buy.countLabel', { count: buyCount, name: title })}
      >
        <Text style={[styles.buyCount, !affordable && styles.buyTextDisabled]}>×{buyCount}</Text>
        <Text style={[styles.buyCost, !affordable && styles.buyTextDisabled]}>💎 {formatNumber(cost)}</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 26,
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  owned: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  production: {
    color: colors.gold,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  buyButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minWidth: 88,
  },
  buyButtonPressed: {
    backgroundColor: colors.accentDark,
  },
  buyButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  buyCount: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  buyCost: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  buyTextDisabled: {
    color: colors.muted,
  },
});
