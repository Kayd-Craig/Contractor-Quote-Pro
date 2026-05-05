import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Product } from "@/components/ProductCard";
import { ProductCard } from "@/components/ProductCard";
import { NEARBY_STORES, StoreNearMeCard } from "@/components/StoreNearMeCard";
import { useQuotes } from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";
import { useSearchProducts } from "@workspace/api-client-react";

type StoreFilter = "all" | "homedepot" | "lowes" | "amazon";
type TabMode = "stores" | "products";

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings } = useQuotes();
  const [tab, setTab] = useState<TabMode>("stores");
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [store, setStore] = useState<StoreFilter>((settings.preferredStore as StoreFilter) || "all");
  const inputRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const { data, isFetching } = useSearchProducts(
    { q: submitted, store: store as "homedepot" | "lowes" | "amazon" | "all" },
    {
      query: {
        enabled: tab === "products" && submitted.length >= 2,
        queryKey: ["products", submitted, store],
      },
    }
  );

  function handleSearch() {
    if (query.trim().length < 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubmitted(query.trim());
  }

  const STORE_FILTERS: { label: string; value: StoreFilter; color: string }[] = [
    { label: "All Stores", value: "all", color: colors.accent },
    { label: "Home Depot", value: "homedepot", color: colors.homedepot },
    { label: "Lowe's", value: "lowes", color: colors.lowes },
    { label: "Amazon", value: "amazon", color: colors.amazon },
  ];

  const zipCode = settings.zipCode;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Materials & Stores
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {zipCode ? `Near ${zipCode}` : "Search products · Find stores"}
        </Text>
      </View>

      {/* Tab switcher */}
      <View style={[styles.tabRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            tab === "stores" && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setTab("stores")}
        >
          <Feather
            name="map-pin"
            size={14}
            color={tab === "stores" ? colors.primary : colors.mutedForeground}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: tab === "stores" ? colors.primary : colors.mutedForeground },
            ]}
          >
            Stores Near Me
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            tab === "products" && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setTab("products")}
        >
          <Feather
            name="search"
            size={14}
            color={tab === "products" ? colors.primary : colors.mutedForeground}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: tab === "products" ? colors.primary : colors.mutedForeground },
            ]}
          >
            Search Products
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── STORES NEAR ME TAB ── */}
      {tab === "stores" && (
        <ScrollView
          contentContainerStyle={[
            styles.storesList,
            {
              paddingBottom:
                Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom,
            },
          ]}
        >
          {/* Zip code banner */}
          {zipCode ? (
            <View
              style={[
                styles.zipBanner,
                { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" },
              ]}
            >
              <Feather name="map-pin" size={14} color={colors.primary} />
              <Text style={[styles.zipBannerText, { color: colors.primary }]}>
                Showing stores near <Text style={{ fontFamily: "Inter_700Bold" }}>{zipCode}</Text>
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.zipBanner,
                { backgroundColor: colors.secondary, borderColor: colors.border },
              ]}
            >
              <Feather name="map-pin" size={14} color={colors.mutedForeground} />
              <Text style={[styles.zipBannerText, { color: colors.mutedForeground }]}>
                Add your zip code in Settings to see stores near you
              </Text>
            </View>
          )}

          <Text style={[styles.storesSectionLabel, { color: colors.mutedForeground }]}>
            {NEARBY_STORES.length} STORES WITH ONLINE PRESENCE
          </Text>

          {NEARBY_STORES.map((s) => (
            <StoreNearMeCard key={s.id} store={s} zipCode={zipCode} />
          ))}
        </ScrollView>
      )}

      {/* ── SEARCH PRODUCTS TAB ── */}
      {tab === "products" && (
        <View style={{ flex: 1 }}>
          {/* Search bar */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.background, borderBottomColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather name="search" size={18} color={colors.mutedForeground} />
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.foreground }]}
                placeholder="lumber, drywall, mulch, paint..."
                placeholderTextColor={colors.mutedForeground}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setQuery("");
                    setSubmitted("");
                  }}
                >
                  <Feather name="x-circle" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.searchBtn, { backgroundColor: colors.primary }]}
              onPress={handleSearch}
              activeOpacity={0.85}
            >
              <Feather name="search" size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>

          {/* Store filter */}
          <View
            style={[styles.storeFilter, { borderBottomColor: colors.border }]}
          >
            {STORE_FILTERS.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[
                  styles.storeBtn,
                  {
                    backgroundColor:
                      store === s.value ? s.color : colors.secondary,
                    borderColor: store === s.value ? s.color : colors.border,
                  },
                ]}
                onPress={() => {
                  setStore(s.value);
                  if (submitted) setSubmitted(query.trim());
                }}
              >
                <Text
                  style={[
                    styles.storeBtnText,
                    { color: store === s.value ? "#FFFFFF" : colors.foreground },
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Results */}
          {isFetching ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Searching stores...
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={[
                styles.list,
                {
                  paddingBottom:
                    Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom,
                },
              ]}
            >
              {data && submitted && (
                <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
                  {data.total} result{data.total !== 1 ? "s" : ""} for "{submitted}"
                </Text>
              )}

              {(data?.products ?? []).map((item) => (
                <ProductCard
                  key={item.id}
                  product={item as Product}
                  contractorDiscount={settings.contractorDiscount ?? 0}
                />
              ))}

              {submitted && (data?.products ?? []).length === 0 && (
                <View style={styles.empty}>
                  <Feather name="package" size={32} color={colors.mutedForeground} />
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                    No products found
                  </Text>
                  <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                    Try a different search term or switch stores
                  </Text>
                </View>
              )}

              {!submitted && (
                <View style={styles.empty}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
                    <Feather name="search" size={30} color={colors.mutedForeground} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                    Search materials
                  </Text>
                  <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                    Search lumber, flooring, paint, concrete and more from Home Depot and Lowe's
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 1 },

  tabRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  storesList: { padding: 16 },
  zipBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  zipBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  storesSectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 2,
  },

  searchBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  storeFilter: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  storeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  storeBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  list: { padding: 16 },
  resultCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  empty: {
    alignItems: "center",
    marginTop: 60,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
  },
});
