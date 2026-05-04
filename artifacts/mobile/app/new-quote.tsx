import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { forwardRef, useRef, useState } from "react";
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
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CustomerPicker } from "@/components/CustomerPicker";
import type { Customer } from "@/context/QuoteContext";
import { useQuotes } from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";

export default function NewQuoteScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { createQuote, settings, getCustomers } = useQuotes();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [jobAddress, setJobAddress] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);

  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);

  const bottomPad =
    Platform.OS === "web" ? 34 : insets.bottom > 0 ? insets.bottom : 24;

  const customers = getCustomers();
  const hasCustomers = customers.length > 0;
  const recentThree = customers.slice(0, 3);

  function handleCreate() {
    if (!customerName.trim()) {
      Alert.alert("Required", "Please enter the customer name.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const quote = createQuote({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      jobAddress: jobAddress.trim() || undefined,
      jobDescription: jobDescription.trim() || "Job quote",
    });
    router.back();
    setTimeout(() => router.push(`/quote/${quote.id}`), 50);
  }

  function handleSelectCustomer(customer: Customer) {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone ?? "");
    setCustomerEmail(customer.email ?? "");
    setJobAddress(customer.lastAddress ?? "");
    setPickerVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleQuickFill(customer: Customer) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone ?? "");
    setCustomerEmail(customer.email ?? "");
    setJobAddress(customer.lastAddress ?? "");
  }

  const isFieldFilled = customerName || customerPhone || customerEmail;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Nav bar */}
      <View
        style={[
          styles.nav,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>
          New Quote
        </Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={handleCreate}
          activeOpacity={0.85}
        >
          <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>
            Create
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 20 }]}
      >
        {/* ── Repeat Customer section ── */}
        {hasCustomers && (
          <View style={styles.repeatSection}>
            <View style={styles.repeatHeader}>
              <View style={styles.repeatTitleRow}>
                <Feather name="users" size={14} color={colors.accent} />
                <Text style={[styles.repeatTitle, { color: colors.accent }]}>
                  Repeat Customer?
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.allCustomersBtn, { borderColor: colors.accent + "40" }]}
                onPress={() => setPickerVisible(true)}
              >
                <Text style={[styles.allCustomersBtnText, { color: colors.accent }]}>
                  All {customers.length}
                </Text>
                <Feather name="chevron-right" size={13} color={colors.accent} />
              </TouchableOpacity>
            </View>

            {/* Recent 3 quick-fill chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              keyboardShouldPersistTaps="handled"
            >
              {recentThree.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.customerChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleQuickFill(c)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[styles.chipAvatar, { backgroundColor: colors.primary + "20" }]}
                  >
                    <Text style={[styles.chipAvatarText, { color: colors.primary }]}>
                      {c.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.chipInfo}>
                    <Text
                      style={[styles.chipName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {c.name.split(" ")[0]}
                    </Text>
                    <Text style={[styles.chipCount, { color: colors.mutedForeground }]}>
                      {c.quoteCount} quote{c.quoteCount !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <Feather name="zap" size={13} color={colors.primary} style={styles.chipZap} />
                </TouchableOpacity>
              ))}

              {customers.length > 3 && (
                <TouchableOpacity
                  style={[
                    styles.moreChip,
                    { backgroundColor: colors.secondary, borderColor: colors.border },
                  ]}
                  onPress={() => setPickerVisible(true)}
                >
                  <Feather name="users" size={16} color={colors.mutedForeground} />
                  <Text style={[styles.moreChipText, { color: colors.mutedForeground }]}>
                    +{customers.length - 3} more
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {isFieldFilled && (
              <TouchableOpacity
                style={styles.clearRow}
                onPress={() => {
                  setCustomerName("");
                  setCustomerPhone("");
                  setCustomerEmail("");
                  setJobAddress("");
                }}
              >
                <Feather name="x-circle" size={12} color={colors.mutedForeground} />
                <Text style={[styles.clearText, { color: colors.mutedForeground }]}>
                  Clear fields
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Customer */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          CUSTOMER
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <InputRow
            icon="user"
            label="Customer Name *"
            value={customerName}
            onChange={setCustomerName}
            placeholder="John Smith"
            returnKey="next"
            onSubmit={() => phoneRef.current?.focus()}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InputRow
            ref={phoneRef}
            icon="phone"
            label="Phone Number"
            value={customerPhone}
            onChange={setCustomerPhone}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
            returnKey="next"
            onSubmit={() => emailRef.current?.focus()}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InputRow
            ref={emailRef}
            icon="mail"
            label="Email Address"
            value={customerEmail}
            onChange={setCustomerEmail}
            placeholder="customer@email.com"
            keyboardType="email-address"
            returnKey="next"
            onSubmit={() => addressRef.current?.focus()}
            colors={colors}
          />
        </View>

        {/* Job */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          JOB DETAILS
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <InputRow
            ref={addressRef}
            icon="map-pin"
            label="Job Address"
            value={jobAddress}
            onChange={setJobAddress}
            placeholder="123 Main St, Anytown USA"
            returnKey="next"
            onSubmit={() => descRef.current?.focus()}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.descRow}>
            <View style={styles.descLabelRow}>
              <Feather name="briefcase" size={15} color={colors.mutedForeground} />
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                Job Description
              </Text>
            </View>
            <TextInput
              ref={descRef}
              style={[styles.descInput, { color: colors.foreground }]}
              value={jobDescription}
              onChangeText={setJobDescription}
              placeholder="Describe the work to be done (e.g. Install 800 sq ft of hardwood flooring in living room and hallway)"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              returnKeyType="default"
            />
          </View>
        </View>

        {settings.defaultMarkup > 0 && (
          <View
            style={[
              styles.markupHint,
              {
                backgroundColor: colors.primary + "12",
                borderColor: colors.primary + "30",
              },
            ]}
          >
            <Feather name="percent" size={14} color={colors.primary} />
            <Text style={[styles.markupHintText, { color: colors.primary }]}>
              {settings.defaultMarkup}% markup will be applied automatically
            </Text>
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Customer picker modal */}
      <CustomerPicker
        visible={pickerVisible}
        customers={customers}
        onSelect={handleSelectCustomer}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

const InputRow = forwardRef<
  TextInput,
  {
    icon: React.ComponentProps<typeof Feather>["name"];
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    keyboardType?: "default" | "phone-pad" | "email-address";
    returnKey?: "next" | "done";
    onSubmit?: () => void;
    colors: ReturnType<typeof useColors>;
  }
>(function InputRow(
  {
    icon,
    label,
    value,
    onChange,
    placeholder,
    keyboardType = "default",
    returnKey = "done",
    onSubmit,
    colors,
  },
  ref
) {
  return (
    <View style={styles.inputRow}>
      <Feather
        name={icon}
        size={15}
        color={colors.mutedForeground}
        style={styles.inputIcon}
      />
      <View style={styles.inputField}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
        <TextInput
          ref={ref}
          style={[styles.fieldInput, { color: colors.foreground }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground + "80"}
          keyboardType={keyboardType}
          returnKeyType={returnKey}
          onSubmitEditing={onSubmit}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          autoCorrect={false}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBack: { padding: 4 },
  navTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  createBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 16 },

  /* Repeat customer section */
  repeatSection: {
    marginBottom: 6,
  },
  repeatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  repeatTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  repeatTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  allCustomersBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  allCustomersBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  chipRow: {
    gap: 8,
    paddingBottom: 4,
  },
  customerChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    minWidth: 120,
    maxWidth: 160,
  },
  chipAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  chipAvatarText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  chipInfo: { flex: 1 },
  chipName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  chipCount: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  chipZap: { marginLeft: 2 },
  moreChip: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
    minWidth: 70,
  },
  moreChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  clearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  clearText: { fontSize: 12, fontFamily: "Inter_400Regular" },

  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 14,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 44,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  inputIcon: { width: 20, textAlign: "center" },
  inputField: { flex: 1, gap: 2 },
  label: { fontSize: 11, fontFamily: "Inter_500Medium" },
  fieldInput: { fontSize: 15, fontFamily: "Inter_400Regular" },
  descRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  descLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  descInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    lineHeight: 22,
    marginLeft: 25,
  },
  markupHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
  },
  markupHintText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
