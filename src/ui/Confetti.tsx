import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSettings } from '../i18n';
import { colors } from './theme';

interface Props {
  /** Každá změna hodnoty spustí nový výbuch konfet. */
  burstKey: number;
}

const PIECES = 42;
const DURATION_MS = 1900;
const PALETTE = [colors.gold, colors.accent, colors.success, '#FF8FAB', '#9BE5FF', '#FFFFFF'];

interface Piece {
  id: number;
  color: string;
  size: number;
  angle: number;
  distance: number;
  spin: number;
  delay: number;
}

function makePieces(seed: number): Piece[] {
  // Deterministický pseudonáhodný generátor, aby se každý výbuch lišil, ale šel reprodukovat.
  let s = seed * 7919 + 13;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: PIECES }, (_, i) => ({
    id: i,
    color: PALETTE[Math.floor(rnd() * PALETTE.length)],
    size: 6 + rnd() * 8,
    angle: -Math.PI / 2 + (rnd() - 0.5) * Math.PI * 1.4,
    distance: 120 + rnd() * 220,
    spin: (rnd() - 0.5) * 6,
    delay: rnd() * 120,
  }));
}

/** Výbuch konfet ze středu obrazovky; po doznění se sám odklidí. */
export function Confetti({ burstKey }: Props) {
  const { settings } = useSettings();
  const { width, height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const [active, setActive] = useState(false);
  const pieces = useMemo(() => makePieces(burstKey), [burstKey]);

  useEffect(() => {
    if (burstKey === 0 || !settings.animations) return;
    setActive(true);
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: DURATION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) setActive(false);
    });
    return () => anim.stop();
  }, [burstKey, progress, settings.animations]);

  if (!active) return null;

  const cx = width / 2;
  const cy = height * 0.4;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p) => {
        const dx = Math.cos(p.angle) * p.distance;
        const dy = Math.sin(p.angle) * p.distance;
        const start = p.delay / DURATION_MS;
        const translateX = progress.interpolate({ inputRange: [0, start, 1], outputRange: [0, 0, dx] });
        // Nahoru a pak gravitací dolů.
        const translateY = progress.interpolate({
          inputRange: [0, start, 0.55, 1],
          outputRange: [0, 0, dy, dy + 260],
        });
        const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin * 360}deg`] });
        const opacity = progress.interpolate({ inputRange: [0, start, 0.75, 1], outputRange: [0, 1, 1, 0] });
        return (
          <Animated.View
            key={p.id}
            style={{
              position: 'absolute',
              left: cx - p.size / 2,
              top: cy - p.size / 2,
              width: p.size,
              height: p.size * 0.6,
              borderRadius: 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
