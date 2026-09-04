import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GENERATORS } from '../engine/data';
import {
  clickValue,
  generatorCost,
  generatorProduction,
  isGeneratorVisible,
  maxAffordable,
  ownedCount,
  productionPerSecond,
} from '../engine/engine';
import { GameState } from '../engine/types';
import { AmountSelector, BuyAmount } from './AmountSelector';
import { ClickButton } from './ClickButton';
import { GeneratorRow } from './GeneratorRow';
import { Header } from './Header';
import { colors, spacing } from './theme';

interface Props {
  state: GameState;
  onTap: () => void;
  onBuy: (generatorId: string, count: number) => void;
}

export function MineScreen({ state, onTap, onBuy }: Props) {
  const [amount, setAmount] = useState<BuyAmount>(1);
  const perSecond = productionPerSecond(state);
  const tapValue = clickValue(state);

  const handleBuy = useCallback(
    (generatorId: string, count: number) => {
      if (count > 0) onBuy(generatorId, count);
    },
    [onBuy],
  );

  return (
    <View style={styles.container}>
      <Header crystals={state.crystals} perSecond={perSecond} stardust={state.stardust} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ClickButton value={tapValue} onTap={onTap} />
        <AmountSelector value={amount} onChange={setAmount} />
        {GENERATORS.map((def, index) => {
          if (!isGeneratorVisible(state, index)) return null;
          const affordableMax = maxAffordable(state, def.id);
          const buyCount = amount === 'max' ? Math.max(1, affordableMax) : amount;
          const cost = generatorCost(state, def.id, buyCount);
          return (
            <GeneratorRow
              key={def.id}
              def={def}
              owned={ownedCount(state, def.id)}
              production={generatorProduction(state, def.id)}
              buyCount={buyCount}
              cost={cost}
              affordable={affordableMax >= buyCount}
              onBuy={() => handleBuy(def.id, buyCount)}
            />
          );
        })}
        <Text style={styles.footer}>Další zařízení se odemkne, jakmile koupíš to předchozí.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: spacing.xl,
  },
  footer: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
});
