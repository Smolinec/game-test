import * as Haptics from 'expo-haptics';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatNumber } from '../engine/format';
import { useSettings, useT } from '../i18n';
import { colors, radius, spacing } from './theme';

interface Props {
  value: number;
  onTap: () => { gained: number; golden: boolean };
}

interface Floater {
  id: number;
  /** Vodorovný posun od středu krystalu. */
  x: number;
  /** Boční drift během letu. */
  drift: number;
  text: string;
  golden: boolean;
  anim: Animated.Value;
}

const MAX_FLOATERS = 12;
const FLOAT_DURATION_MS = 900;
/** O kolik číslo vystoupá; musí být menší než HEADROOM + SIZE / 2, aby nenarazilo na okraj. */
const FLOAT_RISE = 96;
/** Volné místo nad krystalem, kam čísla stoupají, než vyblednou. */
const HEADROOM = 44;
const SIZE = 150;

function formatGain(value: number): string {
  return formatNumber(value, { decimals: value < 10 ? 1 : 0 });
}

export function ClickButton({ value, onTap }: Props) {
  const { t } = useT();
  const { settings } = useSettings();
  const scale = useRef(new Animated.Value(1)).current;
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const nextId = useRef(0);

  const handlePress = useCallback(() => {
    const result = onTap();
    if (settings.haptics) {
      Haptics.impactAsync(result.golden ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
    }
    if (!settings.animations) return;

    scale.stopAnimation();
    scale.setValue(0.92);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }).start();

    const id = nextId.current++;
    const anim = new Animated.Value(0);
    const floater: Floater = {
      id,
      x: (Math.random() - 0.5) * 110,
      drift: (Math.random() - 0.5) * 40,
      text: `${result.golden ? '🌟 ' : ''}+${formatGain(result.gained)}`,
      golden: result.golden,
      anim,
    };
    setFloaters((list) => [...list.slice(-(MAX_FLOATERS - 1)), floater]);
    Animated.timing(anim, {
      toValue: 1,
      duration: FLOAT_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setFloaters((list) => list.filter((f) => f.id !== id)));
  }, [onTap, scale, settings.animations, settings.haptics]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.floaters} pointerEvents="none">
        {floaters.map((f) => (
          <Animated.Text
            key={f.id}
            style={[
              styles.floaterText,
              f.golden && styles.floaterGolden,
              {
                transform: [
                  { translateX: f.anim.interpolate({ inputRange: [0, 1], outputRange: [f.x, f.x + f.drift] }) },
                  { translateY: f.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -FLOAT_RISE] }) },
                  { scale: f.anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.6, 1.15, 0.85] }) },
                ],
                opacity: f.anim.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 0.95, 0] }),
              },
            ]}
          >
            {f.text}
          </Animated.Text>
        ))}
      </View>
      <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={t('tap.label')}>
        <Animated.View style={[styles.button, { transform: [{ scale }] }]}>
          <Text style={styles.icon}>💎</Text>
          <Text style={styles.caption}>{t('tap.button')}</Text>
        </Animated.View>
      </Pressable>
      <Text style={styles.hint}>{t('tap.perTap', { value: formatGain(value) })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingTop: HEADROOM,
    paddingBottom: spacing.md,
  },
  floaters: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  floaterGolden: {
    fontSize: 28,
    color: '#FFF3B0',
  },
  floaterText: {
    position: 'absolute',
    // Start uprostřed krystalu.
    top: HEADROOM + SIZE / 2 - 14,
    color: colors.gold,
    fontSize: 20,
    fontWeight: '800',
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.accent,
    borderWidth: 4,
    borderColor: colors.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  icon: {
    fontSize: 56,
  },
  caption: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: spacing.xs,
  },
  hint: {
    color: colors.muted,
    marginTop: spacing.sm,
    fontSize: 13,
    borderRadius: radius.pill,
  },
});
