import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatRate, formatWhole } from '../engine/format';
import { useT } from '../i18n';
import { AnimatedNumber } from './AnimatedNumber';
import { colors, radius, spacing } from './theme';

interface Props {
  crystals: number;
  perSecond: number;
  stardust: number;
}

export function Header({ crystals, perSecond, stardust }: Props) {
  const { t } = useT();
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{t('header.crystals')}</Text>
        {stardust > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✨ {formatWhole(stardust)}</Text>
          </View>
        )}
      </View>
      <AnimatedNumber
        value={crystals}
        format={(v) => `💎 ${formatWhole(v)}`}
        style={styles.value}
        numberOfLines={1}
        adjustsFontSizeToFit
      />
      <Text style={styles.rate}>{t('header.perSecond', { rate: formatRate(perSecond) })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  badge: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  value: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  rate: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
});
