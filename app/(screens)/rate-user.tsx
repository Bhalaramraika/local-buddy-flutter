/**
 * Rate User Screen — Soft Modern
 * Shown after a task completes, from BOTH sides:
 *  - poster rates the buddy  (opened from task detail / my-tasks)
 *  - buddy rates the poster  (opened right after completion-OTP success)
 * Submits POST /api/v1/reviews { revieweeId, taskId, rating, comment }.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftButton, ScreenHeader, SoftAvatar } from '@/components/ui';
import { apiPost, getApiErrorMessage } from '@/services/api';
import { useUIStore } from '@/store/uiStore';

const RATING_LABELS = ['', 'Poor', 'Okay', 'Good', 'Great', 'Excellent'];

export default function RateUserScreen() {
  const router = useRouter();
  const { taskId, revieweeId, revieweeName, taskTitle } = useLocalSearchParams<{
    taskId: string;
    revieweeId: string;
    revieweeName?: string;
    taskTitle?: string;
  }>();
  const { showToast } = useUIStore();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = rating >= 1 && !!taskId && !!revieweeId && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiPost('/reviews', {
        revieweeId: String(revieweeId),
        taskId: String(taskId),
        rating,
        comment: comment.trim() || undefined,
      });
      showToast('Thanks for your feedback!', 'success');
      router.back();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Could not submit your rating. Please try again.');
      // Already reviewed → treat as done and leave quietly.
      if (String(msg).toLowerCase().includes('already')) {
        showToast('You already rated this task', 'info');
        router.back();
        return;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Rate your experience" subtitle={taskTitle ? String(taskTitle) : undefined} onBack={() => router.back()} />

        <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 420 }}>
          <View style={styles.card}>
            <View style={styles.avatarWrap}>
              <SoftAvatar name={String(revieweeName || 'User')} size={72} />
            </View>
            <Text style={styles.name}>{String(revieweeName || 'User')}</Text>
            <Text style={styles.sub}>How was your experience working together?</Text>

            {/* Stars */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)} hitSlop={8} accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}>
                  <Ionicons
                    name={rating >= n ? 'star' : 'star-outline'}
                    size={40}
                    color={rating >= n ? '#F5A623' : Colors.border.medium}
                  />
                </Pressable>
              ))}
            </View>
            {rating > 0 ? <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text> : null}

            {/* Comment */}
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Add a few words (optional)"
              placeholderTextColor={Colors.text.muted}
              multiline
              maxLength={500}
            />

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={Colors.semantic.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <SoftButton
              label="Submit rating"
              onPress={submit}
              loading={submitting}
              disabled={!canSubmit}
              variant="accent"
              size="lg"
              icon="star"
              withGlow
              style={{ marginTop: Spacing[2] }}
            />
          </View>
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scroll: { paddingBottom: Spacing[10] },

  card: {
    marginHorizontal: Spacing[5], marginTop: Spacing[5],
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius['2xl'],
    borderWidth: 1, borderColor: Colors.border.light,
    padding: Spacing[6], alignItems: 'center', ...Shadows.card,
  },
  avatarWrap: { marginBottom: Spacing[3] },
  name: { fontFamily: Typography.fontFamily.display, fontSize: 22, color: Colors.text.primary },
  sub: {
    fontFamily: Typography.fontFamily.body, fontSize: 13.5, color: Colors.text.secondary,
    textAlign: 'center', marginTop: Spacing[1], marginBottom: Spacing[5], lineHeight: 20,
  },

  starsRow: { flexDirection: 'row', gap: Spacing[2] },
  ratingLabel: {
    marginTop: Spacing[2], fontFamily: Typography.fontFamily.semiBold,
    fontSize: 14, color: Colors.brand.accentPressed,
  },

  commentInput: {
    alignSelf: 'stretch', minHeight: 92, marginTop: Spacing[5], marginBottom: Spacing[4],
    backgroundColor: Colors.surface.tertiary, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border.light,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    fontFamily: Typography.fontFamily.body, fontSize: 14, color: Colors.text.primary,
    textAlignVertical: 'top',
  },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing[3] },
  errorText: { color: Colors.semantic.error, fontSize: 13, fontFamily: Typography.fontFamily.medium, flex: 1 },
});
