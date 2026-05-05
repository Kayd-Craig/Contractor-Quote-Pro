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
  QuoteFont,
  QuoteTemplate,
  QuoteTotals,
} from "@/context/QuoteContext";

const FONT_FAMILIES: Record<QuoteFont, string> = {
  classic: Platform.select({
    ios: "Courier New",
    android: "monospace",
    web: "Courier New, monospace",
    default: "Courier New",
  }) as string,
  modern: Platform.select({
    ios: "System",
    android: "sans-serif",
    web: "Inter, -apple-system, Helvetica Neue, sans-serif",
    default: "System",
  }) as string,
  elegant: Platform.select({
    ios: "Georgia",
    android: "serif",
    web: "Georgia, Cambria, Times New Roman, serif",
    default: "Georgia",
  }) as string,
  clean: Platform.select({
    ios: "Helvetica Neue",
    android: "sans-serif-light",
    web: "Helvetica Neue, Arial, sans-serif",
    default: "Helvetica Neue",
  }) as string,
};

export const FONT_OPTIONS: { key: QuoteFont; label: string; preview: string }[] = [
  { key: "classic", label: "Classic", preview: "Aa" },
  { key: "modern", label: "Modern", preview: "Aa" },
  { key: "elegant", label: "Elegant", preview: "Aa" },
  { key: "clean", label: "Clean", preview: "Aa" },
];

interface TemplateColors {
  paper: string;
  headerBg: string;
  headerText: string;
  headerSubText: string;
  bodyText: string;
  bodySubText: string;
  divider: string;
  accent: string;
  border: string;
  totalBg: string;
  footerText: string;
}

const TEMPLATE_THEMES: Record<QuoteTemplate, TemplateColors> = {
  typewriter: {
    paper: "#FAFAF2",
    headerBg: "transparent",
    headerText: "#1a1a10",
    headerSubText: "#3a3a28",
    bodyText: "#1a1a10",
    bodySubText: "#4a4a38",
    divider: "#9a9874",
    accent: "#3a3a28",
    border: "#E8E6D8",
    totalBg: "transparent",
    footerText: "#6a6a50",
  },
  professional: {
    paper: "#FFFFFF",
    headerBg: "#1A3A5C",
    headerText: "#FFFFFF",
    headerSubText: "rgba(255,255,255,0.8)",
    bodyText: "#1A1A2E",
    bodySubText: "#5A5A7A",
    divider: "#D0D5DD",
    accent: "#1A3A5C",
    border: "#E4E7EC",
    totalBg: "#F2F4F7",
    footerText: "#667085",
  },
  bold: {
    paper: "#FFFFFF",
    headerBg: "#2E7D32",
    headerText: "#FFFFFF",
    headerSubText: "rgba(255,255,255,0.85)",
    bodyText: "#111111",
    bodySubText: "#555555",
    divider: "#E0E0E0",
    accent: "#2E7D32",
    border: "#EEEEEE",
    totalBg: "#F0FFF0",
    footerText: "#888888",
  },
  minimal: {
    paper: "#FAFAFA",
    headerBg: "transparent",
    headerText: "#111111",
    headerSubText: "#777777",
    bodyText: "#222222",
    bodySubText: "#888888",
    divider: "#E8E8E8",
    accent: "#333333",
    border: "#EEEEEE",
    totalBg: "transparent",
    footerText: "#AAAAAA",
  },
};

export const TEMPLATE_OPTIONS: { key: QuoteTemplate; label: string; colors: [string, string, string] }[] = [
  { key: "typewriter", label: "Typewriter", colors: ["#FAFAF2", "#3a3a28", "#9a9874"] },
  { key: "professional", label: "Professional", colors: ["#1A3A5C", "#FFFFFF", "#D0D5DD"] },
  { key: "bold", label: "Bold", colors: ["#2E7D32", "#FFFFFF", "#F0FFF0"] },
  { key: "minimal", label: "Minimal", colors: ["#FAFAFA", "#111111", "#E8E8E8"] },
];

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
  font?: QuoteFont;
  template?: QuoteTemplate;
  taxStateAbbr?: string;
}

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
  font = "classic",
  template = "typewriter",
  taxStateAbbr,
}: Props) {
  const materials = lineItems.filter((i) => i.type === "material");
  const labor = lineItems.filter((i) => i.type === "labor");
  const t = TEMPLATE_THEMES[template];
  const fontFamily = FONT_FAMILIES[font];

  const dateStr = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isTypewriter = template === "typewriter";
  const hasHeaderBg = t.headerBg !== "transparent";

  const txt = (overrides?: object) => ({
    fontFamily,
    color: t.bodyText,
    fontSize: 13,
    lineHeight: 20 as number,
    ...overrides,
  });

  const content = (
    <View style={[styles.paper, { backgroundColor: t.paper, borderColor: t.border }]}>
      {hasHeaderBg ? (
        <View style={[styles.headerBlock, { backgroundColor: t.headerBg }]}>
          {settings.logoUri ? (
            <View style={styles.logoRow}>
              <Image
                source={{ uri: settings.logoUri }}
                style={[styles.logo, { borderRadius: template === "bold" ? 6 : 8 }]}
                resizeMode="contain"
              />
            </View>
          ) : null}
          <Text style={[txt({ color: t.headerText, fontSize: 16, fontWeight: "bold" as const, letterSpacing: 1, textAlign: "center" as const })]}>
            {(settings.businessName || "CONTRACTOR QUOTE").toUpperCase()}
          </Text>
          {settings.name ? (
            <Text style={[txt({ color: t.headerSubText, fontSize: 12, textAlign: "center" as const })]}>{settings.name}</Text>
          ) : null}
          {(settings.phone || settings.email) ? (
            <Text style={[txt({ color: t.headerSubText, fontSize: 11, textAlign: "center" as const })]}>
              {[settings.phone, settings.email].filter(Boolean).join("  |  ")}
            </Text>
          ) : null}
          {settings.license ? (
            <Text style={[txt({ color: t.headerSubText, fontSize: 11, textAlign: "center" as const })]}>
              Lic# {settings.license}
            </Text>
          ) : null}
        </View>
      ) : (
        <>
          {settings.logoUri ? (
            <View style={styles.logoRow}>
              <Image source={{ uri: settings.logoUri }} style={styles.logo} resizeMode="contain" />
            </View>
          ) : null}
          <Text style={[txt({ fontSize: 15, fontWeight: "bold" as const, letterSpacing: 1, textAlign: "center" as const, marginBottom: 2 })]}>
            {(settings.businessName || "CONTRACTOR QUOTE").toUpperCase()}
          </Text>
          {settings.name ? (
            <Text style={[txt({ fontSize: 12, color: t.headerSubText, textAlign: "center" as const })]}>{settings.name}</Text>
          ) : null}
          {(settings.phone || settings.email) ? (
            <Text style={[txt({ fontSize: 12, color: t.headerSubText, textAlign: "center" as const })]}>
              {[settings.phone, settings.email].filter(Boolean).join("  |  ")}
            </Text>
          ) : null}
          {settings.license ? (
            <Text style={[txt({ fontSize: 12, color: t.headerSubText, textAlign: "center" as const })]}>
              Lic# {settings.license}
            </Text>
          ) : null}
        </>
      )}

      {isTypewriter ? (
        <Text style={[txt({ color: t.divider, textAlign: "center" as const, marginVertical: 8, fontSize: 12 })]}>
          {"= = = = = = = = = = = = = = = = = = = ="}
        </Text>
      ) : (
        <View style={[styles.dividerLine, { backgroundColor: t.divider, marginVertical: 10 }]} />
      )}

      <Text style={[txt({
        fontSize: isTypewriter ? 17 : 16,
        fontWeight: "bold" as const,
        letterSpacing: isTypewriter ? 4 : 2,
        textAlign: "center" as const,
        marginBottom: 2,
        color: template === "bold" ? t.accent : t.bodyText,
      })]}>
        {isTypewriter ? "E S T I M A T E" : "ESTIMATE"}
      </Text>
      <Text style={[txt({ fontSize: 12, color: t.bodySubText, textAlign: "center" as const, marginBottom: 2 })]}>
        {dateStr}
      </Text>

      {isTypewriter ? (
        <Text style={[txt({ color: t.divider, textAlign: "center" as const, marginVertical: 8, fontSize: 12 })]}>
          {"- - - - - - - - - - - - - - - - - - - -"}
        </Text>
      ) : (
        <View style={[styles.dividerLine, { backgroundColor: t.divider, marginVertical: 8 }]} />
      )}

      <Text style={[txt({ fontSize: 12, fontWeight: "bold" as const, color: t.bodySubText, marginBottom: 2 })]}>TO:</Text>
      <Text style={[txt({ paddingLeft: 16 })]}>{customerName}</Text>
      {jobAddress ? <Text style={[txt({ paddingLeft: 16 })]}>{jobAddress}</Text> : null}
      {customerPhone ? <Text style={[txt({ paddingLeft: 16 })]}>{customerPhone}</Text> : null}
      {customerEmail ? <Text style={[txt({ paddingLeft: 16 })]}>{customerEmail}</Text> : null}

      {jobDescription && jobDescription !== "Job quote" ? (
        <>
          <View style={styles.spacer} />
          <Text style={[txt({ fontSize: 12, fontWeight: "bold" as const, color: t.bodySubText, marginBottom: 2 })]}>JOB:</Text>
          <Text style={[txt({ paddingLeft: 16 })]}>{jobDescription}</Text>
        </>
      ) : null}

      {isTypewriter ? (
        <Text style={[txt({ color: t.divider, textAlign: "center" as const, marginVertical: 8, fontSize: 12 })]}>
          {"- - - - - - - - - - - - - - - - - - - -"}
        </Text>
      ) : (
        <View style={[styles.dividerLine, { backgroundColor: t.divider, marginVertical: 8 }]} />
      )}

      {materials.length > 0 ? (
        <>
          <Text style={[txt({
            fontSize: 12,
            fontWeight: "bold" as const,
            letterSpacing: 1,
            color: template === "bold" ? t.accent : t.bodySubText,
            marginBottom: 4,
            textDecorationLine: isTypewriter ? ("underline" as const) : ("none" as const),
          })]}>
            MATERIALS
          </Text>
          {materials.map((item) => {
            const total = item.quantity * item.unitPrice;
            return (
              <View key={item.id} style={styles.lineItemBlock}>
                <Text style={[txt()]}>{item.description}</Text>
                <View style={styles.itemDetailRow}>
                  <Text style={[txt({ fontSize: 12, color: t.bodySubText, flex: 1 })]}>
                    {"  "}{item.quantity} {item.unit} @ ${item.unitPrice.toFixed(2)}
                  </Text>
                  <Text style={[txt({ textAlign: "right" as const, minWidth: 60 })]}>
                    ${total.toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })}
          <View style={styles.spacer} />
        </>
      ) : null}

      {labor.length > 0 ? (
        <>
          <Text style={[txt({
            fontSize: 12,
            fontWeight: "bold" as const,
            letterSpacing: 1,
            color: template === "bold" ? t.accent : t.bodySubText,
            marginBottom: 4,
            textDecorationLine: isTypewriter ? ("underline" as const) : ("none" as const),
          })]}>
            LABOR
          </Text>
          {labor.map((item) => {
            const total = item.quantity * item.unitPrice;
            const detailLabel =
              item.unit === "flat"
                ? "  flat rate"
                : `  ${item.quantity} ${item.unit} @ $${item.unitPrice.toFixed(2)}`;
            return (
              <View key={item.id} style={styles.lineItemBlock}>
                <Text style={[txt()]}>{item.description}</Text>
                <View style={styles.itemDetailRow}>
                  <Text style={[txt({ fontSize: 12, color: t.bodySubText, flex: 1 })]}>
                    {detailLabel}
                  </Text>
                  <Text style={[txt({ textAlign: "right" as const, minWidth: 60 })]}>
                    ${total.toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })}
          <View style={styles.spacer} />
        </>
      ) : null}

      {isTypewriter ? (
        <Text style={[txt({ color: t.divider, textAlign: "center" as const, marginVertical: 8, fontSize: 12 })]}>
          {"- - - - - - - - - - - - - - - - - - - -"}
        </Text>
      ) : (
        <View style={[styles.dividerLine, { backgroundColor: t.divider, marginVertical: 8 }]} />
      )}

      <View style={[t.totalBg !== "transparent" && { backgroundColor: t.totalBg, borderRadius: 8, padding: 10, marginBottom: 4 }]}>
        {totals.materialSubtotal > 0 && (
          <View style={styles.totalRow}>
            <Text style={[txt({ color: t.bodySubText })]}>Materials</Text>
            <Text style={[txt({ textAlign: "right" as const })]}>${totals.materialSubtotal.toFixed(2)}</Text>
          </View>
        )}
        {totals.laborSubtotal > 0 && (
          <View style={styles.totalRow}>
            <Text style={[txt({ color: t.bodySubText })]}>Labor</Text>
            <Text style={[txt({ textAlign: "right" as const })]}>${totals.laborSubtotal.toFixed(2)}</Text>
          </View>
        )}
        {totals.discountAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={[txt({ color: t.bodySubText })]}>Discount</Text>
            <Text style={[txt({ color: "#3a7a3a", textAlign: "right" as const })]}>
              -${totals.discountAmount.toFixed(2)}
            </Text>
          </View>
        )}
        {(totals.taxRate > 0 || taxStateAbbr) && (
          <View style={styles.totalRow}>
            <Text style={[txt({ color: t.bodySubText })]}>
              {taxStateAbbr ? `Tax (${taxStateAbbr} ${totals.taxRate}%)` : `Tax (${totals.taxRate}%)`}
            </Text>
            <Text style={[txt({ textAlign: "right" as const })]}>${totals.taxAmount.toFixed(2)}</Text>
          </View>
        )}
      </View>

      {isTypewriter ? (
        <Text style={[txt({ color: t.divider, textAlign: "center" as const, marginVertical: 8, fontSize: 12 })]}>
          {"- - - - - - - - - - - - - - - - - - - -"}
        </Text>
      ) : (
        <View style={[styles.dividerLine, { backgroundColor: t.accent, marginVertical: 8, height: 2 }]} />
      )}

      <View style={styles.totalRow}>
        <Text style={[txt({ fontSize: 15, fontWeight: "bold" as const, letterSpacing: 0.5, color: template === "bold" ? t.accent : t.bodyText })]}>
          TOTAL DUE
        </Text>
        <Text style={[txt({ fontSize: 16, fontWeight: "bold" as const, color: template === "bold" ? t.accent : t.bodyText })]}>
          ${totals.total.toFixed(2)}
        </Text>
      </View>

      {isTypewriter ? (
        <Text style={[txt({ color: t.divider, textAlign: "center" as const, marginTop: 4, marginBottom: 0, fontSize: 12 })]}>
          {"= = = = = = = = = = = = = = = = = = = ="}
        </Text>
      ) : (
        <View style={[styles.dividerLine, { backgroundColor: t.divider, marginTop: 8 }]} />
      )}

      <Text style={[txt({ fontSize: 12, color: t.footerText, marginTop: 6, fontStyle: "italic" as const, textAlign: "center" as const })]}>
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
    borderRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  headerBlock: {
    marginHorizontal: -20,
    marginTop: -22,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    gap: 2,
    marginBottom: 0,
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
  dividerLine: {
    height: 1,
  },
  spacer: {
    height: 6,
  },
  lineItemBlock: {
    marginBottom: 6,
  },
  itemDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 1,
  },
});
