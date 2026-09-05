import { DataTranslations } from '../data';
import { dataEn } from '../data';
import { cs, en, Strings } from '../strings';
import * as de from './de';
import * as es from './es';
import * as fr from './fr';
import * as it from './it';
import * as ja from './ja';
import * as pl from './pl';
import * as pt from './pt';
import * as ru from './ru';
import * as sk from './sk';

export type Language = 'cs' | 'en' | 'de' | 'es' | 'fr' | 'it' | 'pl' | 'pt' | 'ru' | 'ja' | 'sk';

export interface Locale {
  strings: Strings;
  /** Překlady herních dat; null = použít české texty přímo z definic. */
  data: DataTranslations | null;
  /** Název jazyka v něm samotném, pro výběr v nastavení. */
  label: string;
  /** Desetinný oddělovač ve formátu čísel. */
  decimalSeparator: '.' | ',';
}

export const LOCALES: Record<Language, Locale> = {
  cs: { strings: cs, data: null, label: 'Čeština', decimalSeparator: ',' },
  sk: { strings: sk.strings, data: sk.data, label: 'Slovenčina', decimalSeparator: ',' },
  en: { strings: en, data: dataEn, label: 'English', decimalSeparator: '.' },
  de: { strings: de.strings, data: de.data, label: 'Deutsch', decimalSeparator: ',' },
  es: { strings: es.strings, data: es.data, label: 'Español', decimalSeparator: ',' },
  fr: { strings: fr.strings, data: fr.data, label: 'Français', decimalSeparator: ',' },
  it: { strings: it.strings, data: it.data, label: 'Italiano', decimalSeparator: ',' },
  pl: { strings: pl.strings, data: pl.data, label: 'Polski', decimalSeparator: ',' },
  pt: { strings: pt.strings, data: pt.data, label: 'Português', decimalSeparator: ',' },
  ru: { strings: ru.strings, data: ru.data, label: 'Русский', decimalSeparator: ',' },
  ja: { strings: ja.strings, data: ja.data, label: '日本語', decimalSeparator: '.' },
};

/** Pořadí v nastavení: nejdřív domácí jazyky, pak podle rozšířenosti. */
export const LANGUAGES: Language[] = ['cs', 'sk', 'en', 'de', 'es', 'fr', 'it', 'pl', 'pt', 'ru', 'ja'];

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && value in LOCALES;
}

/** Zvolí jazyk hry podle jazyka zařízení (např. "de-AT" → de); neznámé jazyky spadnou na angličtinu. */
export function languageFromLocale(locale: string | null | undefined): Language {
  const code = (locale ?? '').toLowerCase().split(/[-_]/)[0];
  return isLanguage(code) ? code : 'en';
}
