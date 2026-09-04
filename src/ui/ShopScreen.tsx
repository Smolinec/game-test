import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { productionPerSecond } from '../engine/engine';
import { formatNumber } from '../engine/format';
import { ownsProduct, ProductDef, PRODUCTS } from '../engine/shop';
import { GameState } from '../engine/types';
import { purchaseProvider, PurchaseOutcome } from '../services/purchases';
import { ConfirmModal } from './ConfirmModal';
import { Header } from './Header';
import { colors, radius, spacing } from './theme';

interface Props {
  state: GameState;
  onPurchase: (productId: string) => Promise<PurchaseOutcome>;
}

type Dialog =
  | { kind: 'confirm'; product: ProductDef }
  | { kind: 'result'; product: ProductDef; outcome: PurchaseOutcome };

export function ShopScreen({ state, onPurchase }: Props) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [busy, setBusy] = useState(false);

  const confirmPurchase = async () => {
    if (!dialog || dialog.kind !== 'confirm') return;
    setBusy(true);
    const outcome = await onPurchase(dialog.product.id);
    setBusy(false);
    setDialog({ kind: 'result', product: dialog.product, outcome });
  };

  return (
    <View style={styles.container}>
      <Header crystals={state.crystals} perSecond={productionPerSecond(state)} stardust={state.stardust} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>🛒 Obchod</Text>
        {purchaseProvider.isSandbox && (
          <View style={styles.sandbox}>
            <Text style={styles.sandboxTitle}>🧪 {purchaseProvider.modeLabel}</Text>
            <Text style={styles.sandboxText}>
              Nákupy se neúčtují. Slouží k vyzkoušení nabídky a efektů. Skutečné platby přes App Store a Google
              Play napojíme později.
            </Text>
          </View>
        )}

        <Text style={styles.section}>Trvalá vylepšení</Text>
        {PRODUCTS.filter((p) => p.kind === 'entitlement').map((p) => (
          <ProductCard key={p.id} product={p} owned={ownsProduct(state, p.id)} onPress={() => setDialog({ kind: 'confirm', product: p })} />
        ))}

        <Text style={styles.section}>Balíčky</Text>
        {PRODUCTS.filter((p) => p.kind === 'consumable').map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            owned={false}
            hint={p.effect.type === 'timeWarp' ? `Teď by dal 💎 ${formatNumber(productionPerSecond(state) * p.effect.hours * 3600)}` : undefined}
            onPress={() => setDialog({ kind: 'confirm', product: p })}
          />
        ))}

        <Pressable disabled style={styles.restore} accessibilityRole="button" accessibilityState={{ disabled: true }}>
          <Text style={styles.restoreText}>Obnovit nákupy · již brzy</Text>
        </Pressable>
      </ScrollView>

      <ConfirmModal
        visible={dialog?.kind === 'confirm'}
        icon={dialog?.product.icon}
        title={dialog?.product.name ?? ''}
        message={dialog ? `${dialog.product.description}\n\nCena: ${dialog.product.priceLabel}` : ''}
        note={purchaseProvider.isSandbox ? `${purchaseProvider.modeLabel} · nic se neúčtuje` : undefined}
        confirmLabel={dialog ? `Zaplatit ${dialog.product.priceLabel}` : ''}
        busy={busy}
        onConfirm={() => void confirmPurchase()}
        onCancel={() => setDialog(null)}
      />
      <ConfirmModal
        visible={dialog?.kind === 'result'}
        icon={dialog?.kind === 'result' && dialog.outcome === 'success' ? '✅' : '⚠️'}
        title={dialog?.kind === 'result' ? resultTitle(dialog.outcome) : ''}
        message={dialog?.kind === 'result' ? resultMessage(dialog.product, dialog.outcome) : ''}
        confirmLabel="Zavřít"
        cancelLabel="Zpět do obchodu"
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
    </View>
  );
}

function resultTitle(outcome: PurchaseOutcome): string {
  if (outcome === 'success') return 'Hotovo!';
  if (outcome === 'cancelled') return 'Nákup zrušen';
  return 'Nákup se nepovedl';
}

function resultMessage(product: ProductDef, outcome: PurchaseOutcome): string {
  if (outcome === 'success') {
    switch (product.effect.type) {
      case 'stardust':
        return `Přibylo ti ✨ ${product.effect.amount} hvězdného prachu. Bonus k produkci platí okamžitě.`;
      case 'timeWarp':
        return `Kolonie právě odpracovala ${product.effect.hours} hodiny. Krystaly jsou na účtu.`;
      case 'entitlement':
        return `${product.name} je aktivní a zůstane ti i po prestiži.`;
    }
  }
  if (outcome === 'cancelled') return 'Nic se nestalo, nákup jsi zrušil.';
  return 'Obchod neodpověděl. Zkus to prosím za chvíli znovu.';
}

function ProductCard({
  product,
  owned,
  hint,
  onPress,
}: {
  product: ProductDef;
  owned: boolean;
  hint?: string;
  onPress: () => void;
}) {
  return (
    <View style={[styles.card, product.featured && styles.cardFeatured]}>
      {product.featured && !owned && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>NEJOBLÍBENĚJŠÍ</Text>
        </View>
      )}
      <View style={styles.cardRow}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>{product.icon}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.description}>{product.description}</Text>
          {!!hint && <Text style={styles.hint}>{hint}</Text>}
        </View>
      </View>
      <Pressable
        onPress={onPress}
        disabled={owned}
        accessibilityRole="button"
        accessibilityLabel={owned ? `${product.name} vlastníš` : `Koupit ${product.name} za ${product.priceLabel}`}
        style={({ pressed }) => [styles.buy, owned && styles.buyOwned, pressed && !owned && styles.buyPressed]}
      >
        <Text style={[styles.buyText, owned && styles.buyOwnedText]}>{owned ? '✓ Vlastníš' : product.priceLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heading: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  sandbox: {
    backgroundColor: 'rgba(255,209,102,0.12)',
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: 4,
  },
  sandboxTitle: {
    color: colors.gold,
    fontWeight: '800',
    fontSize: 14,
  },
  sandboxText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  section: {
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardFeatured: {
    borderColor: colors.accent,
  },
  featuredBadge: {
    position: 'absolute',
    top: -9,
    right: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  featuredText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 26,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  hint: {
    color: colors.gold,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  buy: {
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  buyPressed: {
    opacity: 0.85,
  },
  buyOwned: {
    backgroundColor: colors.surfaceAlt,
  },
  buyText: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 15,
  },
  buyOwnedText: {
    color: colors.success,
  },
  restore: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    opacity: 0.6,
  },
  restoreText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
});
