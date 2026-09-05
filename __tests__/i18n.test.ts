import { ACHIEVEMENTS } from '../src/engine/achievements';
import { GENERATORS, UPGRADES } from '../src/engine/data';
import { formatNumber, setNumberLocale } from '../src/engine/format';
import { PRODUCTS } from '../src/engine/shop';
import { STARDUST_UPGRADES } from '../src/engine/stardust';
import { interpolate, LANGUAGES, languageFromLocale, LOCALES, parseSettings, translate, translateData } from '../src/i18n';
import { cs } from '../src/i18n/strings';

describe('překlady rozhraní', () => {
  it('interpolace doplní parametry a neznámé nechá', () => {
    expect(interpolate('Ahoj {name}, máš {n} krystalů', { name: 'Jirko', n: 5 })).toBe('Ahoj Jirko, máš 5 krystalů');
    expect(interpolate('{missing}', {})).toBe('{missing}');
  });

  it('všechny jazyky mají stejné klíče a stejné parametry jako čeština', () => {
    const csFlat = flatten(cs);
    for (const lang of LANGUAGES) {
      const flat = flatten(LOCALES[lang].strings);
      expect(Object.keys(flat).sort()).toEqual(Object.keys(csFlat).sort());
      for (const key of Object.keys(csFlat)) {
        expect({ lang, key, params: params(flat[key]).sort() }).toEqual({ lang, key, params: params(csFlat[key]).sort() });
        expect(flat[key].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('jazyk zařízení se mapuje na podporovaný jazyk', () => {
    expect(languageFromLocale('de-AT')).toBe('de');
    expect(languageFromLocale('pt_BR')).toBe('pt');
    expect(languageFromLocale('sk')).toBe('sk');
    expect(languageFromLocale('ja-JP')).toBe('ja');
    expect(languageFromLocale('hu-HU')).toBe('en');
    expect(languageFromLocale(undefined)).toBe('en');
  });

  it('translate vrací text podle jazyka a klíč při chybě', () => {
    expect(translate('cs', 'tabs.mine')).toBe('Těžba');
    expect(translate('en', 'tabs.mine')).toBe('Mine');
    expect(translate('en', 'tap.perTap', { value: '2' })).toBe('+2 per tap');
    expect(translate('en', 'nope.nothing')).toBe('nope.nothing');
  });
});

describe('překlady herních dat', () => {
  it('každý jazyk má přeložené všechny herní objekty', () => {
    for (const lang of LANGUAGES) {
      if (lang === 'cs') continue;
      const data = LOCALES[lang].data!;
      for (const g of GENERATORS) expect({ lang, id: g.id, ok: !!data.generators[g.id]?.name && !!data.generators[g.id]?.description }).toEqual({ lang, id: g.id, ok: true });
      for (const u of UPGRADES) {
        const translated = translateData(lang, 'upgrade', u);
        const special = !/_(I|II|III|IV)$/.test(u.id);
        expect({ lang, id: u.id, ok: (special ? !!data.upgrades[u.id]?.name : true) && translated.name.trim().length > 0 && translated.description.trim().length > 0 }).toEqual({ lang, id: u.id, ok: true });
      }
      for (const p of PRODUCTS) expect({ lang, id: p.id, ok: !!data.products[p.id]?.name }).toEqual({ lang, id: p.id, ok: true });
      for (const s of STARDUST_UPGRADES) expect({ lang, id: s.id, ok: !!data.stardustUpgrades[s.id]?.name }).toEqual({ lang, id: s.id, ok: true });
      for (const a of ACHIEVEMENTS) expect({ lang, id: a.id, ok: !!data.achievements[a.id]?.name }).toEqual({ lang, id: a.id, ok: true });
    }
  });

  it('generovaná vylepšení zařízení se skládají ze šablony', () => {
    const droneII = UPGRADES.find((u) => u.id === 'drone_II')!;
    const t = translateData('en', 'upgrade', droneII);
    expect(t.name).toBe('Mining drone II');
    expect(t.description).toBe('Mining drone: production ×2.');
  });

  it('čeština vrací původní texty', () => {
    expect(translateData('cs', 'generator', GENERATORS[0]).name).toBe('Těžební dron');
  });
});

describe('nastavení', () => {
  it('parseSettings doplní výchozí hodnoty a odmítne nesmysly', () => {
    const s = parseSettings(JSON.stringify({ language: 'en', haptics: false, sound: 'yes' }));
    expect(s.language).toBe('en');
    expect(s.haptics).toBe(false);
    expect(s.sound).toBe(true);
    expect(s.animations).toBe(true);
    expect(parseSettings('{bad').language).toMatch(/cs|en/);
  });

  it('formát čísel respektuje oddělovač jazyka', () => {
    setNumberLocale(LOCALES.en.decimalSeparator);
    expect(formatNumber(12_345)).toBe('12.35K');
    setNumberLocale(LOCALES.de.decimalSeparator);
    expect(formatNumber(12_345)).toBe('12,35K');
    setNumberLocale(LOCALES.ja.decimalSeparator);
    expect(formatNumber(12_345)).toBe('12.35K');
    setNumberLocale(LOCALES.cs.decimalSeparator);
    expect(formatNumber(12_345)).toBe('12,35K');
  });
});

function flatten(obj: Record<string, Record<string, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [section, entries] of Object.entries(obj)) {
    for (const [key, value] of Object.entries(entries)) out[`${section}.${key}`] = value;
  }
  return out;
}

function params(template: string): string[] {
  return Array.from(template.matchAll(/\{(\w+)\}/g), (m) => m[1]);
}
