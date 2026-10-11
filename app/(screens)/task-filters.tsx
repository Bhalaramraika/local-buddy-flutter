/**
 * Task Filters Screen — Soft Modern
 * Category chips, urgency pills, budget range presets, distance steps —
 * all wired to taskStore.setFilters. Apply pops back to the tasks list.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftButton, ScreenHeader } from '@/components/ui';
import { useTaskStore } from '@/store/taskStore';
import type { TaskCategory, TaskStatus, TaskUrgency } from '@/types';

const CATEGORY_OPTIONS: Array<{ value: TaskCategory; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: 'delivery', label: 'Delivery', icon: 'bicycle' },
  { value: 'pickup', label: 'Pickup', icon: 'cube' },
  { value: 'shopping', label: 'Shopping', icon: 'cart' },
  { value: 'errand', label: 'Errand', icon: 'walk' },
  { value: 'repair', label: 'Repair', icon: 'construct' },
  { value: 'cleaning', label: 'Cleaning', icon: 'sparkles' },
  { value: 'tutoring', label: 'Tutoring', icon: 'school' },
  { value: 'tech_help', label: 'Tech Help', icon: 'laptop' },
  { value: 'transport', label: 'Transport', icon: 'bus' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string; color: string }> = [
  { value: 'open', label: 'Open', color: Colors.semantic.info },
  { value: 'in_progress', label: 'In Progress', color: Colors.semantic.warning },
  { value: 'completed', label: 'Completed', color: Colors.semantic.success },
];

const URGENCY_OPTIONS: Array<{ value: TaskUrgency; label: string; color: string }> = [
  { value: 'low', label: 'Flexible', color: Colors.semantic.success },
  { value: 'normal', label: 'Normal', color: Colors.text.secondary },
  { value: 'high', label: 'High', color: Colors.semantic.warning },
  { value: 'urgent', label: 'Urgent', color: Colors.semantic.error },
];

const BUDGET_PRESETS: Array<{ label: string; min: number; max: number | undefined }> = [
  { label: 'Any', min: 0, max: undefined },
  { label: 'Under ₹200', min: 0, max: 200 },
  { label: '₹200 – ₹500', min: 200, max: 500 },
  { label: '₹500 – ₹1000', min: 500, max: 1000 },
  { label: '₹1000+', min: 1000, max: undefined },
];

const DISTANCE_STEPS = [1, 3, 5, 10, 25];

export default function TaskFiltersScreen() {
  const router = useRouter();
  const { filters, setFilters, resetFilters } = useTaskStore();

  const [cats, setCats] = useState<TaskCategory[]>(filters.category || []);
  const [statuses, setStatuses] = useState<TaskStatus[]>(filters.status || []);
  const [urgencies, setUrgencies] = useState<TaskUrgency[]>(filters.urgency || []);
  const [minBudget, setMinBudget] = useState<number | undefined>(filters.minBudget);
  const [maxBudget, setMaxBudget] = useState<number | undefined>(filters.maxBudget);
  const [distance, setDistance] = useState<number | undefined>(filters.distance);

  const toggleIn = <T,>(list: T[], value: T, set: (v: T[]) => void) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const activeCount =
    cats.length + statuses.length + urgencies.length +
    (minBudget !== undefined || maxBudget !== undefined ? 1 : 0) +
    (distance !== undefined ? 1 : 0);

  const applyFilters = () => {
    setFilters({
      category: cats.length ? cats : undefined,
      status: statuses.length ? statuses : undefined,
      urgency: urgencies.length ? urgencies : undefined,
      minBudget,
      maxBudget,
      distance,
    });
    router.back();
  };

  const handleReset = () => {
    setCats([]); setStatuses([]); setUrgencies([]);
    setMinBudget(undefined); setMaxBudget(undefined); setDistance(undefined);
    resetFilters();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Filters" subtitle="Refine what tasks you see" onBack={() => router.back()} />
        {/* Header note */}
        <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380 }} style={styles.introRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>Refine nearby tasks</Text>
            <Text style={styles.introSub}>{activeCount > 0 ? `${activeCount} filter${activeCount > 1 ? 's' : ''} active` : 'Pick any combination — results update instantly'}</Text>
          </View>
          {activeCount > 0 ? (
            <Pressable onPress={handleReset} style={styles.resetBtn} hitSlop={8}>
              <Ionicons name="refresh" size={13} color={Colors.semantic.error} />
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          ) : null}
        </MotiView>

        {/* Category */}
        <FilterSection index={0} title="Category" icon="grid">
          <View style={styles.chipsWrap}>
            {CATEGORY_OPTIONS.map((c) => {
              const active = cats.includes(c.value);
              return (
                <Pressable
                  key={c.value}
                  onPress={() => toggleIn(cats, c.value, setCats)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Ionicons name={c.icon} size={14} color={active ? '#FFFFFF' : Colors.brand.accent} />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </FilterSection>

        {/* Status */}
        <FilterSection index={1} title="Status" icon="pulse">
          <View style={styles.chipsWrap}>
            {STATUS_OPTIONS.map((s) => {
              const active = statuses.includes(s.value);
              return (
                <Pressable
                  key={s.value}
                  onPress={() => toggleIn(statuses, s.value, setStatuses)}
                  style={[styles.pill, active && { backgroundColor: s.color, borderColor: s.color, ...Shadows.cardPressed }]}
                >
                  <View style={[styles.pillDot, { backgroundColor: active ? '#FFFFFF' : s.color }]} />
                  <Text style={[styles.pillText, active && { color: '#FFFFFF' }]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </FilterSection>

        {/* Urgency */}
        <FilterSection index={2} title="Urgency" icon="flash">
          <View style={styles.chipsWrap}>
            {URGENCY_OPTIONS.map((u) => {
              const active = urgencies.includes(u.value);
              return (
                <Pressable
                  key={u.value}
                  onPress={() => toggleIn(urgencies, u.value, setUrgencies)}
                  style={[styles.pill, active && { backgroundColor: u.color, borderColor: u.color, ...Shadows.cardPressed }]}
                >
                  <View style={[styles.pillDot, { backgroundColor: active ? '#FFFFFF' : u.color }]} />
                  <Text style={[styles.pillText, active && { color: '#FFFFFF' }]}>{u.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </FilterSection>

        {/* Budget */}
        <FilterSection index={3} title="Budget range" icon="cash">
          <View style={styles.chipsWrap}>
            {BUDGET_PRESETS.map((b) => {
              const active = minBudget === b.min && maxBudget === b.max;
              return (
                <Pressable
                  key={b.label}
                  onPress={() => { setMinBudget(b.min || undefined); setMaxBudget(b.max); }}
                  style={[styles.budgetPill, active && styles.budgetPillActive]}
                >
                  <Text style={[styles.budgetPillText, active && styles.budgetPillTextActive]}>{b.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </FilterSection>

        {/* Distance */}
        <FilterSection index={4} title="Max distance" icon="navigate">
          <View style={styles.distanceRow}>
            <Pressable
              onPress={() => setDistance(undefined)}
              style={[styles.distanceStep, distance === undefined && styles.distanceStepActive]}
            >
              <Text style={[styles.distanceText, distance === undefined && styles.distanceTextActive]}>Any</Text>
            </Pressable>
            {DISTANCE_STEPS.map((d) => {
              const active = distance === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => setDistance(d)}
                  style={[styles.distanceStep, active && styles.distanceStepActive]}
                >
                  <Text style={[styles.distanceText, active && styles.distanceTextActive]}>{d} km</Text>
                </Pressable>
              );
            })}
          </View>
        </FilterSection>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        <SoftButton label="Clear all" variant="outline" onPress={handleReset} style={{ flex: 1, marginRight: Spacing[3] }} />
        <SoftButton label={`Show tasks${activeCount > 0 ? ` (${activeCount})` : ''}`} variant="accent" onPress={applyFilters} icon="checkmark" withGlow style={{ flex: 2 }} />
      </View>
    </View>
  );
}

function FilterSection({ index, title, icon, children }: { index: number; title: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: 100 + index * 70 }}
      style={styles.section}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={14} color={Colors.brand.accent} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { padding: Spacing[5] },

  introRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[5] },
  introTitle: { fontSize: 21, fontFamily: Typography.fontFamily.display, color: Colors.text.primary },
  introSub: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 3 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.semantic.errorSoft, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
  },
  resetText: { fontSize: 12, fontFamily: Typography.fontFamily.semiBold, color: Colors.semantic.error },

  section: {
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border.light,
    padding: Spacing[4], marginBottom: Spacing[4], ...Shadows.card,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[3] },
  sectionIconWrap: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] + 1,
    borderRadius: BorderRadius.pill, backgroundColor: Colors.surface.primary,
    borderWidth: 1.5, borderColor: Colors.border.light,
  },
  chipActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary, ...Shadows.button },
  chipText: { fontSize: 12.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  chipTextActive: { color: '#FFFFFF' },

  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] + 1,
    borderRadius: BorderRadius.pill, backgroundColor: Colors.surface.primary,
    borderWidth: 1.5, borderColor: Colors.border.light,
  },
  pillDot: { width: 8, height: 8, borderRadius: 4 },
  pillText: { fontSize: 12.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },

  budgetPill: {
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] + 4,
    borderRadius: BorderRadius.pill, backgroundColor: Colors.surface.primary,
    borderWidth: 1.5, borderColor: Colors.border.light,
  },
  budgetPillActive: { backgroundColor: Colors.brand.accent, borderColor: Colors.brand.accent, ...Shadows.buttonOrange },
  budgetPillText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  budgetPillTextActive: { color: '#FFFFFF' },

  distanceRow: { flexDirection: 'row', gap: Spacing[2], flexWrap: 'wrap' },
  distanceStep: {
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] + 4, borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface.primary, borderWidth: 1.5, borderColor: Colors.border.light,
    minWidth: 62, alignItems: 'center',
  },
  distanceStepActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary, ...Shadows.button },
  distanceText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  distanceTextActive: { color: '#FFFFFF' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: Spacing[5], paddingTop: Spacing[4],
    backgroundColor: Colors.surface.primary,
    borderTopWidth: 1, borderTopColor: Colors.border.light,
  },
});
