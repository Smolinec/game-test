import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { UPGRADES } from '../engine/data';
import { availableUpgrades, productionPerSecond } from '../engine/engine';
import { GameState } from '../engine/types';
import { Header } from './Header';
import { colors, spacing } from './theme';
import { UpgradeRow } from './UpgradeRow';

interface Props {
  state: GameState;
  onBuy: (upgradeId: string) => void;
}

export function UpgradesScreen({ state, onBuy }: Props) {
  const available = availableUpgrades(state);
  return (
    <View style={styles.container}>
      <Header crystals={state.crystals} perSecond={productionPerSecond(state)} stardust={state.stardust} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Vylepšení</Text>
        <Text style={styles.subheading}>
          Zakoupeno {state.upgrades.length} z {UPGRADES.length}. Další se objeví, až budeš mít víc zařízení.
        </Text>
        {available.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔒</Text>
            <Text style={styles.emptyText}>Zatím žádné dostupné vylepšení. Kup víc zařízení nebo těž dál!</Text>
          </View>
        )}
        {available.map((def) => (
          <UpgradeRow key={def.id} def={def} affordable={state.crystals >= def.cost} onBuy={() => onBuy(def.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: spacing.xl,
  },
  heading: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  subheading: {
    color: colors.muted,
    fontSize: 13,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
  },
});
