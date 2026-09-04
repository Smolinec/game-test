import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AchievementDef, checkAchievements } from '../engine/achievements';
import {
  applyOfflineProgress,
  ascendGalaxy,
  buyGenerator,
  buyStardustUpgrade as buyStardustUpgradeState,
  buyUpgrade,
  click,
  createInitialState,
  prestige,
  tick,
} from '../engine/engine';
import { AdPlacement, doubleOfflineReward, startBoost } from '../engine/ads';
import { claimDaily } from '../engine/daily';
import { applyPurchase } from '../engine/shop';
import { clearGame, loadGame, saveGame } from '../engine/storage';
import { GameState, OfflineResult } from '../engine/types';
import { adProvider, AdOutcome } from '../services/ads';
import { playSound } from '../services/sound';
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
  doAscendGalaxy: () => void;
  /** Provede nákup přes aktuálního poskytovatele a při úspěchu aplikuje efekt. */
  purchase: (productId: string) => Promise<PurchaseOutcome>;
  resetGame: () => Promise<void>;
  dismissOffline: () => void;
  /** Odebere první úspěch z fronty k zobrazení. */
  dismissAchievement: () => void;
  claimDaily: () => void;
  /** Přehraje odměněné video a při úspěchu připíše odměnu pro dané umístění. */
  watchAd: (placement: AdPlacement) => Promise<AdOutcome>;
}

export interface GameHook {
  state: GameState | null;
  offline: OfflineResult | null;
  /** Nově odemčené úspěchy čekající na zobrazení (nejstarší první). */
  unlockedAchievements: AchievementDef[];
  /** Umístění reklamy, která právě „běží“, jinak null. */
  adPlaying: AdPlacement | null;
  actions: GameActions;
}

export function useGame(): GameHook {
  const [state, setState] = useState<GameState | null>(null);
  const [offline, setOffline] = useState<OfflineResult | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementDef[]>([]);
  const [adPlaying, setAdPlaying] = useState<AdPlacement | null>(null);
  const offlineRef = useRef<OfflineResult | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const [ready, setReady] = useState(false);

  /** Aplikuje přechod stavu; vrací true, když se stav skutečně změnil. */
  const update = useCallback((fn: (s: GameState) => GameState): boolean => {
    const current = stateRef.current;
    if (!current) return false;
    const next = fn(current);
    if (next === current) return false;
    const checked = checkAchievements(next);
    if (checked.unlocked.length > 0) setUnlockedAchievements((q) => [...q, ...checked.unlocked]);
    stateRef.current = checked.state;
    setState(checked.state);
    return true;
  }, []);

  const applyOffline = useCallback(
    (s: GameState, now: number): GameState => {
      const result = applyOfflineProgress(s, now);
      if (result.elapsedSeconds >= OFFLINE_POPUP_MIN_SECONDS && result.earned > 0) {
        offlineRef.current = result;
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
      // Úspěchy přidané v novější verzi hry se doplní i hráčům, kteří je splnili dřív.
      const checked = checkAchievements(initial);
      if (checked.unlocked.length > 0) setUnlockedAchievements(checked.unlocked);
      stateRef.current = checked.state;
      setState(checked.state);
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
    playSound(result.golden ? 'golden' : 'tap');
    return result;
  }, [update]);
  const buyStardustUpgrade = useCallback(
    (upgradeId: string) => {
      if (!update((s) => buyStardustUpgradeState(s, upgradeId))) return;
      playSound('upgrade');
      if (stateRef.current) void saveGame(stateRef.current);
    },
    [update],
  );
  const buy = useCallback(
    (generatorId: string, count: number) => {
      if (update((s) => buyGenerator(s, generatorId, count))) playSound('buy');
    },
    [update],
  );
  const purchaseUpgrade = useCallback(
    (upgradeId: string) => {
      if (update((s) => buyUpgrade(s, upgradeId))) playSound('upgrade');
    },
    [update],
  );
  const doPrestige = useCallback(() => {
    if (!update((s) => prestige(s, Date.now()))) return;
    playSound('prestige');
    if (stateRef.current) void saveGame(stateRef.current);
  }, [update]);
  const doAscendGalaxy = useCallback(() => {
    if (!update((s) => ascendGalaxy(s, Date.now()))) return;
    playSound('prestige');
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
        playSound('buy');
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
    setUnlockedAchievements([]);
  }, []);
  const dismissOffline = useCallback(() => {
    offlineRef.current = null;
    setOffline(null);
  }, []);
  const dismissAchievement = useCallback(() => setUnlockedAchievements((q) => q.slice(1)), []);
  const watchAd = useCallback(
    async (placement: AdPlacement): Promise<AdOutcome> => {
      if (adPlaying) return 'unavailable';
      setAdPlaying(placement);
      let outcome: AdOutcome;
      try {
        outcome = await adProvider.show(placement);
      } catch (error) {
        console.warn('Reklama selhala', error);
        outcome = 'unavailable';
      }
      setAdPlaying(null);
      if (outcome !== 'rewarded') return outcome;
      if (placement === 'boost') {
        update((s) => startBoost(s, Date.now()));
      } else if (placement === 'double_offline') {
        const pending = offlineRef.current;
        if (pending && !pending.doubled) {
          update((s) => doubleOfflineReward(s, pending.earned));
          const doubled = { ...pending, earned: pending.earned * 2, doubled: true };
          offlineRef.current = doubled;
          setOffline(doubled);
        }
      }
      if (stateRef.current) void saveGame(stateRef.current);
      return outcome;
    },
    [adPlaying, update],
  );
  const claimDailyReward = useCallback(() => {
    update((s) => claimDaily(s, Date.now()));
    if (stateRef.current) void saveGame(stateRef.current);
  }, [update]);

  return {
    state,
    offline,
    unlockedAchievements,
    adPlaying,
    actions: {
      tap,
      buyStardustUpgrade,
      buy,
      purchaseUpgrade,
      doPrestige,
      doAscendGalaxy,
      purchase,
      resetGame,
      dismissOffline,
      dismissAchievement,
      claimDaily: claimDailyReward,
      watchAd,
    },
  };
}
