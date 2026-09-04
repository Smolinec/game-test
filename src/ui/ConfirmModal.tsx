import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from './theme';

/**
 * Potvrzovací dialog. Nahrazuje Alert.alert, který na webu nefunguje,
 * a vypadá stejně na iOS, Androidu i v prohlížeči.
 */
interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Během čekání (např. na obchod) se tlačítka zamknou a ukáže se indikátor. */
  busy?: boolean;
  /** Malý popisek nad tlačítky, např. „Testovací režim“. */
  note?: string;
  icon?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Zrušit',
  destructive,
  busy,
  note,
  icon,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? undefined : onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {!!icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {!!note && <Text style={styles.note}>{note}</Text>}
          <View style={styles.buttons}>
            <Pressable
              onPress={onCancel}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                destructive ? styles.destructive : styles.confirm,
                pressed && styles.pressed,
              ]}
            >
              {busy ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
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
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  note: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  button: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancel: {
    backgroundColor: colors.surfaceAlt,
  },
  confirm: {
    backgroundColor: colors.accent,
  },
  destructive: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.85,
  },
  cancelText: {
    color: colors.text,
    fontWeight: '700',
  },
  confirmText: {
    color: colors.text,
    fontWeight: '800',
  },
});
