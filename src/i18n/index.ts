import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { GENERATOR_BY_ID } from '../engine/data';
import { setNumberLocale } from '../engine/format';
import { setSoundEnabled } from '../services/sound';
import { achievementsEn, generatorsEn, NamedText, productsEn, stardustUpgradesEn, tierUpgradeEn, upgradesEn } from './data';
import { cs, en, Strings } from './strings';

export type Language = 'cs' | 'en';

export interface Settings {
  language: Language;
  haptics: boolean;
  animations: boolean;
  sound: boolean;
}

export const SETTINGS_KEY = 'hvezdny-dul.settings';

const DICTIONARIES: Record<Language, Strings> = { cs, en };

/** Jazyk podle zařízení: čeština a slovenština → cs, jinak angličtina. */
export function detectLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    return /^(cs|sk)/i.test(locale) ? 'cs' : 'en';
  } catch {
    return 'cs';
  }
}

export function defaultSettings(): Settings {
  return { language: detectLanguage(), haptics: true, animations: true, sound: true };
}

export function parseSettings(raw: string | null | undefined): Settings {
  const base = defaultSettings();
  if (!raw) return base;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    return {
      language: data.language === 'en' || data.language === 'cs' ? data.language : base.language,
      haptics: typeof data.haptics === 'boolean' ? data.haptics : base.haptics,
      animations: typeof data.animations === 'boolean' ? data.animations : base.animations,
      sound: typeof data.sound === 'boolean' ? data.sound : base.sound,
    };
  } catch {
    return base;
  }
}

// ---------------------------------------------------------------------------
// Překlad textů
// ---------------------------------------------------------------------------

type Params = Record<string, string | number>;

/** Doplní {parametry} do šablony. */
export function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in params ? String(params[key]) : match));
}

/** Přeloží klíč ve tvaru "sekce.klíč" v daném jazyce. */
export function translate(language: Language, key: string, params?: Params): string {
  const [section, name] = key.split('.');
  const dict = DICTIONARIES[language] as unknown as Record<string, Record<string, string>>;
  const template = dict[section]?.[name] ?? (cs as unknown as Record<string, Record<string, string>>)[section]?.[name] ?? key;
  return interpolate(template, params);
}

// ---------------------------------------------------------------------------
// Překlad herních dat (názvy zařízení, vylepšení, produktů, úspěchů)
// ---------------------------------------------------------------------------

export type DataKind = 'generator' | 'upgrade' | 'product' | 'stardustUpgrade' | 'achievement';

const TIER_RE = /^(.+)_(I|II|III|IV)$/;

function englishText(kind: DataKind, id: string, fallback: NamedText, multiplier?: number): NamedText {
  switch (kind) {
    case 'generator':
      return generatorsEn[id] ?? fallback;
    case 'upgrade': {
      if (upgradesEn[id]) return upgradesEn[id];
      const m = TIER_RE.exec(id);
      if (m && generatorsEn[m[1]]) {
        const generator = generatorsEn[m[1]].name;
        return {
          name: interpolate(tierUpgradeEn.name, { generator, suffix: m[2] }),
          description: interpolate(tierUpgradeEn.description, { generator, mult: multiplier ?? '' }),
        };
      }
      return fallback;
    }
    case 'product':
      return productsEn[id] ?? fallback;
    case 'stardustUpgrade':
      return stardustUpgradesEn[id] ?? fallback;
    case 'achievement':
      return achievementsEn[id] ?? fallback;
  }
}

export function translateData(
  language: Language,
  kind: DataKind,
  def: { id: string; name: string; description: string; effect?: unknown },
): NamedText {
  if (language === 'cs') return { name: def.name, description: def.description };
  const effect = def.effect as { type?: string; multiplier?: number } | undefined;
  const multiplier = effect?.type === 'generator' ? effect.multiplier : undefined;
  return englishText(kind, def.id, { name: def.name, description: def.description }, multiplier);
}

// ---------------------------------------------------------------------------
// React kontext
// ---------------------------------------------------------------------------

interface SettingsContextValue {
  settings: Settings;
  ready: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: { language: 'cs', haptics: true, animations: true, sound: true },
  ready: false,
  updateSettings: () => undefined,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => defaultSettings());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let raw: string | null = null;
      try {
        raw = await AsyncStorage.getItem(SETTINGS_KEY);
      } catch (error) {
        console.warn('Načtení nastavení selhalo', error);
      }
      if (cancelled) return;
      setSettings(parseSettings(raw));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setNumberLocale(settings.language);
  }, [settings.language]);

  useEffect(() => {
    setSoundEnabled(settings.sound);
  }, [settings.sound]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch((error) => console.warn('Uložení nastavení selhalo', error));
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, ready, updateSettings }), [settings, ready, updateSettings]);
  return React.createElement(SettingsContext.Provider, { value }, children);
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}

export interface Translator {
  language: Language;
  t: (key: string, params?: Params) => string;
  /** Název herního objektu (zařízení, vylepšení…) v aktuálním jazyce. */
  name: (kind: DataKind, def: { id: string; name: string; description: string; effect?: unknown }) => string;
  description: (kind: DataKind, def: { id: string; name: string; description: string; effect?: unknown }) => string;
}

export function useT(): Translator {
  const { settings } = useSettings();
  const language = settings.language;
  return useMemo(
    () => ({
      language,
      t: (key: string, params?: Params) => translate(language, key, params),
      name: (kind, def) => translateData(language, kind, def).name,
      description: (kind, def) => translateData(language, kind, def).description,
    }),
    [language],
  );
}

/** Pro místa mimo React (např. hlášky ve službách). */
export function generatorName(language: Language, id: string): string {
  const def = GENERATOR_BY_ID[id];
  return def ? translateData(language, 'generator', def).name : id;
}
