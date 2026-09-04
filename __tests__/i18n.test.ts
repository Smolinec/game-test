import { ACHIEVEMENTS } from '../src/engine/achievements';
import { GENERATORS, UPGRADES } from '../src/engine/data';
import { formatNumber, setNumberLocale } from '../src/engine/format';
import { PRODUCTS } from '../src/engine/shop';
import { STARDUST_UPGRADES } from '../src/engine/stardust';
import { interpolate, parseSettings, translate, translateData } from '../src/i18n';
import { cs, en } from '../src/i18n/strings';

describe('překlady rozhraní', () => {
  it('interpolace doplní parametry a neznámé nechá', () => {
    expect(interpolate('Ahoj {name}, máš {n} krystalů', { name: 'Jirko', n: 5 })).toBe('Ahoj Jirko, máš 5 krystalů');
    expect(interpolate('{missing}', {})).toBe('{missing}');
  });

  it('oba jazyky mají stejné klíče a stejné parametry', () => {
    const csFlat = flatten(cs);
    const enFlat = flatten(en);
    expect(Object.keys(enFlat).sort()).toEqual(Object.keys(csFlat).sort());
    for (const key of Object.keys(csFlat)) {
      expect(params(enFlat[key]).sort()).toEqual(params(csFlat[key]).sort());
    }
  });

  it('translate vrací text podle jazyka a klíč při chybě', () => {
    expect(translate('cs', 'tabs.mine')).toBe('Těžba');
    expect(translate('en', 'tabs.mine')).toBe('Mine');
    expect(translate('en', 'tap.perTap', { value: '2' })).toBe('+2 per tap');
    expect(translate('en', 'nope.nothing')).toBe('nope.nothing');
  });
});

describe('překlady herních dat', () => {
  it('každé zařízení, vylepšení, produkt, hvězdné vylepšení a úspěch má anglický název', () => {
    for (const g of GENERATORS) {
      const t = translateData('en', 'generator', g);
      expect(t.name).not.toBe(g.name);
      expect(t.description.length).toBeGreaterThan(5);
    }
    for (const u of UPGRADES) {
      const t = translateData('en', 'upgrade', u);
      expect(t.name).not.toBe(u.name);
    }
    for (const p of PRODUCTS) expect(translateData('en', 'product', p).name).not.toBe(p.name);
    for (const s of STARDUST_UPGRADES) expect(translateData('en', 'stardustUpgrade', s).name).not.toBe(s.name);
    for (const a of ACHIEVEMENTS) expect(translateData('en', 'achievement', a).name).not.toBe(a.name);
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

  it('formát čísel respektuje jazyk', () => {
    setNumberLocale('en');
    expect(formatNumber(12_345)).toBe('12.35K');
    setNumberLocale('cs');
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
