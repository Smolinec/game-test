import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { ACHIEVEMENT_BONUS, AchievementDef } from '../engine/achievements';
import { useSettings, useT } from '../i18n';
import { playSound } from '../services/sound';
import { colors, radius, spacing } from './theme';

interface Props {
  achievement: AchievementDef | null;
  onDone: () => void;
}

const SHOW_MS = 3200;

/** Proužek nahoře, který se vysune při odemčení úspěchu a sám zmizí. */
export function AchievementToast({ achievement, onDone }: Props) {
  const { t, name, description } = useT();
  const { settings } = useSettings();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!achievement) return;
    playSound('achievement');
    const slide = settings.animations ? 320 : 0;
    anim.setValue(0);
    const sequence = Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: slide, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.delay(SHOW_MS),
      Animated.timing(anim, { toValue: 0, duration: slide ? 260 : 0, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]);
    sequence.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => sequence.stop();
  }, [achievement, anim, onDone, settings.animations]);

  if (!achievement) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) }],
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable onPress={onDone} style={styles.toast} accessibilityRole="alert">
        <Text style={styles.icon}>{achievement.icon}</Text>
        <View style={styles.text}>
          <Text style={styles.label}>{t('achievements.unlocked', { pct: Math.round(ACHIEVEMENT_BONUS * 100) })}</Text>
          <Text style={styles.name}>{name('achievement', achievement)}</Text>
          <Text style={styles.description}>{description('achievement', achievement)}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 50,
    elevation: 50,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  icon: {
    fontSize: 30,
  },
  text: {
    flex: 1,
  },
  label: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  description: {
    color: colors.muted,
    fontSize: 12,
  },
});
