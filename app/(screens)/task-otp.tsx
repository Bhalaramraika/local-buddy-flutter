/**
 * Task OTP Screen — Soft Modern
 * Buddy enters the 4-digit code shown on the POSTER's app to start or to
 * complete a task. Verification is server-side (POST /tasks/:id/start |
 * /tasks/:id/complete, code lives in poster-only Firestore secrets).
 * On completion success the app routes straight to the rate-the-poster
 * screen using the reviewContext returned by the API.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftButton, ScreenHeader } from '@/components/ui';
import { apiPost, ENDPOINTS, getApiErrorMessage } from '@/services/api';
import { useTaskStore } from '@/store/taskStore';

const OTP_LEN = 4;

export default function TaskOtpScreen() {
  const router = useRouter();
  const { taskId, type, taskTitle } = useLocalSearchParams<{
    taskId: string;
    type?: string;
    taskTitle?: string;
  }>();
  const isStart = type !== 'complete';

  const { fetchTaskById } = useTaskStore();
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const submit = async () => {
    if (!taskId) return;
    if (otp.length !== OTP_LEN) {
      setError(`Enter the ${OTP_LEN}-digit code shown on the poster's app`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiPost<any>(
        isStart ? ENDPOINTS.tasks.startWithOtp(taskId) : ENDPOINTS.tasks.completeWithOtp(taskId),
        { otp }
      );
      // Re-sync the task locally (realtime listeners also cover this).
      fetchTaskById(taskId).catch(() => {});

      if (isStart) {
        router.back();
        return;
      }
      // Completed → take the buddy to rate the poster.
      const rc = res?.reviewContext;
      router.replace({
        pathname: '/(screens)/rate-user',
        params: {
          taskId,
          revieweeId: rc?.revieweeId || '',
          revieweeName: rc?.revieweeName || 'Poster',
          taskTitle: rc?.taskTitle || taskTitle || '',
        },
      });
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Verification failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.inner}>
        <ScreenHeader
          title={isStart ? 'Start task' : 'Complete task'}
          subtitle={taskTitle ? String(taskTitle) : undefined}
          onBack={() => router.back()}
        />

        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420 }}
          style={styles.hero}
        >
          <View style={styles.heroBadge}>
            <Ionicons name={isStart ? 'play-circle' : 'checkmark-done-circle'} size={34} color={Colors.brand.accent} />
          </View>
          <Text style={styles.heroTitle}>
            {isStart ? 'Ask the poster for the start code' : 'Ask the poster for the completion code'}
          </Text>
          <Text style={styles.heroSub}>
            {isStart
              ? 'The poster’s app shows a 4-digit START code for this task. Enter it to begin the work.'
              : 'The poster’s app shows a 4-digit COMPLETION code for this task. Enter it only after the work is done.'}
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420, delay: 120 }}
        >
          <Pressable style={styles.otpCard} onPress={() => { inputRef.current?.focus(); Keyboard.isVisible(); }}>
            <View style={styles.otpField}>
              <View style={styles.boxes} pointerEvents="none">
                {Array.from({ length: OTP_LEN }, (_, i) => {
                  const filled = otp.length > i;
                  const active = otp.length === i;
                  return (
                    <View key={i} style={[styles.box, filled && styles.boxFilled, active && styles.boxActive]}>
                      <Text style={[styles.digit, filled && styles.digitFilled]}>{otp[i] || ''}</Text>
                    </View>
                  );
                })}
              </View>
              <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, OTP_LEN))}
                keyboardType="number-pad"
                maxLength={OTP_LEN}
                autoFocus
                caretHidden
                selectionColor="transparent"
                style={styles.overlayInput}
                accessibilityLabel={isStart ? 'Task start code' : 'Task completion code'}
              />
            </View>
          </Pressable>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color={Colors.semantic.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <SoftButton
            label={isStart ? 'Verify & start task' : 'Verify & complete task'}
            onPress={submit}
            loading={submitting}
            disabled={otp.length !== OTP_LEN}
            variant={isStart ? 'accent' : 'success'}
            size="lg"
            icon={isStart ? 'play' : 'checkmark'}
            withGlow
          />

          {!isStart ? (
            <Pressable
              style={styles.paymentHint}
              onPress={() =>
                Alert.alert(
                  'Payment first',
                  'For online tasks the poster must release the payment before you can complete the task. Use “Ask for payment” on the task screen.'
                )
              }
            >
              <Ionicons name="information-circle-outline" size={15} color={Colors.text.muted} />
              <Text style={styles.paymentHintText}>Online task? Payment is released before completion.</Text>
            </Pressable>
          ) : null}
        </MotiView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  inner: { flex: 1 },

  hero: { alignItems: 'center', paddingHorizontal: Spacing[6], marginTop: Spacing[5], marginBottom: Spacing[6] },
  heroBadge: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4], ...Shadows.card,
  },
  heroTitle: {
    fontFamily: Typography.fontFamily.display, fontSize: 22, color: Colors.text.primary,
    textAlign: 'center', lineHeight: 29,
  },
  heroSub: {
    fontFamily: Typography.fontFamily.body, fontSize: 13.5, color: Colors.text.secondary,
    textAlign: 'center', marginTop: Spacing[2], lineHeight: 20,
  },

  otpCard: {
    marginHorizontal: Spacing[5], backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border.light,
    padding: Spacing[5], ...Shadows.card,
  },
  otpField: { alignItems: 'center', justifyContent: 'center' },
  boxes: { flexDirection: 'row', gap: Spacing[3] },
  box: {
    width: 58, height: 64, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface.tertiary, borderWidth: 1.5, borderColor: Colors.border.light,
    alignItems: 'center', justifyContent: 'center',
  },
  boxFilled: { backgroundColor: Colors.brand.accentSoft, borderColor: Colors.brand.accent },
  boxActive: { borderColor: Colors.brand.accent, borderWidth: 2 },
  digit: { fontSize: 26, fontFamily: Typography.fontFamily.bold, color: Colors.text.muted },
  digitFilled: { color: Colors.brand.accentPressed },
  overlayInput: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.02, color: 'transparent',
  },

  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: Spacing[6], marginTop: Spacing[4],
  },
  errorText: { color: Colors.semantic.error, fontSize: 13, fontFamily: Typography.fontFamily.medium, flex: 1 },

  paymentHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, marginTop: Spacing[5], paddingHorizontal: Spacing[6],
  },
  paymentHintText: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
});
