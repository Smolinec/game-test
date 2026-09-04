import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { availableUpgrades, canPrestige } from './src/engine/engine';
import { useGame } from './src/hooks/useGame';
import { MineScreen } from './src/ui/MineScreen';
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
  const { state, offline, actions } = useGame();
  const [tab, setTab] = useState<Tab>('mine');

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
        {tab === 'mine' && <MineScreen state={state} onTap={actions.tap} onBuy={actions.buy} />}
        {tab === 'upgrades' && <UpgradesScreen state={state} onBuy={actions.purchaseUpgrade} />}
        {tab === 'prestige' && (
          <PrestigeScreen state={state} onPrestige={actions.doPrestige} onBuyStardustUpgrade={actions.buyStardustUpgrade} />
        )}
        {tab === 'shop' && <ShopScreen state={state} onPurchase={actions.purchase} />}
        {tab === 'stats' && <StatsScreen state={state} onReset={() => void actions.resetGame()} />}
      </View>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      <OfflineModal result={offline} onClose={actions.dismissOffline} />
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
