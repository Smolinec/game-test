import { buyGenerator, createInitialState, newlyVisibleGenerators, visibleGeneratorIds } from '../src/engine/engine';

const NOW = 1_700_000_000_000;

describe('odemykání zařízení', () => {
  it('nový hráč vidí jen první zařízení', () => {
    expect(visibleGeneratorIds(createInitialState(NOW))).toEqual(['drone']);
  });

  it('koupě odemkne další zařízení a rozdíl ho vrátí právě jednou', () => {
    const before = { ...createInitialState(NOW), crystals: 1000, runCrystals: 50, allTimeCrystals: 1000 };
    const after = buyGenerator(before, 'drone', 1);
    expect(visibleGeneratorIds(after)).toEqual(['drone', 'drill']);
    expect(newlyVisibleGenerators(before, after)).toEqual(['drill']);
    expect(newlyVisibleGenerators(after, after)).toEqual([]);
    expect(newlyVisibleGenerators(after, before)).toEqual([]);
  });

  it('vytěžené krystaly odemknou zařízení i bez koupě předchozího', () => {
    const rich = { ...createInitialState(NOW), crystals: 0, runCrystals: 200, allTimeCrystals: 200 };
    expect(visibleGeneratorIds(rich)).toEqual(['drone', 'drill']);
  });
});
