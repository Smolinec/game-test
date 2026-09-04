import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatNumber } from '../engine/format';
import { UpgradeDef } from '../engine/types';
import { colors, radius, spacing } from './theme';

interface Props {
  def: UpgradeDef;
  affordable: boolean;
  onBuy: () => void;
}

export const UpgradeRow = React.memo(function UpgradeRow({ def, affordable, onBuy }: Props) {
  return (
    <Pressable
      onPress={onBuy}
      disabled={!affordable}
      style={({ pressed }) => [styles.row, !affordable && styles.rowDisabled, pressed && affordable && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Koupit vylepšení ${def.name}`}
    >
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{def.icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{def.name}</Text>
        <Text style={styles.description}>{def.description}</Text>
      </View>
      <View style={[styles.price, !affordable && styles.priceDisabled]}>
        <Text style={[styles.priceText, !affordable && styles.priceTextDisabled]}>💎 {formatNumber(def.cost)}</Text>
      </View>
    </Pressable>
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  price: {
    backgroundColor: colors.success,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  priceDisabled: {
    backgroundColor: colors.disabled,
  },
  priceText: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 13,
  },
  priceTextDisabled: {
    color: colors.muted,
  },
});
