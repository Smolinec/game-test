/**
 * Vrstva pro nákupy v aplikaci. Dnes běží v testovacím režimu: nákup se jen
 * nasimuluje a nic se neúčtuje. Po založení účtů v App Store Connect a Google
 * Play Console sem přibude skutečný poskytovatel (např. RevenueCat), UI
 * zůstane stejné.
 */

export type PurchaseOutcome = 'success' | 'cancelled' | 'error';

export interface PurchaseProvider {
  /** Lidsky čitelný název režimu, zobrazuje se v obchodě. */
  readonly modeLabel: string;
  /** True, když se nic neúčtuje. */
  readonly isSandbox: boolean;
  purchase(productId: string): Promise<PurchaseOutcome>;
  restore(): Promise<string[]>;
}

/** Simulovaný poskytovatel: chvíli „komunikuje s obchodem“ a pak nákup potvrdí. */
export class MockPurchaseProvider implements PurchaseProvider {
  readonly modeLabel = 'Testovací režim';
  readonly isSandbox = true;

  constructor(private readonly delayMs: number = 900) {}

  async purchase(_productId: string): Promise<PurchaseOutcome> {
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    return 'success';
  }

  async restore(): Promise<string[]> {
    return [];
  }
}

export const purchaseProvider: PurchaseProvider = new MockPurchaseProvider();
