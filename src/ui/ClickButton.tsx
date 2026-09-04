import * as Haptics from 'expo-haptics';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatNumber } from '../engine/format';
import { colors, radius, spacing } from './theme';

interface Props {
  value: number;
  onTap: () => void;
}

interface Floater {
  id: number;
  /** Vodorovný posun od středu krystalu. */
  x: number;
  /** Boční drift během letu. */
  drift: number;
  text: string;
  anim: Animated.Value;
}

const MAX_FLOATERS = 12;
const FLOAT_DURATION_MS = 900;
/** O kolik číslo vystoupá; musí být menší než HEADROOM + SIZE / 2, aby nenarazilo na okraj. */
const FLOAT_RISE = 96;
/** Volné místo nad krystalem, kam čísla stoupají, než vyblednou. */
const HEADROOM = 44;

export function ClickButton({ value, onTap }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const nextId = useRef(0);

  const handlePress = useCallback(() => {
    onTap();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);

    scale.stopAnimation();
    scale.setValue(0.92);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }).start();

    const id = nextId.current++;
    const anim = new Animated.Value(0);
    const floater: Floater = {
      id,
      x: (Math.random() - 0.5) * 110,
      drift: (Math.random() - 0.5) * 40,
      text: `+${formatNumber(value, { decimals: value < 10 ? 1 : 0 })}`,
      anim,
    };
    setFloaters((list) => [...list.slice(-(MAX_FLOATERS - 1)), floater]);
    Animated.timing(anim, {
      toValue: 1,
      duration: FLOAT_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setFloaters((list) => list.filter((f) => f.id !== id)));
  }, [onTap, scale, value]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.floaters} pointerEvents="none">
        {floaters.map((f) => (
          <Animated.Text
            key={f.id}
            style={[
              styles.floaterText,
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
      <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel="Těžit krystaly">
        <Animated.View style={[styles.button, { transform: [{ scale }] }]}>
          <Text style={styles.icon}>💎</Text>
          <Text style={styles.caption}>TĚŽIT</Text>
        </Animated.View>
      </Pressable>
      <Text style={styles.hint}>+{formatNumber(value, { decimals: value < 10 ? 1 : 0 })} za klepnutí</Text>
    </View>
  );
}

const SIZE = 150;

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
