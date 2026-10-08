/**
 * Language Settings — English / हिन्दी only. Region: India (fixed).
 * Real & persisted: uiStore.setLanguage persists locally AND syncs to the
 * backend (users/{uid}.preferences.appearance) automatically.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';

const LANGUAGES = [
  { code: 'en' as const, name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi' as const, name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const { theme, language, setLanguage, showToast } = useUIStore();
  const systemScheme = useColorScheme();
  const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

  const selectLanguage = (code: 'en' | 'hi') => {
    if (code === language) return;
    setLanguage(code); // persisted locally + synced to backend via uiStore
    showToast(`Language set to ${LANGUAGES.find((l) => l.code === code)?.name}`, 'success');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Language</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>App language</Text>
        <Text style={[styles.sectionSub, { color: isDark ? '#888' : '#666' }]}>
          Local Buddy is available in English and Hindi.
        </Text>

        <View style={styles.list}>
          {LANGUAGES.map((lang) => {
            const active = language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langCard,
                  { backgroundColor: isDark ? '#2a2a2a' : '#fff' },
                  active && styles.langCardActive,
                ]}
                onPress={() => selectLanguage(lang.code)}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langName, { color: active ? '#8B85FF' : isDark ? '#fff' : '#000' }]}>
                    {lang.name}
                  </Text>
                  <Text style={[styles.langNative, { color: isDark ? '#888' : '#666' }]}>{lang.nativeName}</Text>
                </View>
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={active ? '#8B85FF' : isDark ? '#555' : '#ccc'}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Region — India only */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000', marginTop: 28 }]}>Region</Text>
        <View style={[styles.regionCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={styles.langFlag}>🇮🇳</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.langName, { color: isDark ? '#fff' : '#000' }]}>India</Text>
            <Text style={[styles.langNative, { color: isDark ? '#888' : '#666' }]}>
              Currency INR (₹) • Only region currently supported
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={22} color="#10B981" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  sectionSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 14 },
  list: { gap: 10 },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  langCardActive: { borderColor: '#8B85FF' },
  langFlag: { fontSize: 26 },
  langName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  langNative: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  regionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#10B98140',
    marginTop: 10,
  },
});
