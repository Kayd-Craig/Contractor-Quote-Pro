import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  type DayOfWeek,
  DAYS_ORDER,
  DEFAULT_WEEKLY_SCHEDULE,
  useQuotes,
} from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const WEEKDAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_OF_WEEK_MAP: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function getMonthName(monthIdx: number): string {
  return [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][monthIdx];
}

function isSameDate(d1: Date, year: number, month: number, day: number): boolean {
  return d1.getFullYear() === year && d1.getMonth() === month && d1.getDate() === day;
}

export function ScheduleCalendar({ visible, onClose }: Props) {
  const colors = useColors();
  const { quotes, settings, removeBlockedDate, addBlockedDate } = useQuotes();

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const schedule = settings.weeklySchedule ?? DEFAULT_WEEKLY_SCHEDULE;
  const blockedDates = settings.blockedDates ?? [];

  // Map of date string -> array of scheduled quotes
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, typeof quotes>();
    quotes.forEach((q) => {
      if (q.scheduledDate) {
        const list = map.get(q.scheduledDate) ?? [];
        list.push(q);
        map.set(q.scheduledDate, list);
      }
    });
    return map;
  }, [quotes]);

  const blockedSet = useMemo(() => {
    return new Set(blockedDates.map((b) => b.date));
  }, [blockedDates]);

  // Build the calendar grid
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const cells: ({ day: number; dateStr: string } | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, dateStr: toDateStr(viewYear, viewMonth, d) });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const monthBookingCount = useMemo(() => {
    let count = 0;
    bookingsByDate.forEach((list, dateStr) => {
      const [y, m] = dateStr.split("-").map(Number);
      if (y === viewYear && m === viewMonth + 1) count += list.length;
    });
    return count;
  }, [bookingsByDate, viewYear, viewMonth]);

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDate(null);
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDate(null);
  }

  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(null);
  }

  const selectedBookings = selectedDate ? bookingsByDate.get(selectedDate) ?? [] : [];
  const selectedIsBlocked = selectedDate ? blockedSet.has(selectedDate) : false;
  const selectedBlockedItem = selectedDate ? blockedDates.find((b) => b.date === selectedDate) : undefined;

  function handleToggleBlock() {
    if (!selectedDate) return;
    if (selectedIsBlocked && selectedBlockedItem) {
      removeBlockedDate(selectedBlockedItem.id);
    } else {
      addBlockedDate(selectedDate);
    }
  }

  function handleQuotePress(quoteId: string) {
    onClose();
    router.push(`/quote/${quoteId}`);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Job Calendar</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {monthBookingCount === 0
                ? "No jobs scheduled this month"
                : `${monthBookingCount} job${monthBookingCount === 1 ? "" : "s"} scheduled this month`}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Month navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              onPress={goToPrevMonth}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={20} color={colors.foreground} />
            </TouchableOpacity>

            <TouchableOpacity onPress={goToToday} activeOpacity={0.7} style={styles.monthLabelWrap}>
              <Text style={[styles.monthLabel, { color: colors.foreground }]}>
                {getMonthName(viewMonth)} {viewYear}
              </Text>
              <Text style={[styles.todayHint, { color: colors.primary }]}>Tap for today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              onPress={goToNextMonth}
              activeOpacity={0.7}
            >
              <Feather name="chevron-right" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Calendar grid */}
          <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.weekdayRow}>
              {WEEKDAY_HEADERS.map((d, i) => (
                <Text key={i} style={[styles.weekdayLabel, { color: colors.mutedForeground }]}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarCells.map((cell, idx) => {
                if (!cell) {
                  return <View key={`empty-${idx}`} style={styles.dayCell} />;
                }
                const dayOfWeek = DAY_OF_WEEK_MAP[idx % 7];
                const isWorkingDay = schedule[dayOfWeek].enabled;
                const isBlocked = blockedSet.has(cell.dateStr);
                const bookings = bookingsByDate.get(cell.dateStr) ?? [];
                const hasBookings = bookings.length > 0;
                const isToday = isSameDate(today, viewYear, viewMonth, cell.day);
                const isSelected = selectedDate === cell.dateStr;

                let cellBg = "transparent";
                let textColor = colors.foreground;
                if (isBlocked) {
                  cellBg = colors.destructive + "15";
                  textColor = colors.destructive;
                } else if (!isWorkingDay) {
                  textColor = colors.mutedForeground;
                }
                if (isSelected) {
                  cellBg = colors.primary + "20";
                }

                return (
                  <TouchableOpacity
                    key={cell.dateStr}
                    style={[
                      styles.dayCell,
                      { backgroundColor: cellBg },
                      isToday && { borderWidth: 2, borderColor: colors.primary, borderRadius: 8 },
                      isSelected && !isToday && { borderRadius: 8 },
                    ]}
                    onPress={() => setSelectedDate(cell.dateStr)}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: textColor },
                        isToday && { fontFamily: "Inter_700Bold", color: colors.primary },
                      ]}
                    >
                      {cell.day}
                    </Text>
                    {hasBookings && (
                      <View style={[styles.bookingDot, { backgroundColor: colors.primary }]}>
                        {bookings.length > 1 && (
                          <Text style={styles.bookingDotText}>{bookings.length}</Text>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Booked</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { borderColor: colors.primary, backgroundColor: "transparent" }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Today</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: colors.destructive + "30", borderColor: "transparent" }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Blocked</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={[styles.legendDimmed, { color: colors.mutedForeground }]}>15</Text>
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Day off</Text>
            </View>
          </View>

          {/* Selected day details */}
          {selectedDate && (
            <View style={styles.selectedSection}>
              <View style={styles.selectedHeader}>
                <Text style={[styles.selectedTitle, { color: colors.foreground }]}>
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.blockBtn,
                    {
                      backgroundColor: selectedIsBlocked ? colors.destructive + "18" : colors.secondary,
                      borderColor: selectedIsBlocked ? colors.destructive + "40" : colors.border,
                    },
                  ]}
                  onPress={handleToggleBlock}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={selectedIsBlocked ? "rotate-ccw" : "x-octagon"}
                    size={14}
                    color={selectedIsBlocked ? colors.destructive : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.blockBtnText,
                      { color: selectedIsBlocked ? colors.destructive : colors.foreground },
                    ]}
                  >
                    {selectedIsBlocked ? "Unblock" : "Block this day"}
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedBookings.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="calendar" size={28} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    {selectedIsBlocked ? "This day is blocked off" : "No jobs scheduled"}
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {selectedBookings.map((q) => (
                    <TouchableOpacity
                      key={q.id}
                      style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => handleQuotePress(q.id)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.bookingTimeChip, { backgroundColor: colors.primary + "18" }]}>
                        <Feather name="clock" size={12} color={colors.primary} />
                        <Text style={[styles.bookingTime, { color: colors.primary }]}>
                          {q.scheduledTimeSlot ?? "—"}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.bookingCustomer, { color: colors.foreground }]} numberOfLines={1}>
                          {q.customerName || "Unnamed customer"}
                        </Text>
                        {q.jobAddress ? (
                          <Text style={[styles.bookingAddr, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {q.jobAddress}
                          </Text>
                        ) : null}
                        {q.jobDescription ? (
                          <Text style={[styles.bookingDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {q.jobDescription}
                          </Text>
                        ) : null}
                      </View>
                      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {!selectedDate && (
            <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>
              Tap any day to see scheduled jobs or block it off.
            </Text>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: 16 },

  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabelWrap: {
    flex: 1,
    alignItems: "center",
  },
  monthLabel: { fontSize: 18, fontFamily: "Inter_700Bold" },
  todayHint: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 1 },

  calendarCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  weekdayRow: {
    flexDirection: "row",
    paddingBottom: 8,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  dayNumber: { fontSize: 14, fontFamily: "Inter_500Medium" },
  bookingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },
  bookingDotText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingHorizontal: 4,
    marginBottom: 18,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 2,
  },
  legendDimmed: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    width: 14,
    textAlign: "center",
  },
  legendText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  selectedSection: { gap: 12 },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  selectedTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  blockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  blockBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  bookingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  bookingTimeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bookingTime: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  bookingCustomer: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  bookingAddr: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  bookingDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },

  tapHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    fontStyle: "italic",
  },
});
