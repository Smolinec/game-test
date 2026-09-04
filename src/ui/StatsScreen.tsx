import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { clickValue, offlineCapSeconds, offlineEfficiency, productionPerSecond } from '../engine/engine';
import { formatDuration, formatNumber, formatWhole } from '../engine/format';
import { GameState } from '../engine/types';
import { useT } from '../i18n';
import { AccountCard } from './AccountCard';
import { AchievementsSection } from './AchievementsSection';
import { ConfirmModal } from './ConfirmModal';
import { Header } from './Header';
import { SettingsSection } from './SettingsSection';
import { colors, radius, spacing } from './theme';

interface Props {
  state: GameState;
  onReset: () => void;
}

export function StatsScreen({ state, onReset }: Props) {
  const { t } = useT();
  const totalGenerators = Object.values(state.generators).reduce((a, b) => a + b, 0);
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <View style={styles.container}>
      <Header crystals={state.crystals} perSecond={productionPerSecond(state)} stardust={state.stardust} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.accountWrap}>
          <AccountCard />
        </View>

        <SettingsSection />

        <Text style={styles.heading}>{t('stats.title')}</Text>
        <View style={styles.card}>
          <Stat label={t('stats.crystalsTotal')} value={`💎 ${formatWhole(state.allTimeCrystals)}`} />
          <Stat label={t('stats.crystalsRun')} value={`💎 ${formatWhole(state.runCrystals)}`} />
          <Stat
            label={t('stats.production')}
            value={t('header.perSecond', { rate: formatNumber(productionPerSecond(state), { decimals: 1 }) })}
          />
          <Stat label={t('stats.tapValue')} value={`💎 ${formatNumber(clickValue(state), { decimals: 1 })}`} />
          <Stat label={t('stats.taps')} value={formatWhole(state.clicks)} />
          <Stat label={t('stats.devices')} value={formatWhole(totalGenerators)} />
          <Stat label={t('stats.upgradesBought')} value={String(state.upgrades.length)} />
          <Stat label={t('stats.stardustEarned')} value={`✨ ${formatWhole(state.stardustEarned)}`} />
          <Stat label={t('stats.galaxies')} value={`🌌 ${state.galaxies}`} />
          <Stat label={t('stats.purchases')} value={String(state.entitlements.length)} />
          <Stat label={t('stats.adsWatched')} value={String(state.adsWatched)} />
          <Stat label={t('stats.played')} value={formatDuration(state.playTimeSeconds)} />
        </View>

        <AchievementsSection state={state} />

        <Text style={styles.heading}>{t('stats.howTitle')}</Text>
        <View style={styles.card}>
          <Text style={styles.info}>{t('stats.how1')}</Text>
          <Text style={styles.info}>
            {t('stats.how2', {
              pct: Math.round(offlineEfficiency(state) * 100),
              duration: formatDuration(offlineCapSeconds(state)),
            })}
          </Text>
          <Text style={styles.info}>{t('stats.how3')}</Text>
          <Text style={styles.info}>{t('stats.how4')}</Text>
        </View>

        <Pressable
          onPress={() => setConfirmingReset(true)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.resetButton, pressed && styles.resetPressed]}
        >
          <Text style={styles.resetText}>{t('stats.reset')}</Text>
        </Pressable>
      </ScrollView>
      <ConfirmModal
        visible={confirmingReset}
        icon="🗑️"
        title={t('stats.resetTitle')}
        message={t('stats.resetMessage')}
        confirmLabel={t('stats.resetLabel')}
        destructive
        onConfirm={() => {
          setConfirmingReset(false);
          onReset();
        }}
        onCancel={() => setConfirmingReset(false)}
      />
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
  accountWrap: {
    marginTop: spacing.md,
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
