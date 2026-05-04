import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ContractorSettings } from "@/context/QuoteContext";
import { useQuotes } from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useQuotes();

  const [form, setForm] = useState<ContractorSettings>(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  async function handlePickLogo() {
    Alert.alert("Business Logo", "Choose a source", [
      {
        text: "Camera",
        onPress: async () => {
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
            setForm((f) => ({ ...f, logoUri: result.assets[0].uri }));
          }
        },
      },
      {
        text: "Photo Library",
        onPress: async () => {
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
            setForm((f) => ({ ...f, logoUri: result.assets[0].uri }));
          }
        },
      },
      {
        text: "Remove Logo",
        style: "destructive",
        onPress: () => setForm((f) => ({ ...f, logoUri: undefined })),
      },
      { text: "Cancel", style: "cancel" },
    ]);
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
          <TouchableOpacity style={styles.logoRow} onPress={handlePickLogo} activeOpacity={0.8}>
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
            placeholder="Enter zip code to find nearby stores"
            keyboardType="number-pad"
            colors={colors}
          />
        </View>
        <View style={[styles.zipHint, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="map-pin" size={13} color={colors.mutedForeground} />
          <Text style={[styles.zipHintText, { color: colors.mutedForeground }]}>
            Your zip code is used in the Materials tab to show hardware stores near you.
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
});
