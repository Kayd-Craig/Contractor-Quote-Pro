import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useQuotes } from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateSettings } = useQuotes();

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [license, setLicense] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 24) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom > 0 ? insets.bottom : 24;

  function handleGetStarted() {
    const newErrors: Record<string, string> = {};

    if (zipCode.trim().length > 0 && zipCode.trim().length < 5) {
      newErrors.zipCode = "Please enter a valid 5-digit zip code";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setErrors({});
    updateSettings({
      name: name.trim(),
      businessName: businessName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      zipCode: zipCode.trim(),
      license: license.trim(),
      onboardingComplete: true,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleSkip() {
    setErrors({});
    updateSettings({ onboardingComplete: true });
    Haptics.selectionAsync();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: topPad + 40, paddingBottom: bottomPad + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
              <Feather name="briefcase" size={32} color={colors.primaryForeground} />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Welcome to QuickQuote Contractor
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            All fields below are optional. You can skip this screen and start using the app right away.
          </Text>

          <View style={[styles.disclaimerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.disclaimerRow}>
              <Feather name="info" size={14} color={colors.primary} style={styles.disclaimerIcon} />
              <Text style={[styles.disclaimerText, { color: colors.foreground }]}>
                <Text style={styles.disclaimerLabel}>Your name, business, phone &amp; email </Text>
                appear on quotes you send to customers so they know who the bid is from.
              </Text>
            </View>
            <View style={styles.disclaimerRow}>
              <Feather name="map-pin" size={14} color={colors.primary} style={styles.disclaimerIcon} />
              <Text style={[styles.disclaimerText, { color: colors.foreground }]}>
                <Text style={styles.disclaimerLabel}>Your zip code </Text>
                is used only to find nearby Home Depot, Lowe's, and Amazon stores and to look up local sales tax rates. It is never shared.
              </Text>
            </View>
            <View style={styles.disclaimerRow}>
              <Feather name="lock" size={14} color={colors.primary} style={styles.disclaimerIcon} />
              <Text style={[styles.disclaimerText, { color: colors.foreground }]}>
                Everything you enter stays on this device. We do not collect, store, or share any of it on our servers.
              </Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              YOUR INFORMATION
            </Text>

            <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: errors.name ? colors.destructive : colors.border }]}>
              <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
                <Feather name="user" size={18} color={errors.name ? colors.destructive : colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Your Name (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={name}
                  onChangeText={(t) => { setName(t); setErrors((e) => { const { name: _, ...rest } = e; return rest; }); }}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>

              <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
                <Feather name="home" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Business Name (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={businessName}
                  onChangeText={setBusinessName}
                  autoCapitalize="words"
                  autoComplete="organization"
                />
              </View>

              <View style={styles.inputRow}>
                <Feather name="award" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="License # (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={license}
                  onChangeText={setLicense}
                  autoCapitalize="characters"
                />
              </View>
            </View>
            {errors.name && (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.name}</Text>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              CONTACT INFO
            </Text>

            <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: errors.phone ? colors.destructive : colors.border }]}>
              <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
                <Feather name="phone" size={18} color={errors.phone ? colors.destructive : colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Phone Number (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={phone}
                  onChangeText={(t) => { setPhone(t); setErrors((e) => { const { phone: _, ...rest } = e; return rest; }); }}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>

              <View style={styles.inputRow}>
                <Feather name="mail" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Email (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>
            {errors.phone && (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.phone}</Text>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              SERVICE AREA
            </Text>

            <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: errors.zipCode ? colors.destructive : colors.border }]}>
              <View style={styles.inputRow}>
                <Feather name="map-pin" size={18} color={errors.zipCode ? colors.destructive : colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Zip Code (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={zipCode}
                  onChangeText={(t) => { setZipCode(t.replace(/\D/g, "").slice(0, 5)); setErrors((e) => { const { zipCode: _, ...rest } = e; return rest; }); }}
                  keyboardType="number-pad"
                  maxLength={5}
                  autoComplete="postal-code"
                />
              </View>
            </View>
            {errors.zipCode ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.zipCode}</Text>
            ) : (
              <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                Used for automatic tax rate calculation on your quotes.
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleGetStarted}
            activeOpacity={0.85}
            testID="onboarding-get-started"
          >
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              Save & Continue
            </Text>
            <Feather name="arrow-right" size={20} color={colors.primaryForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
            testID="onboarding-skip"
          >
            <Text style={[styles.skipButtonText, { color: colors.primary }]}>
              Skip for now
            </Text>
          </TouchableOpacity>

          <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
            You can add or update this information anytime in Settings.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  iconRow: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputGroup: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    paddingVertical: 14,
  },
  helperText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  disclaimerBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 28,
    gap: 10,
  },
  disclaimerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  disclaimerIcon: {
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  disclaimerLabel: {
    fontFamily: "Inter_600SemiBold",
  },
  skipButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginBottom: 8,
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  footerNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 20,
  },
});
