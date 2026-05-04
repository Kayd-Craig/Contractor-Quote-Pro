import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Customer } from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  customers: Customer[];
  onSelect: (customer: Customer) => void;
  onClose: () => void;
}

export function CustomerPicker({ visible, customers, onSelect, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom > 0 ? insets.bottom : 20;

  const filtered = search.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.phone ?? "").includes(search) ||
          (c.email ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  function handleSelect(customer: Customer) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(customer);
    setSearch("");
  }

  function handleClose() {
    setSearch("");
    onClose();
  }

  const timeAgo = (iso: string) => {
    const days = Math.floor(
      (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}yr ago`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              paddingBottom: bottomPad + 8,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>
                Saved Customers
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {customers.length} customer{customers.length !== 1 ? "s" : ""} — tap to auto-fill
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name, phone, or email…"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Feather name="x-circle" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          {/* Customer list */}
          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filtered.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="users" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No customers match "{search}"
                </Text>
              </View>
            ) : (
              filtered.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.customerCard,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                  onPress={() => handleSelect(c)}
                  activeOpacity={0.75}
                >
                  {/* Avatar */}
                  <View
                    style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}
                  >
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {c.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={styles.customerInfo}>
                    <Text
                      style={[styles.customerName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                    {c.phone ? (
                      <Text
                        style={[styles.customerDetail, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        {c.phone}
                        {c.email ? ` · ${c.email}` : ""}
                      </Text>
                    ) : c.email ? (
                      <Text
                        style={[styles.customerDetail, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        {c.email}
                      </Text>
                    ) : null}
                    <View style={styles.customerMeta}>
                      <View
                        style={[
                          styles.quotePill,
                          { backgroundColor: colors.accent + "15" },
                        ]}
                      >
                        <Feather name="file-text" size={10} color={colors.accent} />
                        <Text style={[styles.quotePillText, { color: colors.accent }]}>
                          {c.quoteCount} quote{c.quoteCount !== 1 ? "s" : ""}
                        </Text>
                      </View>
                      <Text
                        style={[styles.totalSpent, { color: colors.primary }]}
                      >
                        ${c.totalSpent.toFixed(0)} total
                      </Text>
                      <Text
                        style={[styles.lastDate, { color: colors.mutedForeground }]}
                      >
                        {timeAgo(c.lastQuoteDate)}
                      </Text>
                    </View>
                  </View>

                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 8 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
    height: 42,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  list: { flexGrow: 0 },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  customerInfo: { flex: 1, gap: 3 },
  customerName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  customerDetail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  customerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  quotePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  quotePillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  totalSpent: { fontSize: 12, fontFamily: "Inter_700Bold" },
  lastDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
