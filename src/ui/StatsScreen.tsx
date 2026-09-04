import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { OFFLINE_CAP_SECONDS, OFFLINE_EFFICIENCY } from '../engine/data';
import { clickValue, productionPerSecond } from '../engine/engine';
import { formatDuration, formatNumber, formatWhole } from '../engine/format';
import { GameState } from '../engine/types';
import { Header } from './Header';
import { colors, radius, spacing } from './theme';

interface Props {
  state: GameState;
  onReset: () => void;
}

export function StatsScreen({ state, onReset }: Props) {
  const totalGenerators = Object.values(state.generators).reduce((a, b) => a + b, 0);

  const confirmReset = () => {
    Alert.alert('Smazat celý postup?', 'Tohle smaže úplně všechno včetně hvězdného prachu. Nejde to vrátit.', [
      { text: 'Zrušit', style: 'cancel' },
      { text: 'Smazat', style: 'destructive', onPress: onReset },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header crystals={state.crystals} perSecond={productionPerSecond(state)} stardust={state.stardust} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>📊 Statistiky</Text>
        <View style={styles.card}>
          <Stat label="Krystaly celkem" value={`💎 ${formatWhole(state.allTimeCrystals)}`} />
          <Stat label="Krystaly v tomto běhu" value={`💎 ${formatWhole(state.runCrystals)}`} />
          <Stat label="Produkce" value={`${formatNumber(productionPerSecond(state), { decimals: 1 })} / s`} />
          <Stat label="Hodnota klepnutí" value={`💎 ${formatNumber(clickValue(state), { decimals: 1 })}`} />
          <Stat label="Počet klepnutí" value={formatWhole(state.clicks)} />
          <Stat label="Zařízení celkem" value={formatWhole(totalGenerators)} />
          <Stat label="Zakoupená vylepšení" value={String(state.upgrades.length)} />
          <Stat label="Hvězdný prach" value={`✨ ${formatWhole(state.stardust)}`} />
          <Stat label="Odehráno" value={formatDuration(state.playTimeSeconds)} />
        </View>

        <Text style={styles.heading}>ℹ️ Jak to funguje</Text>
        <View style={styles.card}>
          <Text style={styles.info}>
            • Klepáním na krystal těžíš ručně. Zařízení těží samy, i když hru nemáš otevřenou.
          </Text>
          <Text style={styles.info}>
            • Offline těžba běží na {Math.round(OFFLINE_EFFICIENCY * 100)} % výkonu a počítá se nejvýše{' '}
            {formatDuration(OFFLINE_CAP_SECONDS)}.
          </Text>
          <Text style={styles.info}>• Hra se ukládá automaticky každých pár sekund a při zavření aplikace.</Text>
          <Text style={styles.info}>• Prestiž ti dá trvalý bonus výměnou za restart běhu.</Text>
        </View>

        <Pressable
          onPress={confirmReset}
          accessibilityRole="button"
          style={({ pressed }) => [styles.resetButton, pressed && styles.resetPressed]}
        >
          <Text style={styles.resetText}>Smazat postup</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
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
    paddingHorizontal: spacing.lg,
  },
  heading: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 14,
  },
  statValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  resetButton: {
    marginTop: spacing.xl,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  resetPressed: {
    backgroundColor: 'rgba(255,107,107,0.15)',
  },
  resetText: {
    color: colors.danger,
    fontWeight: '700',
  },
});
