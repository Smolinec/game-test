import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { productionPerSecond } from '../engine/engine';
import { formatNumber } from '../engine/format';
import { ownsProduct, ProductDef, PRODUCTS } from '../engine/shop';
import { GameState } from '../engine/types';
import { Translator, useT } from '../i18n';
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
  const tr = useT();
  const { t, name, description } = tr;
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [busy, setBusy] = useState(false);

  const confirmPurchase = async () => {
    if (!dialog || dialog.kind !== 'confirm') return;
    setBusy(true);
    const outcome = await onPurchase(dialog.product.id);
    setBusy(false);
    setDialog({ kind: 'result', product: dialog.product, outcome });
  };

  const perSecond = productionPerSecond(state);

  return (
    <View style={styles.container}>
      <Header crystals={state.crystals} perSecond={perSecond} stardust={state.stardust} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>{t('shop.title')}</Text>
        {purchaseProvider.isSandbox && (
          <View style={styles.sandbox}>
            <Text style={styles.sandboxTitle}>{t('shop.sandboxTitle')}</Text>
            <Text style={styles.sandboxText}>{t('shop.sandboxText')}</Text>
          </View>
        )}

        <Text style={styles.section}>{t('shop.permanent')}</Text>
        {PRODUCTS.filter((p) => p.kind === 'entitlement').map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            owned={ownsProduct(state, p.id)}
            onPress={() => setDialog({ kind: 'confirm', product: p })}
            tr={tr}
          />
        ))}

        <Text style={styles.section}>{t('shop.packs')}</Text>
        {PRODUCTS.filter((p) => p.kind === 'consumable').map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            owned={false}
            hint={
              p.effect.type === 'timeWarp'
                ? t('shop.timeWarpHint', { amount: formatNumber(perSecond * p.effect.hours * 3600) })
                : undefined
            }
            onPress={() => setDialog({ kind: 'confirm', product: p })}
            tr={tr}
          />
        ))}

        <Pressable disabled style={styles.restore} accessibilityRole="button" accessibilityState={{ disabled: true }}>
          <Text style={styles.restoreText}>{t('shop.restore')}</Text>
        </Pressable>
      </ScrollView>

      <ConfirmModal
        visible={dialog?.kind === 'confirm'}
        icon={dialog?.product.icon}
        title={dialog ? name('product', dialog.product) : ''}
        message={dialog ? `${description('product', dialog.product)}\n\n${t('shop.price', { price: dialog.product.priceLabel })}` : ''}
        note={purchaseProvider.isSandbox ? t('shop.sandboxNote') : undefined}
        confirmLabel={dialog ? t('shop.pay', { price: dialog.product.priceLabel }) : ''}
        busy={busy}
        onConfirm={() => void confirmPurchase()}
        onCancel={() => setDialog(null)}
      />
      <ConfirmModal
        visible={dialog?.kind === 'result'}
        icon={dialog?.kind === 'result' && dialog.outcome === 'success' ? '✅' : '⚠️'}
        title={dialog?.kind === 'result' ? resultTitle(tr, dialog.outcome) : ''}
        message={dialog?.kind === 'result' ? resultMessage(tr, dialog.product, dialog.outcome) : ''}
        confirmLabel={t('common.close')}
        cancelLabel={t('shop.backToShop')}
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
    </View>
  );
}

function resultTitle({ t }: Translator, outcome: PurchaseOutcome): string {
  if (outcome === 'success') return t('shop.resultDone');
  if (outcome === 'cancelled') return t('shop.resultCancelled');
  return t('shop.resultFailed');
}

function resultMessage({ t, name }: Translator, product: ProductDef, outcome: PurchaseOutcome): string {
  if (outcome === 'success') {
    switch (product.effect.type) {
      case 'stardust':
        return t('shop.msgStardust', { amount: product.effect.amount });
      case 'timeWarp':
        return t('shop.msgTimeWarp', { hours: product.effect.hours });
      case 'entitlement':
        return t('shop.msgEntitlement', { name: name('product', product) });
    }
  }
  if (outcome === 'cancelled') return t('shop.msgCancelled');
  return t('shop.msgFailed');
}

function ProductCard({
  product,
  owned,
  hint,
  onPress,
  tr,
}: {
  product: ProductDef;
  owned: boolean;
  hint?: string;
  onPress: () => void;
  tr: Translator;
}) {
  const { t, name, description } = tr;
  const title = name('product', product);
  return (
    <View style={[styles.card, product.featured && styles.cardFeatured]}>
      {product.featured && !owned && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>{t('shop.featured')}</Text>
        </View>
      )}
      <View style={styles.cardRow}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>{product.icon}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{title}</Text>
          <Text style={styles.description}>{description('product', product)}</Text>
          {!!hint && <Text style={styles.hint}>{hint}</Text>}
        </View>
      </View>
      <Pressable
        onPress={onPress}
        disabled={owned}
        accessibilityRole="button"
        accessibilityLabel={owned ? t('shop.ownedLabel', { name: title }) : t('shop.buyLabel', { name: title, price: product.priceLabel })}
        style={({ pressed }) => [styles.buy, owned && styles.buyOwned, pressed && !owned && styles.buyPressed]}
      >
        <Text style={[styles.buyText, owned && styles.buyOwnedText]}>{owned ? t('shop.owned') : product.priceLabel}</Text>
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
