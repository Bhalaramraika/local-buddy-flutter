/**
 * Appearance Settings — Soft Modern
 * Theme choice cards with warm previews, font-size picker,
 * pill switches for display options, live preview card.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { useUIStore } from '@/store/uiStore';
import { ScreenHeader } from '@/components/ui';

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const { theme, setTheme, fontSize, setFontSize } = useUIStore();

  const [animationsEnabled, setAnimationsEnabled] = React.useState(true);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [highContrast, setHighContrast] = React.useState(false);
  const [compactMode, setCompactMode] = React.useState(false);
  const [showAvatars, setShowAvatars] = React.useState(true);
  const [showBadges, setShowBadges] = React.useState(true);

  const themes = [
    { id: 'light', name: 'Light', icon: 'sunny' as const, desc: 'Warm cream, easy on the eyes' },
    { id: 'dark', name: 'Dark', icon: 'moon' as const, desc: 'Warm charcoal for the night' },
    { id: 'system', name: 'System', icon: 'phone-portrait' as const, desc: 'Follows your phone setting' },
  ];

  const fontSizes = [
    { id: 'small', name: 'Small', size: 14 },
    { id: 'medium', name: 'Medium', size: 16 },
    { id: 'large', name: 'Large', size: 18 },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Appearance" subtitle="Theme, fonts and display comfort" onBack={() => router.back()} />
        {/* Theme Selection */}
        <MotableSection index={0} title="Theme" subtitle="Pick how Local Buddy looks">
          <View style={styles.themeRow}>
            {themes.map((t) => {
              const active = theme === t.id;
              return (
                <Pressable
                  key={t.id}
                  style={[styles.themeCard, active && styles.themeCardActive]}
                  onPress={() => setTheme(t.id as 'light' | 'dark' | 'system')}
                >
                  <View style={[styles.themeIconWrap, active && styles.themeIconWrapActive]}>
                    <Ionicons name={t.icon} size={22} color={active ? '#FFFFFF' : Colors.brand.accent} />
                  </View>
                  <Text style={[styles.themeName, active && { color: '#FFFFFF' }]}>{t.name}</Text>
                  <Text style={[styles.themeDesc, active && { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={2}>{t.desc}</Text>
                  {active ? (
                    <View style={styles.themeCheck}>
                      <Ionicons name="checkmark" size={12} color={Colors.brand.accent} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </MotableSection>

        {/* Font Size */}
        <MotableSection index={1} title="Font size" subtitle="How big text appears across the app">
          <View style={styles.fontRow}>
            {fontSizes.map((fs) => {
              const active = fontSize === fs.id;
              return (
                <Pressable
                  key={fs.id}
                  style={[styles.fontCard, active && styles.fontCardActive]}
                  onPress={() => setFontSize(fs.id as 'small' | 'medium' | 'large')}
                >
                  <Text style={{ fontSize: fs.size, fontFamily: Typography.fontFamily.body, color: active ? Colors.brand.accentPressed : Colors.text.primary }}>
                    Aa
                  </Text>
                  <Text style={[styles.fontName, active && { color: Colors.brand.accentPressed }]}>{fs.name}</Text>
                  {active ? (
                    <View style={styles.fontCheck}>
                      <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </MotableSection>

        {/* Display Options */}
        <MotableSection index={2} title="Display" subtitle="Fine-tune motion and layout">
          <SettingToggle title="Animations" description="Smooth transitions across screens" icon="sparkles" value={animationsEnabled} onChange={setAnimationsEnabled} />
          <SettingToggle title="Reduced Motion" description="Minimize motion for accessibility" icon="remove-circle-outline" value={reducedMotion} onChange={setReducedMotion} />
          <SettingToggle title="High Contrast" description="Stronger text contrast" icon="contrast-outline" value={highContrast} onChange={setHighContrast} />
          <SettingToggle title="Compact Mode" description="Denser content, less spacing" icon="compress-outline" value={compactMode} onChange={setCompactMode} last />
        </MotableSection>

        {/* Content Display */}
        <MotableSection index={3} title="Content" subtitle="What shows in lists and profiles">
          <SettingToggle title="Show Avatars" description="Profile pictures in lists" icon="person-circle-outline" value={showAvatars} onChange={setShowAvatars} />
          <SettingToggle title="Show Badges" description="Verification and achievement badges" icon="ribbon-outline" value={showBadges} onChange={setShowBadges} last />
        </MotableSection>

        {/* Live Preview */}
        <MotableSection index={4} title="Preview" subtitle="Live look at your settings">
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              {showAvatars ? (
                <View style={styles.previewAvatar}>
                  <Text style={styles.previewAvatarText}>JB</Text>
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.previewName}>John Buddy</Text>
                <Text style={styles.previewSub}>Super Buddy • 4.9★</Text>
              </View>
              {showBadges ? (
                <View style={styles.previewBadges}>
                  <View style={[styles.badge, { backgroundColor: Colors.semantic.successSoft }]}>
                    <Ionicons name="checkmark" size={12} color={Colors.semantic.success} />
                  </View>
                  <View style={[styles.badge, { backgroundColor: Colors.brand.accentSoft }]}>
                    <Ionicons name="star" size={11} color={Colors.brand.accent} />
                  </View>
                </View>
              ) : null}
            </View>
            <Text style={[styles.previewText, { fontSize: fontSize === 'small' ? 13.5 : fontSize === 'medium' ? 15 : 17 }]}>
              This is a live preview of how content looks with your current settings.
            </Text>
            <Pressable style={styles.previewBtn}>
              <Text style={styles.previewBtnText}>Sample button</Text>
            </Pressable>
          </View>
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
      transition={{ type: 'timing', duration: 420, delay: index * 90 }}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      {children}
    </MotiView>
  );
}

const SettingToggle = ({ title, description, icon, value, onChange, last }: any) => (
  <View style={[styles.settingItem, last && { borderBottomWidth: 0 }]}>
    <View style={[styles.settingIcon, value && styles.settingIconActive]}>
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

  themeRow: { flexDirection: 'row', gap: Spacing[3] },
  themeCard: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing[4], paddingHorizontal: Spacing[2],
    borderRadius: BorderRadius.md, backgroundColor: Colors.surface.primary,
    borderWidth: 1.5, borderColor: Colors.border.light,
  },
  themeCardActive: { backgroundColor: Colors.brand.accent, borderColor: Colors.brand.accent, ...Shadows.buttonOrange },
  themeIconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[2],
  },
  themeIconWrapActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  themeName: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginBottom: 2 },
  themeDesc: { fontSize: 10.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, textAlign: 'center', lineHeight: 14 },
  themeCheck: {
    position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },

  fontRow: { flexDirection: 'row', gap: Spacing[3] },
  fontCard: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing[4],
    borderRadius: BorderRadius.md, backgroundColor: Colors.surface.primary,
    borderWidth: 1.5, borderColor: Colors.border.light,
  },
  fontCardActive: { backgroundColor: Colors.brand.accentSoft, borderColor: Colors.brand.accent },
  fontName: { fontSize: 12, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary, marginTop: Spacing[1] },
  fontCheck: {
    position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.brand.accent, alignItems: 'center', justifyContent: 'center',
  },

  settingItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingVertical: Spacing[3] + 2, borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  settingIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  settingIconActive: { backgroundColor: Colors.brand.accent },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  settingDescription: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },

  previewCard: {
    borderRadius: BorderRadius.md, padding: Spacing[4], marginTop: Spacing[2],
    backgroundColor: Colors.surface.primary, borderWidth: 1, borderColor: Colors.border.light,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[3], gap: Spacing[3] },
  previewAvatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.brand.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  previewAvatarText: { color: '#FFFFFF', fontSize: 17, fontFamily: Typography.fontFamily.bold },
  previewName: { fontSize: 15, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  previewSub: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },
  previewBadges: { flexDirection: 'row', gap: 6 },
  badge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  previewText: { fontFamily: Typography.fontFamily.body, lineHeight: 22, color: Colors.text.secondary, marginBottom: Spacing[3] },
  previewBtn: {
    alignSelf: 'flex-start', backgroundColor: Colors.brand.accent, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[5], paddingVertical: Spacing[2] + 2, ...Shadows.buttonOrange,
  },
  previewBtnText: { color: '#FFFFFF', fontSize: 13, fontFamily: Typography.fontFamily.semiBold },
});
