import { Feather } from "@expo/vector-icons";
import {
  cacheDirectory,
  EncodingType,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

import { useSendQuote } from "@workspace/api-client-react";
import type { Quote } from "@/context/QuoteContext";
import { useQuotes } from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";
import { extractZipFromAddress } from "@/utils/extractZip";
import { getTaxRateForZip } from "@/utils/taxRates";
import { PaperQuoteView } from "@/components/PaperQuoteView";

interface Props {
  visible: boolean;
  quote: Quote;
  onClose: () => void;
  onSent: () => void;
}

type SendMethod = "email" | "sms" | "both";

export function SendQuoteModal({ visible, quote, onClose, onSent }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, calculateTotals } = useQuotes();
  const [method, setMethod] = useState<SendMethod>("email");
  const { mutateAsync: sendQuoteApi, isPending } = useSendQuote();

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

  async function handleSend() {
    try {
      const result = await sendQuoteApi({
        data: {
          customerName: quote.customerName,
          customerEmail: quote.customerEmail,
          customerPhone: quote.customerPhone,
          jobAddress: quote.jobAddress,
          jobDescription: quote.jobDescription,
          businessName: settings.businessName || undefined,
          contractorName: settings.name || "Your Contractor",
          contractorPhone: settings.phone,
          contractorEmail: settings.email,
          contractorLicense: settings.license || undefined,
          logoBase64: settings.logoUri || undefined,
          lineItems: quote.lineItems.map((item) => ({
            id: item.id,
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            markupPercent: item.markupPercent,
            store: item.store,
            sku: item.sku,
          })),
          materialSubtotal: totals.materialSubtotal,
          laborSubtotal: totals.laborSubtotal,
          markupAmount: totals.markupAmount,
          discountAmount: totals.discountAmount > 0 ? totals.discountAmount : undefined,
          discountType: quote.discountType ?? undefined,
          taxRate: taxRate > 0 ? taxRate : undefined,
          taxAmount: totals.taxAmount > 0 ? totals.taxAmount : undefined,
          total: totals.total,
          sendMethod: method,
          quoteFont: quote.quoteFont || settings.defaultQuoteFont || "modern",
          quoteTemplate: quote.quoteTemplate || settings.defaultQuoteTemplate || "professional",
        },
      });

      if (result.success && result.pdfBase64) {
        await sharePdf(result.pdfBase64, quote.customerName);
        onSent();
      } else if (result.success) {
        await Share.share({
          message: result.quoteText,
          title: `Quote for ${quote.customerName}`,
        });
        onSent();
      }
    } catch (err) {
      Alert.alert("Error", "Could not send the quote. Please try again.");
    }
  }

  async function sharePdf(base64: string, customerName: string) {
    const safeName = customerName.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `Quote_${safeName}_${Date.now()}.pdf`;

    if (Platform.OS === "web") {
      const byteChars = atob(base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    const fileUri = `${cacheDirectory}${fileName}`;
    await writeAsStringAsync(fileUri, base64, {
      encoding: EncodingType.Base64,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/pdf",
        dialogTitle: `Quote for ${customerName}`,
        UTI: "com.adobe.pdf",
      });
    } else {
      Alert.alert("Saved", `PDF saved to ${fileUri}`);
    }
  }

  const bottomPad =
    Platform.OS === "web" ? 34 : insets.bottom > 0 ? insets.bottom : 16;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, paddingBottom: bottomPad + 8 },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>Send Quote</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

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
            scrollable
            maxHeight={260}
            font={quote.quoteFont || settings.defaultQuoteFont || "classic"}
            template={quote.quoteTemplate || settings.defaultQuoteTemplate || "typewriter"}
          />

          <View style={[styles.pdfBadge, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <Feather name="file-text" size={14} color={colors.primary} />
            <Text style={[styles.pdfBadgeText, { color: colors.primary }]}>
              Will be sent as a professional PDF
            </Text>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            SEND VIA
          </Text>

          <View style={styles.methodRow}>
            {(["email", "sms", "both"] as SendMethod[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.methodBtn,
                  {
                    backgroundColor:
                      method === m ? colors.primary : colors.secondary,
                    borderColor:
                      method === m ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setMethod(m)}
              >
                <Feather
                  name={m === "email" ? "mail" : m === "sms" ? "message-circle" : "send"}
                  size={16}
                  color={method === m ? colors.primaryForeground : colors.foreground}
                />
                <Text
                  style={[
                    styles.methodLabel,
                    {
                      color:
                        method === m
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {m === "email" ? "Email" : m === "sms" ? "SMS" : "Both"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: isPending ? colors.muted : colors.primary },
            ]}
            onPress={handleSend}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Feather name="send" size={18} color={colors.primaryForeground} />
                <Text style={[styles.sendBtnText, { color: colors.primaryForeground }]}>
                  Send Quote as PDF
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 14,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  pdfBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  pdfBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  methodRow: {
    flexDirection: "row",
    gap: 8,
  },
  methodBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  methodLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 13,
    marginTop: 4,
  },
  sendBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
