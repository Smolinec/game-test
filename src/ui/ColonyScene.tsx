import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { GENERATORS } from '../engine/data';
import { ownedCount } from '../engine/engine';
import { GameState } from '../engine/types';
import { useSettings } from '../i18n';
import { colors, radius, spacing } from './theme';

interface Props {
  state: GameState;
}

/** Zařízení, která se vznášejí v horní části scény; ostatní stojí na povrchu. */
const SKY = new Set(['drone', 'freighter', 'station', 'portal', 'nebula', 'blackhole', 'multiverse']);

/** Kolik ikon jednoho druhu se ukáže podle počtu vlastněných kusů. */
function spriteCount(owned: number): number {
  if (owned <= 0) return 0;
  if (owned < 10) return 1;
  if (owned < 25) return 2;
  if (owned < 50) return 3;
  if (owned < 100) return 4;
  return 5;
}

const HEIGHT = 132;
const STARS = 34;

function stars(seed: number) {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: STARS }, (_, i) => ({
    id: i,
    left: `${rnd() * 100}%`,
    top: `${rnd() * 100}%`,
    size: 1 + rnd() * 2,
    opacity: 0.25 + rnd() * 0.6,
  }));
}

/**
 * Malá scéna kolonie nad krystalem: hvězdné pozadí, ve výšce létají drony
 * a lodě, na povrchu stojí vrtné soupravy a rafinerie. Sprity přibývají
 * s počtem zařízení a lehce se pohupují.
 */
export function ColonyScene({ state }: Props) {
  const { settings } = useSettings();
  const bob = useRef(new Animated.Value(0)).current;
  const starField = useMemo(() => stars(42), []);

  useEffect(() => {
    if (!settings.animations) {
      bob.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob, settings.animations]);

  const sky = GENERATORS.filter((g) => SKY.has(g.id) && ownedCount(state, g.id) > 0);
  const ground = GENERATORS.filter((g) => !SKY.has(g.id) && ownedCount(state, g.id) > 0);
  const empty = sky.length === 0 && ground.length === 0;

  return (
    <View style={styles.scene} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {starField.map((s) => (
        <View
          key={s.id}
          style={[styles.star, { left: s.left as `${number}%`, top: s.top as `${number}%`, width: s.size, height: s.size, opacity: s.opacity }]}
        />
      ))}
      <View style={styles.horizon} />
      {empty && <Text style={styles.planet}>🪐</Text>}
      <View style={styles.skyRow}>
        {sky.map((g, index) => (
          <SpriteGroup key={g.id} icon={g.icon} owned={ownedCount(state, g.id)} bob={bob} phase={index} floating />
        ))}
      </View>
      <View style={styles.groundRow}>
        {ground.map((g, index) => (
          <SpriteGroup key={g.id} icon={g.icon} owned={ownedCount(state, g.id)} bob={bob} phase={index + 3} floating={false} />
        ))}
      </View>
    </View>
  );
}

function SpriteGroup({
  icon,
  owned,
  bob,
  phase,
  floating,
}: {
  icon: string;
  owned: number;
  bob: Animated.Value;
  phase: number;
  floating: boolean;
}) {
  const { settings } = useSettings();
  const count = spriteCount(owned);
  const pop = useRef(new Animated.Value(settings.animations ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }).start();
  }, [pop, count]);

  // Každá skupina má jinou fázi, aby se nepohupovaly synchronně.
  const amplitude = floating ? 6 : 1.5;
  const translateY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: phase % 2 === 0 ? [amplitude, -amplitude] : [-amplitude, amplitude],
  });

  return (
    <Animated.View style={[styles.group, { transform: [{ translateY }, { scale: pop }] }]}>
      <View style={styles.sprites}>
        {Array.from({ length: count }, (_, i) => (
          <Text key={i} style={[styles.sprite, { marginLeft: i === 0 ? 0 : -8, transform: [{ translateY: (i % 2) * 4 }] }]}>
            {icon}
          </Text>
        ))}
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>×{owned}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scene: {
    height: HEIGHT,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: '#0E1430',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  horizon: {
    position: 'absolute',
    left: -40,
    right: -40,
    bottom: -60,
    height: 92,
    borderRadius: 200,
    backgroundColor: '#1B2450',
    borderTopWidth: 2,
    borderTopColor: 'rgba(124,92,255,0.45)',
  },
  planet: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.sm,
    fontSize: 34,
    opacity: 0.7,
  },
  skyRow: {
    position: 'absolute',
    top: 10,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  groundRow: {
    position: 'absolute',
    bottom: 8,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  group: {
    alignItems: 'center',
  },
  sprites: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  sprite: {
    fontSize: 22,
  },
  badge: {
    marginTop: 1,
    backgroundColor: 'rgba(11,15,31,0.75)',
    borderRadius: radius.pill,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
  },
});
