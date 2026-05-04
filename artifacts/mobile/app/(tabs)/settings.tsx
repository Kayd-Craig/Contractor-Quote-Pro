import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Alert,
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

  const topPad =
    Platform.OS === "web"
      ? Math.max(insets.top, 67)
      : insets.top;

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

  const Field = ({
    label,
    value,
    onChange,
    placeholder,
    keyboardType = "default",
    icon,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    keyboardType?: "default" | "phone-pad" | "email-address" | "numeric" | "decimal-pad";
    icon: React.ComponentProps<typeof Feather>["name"];
  }) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View
        style={[styles.fieldRow, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Feather name={icon} size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.fieldInput, { color: colors.foreground }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          autoCorrect={false}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border },
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
            paddingBottom:
              Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Contractor Info */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          CONTRACTOR INFORMATION
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field
            label="Business / Name"
            icon="user"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="Your name or business name"
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Field
            label="Phone Number"
            icon="phone"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Field
            label="Email Address"
            icon="mail"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            placeholder="you@email.com"
            keyboardType="email-address"
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Field
            label="License Number"
            icon="shield"
            value={form.license}
            onChange={(v) => setForm((f) => ({ ...f, license: v }))}
            placeholder="Contractor license # (optional)"
          />
        </View>

        {/* Markup */}
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
                  Applied to all jobs unless overridden
                </Text>
              </View>
            </View>
            <View style={[styles.markupInput, { borderColor: colors.primary, backgroundColor: colors.primary + "12" }]}>
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

          {/* Preset buttons */}
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
                    { color: form.defaultMarkup === pct ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {pct}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save button */}
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

        <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Product prices from Home Depot and Lowe's are updated in real time. Contractor pricing shown where available via Pro programs.
          </Text>
        </View>
      </ScrollView>
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
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  scroll: {
    padding: 16,
    gap: 0,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
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
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
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
  markupLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  markupDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  markupInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 72,
    justifyContent: "center",
  },
  markupValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    minWidth: 36,
    textAlign: "center",
  },
  markupPct: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  presetRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 8,
    justifyContent: "center",
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  presetText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 13,
    marginTop: 20,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
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
