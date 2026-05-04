import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  type BlockedDate,
  type DayOfWeek,
  type DaySchedule,
  type WeeklySchedule,
  DAY_LABELS,
  DAYS_ORDER,
  DEFAULT_WEEKLY_SCHEDULE,
} from "@/context/QuoteContext";
import { useQuotes } from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";

const HOUR_OPTIONS: string[] = [];
for (let h = 5; h <= 21; h++) {
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? "AM" : "PM";
  HOUR_OPTIONS.push(`${h.toString().padStart(2, "0")}:00`);
}

function formatTime(time24: string): string {
  const h = parseInt(time24.split(":")[0], 10);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? "AM" : "PM";
  return `${h12}:00 ${ampm}`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ScheduleManager({ visible, onClose }: Props) {
  const colors = useColors();
  const { settings, updateSettings, addBlockedDate, removeBlockedDate } = useQuotes();

  const schedule = settings.weeklySchedule ?? DEFAULT_WEEKLY_SCHEDULE;
  const blockedDates = settings.blockedDates ?? [];

  const [showTimePicker, setShowTimePicker] = useState<{
    day: DayOfWeek;
    field: "startTime" | "endTime";
  } | null>(null);

  const [blockDateInput, setBlockDateInput] = useState("");
  const [blockReasonInput, setBlockReasonInput] = useState("");

  function updateDay(day: DayOfWeek, updates: Partial<DaySchedule>) {
    const updated: WeeklySchedule = {
      ...schedule,
      [day]: { ...schedule[day], ...updates },
    };
    updateSettings({ weeklySchedule: updated });
  }

  function handleAddBlockedDate() {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(blockDateInput)) {
      Alert.alert("Invalid Date", "Please enter a date in YYYY-MM-DD format (e.g., 2026-06-15).");
      return;
    }
    const d = new Date(blockDateInput + "T12:00:00");
    if (isNaN(d.getTime())) {
      Alert.alert("Invalid Date", "Please enter a valid date.");
      return;
    }
    addBlockedDate(blockDateInput, blockReasonInput.trim() || undefined);
    setBlockDateInput("");
    setBlockReasonInput("");
  }

  function formatBlockedDate(dateStr: string): string {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const sortedBlocked = [...blockedDates].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Availability Schedule
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              Set your working hours and days off
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            WEEKLY HOURS
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {DAYS_ORDER.map((day, idx) => {
              const dayData = schedule[day];
              return (
                <View key={day}>
                  {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <View style={styles.dayRow}>
                    <View style={styles.dayLeft}>
                      <Switch
                        value={dayData.enabled}
                        onValueChange={(v) => updateDay(day, { enabled: v })}
                        trackColor={{ false: colors.muted, true: colors.primary + "60" }}
                        thumbColor={dayData.enabled ? colors.primary : colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.dayLabel,
                          { color: dayData.enabled ? colors.foreground : colors.mutedForeground },
                        ]}
                      >
                        {DAY_LABELS[day]}
                      </Text>
                    </View>
                    {dayData.enabled ? (
                      <View style={styles.timeRow}>
                        <TouchableOpacity
                          style={[styles.timeBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                          onPress={() => setShowTimePicker({ day, field: "startTime" })}
                        >
                          <Text style={[styles.timeText, { color: colors.foreground }]}>
                            {formatTime(dayData.startTime)}
                          </Text>
                        </TouchableOpacity>
                        <Text style={[styles.timeDash, { color: colors.mutedForeground }]}>–</Text>
                        <TouchableOpacity
                          style={[styles.timeBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                          onPress={() => setShowTimePicker({ day, field: "endTime" })}
                        >
                          <Text style={[styles.timeText, { color: colors.foreground }]}>
                            {formatTime(dayData.endTime)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={[styles.offLabel, { color: colors.mutedForeground }]}>Off</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 28 }]}>
            BLOCKED DATES
          </Text>
          <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
            Block off specific days you won't be available (holidays, vacations, etc.)
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.addBlockRow}>
              <View style={styles.addBlockInputs}>
                <TextInput
                  style={[styles.blockDateInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.mutedForeground}
                  value={blockDateInput}
                  onChangeText={setBlockDateInput}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
                <TextInput
                  style={[styles.blockReasonInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
                  placeholder="Reason (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={blockReasonInput}
                  onChangeText={setBlockReasonInput}
                />
              </View>
              <TouchableOpacity
                style={[styles.addBlockBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddBlockedDate}
              >
                <Feather name="plus" size={18} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>

            {sortedBlocked.length > 0 && (
              <View style={[styles.divider, { backgroundColor: colors.border, marginTop: 12 }]} />
            )}

            {sortedBlocked.map((blocked) => (
              <View key={blocked.id} style={styles.blockedRow}>
                <View style={styles.blockedInfo}>
                  <Feather name="x-circle" size={14} color={colors.destructive} />
                  <Text style={[styles.blockedDate, { color: colors.foreground }]}>
                    {formatBlockedDate(blocked.date)}
                  </Text>
                  {blocked.reason && (
                    <Text style={[styles.blockedReason, { color: colors.mutedForeground }]}>
                      — {blocked.reason}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => removeBlockedDate(blocked.id)}>
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))}

            {sortedBlocked.length === 0 && (
              <Text style={[styles.emptyBlocked, { color: colors.mutedForeground }]}>
                No blocked dates. Add dates above to mark days off.
              </Text>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {showTimePicker && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setShowTimePicker(null)}>
            <TouchableOpacity
              style={styles.pickerOverlay}
              activeOpacity={1}
              onPress={() => setShowTimePicker(null)}
            >
              <View style={[styles.pickerSheet, { backgroundColor: colors.card }]}>
                <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
                  {showTimePicker.field === "startTime" ? "Start Time" : "End Time"} — {DAY_LABELS[showTimePicker.day]}
                </Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {HOUR_OPTIONS.map((time) => {
                    const isSelected = schedule[showTimePicker.day][showTimePicker.field] === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.pickerOption,
                          isSelected && { backgroundColor: colors.primary + "18" },
                        ]}
                        onPress={() => {
                          updateDay(showTimePicker.day, { [showTimePicker.field]: time });
                          setShowTimePicker(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            { color: isSelected ? colors.primary : colors.foreground },
                            isSelected && { fontFamily: "Inter_600SemiBold" },
                          ]}
                        >
                          {formatTime(time)}
                        </Text>
                        {isSelected && <Feather name="check" size={18} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "web" ? 20 : 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  scroll: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
    marginTop: -4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  dayLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dayLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  timeDash: {
    fontSize: 14,
  },
  offLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  divider: {
    height: 1,
  },
  addBlockRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  addBlockInputs: {
    flex: 1,
    gap: 8,
  },
  blockDateInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  blockReasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  addBlockBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
  },
  blockedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  blockedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  blockedDate: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  blockedReason: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flexShrink: 1,
  },
  emptyBlocked: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 12,
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  pickerSheet: {
    width: 280,
    maxHeight: 400,
    borderRadius: 16,
    padding: 16,
  },
  pickerTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
    textAlign: "center",
  },
  pickerScroll: {
    maxHeight: 320,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pickerOptionText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
