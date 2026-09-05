import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { LANGUAGES, LOCALES, useSettings, useT } from '../i18n';
import { colors, radius, spacing } from './theme';

/** Nastavení: jazyk a přepínače vibrací, animací a zvuku. */
export function SettingsSection() {
  const { t } = useT();
  const { settings, updateSettings } = useSettings();

  return (
    <View>
      <Text style={styles.heading}>{t('settings.title')}</Text>
      <View style={styles.card}>
        <View style={styles.languageBlock}>
          <Text style={styles.label}>{t('settings.language')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.group}>
            {LANGUAGES.map((lang) => {
              const active = settings.language === lang;
              return (
                <Pressable
                  key={lang}
                  onPress={() => updateSettings({ language: lang })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={LOCALES[lang].label}
                  style={[styles.pill, active && styles.pillActive]}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{LOCALES[lang].label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <Toggle label={t('settings.haptics')} value={settings.haptics} onChange={(v) => updateSettings({ haptics: v })} />
        <Toggle label={t('settings.animations')} value={settings.animations} onChange={(v) => updateSettings({ animations: v })} />
        <Toggle label={t('settings.sound')} value={settings.sound} onChange={(v) => updateSettings({ sound: v })} />
      </View>
    </View>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.disabled, true: colors.accent }}
        thumbColor={colors.text}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32,
  },
  languageBlock: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  group: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 3,
    gap: 3,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  pillActive: {
    backgroundColor: colors.accent,
  },
  pillText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 13,
  },
  pillTextActive: {
    color: colors.text,
  },
});
