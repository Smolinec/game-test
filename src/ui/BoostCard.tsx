import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BOOST_DURATION_SECONDS, BOOST_MULTIPLIER, boostCooldownRemainingMs, canWatchBoostAd, isBoostActive } from '../engine/ads';
import { formatDuration } from '../engine/format';
import { GameState } from '../engine/types';
import { adProvider } from '../services/ads';
import { colors, radius, spacing } from './theme';

interface Props {
  state: GameState;
  now: number;
  onWatch: () => void;
}

/** Karta pod krystalem: aktivní boost, nabídka videa, nebo odpočet do dalšího videa. */
export function BoostCard({ state, now, onWatch }: Props) {
  if (isBoostActive(state)) {
    return (
      <View style={[styles.card, styles.cardActive]}>
        <Text style={styles.icon}>⚡</Text>
        <View style={styles.info}>
          <Text style={styles.title}>Boost ×{BOOST_MULTIPLIER} aktivní</Text>
          <Text style={styles.text}>Zbývá {formatDuration(state.boostSecondsLeft)} herního času.</Text>
        </View>
      </View>
    );
  }
  const cooldown = boostCooldownRemainingMs(state, now);
  const available = canWatchBoostAd(state, now) && adProvider.isReady('boost');
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>📺</Text>
      <View style={styles.info}>
        <Text style={styles.title}>
          ×{BOOST_MULTIPLIER} produkce na {formatDuration(BOOST_DURATION_SECONDS)}
        </Text>
        <Text style={styles.text}>
          {available ? `Za shlédnutí videa. ${adProvider.isSandbox ? 'Testovací režim, video se jen simuluje.' : ''}` : `Další video za ${formatDuration(cooldown / 1000)}.`}
        </Text>
      </View>
      <Pressable
        onPress={onWatch}
        disabled={!available}
        accessibilityRole="button"
        accessibilityLabel="Sledovat video pro boost"
        style={({ pressed }) => [styles.button, !available && styles.buttonDisabled, pressed && available && styles.pressed]}
      >
        <Text style={[styles.buttonText, !available && styles.buttonTextDisabled]}>▶ Video</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(255,209,102,0.12)',
  },
  icon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  text: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 13,
  },
  buttonTextDisabled: {
    color: colors.muted,
  },
});
