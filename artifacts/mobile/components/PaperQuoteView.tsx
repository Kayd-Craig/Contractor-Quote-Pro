import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type {
  ContractorSettings,
  LineItem,
  QuoteTotals,
} from "@/context/QuoteContext";

const MONO = Platform.select({
  ios: "Courier New",
  android: "monospace",
  web: "Courier New, monospace",
  default: "Courier New",
});

interface Props {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  jobAddress?: string;
  jobDescription?: string;
  lineItems: LineItem[];
  settings: ContractorSettings;
  totals: QuoteTotals;
  createdAt: string;
  scrollable?: boolean;
  maxHeight?: number;
}

const DASHES = "- - - - - - - - - - - - - - - - - - - -";
const EQUALS = "= = = = = = = = = = = = = = = = = = = =";

export function PaperQuoteView({
  customerName,
  customerEmail,
  customerPhone,
  jobAddress,
  jobDescription,
  lineItems,
  settings,
  totals,
  createdAt,
  scrollable,
  maxHeight,
}: Props) {
  const materials = lineItems.filter((i) => i.type === "material");
  const labor = lineItems.filter((i) => i.type === "labor");

  const dateStr = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const content = (
    <View style={styles.paper}>
      {/* Logo (if set) */}
      {settings.logoUri ? (
        <View style={styles.logoRow}>
          <Image
            source={{ uri: settings.logoUri }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      ) : null}

      {/* Business header */}
      <Text style={[styles.mono, styles.center, styles.businessName]}>
        {(settings.businessName || "CONTRACTOR QUOTE").toUpperCase()}
      </Text>
      {settings.name ? (
        <Text style={[styles.mono, styles.center, styles.headerSub]}>
          {settings.name}
        </Text>
      ) : null}
      {(settings.phone || settings.email) ? (
        <Text style={[styles.mono, styles.center, styles.headerSub]}>
          {[settings.phone, settings.email].filter(Boolean).join("  |  ")}
        </Text>
      ) : null}
      {settings.license ? (
        <Text style={[styles.mono, styles.center, styles.headerSub]}>
          Lic# {settings.license}
        </Text>
      ) : null}

      <Text style={[styles.mono, styles.center, styles.dividerText]}>
        {EQUALS}
      </Text>

      <Text style={[styles.mono, styles.center, styles.estimateTitle]}>
        E S T I M A T E
      </Text>
      <Text style={[styles.mono, styles.center, styles.dateText]}>
        {dateStr}
      </Text>

      <Text style={[styles.mono, styles.dividerText]}>{DASHES}</Text>

      {/* Customer block */}
      <Text style={[styles.mono, styles.sectionLabel]}>TO:</Text>
      <Text style={[styles.mono, styles.indent]}>{customerName}</Text>
      {jobAddress ? (
        <Text style={[styles.mono, styles.indent]}>{jobAddress}</Text>
      ) : null}
      {customerPhone ? (
        <Text style={[styles.mono, styles.indent]}>{customerPhone}</Text>
      ) : null}
      {customerEmail ? (
        <Text style={[styles.mono, styles.indent]}>{customerEmail}</Text>
      ) : null}

      {jobDescription && jobDescription !== "Job quote" ? (
        <>
          <View style={styles.spacer} />
          <Text style={[styles.mono, styles.sectionLabel]}>JOB:</Text>
          <Text style={[styles.mono, styles.indent]}>{jobDescription}</Text>
        </>
      ) : null}

      <Text style={[styles.mono, styles.dividerText]}>{DASHES}</Text>

      {/* Materials */}
      {materials.length > 0 ? (
        <>
          <Text style={[styles.mono, styles.sectionHead]}>MATERIALS</Text>
          {materials.map((item) => {
            const total = item.quantity * item.unitPrice;
            return (
              <View key={item.id} style={styles.lineItemBlock}>
                <Text style={[styles.mono, styles.itemDesc]}>
                  {item.description}
                </Text>
                <View style={styles.itemDetailRow}>
                  <Text style={[styles.mono, styles.itemDetailLeft]}>
                    {"  "}
                    {item.quantity} {item.unit} @ ${item.unitPrice.toFixed(2)}
                  </Text>
                  <Text style={[styles.mono, styles.itemDetailRight]}>
                    ${total.toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })}
          <View style={styles.spacer} />
        </>
      ) : null}

      {/* Labor */}
      {labor.length > 0 ? (
        <>
          <Text style={[styles.mono, styles.sectionHead]}>LABOR</Text>
          {labor.map((item) => {
            const total = item.quantity * item.unitPrice;
            const detailLabel =
              item.unit === "flat"
                ? "  flat rate"
                : `  ${item.quantity} ${item.unit} @ $${item.unitPrice.toFixed(2)}`;
            return (
              <View key={item.id} style={styles.lineItemBlock}>
                <Text style={[styles.mono, styles.itemDesc]}>
                  {item.description}
                </Text>
                <View style={styles.itemDetailRow}>
                  <Text style={[styles.mono, styles.itemDetailLeft]}>
                    {detailLabel}
                  </Text>
                  <Text style={[styles.mono, styles.itemDetailRight]}>
                    ${total.toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })}
          <View style={styles.spacer} />
        </>
      ) : null}

      <Text style={[styles.mono, styles.dividerText]}>{DASHES}</Text>

      {/* Totals */}
      {totals.materialSubtotal > 0 && (
        <View style={styles.totalRow}>
          <Text style={[styles.mono, styles.totalLabel]}>Materials</Text>
          <Text style={[styles.mono, styles.totalValue]}>
            ${totals.materialSubtotal.toFixed(2)}
          </Text>
        </View>
      )}
      {totals.laborSubtotal > 0 && (
        <View style={styles.totalRow}>
          <Text style={[styles.mono, styles.totalLabel]}>Labor</Text>
          <Text style={[styles.mono, styles.totalValue]}>
            ${totals.laborSubtotal.toFixed(2)}
          </Text>
        </View>
      )}
      {totals.discountAmount > 0 && (
        <View style={styles.totalRow}>
          <Text style={[styles.mono, styles.totalLabel]}>Discount</Text>
          <Text style={[styles.mono, styles.totalValue, { color: "#3a7a3a" }]}>
            -${totals.discountAmount.toFixed(2)}
          </Text>
        </View>
      )}

      <Text style={[styles.mono, styles.dividerText]}>{DASHES}</Text>

      <View style={styles.totalRow}>
        <Text style={[styles.mono, styles.grandTotalLabel]}>TOTAL DUE</Text>
        <Text style={[styles.mono, styles.grandTotalValue]}>
          ${totals.total.toFixed(2)}
        </Text>
      </View>

      <Text style={[styles.mono, styles.dividerText, { marginTop: 4 }]}>
        {EQUALS}
      </Text>

      <Text style={[styles.mono, styles.center, styles.footer]}>
        Thank you for your business!
      </Text>
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        style={maxHeight ? { maxHeight } : undefined}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {content}
      </ScrollView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  paper: {
    backgroundColor: "#FAFAF2",
    borderRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E8E6D8",
  },
  logoRow: {
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  mono: {
    fontFamily: MONO,
    color: "#1a1a10",
    fontSize: 13,
    lineHeight: 20,
  },
  center: {
    textAlign: "center",
  },
  businessName: {
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 12,
    color: "#3a3a28",
  },
  dividerText: {
    color: "#9a9874",
    textAlign: "center",
    marginVertical: 8,
    fontSize: 12,
  },
  estimateTitle: {
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 4,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: "#3a3a28",
    marginBottom: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#3a3a28",
    marginBottom: 2,
  },
  indent: {
    fontSize: 13,
    paddingLeft: 16,
    color: "#1a1a10",
  },
  spacer: {
    height: 6,
  },
  sectionHead: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    color: "#3a3a28",
    marginBottom: 4,
    textDecorationLine: "underline",
  },
  lineItemBlock: {
    marginBottom: 6,
  },
  itemDesc: {
    fontSize: 13,
    color: "#1a1a10",
  },
  itemDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemDetailLeft: {
    fontSize: 12,
    color: "#4a4a38",
    flex: 1,
  },
  itemDetailRight: {
    fontSize: 13,
    color: "#1a1a10",
    textAlign: "right",
    minWidth: 60,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 1,
  },
  totalLabel: {
    fontSize: 13,
    color: "#3a3a28",
  },
  totalValue: {
    fontSize: 13,
    color: "#1a1a10",
    textAlign: "right",
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1a1a10",
    letterSpacing: 0.5,
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a10",
  },
  footer: {
    fontSize: 12,
    color: "#6a6a50",
    marginTop: 6,
    fontStyle: "italic",
  },
});
