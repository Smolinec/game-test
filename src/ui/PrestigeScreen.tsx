import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PRESTIGE_BASE } from '../engine/data';
import {
  canBuyStardustUpgrade,
  canPrestige,
  crystalsForNextStardust,
  prestigeGain,
  productionPerSecond,
  stardustBonusPerUnit,
  stardustMultiplier,
  stardustUpgradeCost,
  stardustUpgradeLevel,
} from '../engine/engine';
import { maxLevel, STARDUST_UPGRADES } from '../engine/stardust';
import { formatNumber, formatWhole } from '../engine/format';
import { GameState } from '../engine/types';
import { ConfirmModal } from './ConfirmModal';
import { Header } from './Header';
import { colors, radius, spacing } from './theme';

interface Props {
  state: GameState;
  onPrestige: () => void;
  onBuyStardustUpgrade: (upgradeId: string) => void;
}

export function PrestigeScreen({ state, onPrestige, onBuyStardustUpgrade }: Props) {
  const gain = prestigeGain(state);
  const enabled = canPrestige(state);
  const nextAt = crystalsForNextStardust(state);
  const prevAt = gain * gain * PRESTIGE_BASE;
  const progress = Math.min(1, Math.max(0, (state.runCrystals - prevAt) / (nextAt - prevAt)));
  const bonusPercent = Math.round(stardustBonusPerUnit(state) * 100);
  const [confirming, setConfirming] = useState(false);

  return (
    <View style={styles.container}>
      <Header crystals={state.crystals} perSecond={productionPerSecond(state)} stardust={state.stardust} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>✨ Prestiž</Text>
        <Text style={styles.text}>
          Prestiž resetuje tvůj běh, ale za krystaly vytěžené v tomto běhu dostaneš hvězdný prach. Každý
          neutracený prach zvyšuje veškerou produkci i sílu klepnutí o {bonusPercent} %. Prach můžeš také utratit
          za hvězdná vylepšení níže.
        </Text>

        <View style={styles.card}>
          <Stat label="Hvězdný prach k utracení" value={`✨ ${formatWhole(state.stardust)}`} />
          <Stat label="Bonus z neutraceného prachu" value={`×${stardustMultiplier(state).toFixed(2).replace('.', ',')}`} />
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
          onPress={() => setConfirming(true)}
          disabled={!enabled}
          style={({ pressed }) => [styles.button, !enabled && styles.buttonDisabled, pressed && enabled && styles.buttonPressed]}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, !enabled && styles.buttonTextDisabled]}>
            {enabled ? `Provést prestiž za ✨ ${gain}` : `Potřebuješ 💎 ${formatNumber(PRESTIGE_BASE)} v běhu`}
          </Text>
        </Pressable>

        <Text style={styles.sectionHeading}>🔮 Hvězdná vylepšení</Text>
        <Text style={styles.sectionText}>
          Trvalá vylepšení za hvězdný prach. Utracený prach už nedává pasivní bonus, vylepšení ti ale zůstane
          napořád.
        </Text>
        {STARDUST_UPGRADES.map((def) => {
          const level = stardustUpgradeLevel(state, def.id);
          const max = maxLevel(def);
          const cost = stardustUpgradeCost(state, def.id);
          const affordable = canBuyStardustUpgrade(state, def.id);
          return (
            <View key={def.id} style={styles.upgradeRow}>
              <View style={styles.upgradeIconBox}>
                <Text style={styles.upgradeIcon}>{def.icon}</Text>
              </View>
              <View style={styles.upgradeInfo}>
                <View style={styles.upgradeTitleRow}>
                  <Text style={styles.upgradeName}>{def.name}</Text>
                  {max > 1 && (
                    <View style={styles.pips}>
                      {Array.from({ length: max }, (_, i) => (
                        <View key={i} style={[styles.pip, i < level && styles.pipFilled]} />
                      ))}
                    </View>
                  )}
                </View>
                <Text style={styles.upgradeDescription}>{def.description}</Text>
              </View>
              <Pressable
                onPress={() => onBuyStardustUpgrade(def.id)}
                disabled={!affordable}
                accessibilityRole="button"
                accessibilityLabel={cost === null ? `${def.name} na maximu` : `Koupit ${def.name} za ${cost} prachu`}
                style={({ pressed }) => [
                  styles.upgradeBuy,
                  cost === null && styles.upgradeBuyMaxed,
                  cost !== null && !affordable && styles.upgradeBuyDisabled,
                  pressed && affordable && styles.buttonPressed,
                ]}
              >
                <Text style={[styles.upgradeBuyText, cost === null && styles.upgradeBuyMaxedText, cost !== null && !affordable && styles.upgradeBuyDisabledText]}>
                  {cost === null ? '✓ MAX' : `✨ ${cost}`}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
      <ConfirmModal
        visible={confirming}
        icon="✨"
        title="Vypustit hvězdný prach?"
        message={
          `Získáš ✨ ${gain} hvězdného prachu (+${gain * bonusPercent} % k produkci navždy). ` +
          'Přijdeš o všechny krystaly, zařízení i vylepšení v tomto běhu. Nákupy z obchodu ti zůstanou.'
        }
        confirmLabel="Provést prestiž"
        destructive
        onConfirm={() => {
          setConfirming(false);
          onPrestige();
        }}
        onCancel={() => setConfirming(false)}
      />
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
  sectionHeading: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: spacing.xl,
  },
  sectionText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  upgradeIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeIcon: {
    fontSize: 24,
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  upgradeName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  pips: {
    flexDirection: 'row',
    gap: 3,
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pipFilled: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  upgradeDescription: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  upgradeBuy: {
    backgroundColor: colors.gold,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 72,
    alignItems: 'center',
  },
  upgradeBuyDisabled: {
    backgroundColor: colors.disabled,
  },
  upgradeBuyMaxed: {
    backgroundColor: colors.surfaceAlt,
  },
  upgradeBuyText: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 13,
  },
  upgradeBuyDisabledText: {
    color: colors.muted,
  },
  upgradeBuyMaxedText: {
    color: colors.success,
  },
});
