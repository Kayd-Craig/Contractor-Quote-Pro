import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

import { LineItemRow } from "@/components/LineItemRow";
import { PhotosSection } from "@/components/PhotosSection";
import type { Product } from "@/components/ProductCard";
import { ProductCard } from "@/components/ProductCard";
import { SendQuoteModal } from "@/components/SendQuoteModal";
import type { LineItem } from "@/context/QuoteContext";
import { useQuotes } from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";
import { useSearchProducts } from "@workspace/api-client-react";

type AddMode = "material" | "labor" | null;

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { quotes, settings, deleteLineItem, addLineItem, addPhoto, removePhoto, updateQuote, calculateTotals } =
    useQuotes();

  const quote = quotes.find((q) => q.id === id);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [showSend, setShowSend] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  if (!quote) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>
          Quote not found
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totals = calculateTotals(quote.lineItems, settings.defaultMarkup);
  const materials = quote.lineItems.filter((i) => i.type === "material");
  const labor = quote.lineItems.filter((i) => i.type === "labor");

  const STATUS_OPTIONS: Quote["status"][] = ["draft", "sent", "accepted", "declined"];
  const STATUS_COLORS: Record<string, string> = {
    draft: colors.mutedForeground,
    sent: colors.accent,
    accepted: colors.success,
    declined: colors.destructive,
  };

  function handleStatusChange() {
    const labels = STATUS_OPTIONS.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
    Alert.alert("Update Status", "Select a status for this quote:", [
      ...labels.map((label, i) => ({
        text: label,
        onPress: () => updateQuote(quote.id, { status: STATUS_OPTIONS[i] }),
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  }

  function handleDelete() {
    Alert.alert("Delete Quote", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.back();
          setTimeout(() => {
            const { deleteQuote } = require("@/context/QuoteContext");
          }, 100);
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 10,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerName, { color: colors.foreground }]} numberOfLines={1}>
            {quote.customerName}
          </Text>
          <TouchableOpacity
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[quote.status] + "20" },
            ]}
            onPress={handleStatusChange}
          >
            <View
              style={[styles.statusDot, { backgroundColor: STATUS_COLORS[quote.status] }]}
            />
            <Text style={[styles.statusText, { color: STATUS_COLORS[quote.status] }]}>
              {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
            </Text>
            <Feather name="chevron-down" size={11} color={STATUS_COLORS[quote.status]} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowSend(true)}
        >
          <Feather name="send" size={16} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Platform.OS === "web" ? 40 + 34 : 40 + insets.bottom },
        ]}
      >
        {/* Business / Contractor banner */}
        {(settings.businessName || settings.name) && (
          <View style={[styles.businessBanner, { backgroundColor: colors.accent }]}>
            <Feather name="briefcase" size={14} color="rgba(255,255,255,0.7)" />
            <View style={styles.businessBannerText}>
              {settings.businessName ? (
                <Text style={styles.businessBannerName}>{settings.businessName}</Text>
              ) : null}
              {settings.name ? (
                <Text style={styles.businessBannerSub}>{settings.name}</Text>
              ) : null}
            </View>
          </View>
        )}

        {/* Customer info */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {quote.jobAddress ? (
            <InfoRow icon="map-pin" label={quote.jobAddress} colors={colors} />
          ) : null}
          {quote.customerPhone ? (
            <InfoRow icon="phone" label={quote.customerPhone} colors={colors} />
          ) : null}
          {quote.customerEmail ? (
            <InfoRow icon="mail" label={quote.customerEmail} colors={colors} />
          ) : null}
          <View style={[styles.jobDescBox, { borderTopColor: quote.jobAddress || quote.customerPhone || quote.customerEmail ? colors.border : "transparent" }]}>
            <Feather name="briefcase" size={13} color={colors.mutedForeground} />
            <Text style={[styles.jobDesc, { color: colors.foreground }]}>
              {quote.jobDescription}
            </Text>
          </View>
        </View>

        {/* Materials */}
        <SectionHeader
          title="Materials"
          count={materials.length}
          icon="package"
          color={colors.accent}
          onAdd={() => setAddMode("material")}
          colors={colors}
        />
        {materials.length > 0 ? (
          <View style={[styles.itemsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {materials.map((item) => (
              <LineItemRow
                key={item.id}
                item={item}
                onDelete={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  deleteLineItem(quote.id, item.id);
                }}
              />
            ))}
          </View>
        ) : (
          <EmptySection label="No materials added" icon="package" colors={colors} />
        )}

        {/* Labor */}
        <SectionHeader
          title="Labor"
          count={labor.length}
          icon="clock"
          color={colors.primary}
          onAdd={() => setAddMode("labor")}
          colors={colors}
        />
        {labor.length > 0 ? (
          <View style={[styles.itemsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {labor.map((item) => (
              <LineItemRow
                key={item.id}
                item={item}
                onDelete={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  deleteLineItem(quote.id, item.id);
                }}
              />
            ))}
          </View>
        ) : (
          <EmptySection label="No labor added" icon="clock" colors={colors} />
        )}

        {/* Photos */}
        <PhotosSection
          quoteId={quote.id}
          photos={quote.photos ?? []}
          onAdd={(uri) => addPhoto(quote.id, uri)}
          onRemove={(uri) => removePhoto(quote.id, uri)}
        />

        {/* Summary */}
        <View style={[styles.summary, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
          <Text style={[styles.summaryTitle, { color: "#FFFFFF" }]}>Quote Summary</Text>
          {totals.materialSubtotal > 0 && (
            <SummaryRow label="Materials" value={totals.materialSubtotal} dark />
          )}
          {totals.laborSubtotal > 0 && (
            <SummaryRow label="Labor" value={totals.laborSubtotal} dark />
          )}
          <SummaryRow
            label={`Markup (${settings.defaultMarkup}%)`}
            value={totals.markupAmount}
            dark
          />
          <View style={styles.summaryDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>${totals.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Send button */}
        <TouchableOpacity
          style={[styles.bigSendBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowSend(true)}
          activeOpacity={0.85}
        >
          <Feather name="send" size={20} color={colors.primaryForeground} />
          <Text style={[styles.bigSendText, { color: colors.primaryForeground }]}>
            Send Quote to Customer
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Item Modal */}
      {addMode && (
        <AddItemModal
          mode={addMode}
          quoteId={quote.id}
          defaultMarkup={settings.defaultMarkup}
          onClose={() => setAddMode(null)}
          onAdd={(item) => {
            addLineItem(quote.id, item);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
          colors={colors}
          insets={insets}
        />
      )}

      {/* Send modal */}
      <SendQuoteModal
        visible={showSend}
        quote={quote}
        onClose={() => setShowSend(false)}
        onSent={() => {
          setShowSend(false);
          updateQuote(quote.id, { status: "sent" });
        }}
      />
    </View>
  );
}

function InfoRow({
  icon,
  label,
  colors,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={13} color={colors.mutedForeground} />
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function SectionHeader({
  title,
  count,
  icon,
  color,
  onAdd,
  colors,
}: {
  title: string;
  count: number;
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
  onAdd: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        <Feather name={icon} size={15} color={color} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        {count > 0 && (
          <View style={[styles.countBadge, { backgroundColor: color + "18" }]}>
            <Text style={[styles.countText, { color }]}>{count}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.addBtn, { borderColor: color, backgroundColor: color + "12" }]}
        onPress={onAdd}
      >
        <Feather name="plus" size={14} color={color} />
        <Text style={[styles.addBtnText, { color }]}>Add</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptySection({
  label,
  icon,
  colors,
}: {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.emptySection, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={16} color={colors.mutedForeground} />
      <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  dark,
}: {
  label: string;
  value: number;
  dark?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, dark && { color: "rgba(255,255,255,0.75)" }]}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, dark && { color: "#FFFFFF" }]}>
        ${value.toFixed(2)}
      </Text>
    </View>
  );
}

function AddItemModal({
  mode,
  quoteId,
  defaultMarkup,
  onClose,
  onAdd,
  colors,
  insets,
}: {
  mode: "material" | "labor";
  quoteId: string;
  defaultMarkup: number;
  onClose: () => void;
  onAdd: (item: Omit<LineItem, "id">) => void;
  colors: ReturnType<typeof useColors>;
  insets: { bottom: number; top: number };
}) {
  const isMaterial = mode === "material";

  const [searchQuery, setSearchQuery] = useState("");
  const [searchSubmit, setSearchSubmit] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState(isMaterial ? "each" : "hr");
  const [unitPrice, setUnitPrice] = useState("");
  const [markup, setMarkup] = useState(defaultMarkup.toString());

  const { data: searchData, isFetching } = useSearchProducts(
    { q: searchSubmit },
    { query: { enabled: isMaterial && searchSubmit.length >= 2 } }
  );

  function handleSelectProduct(p: Product) {
    setSelectedProduct(p);
    setDescription(p.name);
    setUnitPrice((p.contractorPrice ?? p.price).toFixed(2));
    setUnit(p.unit);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleAdd() {
    if (!description.trim()) {
      Alert.alert("Required", "Please enter a description.");
      return;
    }
    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    const mkup = parseFloat(markup);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Invalid", "Enter a valid quantity.");
      return;
    }
    if (isNaN(price) || price < 0) {
      Alert.alert("Invalid", "Enter a valid unit price.");
      return;
    }

    onAdd({
      type: mode,
      description: description.trim(),
      quantity: qty,
      unit: unit.trim() || (isMaterial ? "each" : "hr"),
      unitPrice: price,
      markupPercent: isNaN(mkup) ? defaultMarkup : mkup,
      store: selectedProduct?.store ?? null,
      sku: selectedProduct?.sku ?? null,
    });
    onClose();
  }

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom > 0 ? insets.bottom : 16;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
        <View
          style={[
            styles.modalSheet,
            { backgroundColor: colors.card, paddingBottom: bottomPad + 8 },
          ]}
        >
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {isMaterial ? "Add Material" : "Add Labor"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalScroll}
          >
            {/* Material search */}
            {isMaterial && (
              <View style={styles.searchSection}>
                <Text style={[styles.modalSectionLabel, { color: colors.mutedForeground }]}>
                  SEARCH STORES
                </Text>
                <View
                  style={[
                    styles.modalSearchBar,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Feather name="search" size={15} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.modalSearchInput, { color: colors.foreground }]}
                    placeholder="lumber, drywall, paint..."
                    placeholderTextColor={colors.mutedForeground}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => setSearchSubmit(searchQuery.trim())}
                    returnKeyType="search"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setSearchSubmit(searchQuery.trim())}
                    style={[styles.miniSearchBtn, { backgroundColor: colors.primary }]}
                  >
                    <Feather name="search" size={13} color="#fff" />
                  </TouchableOpacity>
                </View>

                {isFetching && (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
                )}

                {!isFetching && searchData && searchData.products.length > 0 && (
                  <View style={{ maxHeight: 220 }}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {searchData.products.slice(0, 8).map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p as Product}
                          compact
                          onAdd={handleSelectProduct}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {selectedProduct && (
                  <View style={[styles.selectedTag, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
                    <Feather name="check-circle" size={14} color={colors.primary} />
                    <Text style={[styles.selectedTagText, { color: colors.primary }]} numberOfLines={1}>
                      {selectedProduct.name}
                    </Text>
                    <TouchableOpacity onPress={() => { setSelectedProduct(null); setDescription(""); setUnitPrice(""); }}>
                      <Feather name="x" size={13} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Form fields */}
            <Text style={[styles.modalSectionLabel, { color: colors.mutedForeground }]}>
              {isMaterial ? "OR ENTER MANUALLY" : "LABOR DETAILS"}
            </Text>

            <View style={[styles.formCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <ModalField
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder={isMaterial ? "Material name" : "Labor description"}
                colors={colors}
              />
              <View style={[styles.formDivider, { backgroundColor: colors.border }]} />
              <View style={styles.formRow}>
                <View style={styles.formRowHalf}>
                  <ModalField
                    label="Quantity"
                    value={quantity}
                    onChange={setQuantity}
                    placeholder="1"
                    keyboardType="decimal-pad"
                    colors={colors}
                  />
                </View>
                <View style={[styles.formRowDivider, { backgroundColor: colors.border }]} />
                <View style={styles.formRowHalf}>
                  <ModalField
                    label="Unit"
                    value={unit}
                    onChange={setUnit}
                    placeholder={isMaterial ? "each" : "hr"}
                    colors={colors}
                  />
                </View>
              </View>
              <View style={[styles.formDivider, { backgroundColor: colors.border }]} />
              <View style={styles.formRow}>
                <View style={styles.formRowHalf}>
                  <ModalField
                    label={isMaterial ? "Unit Price ($)" : "Rate per hr ($)"}
                    value={unitPrice}
                    onChange={setUnitPrice}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    colors={colors}
                  />
                </View>
                <View style={[styles.formRowDivider, { backgroundColor: colors.border }]} />
                <View style={styles.formRowHalf}>
                  <ModalField
                    label="Markup %"
                    value={markup}
                    onChange={setMarkup}
                    placeholder={defaultMarkup.toString()}
                    keyboardType="decimal-pad"
                    colors={colors}
                  />
                </View>
              </View>
            </View>

            {/* Preview total */}
            {unitPrice && quantity ? (
              <View style={[styles.previewTotal, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                  Line Total
                </Text>
                <Text style={[styles.previewValue, { color: colors.primary }]}>
                  ${(
                    parseFloat(quantity || "0") *
                    parseFloat(unitPrice || "0") *
                    (1 + (parseFloat(markup || "0") / 100))
                  ).toFixed(2)}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.addItemBtn, { backgroundColor: colors.primary }]}
              onPress={handleAdd}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={18} color={colors.primaryForeground} />
              <Text style={[styles.addItemBtnText, { color: colors.primaryForeground }]}>
                Add to Quote
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ModalField({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad" | "numeric";
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.modalField}>
      <Text style={[styles.modalFieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[styles.modalFieldInput, { color: colors.foreground }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground + "80"}
        keyboardType={keyboardType}
        autoCorrect={false}
        autoCapitalize="sentences"
      />
    </View>
  );
}

type Quote = import("@/context/QuoteContext").Quote;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFound: { fontSize: 16, fontFamily: "Inter_400Regular" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, gap: 4 },
  headerName: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: 16 },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
    padding: 12,
    gap: 6,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  jobDescBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingTop: 8,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  jobDesc: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 4,
  },
  sectionLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  countBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  addBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  itemsCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  emptySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingVertical: 14,
    marginBottom: 16,
  },
  emptySectionText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  summary: {
    borderRadius: 14,
    padding: 18,
    marginTop: 4,
    marginBottom: 14,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  businessBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  businessBannerText: { flex: 1 },
  businessBannerName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  businessBannerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
  bigSendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  bigSendText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  // Modal styles
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: "90%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalScroll: { gap: 12, paddingBottom: 8 },
  searchSection: { gap: 8 },
  modalSectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  modalSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 8,
    height: 40,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  miniSearchBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectedTagText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  formCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  formDivider: { height: StyleSheet.hairlineWidth },
  formRow: { flexDirection: "row" },
  formRowHalf: { flex: 1 },
  formRowDivider: { width: StyleSheet.hairlineWidth },
  modalField: { padding: 12, gap: 4 },
  modalFieldLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  modalFieldInput: { fontSize: 15, fontFamily: "Inter_400Regular" },
  previewTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
  },
  previewLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  previewValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  addItemBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
