import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useT } from '../i18n';
import { adProvider } from '../services/ads';
import { colors, radius, spacing } from './theme';

interface Props {
  visible: boolean;
}

/** Náhrada reklamy v testovacím režimu: tmavá obrazovka s odpočtem. */
export function MockAdOverlay({ visible }: Props) {
  const { t } = useT();
  const total = Math.ceil(adProvider.durationMs / 1000);
  const [left, setLeft] = useState(total);

  useEffect(() => {
    if (!visible) return;
    setLeft(total);
    const id = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [visible, total]);

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={() => undefined}>
      <View style={styles.screen}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('ad.badge')}</Text>
        </View>
        <Text style={styles.icon}>📺</Text>
        <Text style={styles.title}>{t('ad.title')}</Text>
        <Text style={styles.text}>{t('ad.text')}</Text>
        <View style={styles.countdown}>
          <Text style={styles.countdownText}>{left}</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${((total - left) / total) * 100}%` }]} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#05070F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  badge: {
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  icon: {
    fontSize: 64,
    marginTop: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  text: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  countdown: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  countdownText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  track: {
    width: '80%',
    maxWidth: 320,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
});
