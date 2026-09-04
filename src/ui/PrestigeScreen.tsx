import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GALAXY_COST, GALAXY_MULTIPLIER, PRESTIGE_BASE } from '../engine/data';
import {
  canAscendGalaxy,
  canBuyStardustUpgrade,
  canPrestige,
  crystalsForNextStardust,
  galaxyMultiplier,
  prestigeGain,
  prestigeGainMultiplier,
  productionPerSecond,
  stardustBonusPerUnit,
  stardustMultiplier,
  stardustUpgradeCost,
  stardustUpgradeLevel,
} from '../engine/engine';
import { formatNumber, formatWhole } from '../engine/format';
import { maxLevel, STARDUST_UPGRADES } from '../engine/stardust';
import { GameState } from '../engine/types';
import { useT } from '../i18n';
import { ConfirmModal } from './ConfirmModal';
import { Header } from './Header';
import { colors, radius, spacing } from './theme';

interface Props {
  state: GameState;
  onPrestige: () => void;
  onBuyStardustUpgrade: (upgradeId: string) => void;
  onAscendGalaxy: () => void;
}

export function PrestigeScreen({ state, onPrestige, onBuyStardustUpgrade, onAscendGalaxy }: Props) {
  const { t, name, description } = useT();
  const gain = prestigeGain(state);
  const enabled = canPrestige(state);
  const nextAt = crystalsForNextStardust(state);
  // Krystaly, při kterých hráč dosáhl aktuálního zisku (dolní hranice ukazatele).
  const prevAt = Math.pow(gain / prestigeGainMultiplier(state), 2) * PRESTIGE_BASE;
  const progress = Math.min(1, Math.max(0, (state.runCrystals - prevAt) / (nextAt - prevAt)));
  const bonusPercent = Math.round(stardustBonusPerUnit(state) * 100);
  const [confirming, setConfirming] = useState(false);
  const [confirmingGalaxy, setConfirmingGalaxy] = useState(false);
  const galaxyReady = canAscendGalaxy(state);
  const galaxyProgress = Math.min(1, state.stardust / GALAXY_COST);

  return (
    <View style={styles.container}>
      <Header crystals={state.crystals} perSecond={productionPerSecond(state)} stardust={state.stardust} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>{t('prestige.title')}</Text>
        <Text style={styles.text}>{t('prestige.intro', { pct: bonusPercent })}</Text>

        <View style={styles.card}>
          <Stat label={t('prestige.stardustToSpend')} value={`✨ ${formatWhole(state.stardust)}`} />
          <Stat label={t('prestige.bonus')} value={`×${formatNumber(stardustMultiplier(state), { decimals: 2 })}`} />
          <Stat label={t('prestige.count')} value={String(state.prestigeCount)} />
        </View>

        <View style={styles.card}>
          <Stat label={t('prestige.runCrystals')} value={`💎 ${formatWhole(state.runCrystals)}`} />
          <Stat label={t('prestige.gainNow')} value={`✨ ${gain}`} highlight={enabled} />
          <Stat label={t('prestige.nextAt')} value={`💎 ${formatNumber(nextAt)}`} />
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
            {enabled ? t('prestige.buttonReady', { gain }) : t('prestige.buttonNeed', { amount: formatNumber(PRESTIGE_BASE) })}
          </Text>
        </Pressable>

        <Text style={styles.sectionHeading}>{t('prestige.stardustTitle')}</Text>
        <Text style={styles.sectionText}>{t('prestige.stardustIntro')}</Text>
        {STARDUST_UPGRADES.map((def) => {
          const level = stardustUpgradeLevel(state, def.id);
          const max = maxLevel(def);
          const cost = stardustUpgradeCost(state, def.id);
          const affordable = canBuyStardustUpgrade(state, def.id);
          const title = name('stardustUpgrade', def);
          return (
            <View key={def.id} style={styles.upgradeRow}>
              <View style={styles.upgradeIconBox}>
                <Text style={styles.upgradeIcon}>{def.icon}</Text>
              </View>
              <View style={styles.upgradeInfo}>
                <View style={styles.upgradeTitleRow}>
                  <Text style={styles.upgradeName}>{title}</Text>
                  {max > 1 && (
                    <View style={styles.pips}>
                      {Array.from({ length: max }, (_, i) => (
                        <View key={i} style={[styles.pip, i < level && styles.pipFilled]} />
                      ))}
                    </View>
                  )}
                </View>
                <Text style={styles.upgradeDescription}>{description('stardustUpgrade', def)}</Text>
              </View>
              <Pressable
                onPress={() => onBuyStardustUpgrade(def.id)}
                disabled={!affordable}
                accessibilityRole="button"
                accessibilityLabel={
                  cost === null ? t('prestige.maxedLabel', { name: title }) : t('prestige.buyStardustLabel', { name: title, cost })
                }
                style={({ pressed }) => [
                  styles.upgradeBuy,
                  cost === null && styles.upgradeBuyMaxed,
                  cost !== null && !affordable && styles.upgradeBuyDisabled,
                  pressed && affordable && styles.buttonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.upgradeBuyText,
                    cost === null && styles.upgradeBuyMaxedText,
                    cost !== null && !affordable && styles.upgradeBuyDisabledText,
                  ]}
                >
                  {cost === null ? t('prestige.maxed') : `✨ ${cost}`}
                </Text>
              </Pressable>
            </View>
          );
        })}

        <Text style={styles.sectionHeading}>{t('prestige.galaxyTitle')}</Text>
        <Text style={styles.sectionText}>{t('prestige.galaxyIntro', { cost: formatNumber(GALAXY_COST), mult: GALAXY_MULTIPLIER })}</Text>
        <View style={styles.card}>
          <Stat label={t('prestige.galaxies')} value={`🌌 ${state.galaxies}`} />
          <Stat label={t('prestige.galaxyBonus')} value={`×${formatNumber(galaxyMultiplier(state))}`} />
          <Stat
            label={t('prestige.galaxyDust')}
            value={`✨ ${formatWhole(state.stardust)} / ${formatNumber(GALAXY_COST)}`}
            highlight={galaxyReady}
          />
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, styles.galaxyFill, { width: `${galaxyProgress * 100}%` }]} />
          </View>
        </View>
        <Pressable
          onPress={() => setConfirmingGalaxy(true)}
          disabled={!galaxyReady}
          style={({ pressed }) => [
            styles.button,
            styles.galaxyButton,
            !galaxyReady && styles.buttonDisabled,
            pressed && galaxyReady && styles.buttonPressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, styles.galaxyButtonText, !galaxyReady && styles.buttonTextDisabled]}>
            {galaxyReady ? t('prestige.galaxyButton') : t('prestige.galaxyNeed', { cost: formatNumber(GALAXY_COST) })}
          </Text>
        </Pressable>
      </ScrollView>

      <ConfirmModal
        visible={confirming}
        icon="✨"
        title={t('prestige.confirmTitle')}
        message={t('prestige.confirmMessage', { gain, pct: gain * bonusPercent })}
        confirmLabel={t('prestige.confirmLabel')}
        destructive
        onConfirm={() => {
          setConfirming(false);
          onPrestige();
        }}
        onCancel={() => setConfirming(false)}
      />
      <ConfirmModal
        visible={confirmingGalaxy}
        icon="🌌"
        title={t('prestige.galaxyConfirmTitle')}
        message={t('prestige.galaxyConfirmMessage', { dust: formatWhole(state.stardust), mult: GALAXY_MULTIPLIER })}
        confirmLabel={t('prestige.galaxyConfirmLabel')}
        destructive
        onConfirm={() => {
          setConfirmingGalaxy(false);
          onAscendGalaxy();
        }}
        onCancel={() => setConfirmingGalaxy(false)}
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
  galaxyFill: {
    backgroundColor: colors.accent,
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  galaxyButton: {
    backgroundColor: colors.accent,
    marginBottom: spacing.md,
  },
  galaxyButtonText: {
    color: colors.text,
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
