import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { DAILY_REWARDS, DailyStatus } from '../engine/daily';
import { formatWhole } from '../engine/format';
import { useT } from '../i18n';
import { colors, radius, spacing } from './theme';

interface Props {
  status: DailyStatus | null;
  onClaim: () => void;
  onLater: () => void;
}

export function DailyRewardModal({ status, onClaim, onLater }: Props) {
  const { t } = useT();
  const visible = !!status && status.claimable;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('daily.title')}</Text>
          {status && (
            <>
              <Text style={styles.subtitle}>
                {status.streak > 1 ? t('daily.streak', { streak: status.streak }) : t('daily.intro')}
              </Text>
              <View style={styles.days}>
                {DAILY_REWARDS.map((r) => {
                  const isCurrent = r.day === status.day;
                  const isPast = r.day < status.day;
                  return (
                    <View key={r.day} style={[styles.dayTile, isCurrent && styles.dayCurrent, isPast && styles.dayPast]}>
                      <Text style={[styles.dayLabel, isCurrent && styles.dayLabelCurrent]}>{r.day}</Text>
                      <Text style={styles.dayIcon}>{r.stardust > 0 ? '✨' : '💎'}</Text>
                      {isPast && <Text style={styles.dayCheck}>✓</Text>}
                    </View>
                  );
                })}
              </View>
              <Text style={styles.rewardLabel}>{t('daily.today')}</Text>
              <Text style={styles.reward}>💎 {formatWhole(status.crystals)}</Text>
              {status.reward.stardust > 0 && <Text style={styles.rewardExtra}>{t('daily.extra', { amount: status.reward.stardust })}</Text>}
              <Text style={styles.note}>{t('daily.note', { minutes: status.reward.productionMinutes })}</Text>
            </>
          )}
          <Pressable onPress={onClaim} accessibilityRole="button" style={({ pressed }) => [styles.claim, pressed && styles.pressed]}>
            <Text style={styles.claimText}>{t('daily.claim')}</Text>
          </Pressable>
          <Pressable onPress={onLater} accessibilityRole="button" style={styles.later}>
            <Text style={styles.laterText}>{t('common.later')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  days: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  dayTile: {
    width: 38,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayCurrent: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(255,209,102,0.15)',
  },
  dayPast: {
    opacity: 0.5,
  },
  dayLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  dayLabelCurrent: {
    color: colors.gold,
  },
  dayIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  dayCheck: {
    position: 'absolute',
    top: 2,
    right: 4,
    color: colors.success,
    fontSize: 10,
    fontWeight: '800',
  },
  rewardLabel: {
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  reward: {
    color: colors.gold,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 2,
  },
  rewardExtra: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '700',
  },
  note: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  claim: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  claimText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  later: {
    paddingVertical: spacing.md,
  },
  laterText: {
    color: colors.muted,
    fontWeight: '600',
  },
});
