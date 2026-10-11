/**
 * Account Settings — Soft Modern
 * Rounded section cards, cream inputs, orange save pill,
 * soft-red danger zone. Logic (save phone, delete account) unchanged.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftButton } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/contexts/AuthContext';
import { apiDelete, getApiErrorMessage } from '@/services/api';
import { useUIStore } from '@/store/uiStore';
import { ScreenHeader } from '@/components/ui';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  // AuthContext.updateProfile writes through to the backend; the store-only
  // variant would silently lose changes on restart.
  const { updateProfile, logout } = useAuth();
  const { showToast } = useUIStore();

  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Backend supports phone; email is the login identity (not editable here)
      await updateProfile({ phone: phone.trim() || undefined });
      setLoading(false);
      showToast('Account settings saved', 'success');
    } catch (err: any) {
      setLoading(false);
      showToast(getApiErrorMessage(err, 'Could not save. Please try again.'), 'error');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Second confirmation — destructive action
            Alert.alert(
              'Are you absolutely sure?',
              'Your profile, tasks, wallet history and data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete permanently',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await apiDelete('/users/me/account');
                    } catch (err) {
                      showToast(getApiErrorMessage(err, 'Could not delete account.'), 'error');
                      return;
                    }
                    showToast('Your account has been deleted', 'info');
                    // Wipe local session and go back to welcome
                    try { await logout(); } catch { /* best-effort */ }
                    router.replace('/');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Account settings" subtitle="Identity, phone and privacy" onBack={() => router.back()} />
        {/* Profile Section */}
        <MotableSection index={0} title="Profile information" subtitle="Your login identity and contact">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.readonlyWrap}>
              <Ionicons name="mail" size={16} color={Colors.text.muted} />
              <TextInput
                style={styles.inputReadonly}
                value={email}
                editable={false}
                placeholder="Login email"
                placeholderTextColor={Colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.lockChip}>
                <Ionicons name="lock-closed" size={11} color={Colors.text.muted} />
              </View>
            </View>
            <Text style={styles.inputHint}>Login ID — cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone number</Text>
            <View style={styles.inputWrap}>
              <View style={styles.inputIconChip}>
                <Ionicons name="call" size={15} color={Colors.brand.accent} />
              </View>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor={Colors.text.muted}
                keyboardType="phone-pad"
              />
            </View>
            <Text style={styles.inputHint}>Used for SMS verification</Text>
          </View>

          <SoftButton
            label={loading ? 'Saving…' : 'Save changes'}
            onPress={handleSave}
            loading={loading}
            variant="accent"
            icon="checkmark-circle-outline"
            withGlow
            style={{ marginTop: Spacing[2] }}
          />
        </MotableSection>

        {/* Notification Preferences */}
        <MotableSection index={1} title="Notifications" subtitle="What buzzes your phone">
          <SettingItem
            title="Notification Settings"
            description="Choose which updates you receive"
            icon="notifications-outline"
            onPress={() => router.push('/(screens)/notification-settings')}
          />
        </MotableSection>

        {/* Privacy */}
        <MotableSection index={2} title="Privacy" subtitle="Who sees what">
          <SettingItem
            title="Profile Visibility"
            description="Control who can see your profile"
            icon="person-outline"
            onPress={() => router.push('/(screens)/privacy-settings')}
            trailing="Public"
          />
          <SettingItem
            title="Data & Privacy"
            description="Manage your data and privacy settings"
            icon="shield-checkmark-outline"
            onPress={() => router.push('/(screens)/privacy-settings')}
            last
          />
        </MotableSection>

        {/* Danger Zone */}
        <MotableSection index={3} title="Danger zone" subtitle="Irreversible actions" danger>
          <SettingItem
            title="Delete Account"
            description="Permanently delete your account and all data"
            icon="trash-outline"
            iconTone="error"
            onPress={handleDeleteAccount}
            destructive
            last
          />
        </MotableSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function MotableSection({ index, title, subtitle, danger, children }: { index: number; title: string; subtitle?: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 420, delay: index * 90 }}
      style={[styles.section, danger && styles.sectionDanger]}
    >
      <Text style={[styles.sectionTitle, danger && { color: Colors.semantic.error }]}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      {children}
    </MotiView>
  );
}

const SettingItem = ({ title, description, icon, iconTone, onPress, trailing, destructive, last }: any) => (
  <Pressable
    style={({ pressed }) => [
      styles.settingItem,
      last && { borderBottomWidth: 0 },
      pressed && { backgroundColor: Colors.surface.creamSoft },
    ]}
    onPress={onPress}
  >
    <View style={[styles.settingIcon, iconTone === 'error' ? styles.settingIconError : styles.settingIconAccent]}>
      <Ionicons name={icon} size={19} color={iconTone === 'error' ? Colors.semantic.error : Colors.brand.accent} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, destructive && { color: Colors.semantic.error }]}>{title}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <View style={styles.settingTrailing}>
      {trailing ? <Text style={styles.settingTrailingText}>{trailing}</Text> : null}
      <Ionicons name="chevron-forward" size={17} color={destructive ? Colors.semantic.error : Colors.text.muted} />
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { paddingHorizontal: Spacing[5], paddingTop: Spacing[5], paddingBottom: 40 },

  section: {
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border.light,
    padding: Spacing[5], marginBottom: Spacing[4], ...Shadows.card,
  },
  sectionDanger: { backgroundColor: Colors.semantic.errorSoft, borderColor: Colors.semantic.error + '2E' },
  sectionTitle: { fontSize: 18, fontFamily: Typography.fontFamily.display, color: Colors.text.primary },
  sectionSub: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 3, marginBottom: Spacing[4] },

  inputGroup: { marginBottom: Spacing[5] },
  inputLabel: { fontSize: 13, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary, marginBottom: Spacing[2], marginLeft: Spacing[1] },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    backgroundColor: Colors.surface.primary, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: Colors.border.light, paddingHorizontal: Spacing[3],
  },
  inputIconChip: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, fontSize: 15, fontFamily: Typography.fontFamily.body,
    color: Colors.text.primary, paddingVertical: Spacing[3] + 2,
  },
  readonlyWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    backgroundColor: Colors.surface.tertiary, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: Colors.border.light, paddingHorizontal: Spacing[3],
  },
  inputReadonly: {
    flex: 1, fontSize: 15, fontFamily: Typography.fontFamily.body,
    color: Colors.text.muted, paddingVertical: Spacing[3] + 2,
  },
  lockChip: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.surface.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  inputHint: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, marginTop: Spacing[1] + 2, marginLeft: Spacing[1] },

  settingItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingVertical: Spacing[3] + 2, borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  settingIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  settingIconAccent: { backgroundColor: Colors.brand.accentSoft },
  settingIconError: { backgroundColor: '#FFFFFF' },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  settingDescription: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },
  settingTrailing: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  settingTrailingText: { fontSize: 12.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.secondary },
});
