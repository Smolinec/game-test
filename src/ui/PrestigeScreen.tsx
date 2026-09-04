import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PRESTIGE_BASE, STARDUST_BONUS } from '../engine/data';
import { canPrestige, crystalsForNextStardust, prestigeGain, productionPerSecond, stardustMultiplier } from '../engine/engine';
import { formatNumber, formatWhole } from '../engine/format';
import { GameState } from '../engine/types';
import { Header } from './Header';
import { colors, radius, spacing } from './theme';

interface Props {
  state: GameState;
  onPrestige: () => void;
}

export function PrestigeScreen({ state, onPrestige }: Props) {
  const gain = prestigeGain(state);
  const enabled = canPrestige(state);
  const nextAt = crystalsForNextStardust(state);
  const prevAt = gain * gain * PRESTIGE_BASE;
  const progress = Math.min(1, Math.max(0, (state.runCrystals - prevAt) / (nextAt - prevAt)));
  const bonusPercent = Math.round(STARDUST_BONUS * 100);

  const confirm = () => {
    Alert.alert(
      'Vypustit hvězdný prach?',
      `Získáš ✨ ${gain} hvězdného prachu (+${gain * bonusPercent} % k produkci navždy). ` +
        'Přijdeš o všechny krystaly, zařízení i vylepšení v tomto běhu.',
      [
        { text: 'Zrušit', style: 'cancel' },
        { text: 'Provést prestiž', style: 'destructive', onPress: onPrestige },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Header crystals={state.crystals} perSecond={productionPerSecond(state)} stardust={state.stardust} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>✨ Prestiž</Text>
        <Text style={styles.text}>
          Prestiž resetuje tvůj běh, ale za krystaly vytěžené v tomto běhu dostaneš hvězdný prach. Každý hvězdný
          prach navždy zvyšuje veškerou produkci i sílu klepnutí o {bonusPercent} %.
        </Text>

        <View style={styles.card}>
          <Stat label="Hvězdný prach" value={`✨ ${formatWhole(state.stardust)}`} />
          <Stat label="Aktuální bonus" value={`×${stardustMultiplier(state).toFixed(2).replace('.', ',')}`} />
          <Stat label="Počet prestiží" value={String(state.prestigeCount)} />
        </View>

        <View style={styles.card}>
          <Stat label="Krystaly v tomto běhu" value={`💎 ${formatWhole(state.runCrystals)}`} />
          <Stat label="Zisk při prestiži teď" value={`✨ ${gain}`} highlight={enabled} />
          <Stat label="Další prach při" value={`💎 ${formatNumber(nextAt)}`} />
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <Pressable
          onPress={confirm}
          disabled={!enabled}
          style={({ pressed }) => [styles.button, !enabled && styles.buttonDisabled, pressed && enabled && styles.buttonPressed]}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, !enabled && styles.buttonTextDisabled]}>
            {enabled ? `Provést prestiž za ✨ ${gain}` : `Potřebuješ 💎 ${formatNumber(PRESTIGE_BASE)} v běhu`}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statHighlight]}>{value}</Text>
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
    fontSize: 22,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  text: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
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
    fontSize: 15,
    fontWeight: '700',
  },
  statHighlight: {
    color: colors.success,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold,
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonText: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 16,
  },
  buttonTextDisabled: {
    color: colors.muted,
  },
});
