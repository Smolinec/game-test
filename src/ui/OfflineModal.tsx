import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDuration, formatWhole } from '../engine/format';
import { OfflineResult } from '../engine/types';
import { adProvider } from '../services/ads';
import { colors, radius, spacing } from './theme';

interface Props {
  result: OfflineResult | null;
  onClose: () => void;
  onDouble: () => void;
}

export function OfflineModal({ result, onClose, onDouble }: Props) {
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
              <Text style={styles.amount}>
                💎 {formatWhole(result.earned)}
                {result.doubled ? '  ×2' : ''}
              </Text>
              <Text style={styles.note}>
                Offline těžba běží na {Math.round(result.efficiency * 100)} % výkonu
                {capped && result ? ` a započítá se nejvýše ${formatDuration(result.capSeconds)}.` : '.'}
              </Text>
            </>
          )}
          {result && !result.doubled && adProvider.isReady('double_offline') && (
            <Pressable
              onPress={onDouble}
              accessibilityRole="button"
              accessibilityLabel="Sledovat video a zdvojnásobit"
              style={({ pressed }) => [styles.button, styles.doubleButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.doubleText}>📺 Video: zdvojnásobit</Text>
            </Pressable>
          )}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, result?.doubled && styles.buttonGold, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>{result?.doubled ? 'Vybrat dvojnásobek' : 'Vybrat'}</Text>
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
    opacity: 0.85,
  },
  buttonGold: {
    backgroundColor: colors.gold,
  },
  doubleButton: {
    backgroundColor: colors.gold,
    marginBottom: spacing.sm,
  },
  doubleText: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 16,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
});
