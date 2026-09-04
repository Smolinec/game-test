import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { OFFLINE_EFFICIENCY } from '../engine/data';
import { formatDuration, formatWhole } from '../engine/format';
import { OfflineResult } from '../engine/types';
import { colors, radius, spacing } from './theme';

interface Props {
  result: OfflineResult | null;
  onClose: () => void;
}

export function OfflineModal({ result, onClose }: Props) {
  const capped = !!result && result.elapsedSeconds > result.seconds;
  return (
    <Modal visible={!!result} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Vítej zpět! 👋</Text>
          {result && (
            <>
              <Text style={styles.text}>
                Byl jsi pryč <Text style={styles.strong}>{formatDuration(result.elapsedSeconds)}</Text>. Tvoje
                kolonie mezitím vytěžila
              </Text>
              <Text style={styles.amount}>💎 {formatWhole(result.earned)}</Text>
              <Text style={styles.note}>
                Offline těžba běží na {Math.round(OFFLINE_EFFICIENCY * 100)} % výkonu
                {capped && result ? ` a započítá se nejvýše ${formatDuration(result.capSeconds)}.` : '.'}
              </Text>
            </>
          )}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Vybrat</Text>
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
    maxWidth: 360,
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
    marginBottom: spacing.md,
  },
  text: {
    color: colors.muted,
    fontSize: 15,
    textAlign: 'center',
  },
  strong: {
    color: colors.text,
    fontWeight: '700',
  },
  amount: {
    color: colors.gold,
    fontSize: 32,
    fontWeight: '800',
    marginVertical: spacing.md,
  },
  note: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.accentDark,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
});
