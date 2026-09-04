import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ACHIEVEMENT_BONUS, ACHIEVEMENTS, achievementProgress, hasAchievement, metricValue } from '../engine/achievements';
import { formatDuration, formatNumber } from '../engine/format';
import { GameState } from '../engine/types';
import { colors, radius, spacing } from './theme';

interface Props {
  state: GameState;
}

export function AchievementsSection({ state }: Props) {
  const done = state.achievements.length;
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>🏆 Úspěchy</Text>
        <Text style={styles.counter}>
          {done} / {ACHIEVEMENTS.length} · +{Math.round(done * ACHIEVEMENT_BONUS * 100)} % produkce
        </Text>
      </View>
      <View style={styles.list}>
        {ACHIEVEMENTS.map((def) => {
          const unlocked = hasAchievement(state, def.id);
          const progress = achievementProgress(state, def);
          const value = metricValue(state, def.metric);
          const progressLabel =
            def.metric === 'playTimeSeconds'
              ? `${formatDuration(Math.min(value, def.threshold))} / ${formatDuration(def.threshold)}`
              : `${formatNumber(Math.min(value, def.threshold))} / ${formatNumber(def.threshold)}`;
          return (
            <View key={def.id} style={[styles.row, unlocked && styles.rowUnlocked]}>
              <View style={[styles.iconBox, unlocked && styles.iconBoxUnlocked]}>
                <Text style={[styles.icon, !unlocked && styles.iconLocked]}>{unlocked ? def.icon : '🔒'}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, !unlocked && styles.nameLocked]}>{def.name}</Text>
                <Text style={styles.description}>{def.description}</Text>
                {!unlocked && (
                  <View style={styles.progressRow}>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${progress * 100}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{progressLabel}</Text>
                  </View>
                )}
              </View>
              {unlocked && <Text style={styles.check}>✓</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heading: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  counter: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowUnlocked: {
    borderColor: 'rgba(255,209,102,0.5)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxUnlocked: {
    backgroundColor: 'rgba(255,209,102,0.15)',
  },
  icon: {
    fontSize: 20,
  },
  iconLocked: {
    opacity: 0.5,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  nameLocked: {
    color: colors.muted,
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
  },
  track: {
    flex: 1,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  progressText: {
    color: colors.muted,
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  check: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '800',
  },
});
