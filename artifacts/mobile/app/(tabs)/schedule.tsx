import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScheduleCalendar } from "@/components/ScheduleCalendar";
import { ScheduleManager } from "@/components/ScheduleManager";
import {
  DAY_LABELS,
  DAYS_ORDER,
  DEFAULT_WEEKLY_SCHEDULE,
  useQuotes,
} from "@/context/QuoteContext";
import { useColors } from "@/hooks/useColors";

export default function ScheduleTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { quotes, settings } = useQuotes();

  const [showCalendar, setShowCalendar] = useState(false);
  const [showManager, setShowManager] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 24) : insets.top;

  const scheduledJobs = useMemo(
    () =>
      quotes
        .filter((q) => q.scheduledDate)
        .sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? ""))
        .slice(0, 5),
    [quotes],
  );

  const totalScheduled = quotes.filter((q) => q.scheduledDate).length;
  const schedule = settings.weeklySchedule ?? DEFAULT_WEEKLY_SCHEDULE;
  const activeDays = DAYS_ORDER.filter((d) => schedule[d].enabled);
  const blocked = settings.blockedDates?.length ?? 0;

  function formatJobDate(iso: string): string {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: topPad + 16,
            paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 100,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Schedule</Text>
        </View>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          Plan your jobs and set your working hours.
        </Text>

        <TouchableOpacity
          style={[styles.bigCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowCalendar(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.bigIcon, { backgroundColor: colors.accent + "18" }]}>
            <Feather name="grid" size={28} color={colors.accent} />
          </View>
          <View style={styles.bigContent}>
            <Text style={[styles.bigTitle, { color: colors.foreground }]}>Month Calendar</Text>
            <Text style={[styles.bigSub, { color: colors.mutedForeground }]}>
              {totalScheduled === 0
                ? "No jobs scheduled yet"
                : `${totalScheduled} scheduled job${totalScheduled === 1 ? "" : "s"}`}
            </Text>
          </View>
          <Feather name="chevron-right" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bigCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowManager(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.bigIcon, { backgroundColor: colors.primary + "18" }]}>
            <Feather name="clock" size={28} color={colors.primary} />
          </View>
          <View style={styles.bigContent}>
            <Text style={[styles.bigTitle, { color: colors.foreground }]}>Working Hours &amp; Days Off</Text>
            <Text style={[styles.bigSub, { color: colors.mutedForeground }]}>
              {activeDays.length === 0
                ? "No working days set"
                : `${activeDays.map((d) => DAY_LABELS[d].slice(0, 3)).join(", ")}${
                    blocked > 0 ? ` · ${blocked} blocked` : ""
                  }`}
            </Text>
          </View>
          <Feather name="chevron-right" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          UPCOMING JOBS
        </Text>
        {scheduledJobs.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="calendar" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No jobs scheduled
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              When a customer accepts a quote, you can schedule it from the quote detail page.
            </Text>
          </View>
        ) : (
          scheduledJobs.map((q) => (
            <View
              key={q.id}
              style={[styles.jobCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.jobDateChip, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[styles.jobDateText, { color: colors.primary }]}>
                  {q.scheduledDate ? formatJobDate(q.scheduledDate) : ""}
                </Text>
                {q.scheduledTimeSlot ? (
                  <Text style={[styles.jobTimeText, { color: colors.primary }]}>
                    {q.scheduledTimeSlot}
                  </Text>
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.jobCustomer, { color: colors.foreground }]} numberOfLines={1}>
                  {q.customerName || "Unnamed customer"}
                </Text>
                {q.jobAddress ? (
                  <Text style={[styles.jobAddress, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {q.jobAddress}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ScheduleCalendar visible={showCalendar} onClose={() => setShowCalendar(false)} />
      <ScheduleManager visible={showManager} onClose={() => setShowManager(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 32, fontFamily: "Inter_700Bold" },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    marginBottom: 18,
  },
  bigCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  bigIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  bigContent: { flex: 1 },
  bigTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  bigSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptySub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  jobDateChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  jobDateText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  jobTimeText: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 1 },
  jobCustomer: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  jobAddress: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
