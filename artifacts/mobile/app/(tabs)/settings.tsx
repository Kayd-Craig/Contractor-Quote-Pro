import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
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

import { FONT_OPTIONS, TEMPLATE_OPTIONS } from "@/components/PaperQuoteView";
import type { ContractorSettings, PreferredStore, QuoteFont, QuoteTemplate } from "@/context/QuoteContext";
import { useQuotes } from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";
import { useConnectOnboard, getConnectDashboard, useGetConnectBalance, useGetConnectStatus } from "@workspace/api-client-react";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, quotes } = useQuotes();

  const [form, setForm] = useState<ContractorSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const { mutateAsync: onboardConnect } = useConnectOnboard();

  const hasStripeAccount = !!settings.stripeAccountId;

  const { data: connectStatus, refetch: refetchStatus } = useGetConnectStatus(
    { account_id: settings.stripeAccountId || "" },
    { query: { enabled: hasStripeAccount } }
  );

  const { data: balanceData, refetch: refetchBalance } = useGetConnectBalance(
    { account_id: settings.stripeAccountId || "" },
    { query: { enabled: hasStripeAccount && connectStatus?.status === "active" } }
  );

  useEffect(() => {
    setForm((prev) => {
      const scheduleOnly =
        prev.name === settings.name &&
        prev.phone === settings.phone &&
        prev.email === settings.email &&
        prev.businessName === settings.businessName &&
        prev.licenseNumber === settings.licenseNumber &&
        prev.zipCode === settings.zipCode &&
        prev.defaultMarkup === settings.defaultMarkup &&
        prev.contractorDiscount === settings.contractorDiscount &&
        prev.preferredStore === settings.preferredStore &&
        prev.quoteTemplate === settings.quoteTemplate &&
        prev.quoteFont === settings.quoteFont &&
        prev.logo === settings.logo;
      if (scheduleOnly) {
        return { ...prev, weeklySchedule: settings.weeklySchedule, blockedDates: settings.blockedDates };
      }
      return settings;
    });
  }, [settings]);

  const handleConnectStripe = useCallback(async () => {
    setConnectLoading(true);
    try {
      const data: Record<string, any> = {
        email: settings.email || undefined,
        businessName: settings.businessName || undefined,
        contractorName: settings.name || undefined,
      };

      if (settings.stripeAccountId) {
        data.existingAccountId = settings.stripeAccountId;
      }

      const result = await onboardConnect({ data: data as any });

      updateSettings({
        stripeAccountId: result.accountId,
        stripeOnboarded: false,
      });

      if (Platform.OS === "web") {
        window.open(result.onboardingUrl, "_blank");
      } else {
        await WebBrowser.openBrowserAsync(result.onboardingUrl);
      }

      setTimeout(() => refetchStatus(), 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.connectRequired
        ? "Stripe Connect is not yet enabled. Please contact the app administrator to set it up."
        : "Failed to start Stripe account setup. Please try again.";
      Alert.alert("Setup Error", msg);
    } finally {
      setConnectLoading(false);
    }
  }, [settings, onboardConnect, updateSettings, refetchStatus]);

  const handleOpenDashboard = useCallback(async () => {
    if (!settings.stripeAccountId) return;
    setDashboardLoading(true);
    try {
      const result = await getConnectDashboard({ account_id: settings.stripeAccountId });
      if (result.dashboardUrl) {
        if (Platform.OS === "web") {
          window.open(result.dashboardUrl, "_blank");
        } else {
          await WebBrowser.openBrowserAsync(result.dashboardUrl);
        }
      }
    } catch (err: any) {
      Alert.alert("Error", "Unable to open Stripe dashboard. Make sure your account setup is complete.");
    } finally {
      setDashboardLoading(false);
    }
  }, [settings.stripeAccountId]);

  const handleRefreshConnect = useCallback(() => {
    refetchStatus();
    if (connectStatus?.status === "active") {
      refetchBalance();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [refetchStatus, refetchBalance, connectStatus]);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom > 0 ? insets.bottom : 16;

  async function convertToDataUri(uri: string): Promise<string> {
    if (uri.startsWith("data:")) return uri;

    if (Platform.OS === "web") {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        return uri;
      }
    }

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const ext = uri.toLowerCase().includes(".png") ? "png" : "jpeg";
      return `data:image/${ext};base64,${base64}`;
    } catch {
      return uri;
    }
  }

  async function handleCamera() {
    setShowLogoPicker(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera access is required to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const dataUri = await convertToDataUri(result.assets[0].uri);
      setForm((f) => ({ ...f, logoUri: dataUri }));
    }
  }

  async function handleLibrary() {
    setShowLogoPicker(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Photo library access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const dataUri = await convertToDataUri(result.assets[0].uri);
      setForm((f) => ({ ...f, logoUri: dataUri }));
    }
  }

  function handleRemoveLogo() {
    setShowLogoPicker(false);
    setForm((f) => ({ ...f, logoUri: undefined }));
  }

  function handleSave() {
    if (!form.name.trim()) {
      Alert.alert("Required", "Please enter your contractor name.");
      return;
    }
    if (form.defaultMarkup < 0 || form.defaultMarkup > 500) {
      Alert.alert("Invalid Markup", "Markup must be between 0% and 500%.");
      return;
    }
    updateSettings(form);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Your contractor profile
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Business Name + Logo — prominent, shown on quotes */}
        <View style={[styles.businessCard, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          <View style={styles.businessCardHeader}>
            <Feather name="briefcase" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.businessCardLabel}>BUSINESS NAME</Text>
            <View style={styles.quoteTagRow}>
              <Feather name="file-text" size={11} color="rgba(255,255,255,0.7)" />
              <Text style={styles.quoteTagText}>Appears on every quote</Text>
            </View>
          </View>
          <TextInput
            style={styles.businessNameInput}
            value={form.businessName}
            onChangeText={(v) => setForm((f) => ({ ...f, businessName: v }))}
            placeholder="Your Business Name (e.g. Smith Construction LLC)"
            placeholderTextColor="rgba(255,255,255,0.5)"
            autoCapitalize="words"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.logoRow} onPress={() => setShowLogoPicker(true)} activeOpacity={0.8}>
            {form.logoUri ? (
              <>
                <Image source={{ uri: form.logoUri }} style={styles.logoPreview} resizeMode="contain" />
                <View style={styles.logoMeta}>
                  <Text style={styles.logoLabel}>Business Logo</Text>
                  <Text style={styles.logoHint}>Tap to change or remove</Text>
                </View>
                <Feather name="edit-2" size={16} color="rgba(255,255,255,0.7)" />
              </>
            ) : (
              <>
                <View style={styles.logoPlaceholder}>
                  <Feather name="image" size={22} color="rgba(255,255,255,0.6)" />
                </View>
                <View style={styles.logoMeta}>
                  <Text style={styles.logoLabel}>Add Business Logo</Text>
                  <Text style={styles.logoHint}>Shows on quotes — tap to upload</Text>
                </View>
                <Feather name="plus" size={18} color="rgba(255,255,255,0.7)" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          CONTACT INFORMATION
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <InputRow
            icon="user"
            label="Your Name"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="First and last name"
            colors={colors}
          />
          <Divider colors={colors} />
          <InputRow
            icon="phone"
            label="Phone Number"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
            colors={colors}
          />
          <Divider colors={colors} />
          <InputRow
            icon="mail"
            label="Email Address"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            placeholder="you@email.com"
            keyboardType="email-address"
            colors={colors}
          />
          <Divider colors={colors} />
          <InputRow
            icon="shield"
            label="License Number"
            value={form.license}
            onChange={(v) => setForm((f) => ({ ...f, license: v }))}
            placeholder="Contractor license # (optional)"
            colors={colors}
          />
        </View>

        {/* Location */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          YOUR LOCATION
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <InputRow
            icon="map-pin"
            label="Zip Code"
            value={form.zipCode}
            onChange={(v) => setForm((f) => ({ ...f, zipCode: v.replace(/\D/g, "").slice(0, 5) }))}
            placeholder="Optional — enter to find nearby stores"
            keyboardType="number-pad"
            colors={colors}
          />
        </View>
        <View style={[styles.zipHint, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="map-pin" size={13} color={colors.mutedForeground} />
          <Text style={[styles.zipHintText, { color: colors.mutedForeground }]}>
            Optional. Your zip code is used only on your device to (1) find Home Depot, Lowe's, and Amazon stores near you in the Materials tab, and (2) auto-fill the correct local sales tax rate on new quotes. It's never sent to our servers or shared with anyone.
          </Text>
        </View>

        {/* Preferred Store */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          PREFERRED STORE
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.styleSection}>
            <View style={styles.styleSectionHeader}>
              <Feather name="shopping-bag" size={16} color={colors.primary} />
              <View>
                <Text style={[styles.markupLabel, { color: colors.foreground }]}>Quote From</Text>
                <Text style={[styles.markupDesc, { color: colors.mutedForeground }]}>Which store to search products from</Text>
              </View>
            </View>
            <View style={styles.styleChipRow}>
              {([
                { key: "all" as PreferredStore, label: "All Stores", icon: "grid" as const, color: colors.accent },
                { key: "homedepot" as PreferredStore, label: "Home Depot", icon: "home" as const, color: colors.homedepot },
                { key: "lowes" as PreferredStore, label: "Lowe's", icon: "tool" as const, color: colors.lowes },
                { key: "amazon" as PreferredStore, label: "Amazon", icon: "shopping-bag" as const, color: colors.amazon },
              ]).map((opt) => {
                const active = (form.preferredStore || "all") === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.styleChip,
                      {
                        borderColor: active ? opt.color : colors.border,
                        backgroundColor: active ? opt.color + "18" : colors.secondary,
                      },
                    ]}
                    onPress={() => setForm((f) => ({ ...f, preferredStore: opt.key }))}
                    activeOpacity={0.8}
                  >
                    <Feather name={opt.icon} size={18} color={active ? opt.color : colors.mutedForeground} />
                    <Text style={[styles.styleChipLabel, { color: active ? opt.color : colors.foreground }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
        <View style={[styles.zipHint, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="info" size={13} color={colors.mutedForeground} />
          <Text style={[styles.zipHintText, { color: colors.mutedForeground }]}>
            Choose "All Stores" to see products from Home Depot, Lowe's, and Amazon, or pick one to only show products from that store.
          </Text>
        </View>

        {/* Store Account Discount */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          STORE ACCOUNT DISCOUNT
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.markupRow}>
            <View style={styles.markupInfo}>
              <Feather name="scissors" size={16} color={colors.success} />
              <View>
                <Text style={[styles.markupLabel, { color: colors.foreground }]}>
                  My Pro Account Discount
                </Text>
                <Text style={[styles.markupDesc, { color: colors.mutedForeground }]}>
                  Your % off retail at HD / Lowe's
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.markupInput,
                { borderColor: colors.success, backgroundColor: colors.success + "12" },
              ]}
            >
              <TextInput
                style={[styles.markupValue, { color: colors.success }]}
                value={form.contractorDiscount.toString()}
                onChangeText={(v) => {
                  const n = parseFloat(v);
                  if (!isNaN(n)) setForm((f) => ({ ...f, contractorDiscount: n }));
                  else if (v === "" || v === ".") setForm((f) => ({ ...f, contractorDiscount: 0 }));
                }}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
              <Text style={[styles.markupPct, { color: colors.success }]}>%</Text>
            </View>
          </View>
          <View style={[styles.presetRow, { borderTopColor: colors.border }]}>
            {[0, 5, 10, 12, 15, 20].map((pct) => (
              <TouchableOpacity
                key={pct}
                style={[
                  styles.presetBtn,
                  {
                    backgroundColor:
                      form.contractorDiscount === pct ? colors.success : colors.secondary,
                  },
                ]}
                onPress={() => setForm((f) => ({ ...f, contractorDiscount: pct }))}
              >
                <Text
                  style={[
                    styles.presetText,
                    {
                      color:
                        form.contractorDiscount === pct
                          ? "#FFFFFF"
                          : colors.foreground,
                    },
                  ]}
                >
                  {pct === 0 ? "None" : `${pct}%`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={[styles.zipHint, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="info" size={13} color={colors.mutedForeground} />
          <Text style={[styles.zipHintText, { color: colors.mutedForeground }]}>
            When set, product prices in search show your actual cost — not the retail price — and auto-fill that lower amount when adding to a quote.
          </Text>
        </View>

        {/* Default Markup */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          DEFAULT MARKUP
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.markupRow}>
            <View style={styles.markupInfo}>
              <Feather name="percent" size={16} color={colors.primary} />
              <View>
                <Text style={[styles.markupLabel, { color: colors.foreground }]}>
                  Default Markup %
                </Text>
                <Text style={[styles.markupDesc, { color: colors.mutedForeground }]}>
                  Applied automatically to all jobs
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.markupInput,
                { borderColor: colors.primary, backgroundColor: colors.primary + "12" },
              ]}
            >
              <TextInput
                style={[styles.markupValue, { color: colors.primary }]}
                value={form.defaultMarkup.toString()}
                onChangeText={(v) => {
                  const n = parseFloat(v);
                  if (!isNaN(n)) setForm((f) => ({ ...f, defaultMarkup: n }));
                  else if (v === "" || v === ".") setForm((f) => ({ ...f, defaultMarkup: 0 }));
                }}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
              <Text style={[styles.markupPct, { color: colors.primary }]}>%</Text>
            </View>
          </View>
          <View style={[styles.presetRow, { borderTopColor: colors.border }]}>
            {[10, 15, 20, 25, 30].map((pct) => (
              <TouchableOpacity
                key={pct}
                style={[
                  styles.presetBtn,
                  {
                    backgroundColor:
                      form.defaultMarkup === pct ? colors.primary : colors.secondary,
                  },
                ]}
                onPress={() => setForm((f) => ({ ...f, defaultMarkup: pct }))}
              >
                <Text
                  style={[
                    styles.presetText,
                    {
                      color:
                        form.defaultMarkup === pct
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {pct}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quote Style */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          DEFAULT QUOTE STYLE
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.styleSection}>
            <View style={styles.styleSectionHeader}>
              <Feather name="layout" size={16} color={colors.primary} />
              <View>
                <Text style={[styles.markupLabel, { color: colors.foreground }]}>Template</Text>
                <Text style={[styles.markupDesc, { color: colors.mutedForeground }]}>Layout and color scheme</Text>
              </View>
            </View>
            <View style={styles.styleChipRow}>
              {TEMPLATE_OPTIONS.map((opt) => {
                const active = (form.defaultQuoteTemplate || "typewriter") === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.styleChip,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + "12" : colors.secondary,
                      },
                    ]}
                    onPress={() => setForm((f) => ({ ...f, defaultQuoteTemplate: opt.key as QuoteTemplate }))}
                    activeOpacity={0.8}
                  >
                    <View style={styles.templateMini}>
                      <View style={[styles.templateMiniTop, { backgroundColor: opt.colors[0] }]} />
                      <View style={[styles.templateMiniLine, { backgroundColor: opt.colors[2] }]} />
                      <View style={[styles.templateMiniLine, { backgroundColor: opt.colors[2], width: 12 }]} />
                    </View>
                    <Text style={[styles.styleChipLabel, { color: active ? colors.primary : colors.foreground }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={[styles.styleDivider, { backgroundColor: colors.border }]} />
          <View style={styles.styleSection}>
            <View style={styles.styleSectionHeader}>
              <Feather name="type" size={16} color={colors.primary} />
              <View>
                <Text style={[styles.markupLabel, { color: colors.foreground }]}>Font</Text>
                <Text style={[styles.markupDesc, { color: colors.mutedForeground }]}>Text style on your quotes</Text>
              </View>
            </View>
            <View style={styles.styleChipRow}>
              {FONT_OPTIONS.map((opt) => {
                const active = (form.defaultQuoteFont || "classic") === opt.key;
                const fontFamily =
                  opt.key === "classic" ? (Platform.OS === "web" ? "Courier New, monospace" : "Courier New")
                  : opt.key === "elegant" ? (Platform.OS === "web" ? "Georgia, serif" : "Georgia")
                  : opt.key === "clean" ? (Platform.OS === "web" ? "Helvetica Neue, Arial, sans-serif" : "Helvetica Neue")
                  : undefined;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.styleChip,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + "12" : colors.secondary,
                      },
                    ]}
                    onPress={() => setForm((f) => ({ ...f, defaultQuoteFont: opt.key as QuoteFont }))}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.fontPreviewLetter, { fontFamily, color: active ? colors.primary : colors.foreground }]}>
                      Aa
                    </Text>
                    <Text style={[styles.styleChipLabel, { color: active ? colors.primary : colors.foreground }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
        <View style={[styles.zipHint, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="info" size={13} color={colors.mutedForeground} />
          <Text style={[styles.zipHintText, { color: colors.mutedForeground }]}>
            New quotes will use this style by default. You can still change the style per-quote from the quote preview screen.
          </Text>
        </View>

        {/* Stripe Connect / Payments */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          PAYMENTS & PAYOUTS
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {!hasStripeAccount ? (
            <View style={styles.connectSection}>
              <View style={styles.connectHeader}>
                <View style={[styles.connectIconWrap, { backgroundColor: "#635BFF" + "15" }]}>
                  <Feather name="credit-card" size={20} color="#635BFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.markupLabel, { color: colors.foreground }]}>Connect Stripe Account</Text>
                  <Text style={[styles.markupDesc, { color: colors.mutedForeground }]}>
                    Receive payments directly to your bank account
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.connectBtn, { backgroundColor: "#635BFF" }]}
                onPress={handleConnectStripe}
                disabled={connectLoading}
                activeOpacity={0.85}
              >
                {connectLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="link" size={16} color="#fff" />
                    <Text style={styles.connectBtnText}>Set Up Stripe Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.connectSection}>
              <View style={styles.connectHeader}>
                <View style={[styles.connectIconWrap, {
                  backgroundColor: connectStatus?.status === "active" ? colors.success + "15" : "#F59E0B" + "15"
                }]}>
                  <Feather
                    name={connectStatus?.status === "active" ? "check-circle" : "clock"}
                    size={20}
                    color={connectStatus?.status === "active" ? colors.success : "#F59E0B"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.markupLabel, { color: colors.foreground }]}>
                    Stripe Account {connectStatus?.status === "active" ? "Connected" : connectStatus?.status === "pending" ? "Pending" : "Incomplete"}
                  </Text>
                  <Text style={[styles.markupDesc, { color: colors.mutedForeground }]}>
                    {connectStatus?.status === "active"
                      ? "Your account is active and receiving payments"
                      : "Complete your account setup to receive payments"}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleRefreshConnect} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              {connectStatus?.status === "active" && balanceData && (
                <View style={[styles.balanceRow, { borderTopColor: colors.border }]}>
                  <View style={styles.balanceItem}>
                    <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Available</Text>
                    <Text style={[styles.balanceValue, { color: colors.success }]}>
                      ${balanceData.availableBalance.toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.balanceDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.balanceItem}>
                    <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Pending</Text>
                    <Text style={[styles.balanceValue, { color: colors.foreground }]}>
                      ${balanceData.pendingBalance.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}

              {connectStatus?.status === "active" ? (
                <TouchableOpacity
                  style={[styles.connectBtn, { backgroundColor: "#635BFF" }]}
                  onPress={handleOpenDashboard}
                  disabled={dashboardLoading}
                  activeOpacity={0.85}
                >
                  {dashboardLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="external-link" size={16} color="#fff" />
                      <Text style={styles.connectBtnText}>Open Stripe Dashboard</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.connectBtn, { backgroundColor: "#F59E0B" }]}
                  onPress={handleConnectStripe}
                  disabled={connectLoading}
                  activeOpacity={0.85}
                >
                  {connectLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="arrow-right" size={16} color="#fff" />
                      <Text style={styles.connectBtnText}>Complete Account Setup</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        <View style={[styles.zipHint, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="info" size={13} color={colors.mutedForeground} />
          <Text style={[styles.zipHintText, { color: colors.mutedForeground }]}>
            When connected, client payments go directly to your Stripe account. A 3% + $0.50 service fee is deducted automatically per transaction.
          </Text>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: saved ? colors.success : colors.primary },
          ]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Feather
            name={saved ? "check" : "save"}
            size={18}
            color={colors.primaryForeground}
          />
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
            {saved ? "Saved!" : "Save Settings"}
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.infoBox,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
        >
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Product prices from Home Depot and Lowe's are updated in real time.
            Contractor pricing shown where available via Pro programs.
          </Text>
        </View>
      </ScrollView>

      {/* Logo picker bottom sheet */}
      <Modal
        visible={showLogoPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLogoPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <TouchableOpacity style={styles.pickerBackdrop} onPress={() => setShowLogoPicker(false)} />
          <View style={[styles.pickerSheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 8 }]}>
            <View style={[styles.pickerHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Business Logo</Text>

            {Platform.OS !== "web" && (
              <TouchableOpacity
                style={[styles.pickerOption, { borderColor: colors.border }]}
                onPress={handleCamera}
                activeOpacity={0.75}
              >
                <View style={[styles.pickerOptionIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Feather name="camera" size={20} color={colors.primary} />
                </View>
                <View style={styles.pickerOptionText}>
                  <Text style={[styles.pickerOptionLabel, { color: colors.foreground }]}>Take a Photo</Text>
                  <Text style={[styles.pickerOptionSub, { color: colors.mutedForeground }]}>Use your camera</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.pickerOption, { borderColor: colors.border }]}
              onPress={handleLibrary}
              activeOpacity={0.75}
            >
              <View style={[styles.pickerOptionIcon, { backgroundColor: colors.accent + "15" }]}>
                <Feather name="image" size={20} color={colors.accent} />
              </View>
              <View style={styles.pickerOptionText}>
                <Text style={[styles.pickerOptionLabel, { color: colors.foreground }]}>
                  {Platform.OS === "web" ? "Choose a File" : "Photo Library"}
                </Text>
                <Text style={[styles.pickerOptionSub, { color: colors.mutedForeground }]}>
                  {Platform.OS === "web" ? "Upload from your device" : "Pick from your photos"}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            {form.logoUri ? (
              <TouchableOpacity
                style={[styles.pickerOption, { borderColor: colors.border }]}
                onPress={handleRemoveLogo}
                activeOpacity={0.75}
              >
                <View style={[styles.pickerOptionIcon, { backgroundColor: colors.destructive + "15" }]}>
                  <Feather name="trash-2" size={20} color={colors.destructive} />
                </View>
                <View style={styles.pickerOptionText}>
                  <Text style={[styles.pickerOptionLabel, { color: colors.destructive }]}>Remove Logo</Text>
                  <Text style={[styles.pickerOptionSub, { color: colors.mutedForeground }]}>Clear the current logo</Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.pickerCancel, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              onPress={() => setShowLogoPicker(false)}
            >
              <Text style={[styles.pickerCancelText, { color: colors.foreground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.divider, { backgroundColor: colors.border }]} />
  );
}

function InputRow({
  icon,
  label,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  colors,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address" | "number-pad" | "decimal-pad";
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View
        style={[
          styles.fieldRow,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <Feather name={icon} size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.fieldInput, { color: colors.foreground }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
          autoCapitalize={
            keyboardType === "email-address" || keyboardType === "number-pad"
              ? "none"
              : "words"
          }
          autoCorrect={false}
        />
      </View>
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
  scroll: { padding: 16 },

  businessCard: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginBottom: 6,
    marginTop: 6,
  },
  businessCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  businessCardLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.8,
    flex: 1,
  },
  quoteTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.15)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  quoteTagText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
  },
  businessNameInput: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    borderBottomWidth: 1.5,
    borderBottomColor: "rgba(255,255,255,0.4)",
    paddingVertical: 6,
    minHeight: 36,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 12,
    padding: 10,
  },
  logoPreview: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  logoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  logoMeta: {
    flex: 1,
    gap: 2,
  },
  logoLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  logoHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.65)",
  },

  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 18,
    marginLeft: 4,
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  fieldGroup: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
    height: 42,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },

  zipHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
  },
  zipHintText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },

  markupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  markupInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  markupLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  markupDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  markupInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: 78,
    justifyContent: "center",
    overflow: "hidden",
  },
  markupValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    width: 44,
    textAlign: "right",
  },
  markupPct: { fontSize: 15, fontFamily: "Inter_700Bold" },
  presetRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
    justifyContent: "center",
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 0,
  },
  presetText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 13,
    marginTop: 20,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },

  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  pickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  pickerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  pickerOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerOptionText: { flex: 1, gap: 2 },
  pickerOptionLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  pickerOptionSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  pickerCancel: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  pickerCancelText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },

  styleSection: {
    padding: 16,
    gap: 12,
  },
  styleSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  styleDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  styleChipRow: {
    flexDirection: "row",
    gap: 8,
  },
  styleChip: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  styleChipLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  templateMini: {
    width: 30,
    height: 20,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    padding: 3,
    gap: 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.1)",
  },
  templateMiniTop: {
    width: "100%",
    height: 7,
    borderRadius: 1,
  },
  templateMiniLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
  },
  fontPreviewLetter: {
    fontSize: 18,
    fontWeight: "600",
  },
  connectSection: {
    padding: 16,
    gap: 14,
  },
  connectHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  connectIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  connectBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
  },
  balanceItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  balanceDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
  balanceLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
  },
  scheduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  scheduleSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
