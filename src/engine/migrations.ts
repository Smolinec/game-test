/**
 * Migrace uloženého stavu mezi verzemi formátu.
 *
 * Každý krok převádí surová data z verze N na verzi N+1. Kroky se aplikují
 * postupně, takže uložení z libovolné starší verze se dostane na aktuální.
 * Po migraci data ještě projdou validací v `deserialize`, takže migrace
 * nemusí řešit poškozené hodnoty, jen změny významu a nová pole.
 *
 * Při změně formátu: zvyš SAVE_VERSION, přidej krok do MIGRATIONS a test.
 */
export const SAVE_VERSION = 3;

type RawSave = Record<string, unknown>;
type MigrationStep = (data: RawSave) => RawSave;

/** Klíč je verze, ze které krok převádí. */
const MIGRATIONS: Record<number, MigrationStep> = {
  // v1 → v2: přibyl obchod (entitlements), hvězdná vylepšení a evidence
  // celkově získaného prachu. Starší hráči dostanou získaný prach rovný zůstatku.
  1: (data) => ({
    ...data,
    entitlements: Array.isArray(data.entitlements) ? data.entitlements : [],
    stardustUpgrades:
      data.stardustUpgrades && typeof data.stardustUpgrades === 'object' ? data.stardustUpgrades : {},
    stardustEarned:
      typeof data.stardustEarned === 'number' ? data.stardustEarned : typeof data.stardust === 'number' ? data.stardust : 0,
  }),
  // v2 → v3: úspěchy.
  2: (data) => ({
    ...data,
    achievements: Array.isArray(data.achievements) ? data.achievements : [],
  }),
};

export function saveVersionOf(data: RawSave): number {
  const v = data.version;
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 ? v : 1;
}

export interface MigrationResult {
  data: RawSave;
  fromVersion: number;
  /** Uložení z novější verze aplikace – načte se, co jde, ale může něco chybět. */
  fromFuture: boolean;
}

export function migrate(input: RawSave): MigrationResult {
  const fromVersion = saveVersionOf(input);
  let data: RawSave = { ...input };
  for (let v = fromVersion; v < SAVE_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (step) data = step(data);
  }
  return { data: { ...data, version: SAVE_VERSION }, fromVersion, fromFuture: fromVersion > SAVE_VERSION };
}
