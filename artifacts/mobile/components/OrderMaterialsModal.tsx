import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React, { useMemo } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { LineItem } from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";

type StoreKey = "amazon" | "homedepot" | "lowes" | "other";

interface StoreGroupMeta {
  key: StoreKey;
  label: string;
  color: string;
  textColor: string;
  initials: string;
  hasAutoCart: boolean;
  description: string;
}

const STORE_META: Record<StoreKey, StoreGroupMeta> = {
  amazon: {
    key: "amazon",
    label: "Amazon",
    color: "#FF9900",
    textColor: "#131A22",
    initials: "AMZ",
    hasAutoCart: true,
    description: "Builds your Amazon cart automatically",
  },
  homedepot: {
    key: "homedepot",
    label: "Home Depot",
    color: "#F96302",
    textColor: "#FFFFFF",
    initials: "HD",
    hasAutoCart: false,
    description: "Opens each item pre-searched (add manually)",
  },
  lowes: {
    key: "lowes",
    label: "Lowe's",
    color: "#004990",
    textColor: "#FFFFFF",
    initials: "LW",
    hasAutoCart: false,
    description: "Opens each item pre-searched (add manually)",
  },
  other: {
    key: "other",
    label: "Other / Not Tagged",
    color: "#6B7280",
    textColor: "#FFFFFF",
    initials: "•••",
    hasAutoCart: false,
    description: "No store assigned — use list to shop manually",
  },
};

function classifyStore(raw?: string | null): StoreKey {
  const s = (raw || "").toLowerCase().trim();
  if (s === "amazon" || s.includes("amazon")) return "amazon";
  if (s === "homedepot" || s.includes("home depot")) return "homedepot";
  if (s === "lowes" || s.includes("lowe")) return "lowes";
  return "other";
}

function isAmazonAsin(sku?: string | null): boolean {
  if (!sku) return false;
  return /^[A-Z0-9]{10}$/.test(sku.trim().toUpperCase());
}

function buildAmazonCartUrl(items: LineItem[]): string {
  const params: string[] = [];
  let idx = 1;
  for (const it of items) {
    const asin = (it.sku || "").trim().toUpperCase();
    if (!isAmazonAsin(asin)) continue;
    const qty = Math.max(1, Math.ceil(it.quantity || 1));
    params.push(`ASIN.${idx}=${asin}`);
    params.push(`Quantity.${idx}=${qty}`);
    idx++;
  }
  if (params.length === 0) return "";
  return `https://www.amazon.com/gp/aws/cart/add.html?${params.join("&")}`;
}

function buildAmazonSearchUrl(item: LineItem): string {
  const q = encodeURIComponent(item.description.slice(0, 80));
  return `https://www.amazon.com/s?k=${q}&i=tools`;
}

function buildHomeDepotUrl(item: LineItem): string {
  const sku = (item.sku || "").trim();
  if (sku && /^\d+$/.test(sku)) {
    return `https://www.homedepot.com/p/${sku}`;
  }
  const q = encodeURIComponent(item.description.slice(0, 80));
  return `https://www.homedepot.com/s/${q}`;
}

function buildLowesUrl(item: LineItem): string {
  const q = encodeURIComponent(item.description.slice(0, 80));
  return `https://www.lowes.com/search?searchTerm=${q}`;
}

function formatItem(item: LineItem): string {
  const qty = `${item.quantity} ${item.unit || "ea"}`;
  return `• ${item.description} — ${qty}`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  materials: LineItem[];
  customerName?: string;
  jobAddress?: string;
}

export function OrderMaterialsModal({
  visible,
  onClose,
  materials,
  customerName,
  jobAddress,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const groups = useMemo(() => {
    const map = new Map<StoreKey, LineItem[]>();
    for (const item of materials) {
      const key = classifyStore(item.store);
      const arr = map.get(key) || [];
      arr.push(item);
      map.set(key, arr);
    }
    const order: StoreKey[] = ["amazon", "homedepot", "lowes", "other"];
    return order
      .filter((k) => map.has(k))
      .map((k) => ({ meta: STORE_META[k], items: map.get(k)! }));
  }, [materials]);

  function handleShopAmazon(items: LineItem[]) {
    const eligible = items.filter((it) => isAmazonAsin(it.sku));
    if (eligible.length === 0) {
      Alert.alert(
        "No Amazon ASINs found",
        "These Amazon items don't have Amazon product IDs (ASINs) saved. Add them again from the Amazon search to enable auto-cart.",
        [{ text: "OK" }],
      );
      return;
    }
    const url = buildAmazonCartUrl(eligible);
    if (!url) return;
    const skipped = items.length - eligible.length;
    const proceed = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Linking.openURL(url);
    };
    if (skipped > 0) {
      Alert.alert(
        "Adding to Amazon cart",
        `${eligible.length} of ${items.length} items will be added automatically. ${skipped} item(s) without Amazon IDs will be skipped — search them on Amazon separately.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Amazon", onPress: proceed },
        ],
      );
    } else {
      proceed();
    }
  }

  function urlForItemAtStore(storeKey: StoreKey, item: LineItem): string {
    if (storeKey === "homedepot") return buildHomeDepotUrl(item);
    if (storeKey === "lowes") return buildLowesUrl(item);
    return buildAmazonSearchUrl(item);
  }

  function handleShopFirstItem(storeKey: StoreKey, items: LineItem[]) {
    if (items.length === 0) return;
    const labels: Record<string, string> = {
      homedepot: "Home Depot",
      lowes: "Lowe's",
      amazon: "Amazon",
      other: "store",
    };
    const label = labels[storeKey] || "store";
    const first = items[0]!;
    const proceed = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Linking.openURL(urlForItemAtStore(storeKey, first));
    };
    if (items.length === 1) {
      proceed();
      return;
    }
    Alert.alert(
      `Shop on ${label}`,
      `${label} doesn't let other apps fill your cart, so we'll open the first item ("${first.description.slice(0, 60)}") on ${label}.com. Add it to your cart there, come back here, then tap each remaining item below to shop them one at a time.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: `Open first item`, onPress: proceed },
      ],
    );
  }

  function handleShopSingleItem(storeKey: StoreKey, item: LineItem) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(urlForItemAtStore(storeKey, item));
  }

  function buildPlainTextList(): string {
    const lines: string[] = [];
    lines.push(`Materials list${customerName ? ` for ${customerName}` : ""}`);
    if (jobAddress) lines.push(`Job: ${jobAddress}`);
    lines.push("");
    for (const g of groups) {
      lines.push(`— ${g.meta.label} —`);
      for (const it of g.items) lines.push(formatItem(it));
      lines.push("");
    }
    lines.push("(Generated by QuickQuote Contractor)");
    return lines.join("\n");
  }

  async function handleShareList() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = buildPlainTextList();
    try {
      await Share.share({
        message: text,
        title: `Materials list${customerName ? ` — ${customerName}` : ""}`,
      });
    } catch {
      // user cancelled
    }
  }

  function handleEmailList() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const subject = encodeURIComponent(
      `Materials list${customerName ? ` — ${customerName}` : ""}`,
    );
    const body = encodeURIComponent(buildPlainTextList());
    const url = `mailto:?subject=${subject}&body=${body}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("No email app found", "Couldn't open your email app."),
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: Platform.OS === "web" ? 18 : insets.top + 8,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Order Materials
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {materials.length} item{materials.length === 1 ? "" : "s"} grouped by store
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Feather name="x" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Honest disclosure */}
          <View
            style={[
              styles.notice,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Feather name="info" size={14} color={colors.mutedForeground} />
            <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
              <Text style={{ fontFamily: "Inter_600SemiBold" }}>
                Amazon
              </Text>
              {" "}supports auto-cart. <Text style={{ fontFamily: "Inter_600SemiBold" }}>Home Depot</Text> and <Text style={{ fontFamily: "Inter_600SemiBold" }}>Lowe's</Text> don't allow apps to add items to your cart — we open each item pre-searched on their site so you tap "Add to Cart" once per item.
            </Text>
          </View>

          {groups.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="package" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No materials in this quote yet.
              </Text>
            </View>
          ) : (
            groups.map((g) => (
              <View
                key={g.meta.key}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.cardHead}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: g.meta.color },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: g.meta.textColor }]}>
                      {g.meta.initials}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.storeName, { color: colors.foreground }]}>
                      {g.meta.label}
                    </Text>
                    <Text
                      style={[
                        styles.storeDesc,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {g.items.length} item{g.items.length === 1 ? "" : "s"} · {g.meta.description}
                    </Text>
                  </View>
                </View>

                <View style={[styles.itemList, { borderTopColor: colors.border }]}>
                  {g.items.map((it) => {
                    const isOther = g.meta.key === "other";
                    const tappable = !isOther;
                    const Comp: typeof TouchableOpacity | typeof View = tappable ? TouchableOpacity : View;
                    return (
                      <Comp
                        key={it.id}
                        style={styles.itemRow}
                        {...(tappable
                          ? {
                              onPress: () => handleShopSingleItem(g.meta.key, it),
                              activeOpacity: 0.6,
                              accessibilityRole: "button",
                              accessibilityLabel: `Shop ${it.description} on ${g.meta.label}`,
                            }
                          : {})}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[styles.itemDesc, { color: colors.foreground }]}
                            numberOfLines={2}
                          >
                            {it.description}
                          </Text>
                          <Text
                            style={[styles.itemQty, { color: colors.mutedForeground }]}
                          >
                            {it.quantity} {it.unit || "ea"}
                          </Text>
                        </View>
                        {tappable ? (
                          <Feather
                            name="external-link"
                            size={15}
                            color={g.meta.color}
                          />
                        ) : null}
                      </Comp>
                    );
                  })}
                </View>

                {g.meta.hasAutoCart ? (
                  <TouchableOpacity
                    style={[styles.shopBtn, { backgroundColor: g.meta.color }]}
                    onPress={() => handleShopAmazon(g.items)}
                    activeOpacity={0.85}
                  >
                    <Feather name="shopping-cart" size={15} color={g.meta.textColor} />
                    <Text style={[styles.shopBtnText, { color: g.meta.textColor }]}>
                      Add all to Amazon Cart
                    </Text>
                  </TouchableOpacity>
                ) : g.meta.key === "other" ? (
                  <View>
                    <Text style={[styles.pickStoreLabel, { color: colors.mutedForeground }]}>
                      Search these items at:
                    </Text>
                    <View style={styles.storePickRow}>
                      <TouchableOpacity
                        style={[styles.storePickBtn, { backgroundColor: STORE_META.amazon.color }]}
                        onPress={() => handleShopFirstItem("amazon", g.items)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.storePickText, { color: STORE_META.amazon.textColor }]}>
                          Amazon
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.storePickBtn, { backgroundColor: STORE_META.homedepot.color }]}
                        onPress={() => handleShopFirstItem("homedepot", g.items)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.storePickText, { color: STORE_META.homedepot.textColor }]}>
                          Home Depot
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.storePickBtn, { backgroundColor: STORE_META.lowes.color }]}
                        onPress={() => handleShopFirstItem("lowes", g.items)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.storePickText, { color: STORE_META.lowes.textColor }]}>
                          Lowe's
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.shopBtn, { backgroundColor: g.meta.color }]}
                    onPress={() => handleShopFirstItem(g.meta.key, g.items)}
                    activeOpacity={0.85}
                  >
                    <Feather name="external-link" size={15} color={g.meta.textColor} />
                    <Text style={[styles.shopBtnText, { color: g.meta.textColor }]}>
                      {g.items.length === 1
                        ? `Shop on ${g.meta.label}`
                        : `Shop first item on ${g.meta.label}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}

          {/* Share / Email actions */}
          {groups.length > 0 ? (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleShareList}
                activeOpacity={0.85}
              >
                <Feather name="share-2" size={15} color={colors.primaryForeground} />
                <Text style={[styles.actionText, { color: colors.primaryForeground }]}>
                  Share List
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
                ]}
                onPress={handleEmailList}
                activeOpacity={0.85}
              >
                <Feather name="mail" size={15} color={colors.foreground} />
                <Text style={[styles.actionText, { color: colors.foreground }]}>
                  Email List
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={{ height: insets.bottom + 16 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: 16,
    gap: 14,
  },
  notice: {
    flexDirection: "row",
    gap: 9,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  storeName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  storeDesc: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  itemList: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  itemDesc: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 18,
  },
  itemQty: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  shopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
  },
  shopBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  pickStoreLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  storePickRow: {
    flexDirection: "row",
    gap: 8,
  },
  storePickBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  storePickText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
