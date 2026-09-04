/**
 * Vrstva pro odměněná videa. Dnes běží v testovacím režimu: místo reklamy se
 * ukáže odpočet a odměna se připíše. Po založení účtu u AdMobu sem přibude
 * skutečný poskytovatel (react-native-google-mobile-ads) se stejným rozhraním.
 */
import { AdPlacement } from '../engine/ads';

export type AdOutcome = 'rewarded' | 'dismissed' | 'unavailable';

export interface RewardedAdProvider {
  readonly modeLabel: string;
  readonly isSandbox: boolean;
  /** Orientační délka „videa“ v ms, aby UI mohlo ukázat odpočet. */
  readonly durationMs: number;
  isReady(placement: AdPlacement): boolean;
  show(placement: AdPlacement): Promise<AdOutcome>;
}

export class MockRewardedAdProvider implements RewardedAdProvider {
  readonly modeLabel = 'Testovací reklama';
  readonly isSandbox = true;

  constructor(readonly durationMs: number = 5_000) {}

  isReady(_placement: AdPlacement): boolean {
    return true;
  }

  async show(_placement: AdPlacement): Promise<AdOutcome> {
    await new Promise((resolve) => setTimeout(resolve, this.durationMs));
    return 'rewarded';
  }
}

export const adProvider: RewardedAdProvider = new MockRewardedAdProvider();
