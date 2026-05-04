import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { LineItem } from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  item: LineItem;
  onDelete: () => void;
}

export function LineItemRow({ item, onDelete }: Props) {
  const colors = useColors();

  const baseTotal = item.quantity * item.unitPrice;
  const markupAmt = baseTotal * (item.markupPercent / 100);
  const total = baseTotal + markupAmt;

  const isMaterial = item.type === "material";
  const storeColor =
    item.store === "homedepot"
      ? colors.homedepot
      : item.store === "lowes"
      ? colors.lowes
      : null;
  const storeName =
    item.store === "homedepot"
      ? "HD"
      : item.store === "lowes"
      ? "LWS"
      : null;

  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <View
        style={[
          styles.typeIcon,
          { backgroundColor: isMaterial ? colors.accent + "15" : colors.primary + "18" },
        ]}
      >
        <Feather
          name={isMaterial ? "package" : "clock"}
          size={14}
          color={isMaterial ? colors.accent : colors.primary}
        />
      </View>

      <View style={styles.middle}>
        <View style={styles.nameRow}>
          <Text style={[styles.desc, { color: colors.foreground }]} numberOfLines={1}>
            {item.description}
          </Text>
          {storeName && storeColor && (
            <View style={[styles.storeTag, { backgroundColor: storeColor }]}>
              <Text style={styles.storeTagText}>{storeName}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.detail, { color: colors.mutedForeground }]}>
          {item.quantity} {item.unit} × ${item.unitPrice.toFixed(2)} + {item.markupPercent}% markup
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.total, { color: colors.foreground }]}>
          ${total.toFixed(2)}
        </Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="trash-2" size={15} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  typeIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  middle: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  desc: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  storeTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  storeTagText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  detail: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  right: {
    alignItems: "flex-end",
    gap: 6,
  },
  total: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
