import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useQuotes } from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSchedule: (date: string, timeSlot: string) => void;
  currentDate?: string;
  currentSlot?: string;
}

function getNextNDays(n: number): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 1; i <= n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    days.push(`${yyyy}-${mm}-${dd}`);
  }
  return days;
}

function formatDateDisplay(dateStr: string): { dayName: string; monthDay: string; full: string } {
  const d = new Date(dateStr + "T12:00:00");
  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
  const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const full = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  return { dayName, monthDay, full };
}

export function SchedulePicker({ visible, onClose, onSchedule, currentDate, currentSlot }: Props) {
  const colors = useColors();
  const { isDateAvailable, getAvailableSlots } = useQuotes();

  const [selectedDate, setSelectedDate] = useState<string | null>(currentDate ?? null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(currentSlot ?? null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (visible) {
      setSelectedDate(currentDate ?? null);
      setSelectedSlot(currentSlot ?? null);
      setWeekOffset(0);
    }
  }, [visible, currentDate, currentSlot]);

  const allDays = useMemo(() => getNextNDays(90), []);

  const visibleDays = useMemo(() => {
    const start = weekOffset * 7;
    return allDays.slice(start, start + 7);
  }, [allDays, weekOffset]);

  const maxWeeks = Math.ceil(allDays.length / 7);

  const slots = useMemo(() => {
    if (!selectedDate) return [];
    return getAvailableSlots(selectedDate);
  }, [selectedDate, getAvailableSlots]);

  function handleConfirm() {
    if (selectedDate && selectedSlot) {
      onSchedule(selectedDate, selectedSlot);
    }
  }

  const weekLabel = useMemo(() => {
    if (visibleDays.length === 0) return "";
    const first = formatDateDisplay(visibleDays[0]);
    const last = formatDateDisplay(visibleDays[visibleDays.length - 1]);
    return `${first.monthDay} – ${last.monthDay}`;
  }, [visibleDays]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>Schedule Job</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekNav}>
            <TouchableOpacity
              onPress={() => setWeekOffset(Math.max(0, weekOffset - 1))}
              disabled={weekOffset === 0}
              style={[styles.navBtn, { opacity: weekOffset === 0 ? 0.3 : 1 }]}
            >
              <Feather name="chevron-left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.weekLabel, { color: colors.foreground }]}>{weekLabel}</Text>
            <TouchableOpacity
              onPress={() => setWeekOffset(Math.min(maxWeeks - 1, weekOffset + 1))}
              disabled={weekOffset >= maxWeeks - 1}
              style={[styles.navBtn, { opacity: weekOffset >= maxWeeks - 1 ? 0.3 : 1 }]}
            >
              <Feather name="chevron-right" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.daysRow}>
            {visibleDays.map((day) => {
              const available = isDateAvailable(day);
              const isSelected = selectedDate === day;
              const { dayName, monthDay } = formatDateDisplay(day);

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : available
                        ? colors.secondary
                        : colors.muted,
                      borderColor: isSelected ? colors.primary : "transparent",
                      opacity: available ? 1 : 0.4,
                    },
                  ]}
                  onPress={() => {
                    if (available) {
                      setSelectedDate(day);
                      setSelectedSlot(null);
                    }
                  }}
                  disabled={!available}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayCellDay,
                      { color: isSelected ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {dayName}
                  </Text>
                  <Text
                    style={[
                      styles.dayCellDate,
                      {
                        color: isSelected
                          ? colors.primaryForeground
                          : available
                          ? colors.foreground
                          : colors.mutedForeground,
                      },
                    ]}
                  >
                    {monthDay.split(" ")[1]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedDate && (
            <>
              <Text style={[styles.slotsLabel, { color: colors.mutedForeground }]}>
                AVAILABLE TIMES — {formatDateDisplay(selectedDate).full}
              </Text>

              {slots.length > 0 ? (
                <ScrollView
                  style={styles.slotsScroll}
                  contentContainerStyle={styles.slotsGrid}
                  showsVerticalScrollIndicator={false}
                >
                  {slots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[
                          styles.slotChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.secondary,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setSelectedSlot(slot)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.slotText,
                            { color: isSelected ? colors.primaryForeground : colors.foreground },
                          ]}
                        >
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <Text style={[styles.noSlots, { color: colors.mutedForeground }]}>
                  No available times for this date.
                </Text>
              )}
            </>
          )}

          {!selectedDate && (
            <Text style={[styles.pickPrompt, { color: colors.mutedForeground }]}>
              Select a date above to see available time slots.
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              {
                backgroundColor:
                  selectedDate && selectedSlot ? colors.primary : colors.muted,
              },
            ]}
            onPress={handleConfirm}
            disabled={!selectedDate || !selectedSlot}
            activeOpacity={0.85}
          >
            <Feather
              name="calendar"
              size={18}
              color={selectedDate && selectedSlot ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text
              style={[
                styles.confirmText,
                {
                  color:
                    selectedDate && selectedSlot
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                },
              ]}
            >
              {currentDate ? "Update Schedule" : "Confirm Schedule"}
            </Text>
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
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navBtn: {
    padding: 6,
  },
  weekLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  daysRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
  },
  dayCellDay: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  dayCellDate: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  slotsLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  slotsScroll: {
    maxHeight: 160,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 8,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  slotText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  noSlots: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 20,
  },
  pickPrompt: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 24,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 13,
    marginTop: 12,
  },
  confirmText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
