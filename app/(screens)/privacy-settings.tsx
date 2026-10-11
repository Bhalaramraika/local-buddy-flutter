/**
 * Privacy Settings — Soft Modern
 * Segmented privacy choices as rounded option cards, pill switch rows,
 * data actions with soft-red destructive styling.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ui';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const [profileVisibility, setProfileVisibility] = React.useState<'public' | 'friends' | 'private'>('public');
  const [showOnlineStatus, setShowOnlineStatus] = React.useState(true);
  const [showActivity, setShowActivity] = React.useState(true);
  const [allowMessages, setAllowMessages] = React.useState<'everyone' | 'friends' | 'none'>('everyone');
  const [dataCollection, setDataCollection] = React.useState(true);
  const [analytics, setAnalytics] = React.useState(true);
  const [personalizedAds, setPersonalizedAds] = React.useState(false);

  const handleDownloadData = () => {
    Alert.alert('Download Data', 'Your data export will be prepared and sent to your email.');
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete Personal Data',
      'This will permanently delete all your personal data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Deleted', 'Your personal data has been deleted.') }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Privacy" subtitle="Who sees you, your activity and messages" onBack={() => router.back()} />
        {/* Profile Visibility */}
        <MotableSection index={0} title="Profile visibility" subtitle="Who can see you on Local Buddy">
          <PrivacyOption title="Public" description="Anyone can see your profile and activity" icon="globe-outline" selected={profileVisibility === 'public'} onPress={() => setProfileVisibility('public')} />
          <PrivacyOption title="Friends only" description="Only your connections can see your profile" icon="people-outline" selected={profileVisibility === 'friends'} onPress={() => setProfileVisibility('friends')} />
          <PrivacyOption title="Private" description="Only you can see your profile" icon="lock-closed-outline" selected={profileVisibility === 'private'} onPress={() => setProfileVisibility('private')} last />
        </MotableSection>

        {/* Activity Visibility */}
        <MotableSection index={1} title="Activity visibility" subtitle="What others see live">
          <SettingToggle title="Show Online Status" description="Let others see when you're online" value={showOnlineStatus} onChange={setShowOnlineStatus} icon="person-outline" />
          <SettingToggle title="Show Activity" description="Let others see your recent activity" icon="time-outline" value={showActivity} onChange={setShowActivity} last />
        </MotableSection>

        {/* Message Permissions */}
        <MotableSection index={2} title="Message permissions" subtitle="Who can start a chat with you">
          <PrivacyOption title="Everyone" description="Anyone can send you messages" icon="chatbubble-outline" selected={allowMessages === 'everyone'} onPress={() => setAllowMessages('everyone')} />
          <PrivacyOption title="Friends only" description="Only connections can message you" icon="people-outline" selected={allowMessages === 'friends'} onPress={() => setAllowMessages('friends')} />
          <PrivacyOption title="No one" description="Nobody can message you directly" icon="chatbubble-ellipses-outline" selected={allowMessages === 'none'} onPress={() => setAllowMessages('none')} last />
        </MotableSection>

        {/* Data & Analytics */}
        <MotableSection index={3} title="Data & analytics" subtitle="How your usage improves the app">
          <SettingToggle title="Data Collection" description="Allow usage data to improve the app" value={dataCollection} onChange={setDataCollection} icon="analytics-outline" />
          <SettingToggle title="Analytics" description="Help us understand app usage" value={analytics} onChange={setAnalytics} icon="bar-chart-outline" />
          <SettingToggle title="Personalized Ads" description="Ads based on your interests" value={personalizedAds} onChange={setPersonalizedAds} icon="megaphone-outline" last />
        </MotableSection>

        {/* Data Management */}
        <MotableSection index={4} title="Your data" subtitle="Export or erase what's yours">
          <ActionRow title="Download My Data" description="Get a copy of all your data" icon="download-outline" onPress={handleDownloadData} />
          <ActionRow title="Delete My Data" description="Permanently delete all personal data" icon="trash-outline" onPress={handleDeleteData} destructive last />
        </MotableSection>

        {/* Legal Links */}
        <MotableSection index={5} title="Legal" subtitle="Policies that protect you">
          <ActionRow title="Privacy Policy" description="How we handle your data" icon="document-text-outline" onPress={() => router.push('/privacy')} />
          <ActionRow title="Terms of Service" description="Rules of the platform" icon="document-outline" onPress={() => router.push('/terms')} />
          <ActionRow title="Cookie Policy" description="How cookies are used" icon="cookie-outline" onPress={() => router.push('/(screens)/privacy')} last />
        </MotableSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function MotableSection({ index, title, subtitle, children }: { index: number; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 420, delay: index * 80 }}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      {children}
    </MotiView>
  );
}

const PrivacyOption = ({ title, description, icon, selected, onPress, last }: any) => (
  <Pressable
    style={({ pressed }) => [
      styles.privacyOption,
      last && { marginBottom: 0 },
      selected && styles.privacyOptionSelected,
      pressed && { transform: [{ scale: 0.985 }] },
    ]}
    onPress={onPress}
  >
    <View style={[styles.privacyIcon, selected && styles.privacyIconSelected]}>
      <Ionicons name={icon} size={19} color={selected ? '#FFFFFF' : Colors.brand.accent} />
    </View>
    <View style={styles.privacyContent}>
      <Text style={[styles.privacyTitle, selected && { color: Colors.brand.accentPressed }]}>{title}</Text>
      <Text style={styles.privacyDescription}>{description}</Text>
    </View>
    <View style={[styles.privacyRadio, selected && styles.privacyRadioSelected]}>
      {selected ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
    </View>
  </Pressable>
);

const ActionRow = ({ title, description, icon, onPress, destructive, last }: any) => (
  <Pressable
    style={({ pressed }) => [
      styles.settingItem,
      last && { borderBottomWidth: 0 },
      pressed && { backgroundColor: Colors.surface.creamSoft, borderRadius: BorderRadius.sm },
    ]}
    onPress={onPress}
  >
    <View style={[styles.settingIcon, destructive ? styles.settingIconError : styles.settingIconAccent]}>
      <Ionicons name={icon} size={19} color={destructive ? Colors.semantic.error : Colors.brand.accent} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, destructive && { color: Colors.semantic.error }]}>{title}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={17} color={destructive ? Colors.semantic.error : Colors.text.muted} />
  </Pressable>
);

const SettingToggle = ({ title, description, icon, value, onChange, last }: any) => (
  <View style={[styles.settingItem, last && { borderBottomWidth: 0 }]}>
    <View style={[styles.settingIcon, value ? styles.settingIconOn : styles.settingIconAccent]}>
      <Ionicons name={icon} size={19} color={value ? '#FFFFFF' : Colors.brand.accent} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: Colors.border.medium, true: Colors.brand.accent }}
      thumbColor="#FFFFFF"
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { paddingHorizontal: Spacing[5], paddingTop: Spacing[5], paddingBottom: 40 },

  section: {
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border.light,
    padding: Spacing[5], marginBottom: Spacing[4], ...Shadows.card,
  },
  sectionTitle: { fontSize: 18, fontFamily: Typography.fontFamily.display, color: Colors.text.primary },
  sectionSub: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 3, marginBottom: Spacing[4] },

  privacyOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    padding: Spacing[3] + 2, borderRadius: BorderRadius.md, marginBottom: Spacing[3],
    backgroundColor: Colors.surface.primary, borderWidth: 1.5, borderColor: Colors.border.light,
  },
  privacyOptionSelected: { backgroundColor: Colors.brand.accentSoft, borderColor: Colors.brand.accent, ...Shadows.cardPressed },
  privacyIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  privacyIconSelected: { backgroundColor: Colors.brand.accent },
  privacyContent: { flex: 1 },
  privacyTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  privacyDescription: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },
  privacyRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border.medium,
    alignItems: 'center', justifyContent: 'center',
  },
  privacyRadioSelected: { backgroundColor: Colors.brand.accent, borderColor: Colors.brand.accent },

  settingItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingVertical: Spacing[3] + 2, borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  settingIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  settingIconAccent: { backgroundColor: Colors.brand.accentSoft },
  settingIconOn: { backgroundColor: Colors.brand.accent },
  settingIconError: { backgroundColor: Colors.semantic.errorSoft },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  settingDescription: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },
});
