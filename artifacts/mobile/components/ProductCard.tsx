import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  unit: string;
  store: "homedepot" | "lowes" | "amazon";
  sku: string;
  category: string;
  inStock: boolean;
  contractorPrice?: number;
}

const STORE_DISPLAY: Record<
  Product["store"],
  { color: string; textColor: string; name: string }
> = {
  homedepot: { color: "#F96302", textColor: "#FFFFFF", name: "Home Depot" },
  lowes: { color: "#004990", textColor: "#FFFFFF", name: "Lowe's" },
  amazon: { color: "#FF9900", textColor: "#131A22", name: "Amazon" },
};

interface Props {
  product: Product;
  onAdd?: (product: Product) => void;
  compact?: boolean;
  contractorDiscount?: number;
}

export function ProductCard({ product, onAdd, compact, contractorDiscount = 0 }: Props) {
  const colors = useColors();

  const storeMeta = STORE_DISPLAY[product.store] ?? STORE_DISPLAY.homedepot;
  const storeColor = storeMeta.color;
  const storeTextColor = storeMeta.textColor;
  const storeName = storeMeta.name;

  const retailPrice = product.contractorPrice ?? product.price;
  const hasAccountDiscount = contractorDiscount > 0;
  const yourCost = hasAccountDiscount
    ? retailPrice * (1 - contractorDiscount / 100)
    : retailPrice;
  const savingsAmount = retailPrice - yourCost;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        compact && styles.compact,
      ]}
    >
      <View style={styles.left}>
        <View style={styles.badges}>
          <View style={[styles.storeBadge, { backgroundColor: storeColor }]}>
            <Text style={[styles.storeBadgeText, { color: storeTextColor }]}>{storeName}</Text>
          </View>
          <Text style={[styles.category, { color: colors.mutedForeground }]}>
            {product.category}
          </Text>
          {!product.inStock && (
            <View style={[styles.outStockBadge, { borderColor: colors.destructive }]}>
              <Text style={[styles.outStockText, { color: colors.destructive }]}>
                Out of Stock
              </Text>
            </View>
          )}
          {hasAccountDiscount && (
            <View style={[styles.discountBadge, { backgroundColor: colors.success + "18" }]}>
              <Feather name="scissors" size={9} color={colors.success} />
              <Text style={[styles.discountBadgeText, { color: colors.success }]}>
                {contractorDiscount}% off
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={[styles.brand, { color: colors.mutedForeground }]}>
          {product.brand} · SKU {product.sku}
        </Text>

        <View style={styles.priceBlock}>
          {hasAccountDiscount ? (
            <View style={styles.discountPriceRow}>
              <View>
                <Text style={[styles.yourCostLabel, { color: colors.success }]}>
                  Your Cost
                </Text>
                <View style={styles.yourCostRow}>
                  <Text style={[styles.yourCostPrice, { color: colors.success }]}>
                    ${yourCost.toFixed(2)}
                  </Text>
                  <Text style={[styles.perUnit, { color: colors.mutedForeground }]}>
                    /{product.unit}
                  </Text>
                </View>
              </View>
              <View style={styles.retailBlock}>
                <Text style={[styles.retailLabel, { color: colors.mutedForeground }]}>
                  Retail
                </Text>
                <Text style={[styles.retailPrice, { color: colors.mutedForeground }]}>
                  ${retailPrice.toFixed(2)}
                </Text>
                <Text style={[styles.savingsText, { color: colors.success }]}>
                  save ${savingsAmount.toFixed(2)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.priceRow}>
              <View>
                <Text style={[styles.price, { color: colors.primary }]}>
                  ${retailPrice.toFixed(2)}
                </Text>
                <Text style={[styles.perUnit, { color: colors.mutedForeground }]}>
                  per {product.unit}
                </Text>
              </View>
              {product.contractorPrice && (
                <View style={[styles.proTag, { backgroundColor: colors.accent + "15" }]}>
                  <Feather name="shield" size={11} color={colors.accent} />
                  <Text style={[styles.proTagText, { color: colors.accent }]}>
                    Pro Price
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {onAdd && (
        <TouchableOpacity
          style={[
            styles.addBtn,
            { backgroundColor: product.inStock ? colors.primary : colors.muted },
          ]}
          onPress={() => onAdd(product)}
          disabled={!product.inStock}
          activeOpacity={0.8}
        >
          <Feather
            name="plus"
            size={20}
            color={product.inStock ? colors.primaryForeground : colors.mutedForeground}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  compact: {
    marginBottom: 6,
    padding: 10,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  storeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  storeBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  category: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  outStockBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  outStockText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  discountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 19,
    marginTop: 2,
  },
  brand: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  priceBlock: {
    marginTop: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  perUnit: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  proTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proTagText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  discountPriceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  yourCostLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  yourCostRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  yourCostPrice: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  retailBlock: {
    alignItems: "flex-end",
    gap: 1,
  },
  retailLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  retailPrice: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "line-through",
  },
  savingsText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
