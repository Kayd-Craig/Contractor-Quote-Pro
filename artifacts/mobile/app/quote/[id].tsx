import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { FONT_OPTIONS, PaperQuoteView, TEMPLATE_OPTIONS } from "@/components/PaperQuoteView";
import { PhotosSection } from "@/components/PhotosSection";
import type { Product } from "@/components/ProductCard";
import { ProductCard } from "@/components/ProductCard";
import { SendQuoteModal } from "@/components/SendQuoteModal";
import type { LineItem, QuoteFont, QuoteTemplate } from "@/context/QuoteContext";
import { useQuotes } from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";
import { extractZipFromAddress } from "@/utils/extractZip";
import { getTaxRateForZip } from "@/utils/taxRates";
import { useSearchProducts } from "@workspace/api-client-react";

type AddMode = "material" | "labor" | null;

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { quotes, settings, deleteLineItem, deleteQuote, addLineItem, addPhoto, removePhoto, updateQuote, calculateTotals } =
    useQuotes();

  const quote = quotes.find((q) => q.id === id);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [showSend, setShowSend] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingMarkup, setEditingMarkup] = useState(false);
  const [markupInput, setMarkupInput] = useState("");
  const [showDiscountEditor, setShowDiscountEditor] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [discountTypeLocal, setDiscountTypeLocal] = useState<"percent" | "flat">("percent");
  const [showStatusPicker, setShowStatusPicker] = useState(false);

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

  const zip = extractZipFromAddress(quote.jobAddress, settings.zipCode);
  const taxInfo = zip ? getTaxRateForZip(zip) : null;
  const taxRate = taxInfo?.rate ?? 0;

  const totals = calculateTotals(
    quote.lineItems,
    quote.markupOverride ?? settings.defaultMarkup,
    quote.discountAmount,
    quote.discountType,
    taxRate
  );
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
    if (Platform.OS === "web") {
      setShowStatusPicker(true);
    } else {
      const labels = STATUS_OPTIONS.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
      Alert.alert("Update Status", "Select a status for this quote:", [
        ...labels.map((label, i) => ({
          text: label,
          onPress: () => updateQuote(quote.id, { status: STATUS_OPTIONS[i] }),
        })),
        { text: "Cancel", style: "cancel" as const },
      ]);
    }
  }

  function handleDelete() {
    const doDelete = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      deleteQuote(quote.id);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.navigate("/");
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Delete the quote for ${quote.customerName}? This cannot be undone.`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Delete Quote",
        `Delete the quote for ${quote.customerName}? This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: doDelete },
        ]
      );
    }
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
        <View style={styles.headerBtns}>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={() => setShowPreview(true)}
          >
            <Feather name="file-text" size={16} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "40" }]}
            onPress={handleDelete}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowSend(true)}
          >
            <Feather name="send" size={16} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Platform.OS === "web" ? 40 + 34 : 40 + insets.bottom },
        ]}
      >
        {/* Business / Contractor banner */}
        {(settings.businessName || settings.name || settings.logoUri) && (
          <View style={[styles.businessBanner, { backgroundColor: colors.accent }]}>
            {settings.logoUri ? (
              <Image
                source={{ uri: settings.logoUri }}
                style={styles.businessBannerLogo}
                resizeMode="contain"
              />
            ) : (
              <Feather name="briefcase" size={14} color="rgba(255,255,255,0.7)" />
            )}
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
        <View style={[styles.summary, { backgroundColor: colors.accent }]}>
          <Text style={[styles.summaryTitle, { color: "#FFFFFF" }]}>Quote Summary</Text>

          {totals.materialSubtotal > 0 && (
            <SummaryRow label="Materials" value={totals.materialSubtotal} dark />
          )}
          {totals.laborSubtotal > 0 && (
            <SummaryRow label="Labor" value={totals.laborSubtotal} dark />
          )}

          {/* Editable Markup Row */}
          <View style={styles.summaryEditRow}>
            <View style={styles.summaryEditLeft}>
              <Text style={styles.summaryEditLabel}>
                Markup
              </Text>
              {editingMarkup ? (
                <View style={styles.markupInputRow}>
                  <TextInput
                    style={styles.markupInput}
                    value={markupInput}
                    onChangeText={setMarkupInput}
                    keyboardType="numeric"
                    autoFocus
                    selectTextOnFocus
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      const val = parseFloat(markupInput);
                      if (!isNaN(val) && val >= 0) {
                        updateQuote(quote.id, { markupOverride: val });
                      }
                      setEditingMarkup(false);
                    }}
                    onBlur={() => {
                      const val = parseFloat(markupInput);
                      if (!isNaN(val) && val >= 0) {
                        updateQuote(quote.id, { markupOverride: val });
                      }
                      setEditingMarkup(false);
                    }}
                  />
                  <Text style={styles.markupInputPct}>%</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.markupBadge}
                  onPress={() => {
                    setMarkupInput(String(totals.markupPercent));
                    setEditingMarkup(true);
                  }}
                >
                  <Text style={styles.markupBadgeText}>{totals.markupPercent}%</Text>
                  <Feather name="edit-2" size={10} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              )}
              {quote.markupOverride !== undefined &&
                quote.markupOverride !== settings.defaultMarkup && (
                  <TouchableOpacity
                    onPress={() => updateQuote(quote.id, { markupOverride: undefined })}
                  >
                    <Text style={styles.resetLink}>reset</Text>
                  </TouchableOpacity>
                )}
            </View>
            <Text style={styles.summaryEditValue}>
              +${totals.markupAmount.toFixed(2)}
            </Text>
          </View>

          {/* Discount Row */}
          {showDiscountEditor || quote.discountAmount ? (
            <View style={styles.summaryEditRow}>
              <View style={styles.summaryEditLeft}>
                <Text style={styles.summaryEditLabel}>Discount</Text>
                {showDiscountEditor ? (
                  <View style={styles.discountEditorRow}>
                    {/* % / $ toggle */}
                    <TouchableOpacity
                      style={[
                        styles.discountTypeBtn,
                        discountTypeLocal === "percent" && styles.discountTypeBtnActive,
                      ]}
                      onPress={() => setDiscountTypeLocal("percent")}
                    >
                      <Text style={styles.discountTypeBtnText}>%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.discountTypeBtn,
                        discountTypeLocal === "flat" && styles.discountTypeBtnActive,
                      ]}
                      onPress={() => setDiscountTypeLocal("flat")}
                    >
                      <Text style={styles.discountTypeBtnText}>$</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.discountInput}
                      value={discountInput}
                      onChangeText={setDiscountInput}
                      keyboardType="numeric"
                      autoFocus
                      selectTextOnFocus
                      placeholder="0"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        const val = parseFloat(discountInput);
                        if (!isNaN(val) && val > 0) {
                          updateQuote(quote.id, {
                            discountAmount: val,
                            discountType: discountTypeLocal,
                          });
                        }
                        setShowDiscountEditor(false);
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        updateQuote(quote.id, {
                          discountAmount: undefined,
                          discountType: undefined,
                        });
                        setDiscountInput("");
                        setShowDiscountEditor(false);
                      }}
                    >
                      <Feather name="x" size={14} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.markupBadge}
                    onPress={() => {
                      setDiscountInput(String(quote.discountAmount ?? ""));
                      setDiscountTypeLocal(quote.discountType ?? "percent");
                      setShowDiscountEditor(true);
                    }}
                  >
                    <Text style={styles.markupBadgeText}>
                      {quote.discountType === "flat"
                        ? `$${quote.discountAmount}`
                        : `${quote.discountAmount}%`}
                    </Text>
                    <Feather name="edit-2" size={10} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                )}
              </View>
              {totals.discountAmount > 0 && (
                <Text style={[styles.summaryEditValue, { color: "#86efac" }]}>
                  -${totals.discountAmount.toFixed(2)}
                </Text>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addDiscountBtn}
              onPress={() => {
                setDiscountTypeLocal("percent");
                setDiscountInput("");
                setShowDiscountEditor(true);
              }}
            >
              <Feather name="tag" size={13} color="rgba(255,255,255,0.65)" />
              <Text style={styles.addDiscountText}>Add Discount</Text>
            </TouchableOpacity>
          )}

          {/* Tax Row */}
          {totals.taxRate > 0 && (
            <View style={styles.summaryEditRow}>
              <View style={styles.summaryEditLeft}>
                <Text style={styles.summaryEditLabel}>
                  Tax ({taxInfo?.stateAbbr ?? ""})
                </Text>
                <View style={styles.markupBadge}>
                  <Text style={styles.markupBadgeText}>{totals.taxRate}%</Text>
                </View>
              </View>
              <Text style={styles.summaryEditValue}>
                +${totals.taxAmount.toFixed(2)}
              </Text>
            </View>
          )}
          {totals.taxRate === 0 && taxInfo === null && (
            <View style={styles.summaryEditRow}>
              <View style={styles.summaryEditLeft}>
                <Text style={[styles.summaryEditLabel, { opacity: 0.6 }]}>
                  Tax
                </Text>
                <Text style={[styles.resetLink, { fontSize: 10 }]}>
                  add zip to address
                </Text>
              </View>
              <Text style={[styles.summaryEditValue, { opacity: 0.5 }]}>
                --
              </Text>
            </View>
          )}

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
          contractorDiscount={settings.contractorDiscount ?? 0}
          storeFilter={(settings.preferredStore || "all") as "homedepot" | "lowes" | "all"}
          onClose={() => setAddMode(null)}
          onAdd={(item) => {
            addLineItem(quote.id, item);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
          colors={colors}
          insets={insets}
        />
      )}

      {/* Status picker modal (web) */}
      {Platform.OS === "web" && (
        <Modal
          visible={showStatusPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStatusPicker(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
            activeOpacity={1}
            onPress={() => setShowStatusPicker(false)}
          >
            <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32, paddingTop: 8 }}>
              <View style={{ alignItems: "center", paddingVertical: 8 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#ccc" }} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 12, color: colors.text }}>Update Status</Text>
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={{ paddingVertical: 14, paddingHorizontal: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}
                  onPress={() => {
                    updateQuote(quote.id, { status });
                    setShowStatusPicker(false);
                  }}
                >
                  <Text style={{ fontSize: 16, color: STATUS_COLORS[status] || colors.text, fontWeight: quote.status === status ? "700" : "400" }}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={{ paddingVertical: 14, paddingHorizontal: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}
                onPress={() => setShowStatusPicker(false)}
              >
                <Text style={{ fontSize: 16, color: colors.mutedForeground, textAlign: "center" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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

      {/* Paper preview modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={[styles.previewModalContainer, { backgroundColor: "#2C2C24" }]}>
          <View
            style={[
              styles.previewModalHeader,
              { paddingTop: topPad + 8, backgroundColor: "#1a1a14", borderBottomColor: "#3a3a30" },
            ]}
          >
            <Text style={styles.previewModalTitle}>Quote Preview</Text>
            <TouchableOpacity
              style={styles.previewModalClose}
              onPress={() => setShowPreview(false)}
            >
              <Feather name="x" size={22} color="#FAFAF2" />
            </TouchableOpacity>
          </View>

          {/* Style pickers */}
          <View style={styles.stylePickerArea}>
            <View style={styles.stylePickerRow}>
              <Text style={styles.stylePickerLabel}>TEMPLATE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.styleChipsScroll}>
                {TEMPLATE_OPTIONS.map((opt) => {
                  const active = (quote.quoteTemplate || settings.defaultQuoteTemplate || "typewriter") === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.templateChip, active && styles.templateChipActive]}
                      onPress={() => updateQuote(quote.id, { quoteTemplate: opt.key })}
                      activeOpacity={0.8}
                    >
                      <View style={styles.templatePreview}>
                        <View style={[styles.templatePreviewTop, { backgroundColor: opt.colors[0] }]} />
                        <View style={[styles.templatePreviewLine, { backgroundColor: opt.colors[2] }]} />
                        <View style={[styles.templatePreviewLine, { backgroundColor: opt.colors[2], width: 16 }]} />
                      </View>
                      <Text style={[styles.templateChipText, active && styles.templateChipTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <View style={styles.stylePickerRow}>
              <Text style={styles.stylePickerLabel}>FONT</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.styleChipsScroll}>
                {FONT_OPTIONS.map((opt) => {
                  const active = (quote.quoteFont || settings.defaultQuoteFont || "classic") === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.fontChip, active && styles.fontChipActive]}
                      onPress={() => updateQuote(quote.id, { quoteFont: opt.key })}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.fontChipPreview, { fontFamily: opt.key === "classic" ? (Platform.OS === "web" ? "Courier New, monospace" : "Courier New") : opt.key === "elegant" ? (Platform.OS === "web" ? "Georgia, serif" : "Georgia") : opt.key === "clean" ? (Platform.OS === "web" ? "Helvetica Neue, Arial, sans-serif" : "Helvetica Neue") : undefined }, active && styles.fontChipPreviewActive]}>
                        {opt.preview}
                      </Text>
                      <Text style={[styles.fontChipText, active && styles.fontChipTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.previewModalScroll}
            showsVerticalScrollIndicator={false}
          >
            <PaperQuoteView
              customerName={quote.customerName}
              customerEmail={quote.customerEmail}
              customerPhone={quote.customerPhone}
              jobAddress={quote.jobAddress}
              jobDescription={quote.jobDescription}
              lineItems={quote.lineItems}
              settings={settings}
              totals={totals}
              createdAt={quote.createdAt}
              font={quote.quoteFont || settings.defaultQuoteFont || "classic"}
              template={quote.quoteTemplate || settings.defaultQuoteTemplate || "typewriter"}
            />
          </ScrollView>
          <TouchableOpacity
            style={[styles.previewSendBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              setShowPreview(false);
              setTimeout(() => setShowSend(true), 300);
            }}
          >
            <Feather name="send" size={18} color={colors.primaryForeground} />
            <Text style={[styles.previewSendBtnText, { color: colors.primaryForeground }]}>
              Send This Quote
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  contractorDiscount,
  storeFilter,
  onClose,
  onAdd,
  colors,
  insets,
}: {
  mode: "material" | "labor";
  quoteId: string;
  defaultMarkup: number;
  contractorDiscount: number;
  storeFilter: "homedepot" | "lowes" | "all";
  onClose: () => void;
  onAdd: (item: Omit<LineItem, "id">) => void;
  colors: ReturnType<typeof useColors>;
  insets: { bottom: number; top: number };
}) {
  const isMaterial = mode === "material";

  const [entryMode, setEntryMode] = useState<"search" | "manual">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState(isMaterial ? "each" : "hr");
  const [unitPrice, setUnitPrice] = useState("");
  const [markup, setMarkup] = useState(defaultMarkup.toString());
  const [customSupplier, setCustomSupplier] = useState("");

  const LABOR_UNITS = [
    { label: "per Hour", value: "hr" },
    { label: "per Sq Ft", value: "sq ft" },
    { label: "per Lin Ft", value: "lin ft" },
    { label: "per Day", value: "day" },
    { label: "Flat Rate", value: "flat" },
  ];

  useEffect(() => {
    if (searchQuery.length < 2) {
      setDebouncedQuery("");
      return;
    }
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: searchData, isFetching } = useSearchProducts(
    { q: debouncedQuery, store: storeFilter },
    { query: { enabled: isMaterial && debouncedQuery.length >= 2, queryKey: ["products", debouncedQuery, storeFilter] } }
  );

  function handleSelectProduct(p: Product) {
    setSelectedProduct(p);
    setDescription(p.name);
    const basePrice = p.contractorPrice ?? p.price;
    const myPrice =
      contractorDiscount > 0
        ? basePrice * (1 - contractorDiscount / 100)
        : basePrice;
    setUnitPrice(myPrice.toFixed(2));
    setUnit(p.unit);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleAdd() {
    if (!description.trim()) {
      Alert.alert("Required", "Please enter a description.");
      return;
    }

    if (isMaterial) {
      const qty = parseFloat(quantity);
      const price = parseFloat(unitPrice);
      const mkup = parseFloat(markup);
      if (isNaN(qty) || qty <= 0) { Alert.alert("Invalid", "Enter a valid quantity."); return; }
      if (isNaN(price) || price < 0) { Alert.alert("Invalid", "Enter a valid unit price."); return; }
      onAdd({
        type: "material",
        description: description.trim(),
        quantity: qty,
        unit: unit.trim() || "each",
        unitPrice: price,
        markupPercent: isNaN(mkup) ? defaultMarkup : mkup,
        store: selectedProduct?.store ?? (customSupplier.trim() || null),
        sku: selectedProduct?.sku ?? null,
      });
    } else if (unit === "flat") {
      const totalPrice = parseFloat(quantity);
      if (isNaN(totalPrice) || totalPrice <= 0) { Alert.alert("Invalid", "Enter a valid total price."); return; }
      onAdd({
        type: "labor",
        description: description.trim(),
        quantity: 1,
        unit: "flat",
        unitPrice: totalPrice,
        markupPercent: 0,
        store: null,
        sku: null,
      });
    } else {
      const qty = parseFloat(quantity);
      const price = parseFloat(unitPrice);
      if (isNaN(qty) || qty <= 0) { Alert.alert("Invalid", "Enter a valid quantity."); return; }
      if (isNaN(price) || price < 0) { Alert.alert("Invalid", "Enter a valid rate."); return; }
      onAdd({
        type: "labor",
        description: description.trim(),
        quantity: qty,
        unit: unit,
        unitPrice: price,
        markupPercent: 0,
        store: null,
        sku: null,
      });
    }
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
            {/* Material entry mode tabs */}
            {isMaterial && (
              <View style={styles.searchSection}>
                <View style={[styles.entryModeTabs, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={[
                      styles.entryModeTab,
                      entryMode === "search" && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => { setEntryMode("search"); setCustomSupplier(""); }}
                  >
                    <Feather name="search" size={14} color={entryMode === "search" ? colors.primaryForeground : colors.mutedForeground} />
                    <Text style={[styles.entryModeTabText, { color: entryMode === "search" ? colors.primaryForeground : colors.foreground }]}>
                      Search Catalog
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.entryModeTab,
                      entryMode === "manual" && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => { setEntryMode("manual"); setSelectedProduct(null); setSearchQuery(""); setDebouncedQuery(""); }}
                  >
                    <Feather name="edit-3" size={14} color={entryMode === "manual" ? colors.primaryForeground : colors.mutedForeground} />
                    <Text style={[styles.entryModeTabText, { color: entryMode === "manual" ? colors.primaryForeground : colors.foreground }]}>
                      Manual Entry
                    </Text>
                  </TouchableOpacity>
                </View>

                {entryMode === "search" && (
                  <>
                    <View
                      style={[
                        styles.modalSearchBar,
                        { backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    >
                      {isFetching
                        ? <ActivityIndicator size="small" color={colors.primary} style={{ width: 15 }} />
                        : <Feather name="search" size={15} color={colors.mutedForeground} />
                      }
                      <TextInput
                        style={[styles.modalSearchInput, { color: colors.foreground }]}
                        placeholder="mulch, lumber, pavers, seed..."
                        placeholderTextColor={colors.mutedForeground}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        autoCapitalize="none"
                      />
                      {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(""); setDebouncedQuery(""); }}>
                          <Feather name="x" size={15} color={colors.mutedForeground} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {!isFetching && searchData && searchData.products.length > 0 && (
                      <View style={{ maxHeight: 220 }}>
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                          {searchData.products.slice(0, 8).map((p) => (
                            <ProductCard
                              key={p.id}
                              product={p as Product}
                              compact
                              contractorDiscount={contractorDiscount}
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
                  </>
                )}

                {entryMode === "manual" && (
                  <View style={[styles.supplierField, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Feather name="truck" size={15} color={colors.mutedForeground} />
                    <TextInput
                      style={[styles.modalSearchInput, { color: colors.foreground }]}
                      placeholder="Supplier name (optional)"
                      placeholderTextColor={colors.mutedForeground}
                      value={customSupplier}
                      onChangeText={setCustomSupplier}
                      autoCapitalize="words"
                    />
                    {customSupplier.length > 0 && (
                      <TouchableOpacity onPress={() => setCustomSupplier("")}>
                        <Feather name="x" size={15} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Labor unit type picker */}
            {!isMaterial && (
              <>
                <Text style={[styles.modalSectionLabel, { color: colors.mutedForeground }]}>
                  CHARGE TYPE
                </Text>
                <View style={styles.laborUnitRow}>
                  {LABOR_UNITS.map((lu) => (
                    <TouchableOpacity
                      key={lu.value}
                      style={[
                        styles.laborUnitBtn,
                        {
                          backgroundColor: unit === lu.value ? colors.primary : colors.background,
                          borderColor: unit === lu.value ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setUnit(lu.value)}
                    >
                      <Text
                        style={[
                          styles.laborUnitText,
                          { color: unit === lu.value ? colors.primaryForeground : colors.foreground },
                        ]}
                      >
                        {lu.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Form fields */}
            <Text style={[styles.modalSectionLabel, { color: colors.mutedForeground }]}>
              {isMaterial ? (entryMode === "manual" ? "ITEM DETAILS" : "OR ENTER MANUALLY") : "LABOR DETAILS"}
            </Text>

            <View style={[styles.formCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <ModalField
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder={isMaterial ? "Material name" : "e.g. Lawn mowing, Sod installation"}
                colors={colors}
              />
              <View style={[styles.formDivider, { backgroundColor: colors.border }]} />
              <View style={styles.formRow}>
                <View style={styles.formRowHalf}>
                  <ModalField
                    label={unit === "flat" ? "Total Price ($)" : `Qty${!isMaterial ? ` (${unit})` : ""}`}
                    value={quantity}
                    onChange={setQuantity}
                    placeholder="1"
                    keyboardType="decimal-pad"
                    colors={colors}
                  />
                </View>
                {isMaterial && (
                  <>
                    <View style={[styles.formRowDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.formRowHalf}>
                      <ModalField
                        label="Unit"
                        value={unit}
                        onChange={setUnit}
                        placeholder="each"
                        colors={colors}
                      />
                    </View>
                  </>
                )}
                {!isMaterial && unit !== "flat" && (
                  <>
                    <View style={[styles.formRowDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.formRowHalf}>
                      <ModalField
                        label={`Rate ${unit === "hr" ? "per hr" : unit === "day" ? "per day" : `per ${unit}`} ($)`}
                        value={unitPrice}
                        onChange={setUnitPrice}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        colors={colors}
                      />
                    </View>
                  </>
                )}
              </View>
              {isMaterial && (
                <>
                  <View style={[styles.formDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.formRow}>
                    <View style={styles.formRowHalf}>
                      <ModalField
                        label="Unit Price ($)"
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
                </>
              )}
            </View>

            {/* Preview total */}
            {(() => {
              if (isMaterial && unitPrice && quantity) {
                const total = parseFloat(quantity || "0") * parseFloat(unitPrice || "0") * (1 + (parseFloat(markup || "0") / 100));
                return (
                  <View style={[styles.previewTotal, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Line Total (with markup)</Text>
                    <Text style={[styles.previewValue, { color: colors.primary }]}>${total.toFixed(2)}</Text>
                  </View>
                );
              }
              if (!isMaterial && unit === "flat" && quantity) {
                const total = parseFloat(quantity || "0");
                if (!isNaN(total) && total > 0) return (
                  <View style={[styles.previewTotal, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Flat Rate Total</Text>
                    <Text style={[styles.previewValue, { color: colors.primary }]}>${total.toFixed(2)}</Text>
                  </View>
                );
              }
              if (!isMaterial && unit !== "flat" && unitPrice && quantity) {
                const total = parseFloat(quantity || "0") * parseFloat(unitPrice || "0");
                if (!isNaN(total) && total > 0) return (
                  <View style={[styles.previewTotal, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Labor Total</Text>
                    <Text style={[styles.previewValue, { color: colors.primary }]}>${total.toFixed(2)}</Text>
                  </View>
                );
              }
              return null;
            })()}

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
  headerBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  previewModalContainer: { flex: 1 },
  previewModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  previewModalTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#FAFAF2",
  },
  previewModalClose: { padding: 4 },
  previewModalScroll: {
    padding: 20,
    paddingBottom: 16,
  },
  previewSendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 34,
    marginTop: 12,
    paddingVertical: 15,
    borderRadius: 14,
  },
  previewSendBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
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
  summaryEditRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 32,
  },
  summaryEditLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  summaryEditLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
  },
  summaryEditValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  markupBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  markupBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  markupInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 2,
  },
  markupInput: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    minWidth: 40,
    maxWidth: 60,
  },
  markupInputPct: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  resetLink: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
    textDecorationLine: "underline",
  },
  addDiscountBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  addDiscountText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.6)",
  },
  discountEditorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  discountTypeBtn: {
    width: 28,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  discountTypeBtnActive: {
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  discountTypeBtnText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  discountInput: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    minWidth: 50,
    maxWidth: 80,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
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
  businessBannerLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
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
  entryModeTabs: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  entryModeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  entryModeTabText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  supplierField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
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
  laborUnitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  laborUnitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  laborUnitText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
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

  stylePickerArea: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#3a3a30",
  },
  stylePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stylePickerLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "rgba(250,250,242,0.5)",
    letterSpacing: 0.8,
    width: 68,
  },
  styleChipsScroll: {
    gap: 8,
    paddingRight: 8,
  },
  templateChip: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(250,250,242,0.15)",
  },
  templateChipActive: {
    borderColor: "#2E7D32",
    backgroundColor: "rgba(46,125,50,0.15)",
  },
  templatePreview: {
    width: 32,
    height: 22,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    padding: 3,
    gap: 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  templatePreviewTop: {
    width: "100%",
    height: 8,
    borderRadius: 1,
  },
  templatePreviewLine: {
    width: 22,
    height: 2,
    borderRadius: 1,
  },
  templateChipText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "rgba(250,250,242,0.6)",
  },
  templateChipTextActive: {
    color: "#2E7D32",
  },
  fontChip: {
    alignItems: "center",
    gap: 3,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(250,250,242,0.15)",
  },
  fontChipActive: {
    borderColor: "#2E7D32",
    backgroundColor: "rgba(46,125,50,0.15)",
  },
  fontChipPreview: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(250,250,242,0.7)",
  },
  fontChipPreviewActive: {
    color: "#2E7D32",
  },
  fontChipText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "rgba(250,250,242,0.6)",
  },
  fontChipTextActive: {
    color: "#2E7D32",
  },
});
