/**
 * Language Settings — English / हिन्दी only. Region: India (fixed).
 * Real & persisted: uiStore.setLanguage persists locally AND syncs to the
 * backend (users/{uid}.preferences.appearance) automatically.
 * Soft Modern: rounded choice cards with big radio pills.
 */

import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { useUIStore } from '@/store/uiStore';
import { ScreenHeader } from '@/components/ui';

const LANGUAGES = [
  { code: 'en' as const, name: 'English', nativeName: 'English', flag: '🇬🇧', sub: 'Default app language' },
  { code: 'hi' as const, name: 'हिन्दी', nativeName: 'Hindi', flag: '🇮🇳', sub: 'पूरी ऐप हिन्दी में' },
];

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const { language, setLanguage, showToast } = useUIStore();

  const selectLanguage = (code: 'en' | 'hi') => {
    if (code === language) return;
    setLanguage(code); // persisted locally + synced to backend via uiStore
    showToast(`Language set to ${LANGUAGES.find((l) => l.code === code)?.name}`, 'success');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Language" subtitle="English ya हिन्दी — app ki bhasha" onBack={() => router.back()} />
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380 }}>
          <Text style={styles.sectionTitle}>App language</Text>
          <Text style={styles.sectionSub}>
            Local Buddy is available in English and Hindi. Pick how the app talks to you.
          </Text>
        </MotiView>

        <View style={styles.list}>
          {LANGUAGES.map((lang, i) => {
            const active = language === lang.code;
            return (
              <MotiView
                key={lang.code}
                from={{ opacity: 0, translateY: 14 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 380, delay: 90 + i * 80 }}
              >
                <Pressable
                  style={[styles.langCard, active && styles.langCardActive]}
                  onPress={() => selectLanguage(lang.code)}
                >
                  <View style={[styles.flagWrap, active && styles.flagWrapActive]}>
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.langName, active && { color: Colors.brand.accentPressed }]}>
                      {lang.name}
                    </Text>
                    <Text style={styles.langNative}>{lang.nativeName} • {lang.sub}</Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
                  </View>
                </Pressable>
              </MotiView>
            );
          })}
        </View>

        {/* Region — India only */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 380, delay: 280 }}
        >
          <Text style={[styles.sectionTitle, { marginTop: Spacing[7] }]}>Region</Text>
          <View style={styles.regionCard}>
            <View style={styles.flagWrap}>
              <Text style={styles.langFlag}>🇮🇳</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.langName}>India</Text>
              <Text style={styles.langNative}>Currency INR (₹) • Only region currently supported</Text>
            </View>
            <View style={styles.regionCheck}>
              <Ionicons name="checkmark" size={13} color="#FFFFFF" />
            </View>
          </View>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { padding: Spacing[5], paddingBottom: 40 },
  sectionTitle: { fontSize: 21, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, marginBottom: 4 },
  sectionSub: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, lineHeight: 19, marginBottom: Spacing[5] },
  list: { gap: Spacing[3] },
  langCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    padding: Spacing[4], borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface.elevated,
    borderWidth: 1.5, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  langCardActive: { borderColor: Colors.brand.accent, backgroundColor: Colors.brand.accentSoft, ...Shadows.buttonOrange },
  flagWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surface.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border.light,
  },
  flagWrapActive: { backgroundColor: '#FFFFFF', borderColor: Colors.brand.accent },
  langFlag: { fontSize: 24 },
  langName: { fontSize: 16, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  langNative: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 2 },
  radio: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border.medium,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent',
  },
  radioActive: { backgroundColor: Colors.brand.accent, borderColor: Colors.brand.accent },
  regionCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    padding: Spacing[4], borderRadius: BorderRadius.lg, marginTop: Spacing[2],
    backgroundColor: Colors.surface.elevated, borderWidth: 1.5, borderColor: Colors.semantic.success + '40',
    ...Shadows.card,
  },
  regionCheck: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.semantic.success,
    alignItems: 'center', justifyContent: 'center',
  },
});
