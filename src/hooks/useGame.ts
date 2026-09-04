import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  applyOfflineProgress,
  buyGenerator,
  buyStardustUpgrade as buyStardustUpgradeState,
  buyUpgrade,
  click,
  createInitialState,
  prestige,
  tick,
} from '../engine/engine';
import { applyPurchase } from '../engine/shop';
import { clearGame, loadGame, saveGame } from '../engine/storage';
import { GameState, OfflineResult } from '../engine/types';
import { purchaseProvider, PurchaseOutcome } from '../services/purchases';

/** Jak často se počítá herní tick (ms). */
const TICK_MS = 100;
/** Jak často se hra automaticky ukládá (ms). */
const AUTOSAVE_MS = 10_000;
/** Delší mezera mezi ticky se bere jako "hráč byl pryč" a počítá se offline postup. */
const OFFLINE_THRESHOLD_SECONDS = 5;
/** Pod touto dobou se souhrn offline postupu neukazuje (jen se tiše připíše). */
const OFFLINE_POPUP_MIN_SECONDS = 60;

export interface TapResult {
  gained: number;
  golden: boolean;
}

export interface GameActions {
  /** Klepnutí; vrací, kolik krystalů dalo a zda zabrala Zlatá žíla. */
  tap: () => TapResult;
  buyStardustUpgrade: (upgradeId: string) => void;
  buy: (generatorId: string, count: number) => void;
  purchaseUpgrade: (upgradeId: string) => void;
  doPrestige: () => void;
  /** Provede nákup přes aktuálního poskytovatele a při úspěchu aplikuje efekt. */
  purchase: (productId: string) => Promise<PurchaseOutcome>;
  resetGame: () => Promise<void>;
  dismissOffline: () => void;
}

export interface GameHook {
  state: GameState | null;
  offline: OfflineResult | null;
  actions: GameActions;
}

export function useGame(): GameHook {
  const [state, setState] = useState<GameState | null>(null);
  const [offline, setOffline] = useState<OfflineResult | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const [ready, setReady] = useState(false);

  const update = useCallback((fn: (s: GameState) => GameState) => {
    const current = stateRef.current;
    if (!current) return;
    const next = fn(current);
    if (next === current) return;
    stateRef.current = next;
    setState(next);
  }, []);

  const applyOffline = useCallback(
    (s: GameState, now: number): GameState => {
      const result = applyOfflineProgress(s, now);
      if (result.elapsedSeconds >= OFFLINE_POPUP_MIN_SECONDS && result.earned > 0) {
        setOffline(result);
      }
      return result.state;
    },
    [],
  );

  // Načtení uložené hry při startu.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const now = Date.now();
      const loaded = await loadGame(now);
      if (cancelled) return;
      const initial = loaded ? applyOffline(loaded, now) : createInitialState(now);
      stateRef.current = initial;
      setState(initial);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [applyOffline]);

  // Herní smyčka.
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      const now = Date.now();
      update((s) => {
        const dt = (now - s.lastSeenAt) / 1000;
        if (dt > OFFLINE_THRESHOLD_SECONDS) return applyOffline(s, now);
        return tick(s, dt, now);
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [ready, update, applyOffline]);

  // Automatické ukládání + uložení při přechodu do pozadí.
  useEffect(() => {
    if (!ready) return;
    const persist = () => {
      if (stateRef.current) void saveGame(stateRef.current);
    };
    const id = setInterval(persist, AUTOSAVE_MS);
    const sub = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (status === 'background' || status === 'inactive') persist();
    });
    return () => {
      clearInterval(id);
      sub.remove();
      persist();
    };
  }, [ready]);

  const tap = useCallback((): TapResult => {
    let result: TapResult = { gained: 0, golden: false };
    update((s) => {
      const outcome = click(s);
      result = { gained: outcome.gained, golden: outcome.golden };
      return outcome.state;
    });
    return result;
  }, [update]);
  const buyStardustUpgrade = useCallback(
    (upgradeId: string) => {
      update((s) => buyStardustUpgradeState(s, upgradeId));
      if (stateRef.current) void saveGame(stateRef.current);
    },
    [update],
  );
  const buy = useCallback(
    (generatorId: string, count: number) => update((s) => buyGenerator(s, generatorId, count)),
    [update],
  );
  const purchaseUpgrade = useCallback(
    (upgradeId: string) => update((s) => buyUpgrade(s, upgradeId)),
    [update],
  );
  const doPrestige = useCallback(() => {
    update((s) => prestige(s, Date.now()));
    if (stateRef.current) void saveGame(stateRef.current);
  }, [update]);
  const purchase = useCallback(
    async (productId: string): Promise<PurchaseOutcome> => {
      let outcome: PurchaseOutcome;
      try {
        outcome = await purchaseProvider.purchase(productId);
      } catch (error) {
        console.warn('Nákup selhal', error);
        outcome = 'error';
      }
      if (outcome === 'success') {
        update((s) => applyPurchase(s, productId));
        if (stateRef.current) void saveGame(stateRef.current);
      }
      return outcome;
    },
    [update],
  );
  const resetGame = useCallback(async () => {
    await clearGame();
    const fresh = createInitialState(Date.now());
    stateRef.current = fresh;
    setState(fresh);
    setOffline(null);
  }, []);
  const dismissOffline = useCallback(() => setOffline(null), []);

  return {
    state,
    offline,
    actions: { tap, buyStardustUpgrade, buy, purchaseUpgrade, doPrestige, purchase, resetGame, dismissOffline },
  };
}
