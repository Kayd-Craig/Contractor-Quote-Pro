import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { QuoteCard } from "@/components/QuoteCard";
import type { Quote } from "@/context/QuoteContext";
import { useQuotes } from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";

export default function QuotesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { quotes, deleteQuote } = useQuotes();
  const [filter, setFilter] = useState<Quote["status"] | "all">("all");

  const filtered =
    filter === "all" ? quotes : quotes.filter((q) => q.status === filter);

  const topPad =
    Platform.OS === "web"
      ? Math.max(insets.top, 67)
      : insets.top;

  function handleNewQuote() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/new-quote");
  }

  function handleDelete(quote: Quote) {
    Alert.alert(
      "Delete Quote",
      `Delete the quote for ${quote.customerName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteQuote(quote.id);
          },
        },
      ]
    );
  }

  const FILTERS: { label: string; value: Quote["status"] | "all" }[] = [
    { label: "All", value: "all" },
    { label: "Draft", value: "draft" },
    { label: "Sent", value: "sent" },
    { label: "Accepted", value: "accepted" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.brandName, { color: colors.primary }]}>
            Quick Quote
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {quotes.length} quote{quotes.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
          onPress={handleNewQuote}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={20} color={colors.primaryForeground} />
          <Text style={[styles.newBtnText, { color: colors.primaryForeground }]}>
            New
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View
        style={[styles.filterBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterBtn,
              filter === f.value && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setFilter(f.value)}
          >
            <Text
              style={[
                styles.filterLabel,
                { color: filter === f.value ? colors.primary : colors.mutedForeground },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(q) => q.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom:
              Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom,
          },
        ]}
        scrollEnabled={!!filtered.length}
        renderItem={({ item }) => (
          <QuoteCard
            quote={item}
            onPress={() => router.push(`/quote/${item.id}`)}
            onLongPress={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View
              style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}
            >
              <Feather name="file-text" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No quotes yet
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Tap "New" to create your first quote on-site
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brandName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  newBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  filterBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  listContent: {
    padding: 16,
  },
  empty: {
    alignItems: "center",
    marginTop: 80,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
