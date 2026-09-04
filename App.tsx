import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { dailyStatus, localDayNumber } from './src/engine/daily';
import { availableUpgrades, canPrestige } from './src/engine/engine';
import { useGame } from './src/hooks/useGame';
import { AchievementToast } from './src/ui/AchievementToast';
import { DailyRewardModal } from './src/ui/DailyRewardModal';
import { MineScreen } from './src/ui/MineScreen';
import { MockAdOverlay } from './src/ui/MockAdOverlay';
import { OfflineModal } from './src/ui/OfflineModal';
import { PrestigeScreen } from './src/ui/PrestigeScreen';
import { ShopScreen } from './src/ui/ShopScreen';
import { StatsScreen } from './src/ui/StatsScreen';
import { Tab, TabBar, TabItem } from './src/ui/TabBar';
import { colors } from './src/ui/theme';
import { UpgradesScreen } from './src/ui/UpgradesScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <Game />
    </SafeAreaProvider>
  );
}

function Game() {
  const { state, offline, unlockedAchievements, adPlaying, actions } = useGame();
  const [tab, setTab] = useState<Tab>('mine');
  // Den, pro který hráč odložil denní odměnu tlačítkem „Později“.
  const [dailyPostponedDay, setDailyPostponedDay] = useState<number | null>(null);
  const now = Date.now();
  const daily = state && offline === null && dailyPostponedDay !== localDayNumber(now) ? dailyStatus(state, now) : null;

  const affordableUpgrades = useMemo(
    () => (state ? availableUpgrades(state).filter((u) => u.cost <= state.crystals).length : 0),
    [state],
  );

  const tabs: TabItem[] = [
    { key: 'mine', label: 'Těžba', icon: '💎' },
    { key: 'upgrades', label: 'Vylepšení', icon: '⬆️', badge: affordableUpgrades },
    { key: 'prestige', label: 'Prestiž', icon: '✨', badge: state && canPrestige(state) ? 1 : 0 },
    { key: 'shop', label: 'Obchod', icon: '🛒' },
    { key: 'stats', label: 'Info', icon: '📊' },
  ];

  if (!state) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Načítám kolonii…</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {tab === 'mine' && (
          <MineScreen state={state} onTap={actions.tap} onBuy={actions.buy} onWatchBoostAd={() => void actions.watchAd('boost')} />
        )}
        {tab === 'upgrades' && <UpgradesScreen state={state} onBuy={actions.purchaseUpgrade} />}
        {tab === 'prestige' && (
          <PrestigeScreen
            state={state}
            onPrestige={actions.doPrestige}
            onBuyStardustUpgrade={actions.buyStardustUpgrade}
            onAscendGalaxy={actions.doAscendGalaxy}
          />
        )}
        {tab === 'shop' && <ShopScreen state={state} onPurchase={actions.purchase} />}
        {tab === 'stats' && <StatsScreen state={state} onReset={() => void actions.resetGame()} />}
      </View>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      <AchievementToast achievement={unlockedAchievements[0] ?? null} onDone={actions.dismissAchievement} />
      <OfflineModal result={offline} onClose={actions.dismissOffline} onDouble={() => void actions.watchAd('double_offline')} />
      <MockAdOverlay visible={adPlaying !== null} />
      <DailyRewardModal status={daily} onClaim={actions.claimDaily} onLater={() => setDailyPostponedDay(localDayNumber(Date.now()))} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
  },
});
