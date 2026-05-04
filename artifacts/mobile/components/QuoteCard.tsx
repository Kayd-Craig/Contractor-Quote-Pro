import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Quote } from "@/context/QuoteContext";
import { useQuotes } from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";
import { extractZipFromAddress } from "@/utils/extractZip";
import { getTaxRateForZip } from "@/utils/taxRates";

interface Props {
  quote: Quote;
  onPress: () => void;
  onLongPress?: () => void;
}

const STATUS_LABELS: Record<Quote["status"], string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
};

export function QuoteCard({ quote, onPress, onLongPress }: Props) {
  const colors = useColors();
  const { calculateTotals, settings } = useQuotes();
  const zip = extractZipFromAddress(quote.jobAddress, settings.zipCode);
  const taxInfo = zip ? getTaxRateForZip(zip) : null;
  const totals = calculateTotals(
    quote.lineItems,
    quote.markupOverride ?? settings.defaultMarkup,
    quote.discountAmount,
    quote.discountType,
    taxInfo?.rate ?? 0
  );

  const statusColor = {
    draft: colors.mutedForeground,
    sent: colors.accent,
    accepted: colors.success,
    declined: colors.destructive,
  }[quote.status];

  const date = new Date(quote.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[quote.status]}
          </Text>
        </View>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{date}</Text>
      </View>

      <Text style={[styles.customerName, { color: colors.foreground }]} numberOfLines={1}>
        {quote.customerName}
      </Text>
      <Text style={[styles.jobDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
        {quote.jobDescription}
      </Text>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.itemCount}>
          <Feather name="package" size={13} color={colors.mutedForeground} />
          <Text style={[styles.itemCountText, { color: colors.mutedForeground }]}>
            {quote.lineItems.length} item{quote.lineItems.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <Text style={[styles.total, { color: colors.primary }]}>
          ${totals.total.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  customerName: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  jobDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  itemCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  itemCountText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  total: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
});
