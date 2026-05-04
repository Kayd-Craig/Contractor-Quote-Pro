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
  store: "homedepot" | "lowes";
  sku: string;
  category: string;
  inStock: boolean;
  contractorPrice?: number;
}

interface Props {
  product: Product;
  onAdd?: (product: Product) => void;
  compact?: boolean;
}

export function ProductCard({ product, onAdd, compact }: Props) {
  const colors = useColors();

  const storeColor =
    product.store === "homedepot" ? colors.homedepot : colors.lowes;
  const storeName =
    product.store === "homedepot" ? "Home Depot" : "Lowe's";

  const displayPrice = product.contractorPrice ?? product.price;

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
            <Text style={styles.storeBadgeText}>{storeName}</Text>
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
        </View>

        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={[styles.brand, { color: colors.mutedForeground }]}>
          {product.brand} · SKU {product.sku}
        </Text>

        <View style={styles.priceRow}>
          <View>
            <Text style={[styles.price, { color: colors.primary }]}>
              ${displayPrice.toFixed(2)}
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
      </View>

      {onAdd && (
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: product.inStock ? colors.primary : colors.muted }]}
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
    color: "#FFFFFF",
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
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
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
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
