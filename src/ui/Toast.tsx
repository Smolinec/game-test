import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../i18n';
import { playSound, SoundName } from '../services/sound';
import { colors, radius, spacing } from './theme';

/** Oznámení, které se vysune nahoře a samo zmizí (úspěch, nové zařízení…). */
export interface Notice {
  /** Unikátní klíč, aby se stejné oznámení dvakrát po sobě znovu animovalo. */
  key: string;
  icon: string;
  /** Malý popisek nad titulkem, např. „ÚSPĚCH ODEMČEN“. */
  label: string;
  title: string;
  description: string;
  accent?: 'gold' | 'accent';
  sound?: SoundName;
}

interface Props {
  notice: Notice | null;
  onDone: () => void;
}

const SHOW_MS = 3200;

export function Toast({ notice, onDone }: Props) {
  const { settings } = useSettings();
  const anim = useRef(new Animated.Value(0)).current;
  // Objekt oznámení se vytváří při každém renderu; animaci řídí jen jeho klíč.
  const noticeRef = useRef(notice);
  noticeRef.current = notice;
  const noticeKey = notice?.key ?? null;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const current = noticeRef.current;
    if (!noticeKey || !current) return;
    if (current.sound) playSound(current.sound, { passive: true });
    const slide = settings.animations ? 320 : 0;
    anim.setValue(0);
    const sequence = Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: slide, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.delay(SHOW_MS),
      Animated.timing(anim, { toValue: 0, duration: slide ? 260 : 0, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]);
    sequence.start(({ finished }) => {
      if (finished) onDoneRef.current();
    });
    return () => sequence.stop();
  }, [noticeKey, anim, settings.animations]);

  if (!notice) return null;
  const accent = notice.accent === 'accent' ? colors.accent : colors.gold;

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
      <Pressable onPress={onDone} style={[styles.toast, { borderColor: accent }]} accessibilityRole="alert">
        <Text style={styles.icon}>{notice.icon}</Text>
        <View style={styles.text}>
          <Text style={[styles.label, { color: accent }]}>{notice.label}</Text>
          <Text style={styles.title}>{notice.title}</Text>
          <Text style={styles.description}>{notice.description}</Text>
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
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
