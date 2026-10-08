/**
 * Onboarding Wizard — single-screen, multi-step setup
 *
 * Design brief: soft cream background, orange CTAs, big rounded choice
 * cards, curved inputs, bold Inter headings.
 *
 * Steps: Role → About you (name, photo, bio) → Date of birth (calendar)
 *        → Language → Location → Referral → Finish
 * Everything is saved to the backend in ONE PUT /users/me/profile call so
 * nothing is left half-saved.
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useLocationStore } from '@/store/locationStore';
import { uploadToCloudinary } from '@/services/upload';
import { getApiErrorMessage } from '@/services/api';
import { storage } from '@/services/storage';
import { STORAGE_KEYS } from '@/constants/app';

// ---- Wizard palette (soft cream + orange) ----
const CREAM = '#FFF7EC';
const CREAM_CARD = '#FFFFFF';
const ORANGE = '#FF6B35';
const ORANGE_DEEP = '#E85A24';
const ORANGE_SOFT = '#FFE7D9';
const INK = '#2B2118';
const INK_SOFT = '#8A7B6C';

const STEPS = [
  { key: 'role', title: 'How will you use Local Buddy?', sub: 'Pick one — you can always do both.' },
  { key: 'about', title: 'Tell us about you', sub: 'Your name and photo help buddies recognize you.' },
  { key: 'dob', title: 'Your date of birth', sub: 'You must be at least 14 years old.' },
  { key: 'language', title: 'Preferred language', sub: 'Choose how the app talks to you.' },
  { key: 'location', title: 'Where are you?', sub: 'City and area power nearby matches.' },
  { key: 'referral', title: 'Referral code?', sub: 'Optional — unlock invite rewards.' },
] as const;

const isLocalUri = (uri?: string | null) => !!uri && !/^https?:\/\//i.test(uri);

// ============================================================
// Mini calendar (no native deps) — tap-to-pick DOB
// ============================================================
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function DobCalendar({ value, onChange }: { value: Date | null; onChange: (d: Date) => void }) {
  const today = new Date();
  const cutoff = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate()); // min age 14
  const minYear = 1940;
  const maxYear = cutoff.getFullYear();

  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? Math.min(2000, maxYear));
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? 0);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const cells: Array<Date | null> = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];

  const canGoPrev = viewYear > minYear || viewMonth > 0;
  const canGoNext = viewYear < maxYear || viewMonth < cutoff.getMonth();
  const prevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => Math.max(minYear, y - 1)); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => Math.min(maxYear, y + 1)); }
    else setViewMonth((m) => m + 1);
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  return (
    <View style={calStyles.card}>
      <View style={calStyles.headerRow}>
        <Pressable onPress={prevMonth} disabled={!canGoPrev} style={[calStyles.navBtn, !canGoPrev && { opacity: 0.3 }]}>
          <Ionicons name="chevron-back" size={18} color={INK} />
        </Pressable>
        <Text style={calStyles.headerText}>{MONTHS[viewMonth]} {viewYear}</Text>
        <Pressable onPress={nextMonth} disabled={!canGoNext} style={[calStyles.navBtn, !canGoNext && { opacity: 0.3 }]}>
          <Ionicons name="chevron-forward" size={18} color={INK} />
        </Pressable>
      </View>
      <View style={calStyles.weekRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={calStyles.weekDay}>{d}</Text>
        ))}
      </View>
      <View style={calStyles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={`e${i}`} style={calStyles.cell} />;
          const selectable = date <= cutoff && date.getFullYear() >= minYear;
          const selected = value && isSameDay(date, value);
          return (
            <Pressable
              key={date.toISOString()}
              disabled={!selectable}
              onPress={() => onChange(date)}
              style={[
                calStyles.cell,
                selected && calStyles.cellSelected,
                !selectable && { opacity: 0.25 },
              ]}
            >
              <Text style={[calStyles.cellText, selected && calStyles.cellTextSelected]}>{date.getDate()}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  card: { backgroundColor: CREAM_CARD, borderRadius: 22, padding: 14, borderWidth: 1, borderColor: '#F3E4D2' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: INK },
  navBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: ORANGE_SOFT, alignItems: 'center', justifyContent: 'center' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekDay: { flex: 1, textAlign: 'center', fontFamily: 'Inter_600SemiBold', fontSize: 11, color: INK_SOFT },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  cellSelected: { backgroundColor: ORANGE },
  cellText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: INK },
  cellTextSelected: { color: '#fff', fontFamily: 'Inter_700Bold' },
});

// ============================================================
// Reusable wizard bits
// ============================================================
function ChoiceCard({
  icon, title, sub, selected, onPress,
}: { icon: any; title: string; sub?: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        wizStyles.choiceCard,
        selected && { borderColor: ORANGE, backgroundColor: ORANGE_SOFT, borderWidth: 2 },
      ]}
    >
      <View style={[wizStyles.choiceIcon, { backgroundColor: selected ? ORANGE : ORANGE_SOFT }]}>
        <Ionicons name={icon} size={22} color={selected ? '#fff' : ORANGE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={wizStyles.choiceTitle}>{title}</Text>
        {sub ? <Text style={wizStyles.choiceSub}>{sub}</Text> : null}
      </View>
      <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selected ? ORANGE : '#D8CBBE'} />
    </Pressable>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={wizStyles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={INK_SOFT}
        {...props}
        style={[wizStyles.input, props.multiline && { minHeight: 96, textAlignVertical: 'top' }, props.style]}
      />
    </View>
  );
}

// ============================================================
export default function OnboardingSetup() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { requestPermission } = useLocation();
  const currentLocation = useLocationStore((s) => s.currentLocation);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [role, setRole] = useState<'customer' | 'buddy' | null>(null);
  const [name, setName] = useState(user?.name && !/^User /.test(user.name) ? user.name : '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar || null);
  const [dob, setDob] = useState<Date | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>((user?.language as any) === 'hi' ? 'hi' : 'en');
  const [city, setCity] = useState(user?.city || '');
  const [area, setArea] = useState((user as any)?.area || '');
  const [referral, setReferral] = useState('');

  // Step transition animation
  const stepFade = useRef(new Animated.Value(1)).current;
  const goTo = (next: number) => {
    Animated.timing(stepFade, { toValue: 0, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
      setStep(next);
      setError(null);
      Animated.timing(stepFade, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  };

  const canContinue = useMemo(() => {
    switch (STEPS[step].key) {
      case 'role': return !!role;
      case 'about': return name.trim().length >= 2;
      case 'dob': return !!dob;
      case 'language': return !!language;
      case 'location': return city.trim().length >= 2;
      case 'referral': return true;
      default: return false;
    }
  }, [step, role, name, dob, language, city]);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { setError('Please allow photo access to pick a profile photo.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setAvatarUri(result.assets[0].uri);
  };

  const useCurrentLocation = async () => {
    try {
      await requestPermission();
      await storage.set(STORAGE_KEYS.locationPermissionGranted, true);
      const loc = useLocationStore.getState().currentLocation;
      if (loc?.address) {
        const parts = String(loc.address).split(',').map((s: string) => s.trim()).filter(Boolean);
        if (parts.length) setCity(parts[0].length > 1 ? parts[0] : (parts[1] || parts[0]));
        if (parts.length > 1) setArea(parts.slice(0, 2).join(', '));
      }
    } catch { /* optional step */ }
  };

  React.useEffect(() => {
    if (currentLocation?.address && !city) {
      const parts = String(currentLocation.address).split(',').map((s: string) => s.trim()).filter(Boolean);
      if (parts.length) setCity(parts[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation]);

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      let avatarUrl: string | undefined;
      if (isLocalUri(avatarUri)) {
        const uploaded = await uploadToCloudinary(avatarUri!, { folder: `avatars/${user?.id || 'user'}` });
        avatarUrl = uploaded.secureUrl;
      } else if (avatarUri) {
        avatarUrl = avatarUri;
      }

      await updateProfile({
        name: name.trim(),
        bio: bio.trim() || undefined,
        avatar: avatarUrl,
        role: role || undefined,
        language,
        dateOfBirth: dob ? dob.toISOString().slice(0, 10) : undefined,
        city: city.trim(),
        area: area.trim() || undefined,
        referralCode: referral.trim() || undefined,
        profileCompleted: true,
      } as any);
      await storage.set(STORAGE_KEYS.onboardingComplete, true);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setError(getApiErrorMessage(e, 'Could not save your profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (!canContinue) return;
    if (step === STEPS.length - 1) { void finish(); return; }
    goTo(step + 1);
  };
  const back = () => { if (step > 0) goTo(step - 1); else router.back(); };

  const stepDef = STEPS[step];

  return (
    <KeyboardAvoidingView style={wizStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={wizStyles.header}>
        <Pressable onPress={back} style={wizStyles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={20} color={INK} />
        </Pressable>
        <View style={wizStyles.dotsRow}>
          {STEPS.map((s, i) => (
            <View key={s.key} style={[wizStyles.dot, i <= step && wizStyles.dotActive]} />
          ))}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={wizStyles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: stepFade, transform: [{ translateY: stepFade.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
          <Text style={wizStyles.title}>{stepDef.title}</Text>
          <Text style={wizStyles.subtitle}>{stepDef.sub}</Text>

          {stepDef.key === 'role' && (
            <View style={{ gap: 12, marginTop: 8 }}>
              <ChoiceCard icon="hand-left-outline" title="Get help" sub="Post tasks for local buddies" selected={role === 'customer'} onPress={() => setRole('customer')} />
              <ChoiceCard icon="briefcase-outline" title="Help others" sub="Earn by completing nearby tasks" selected={role === 'buddy'} onPress={() => setRole('buddy')} />
            </View>
          )}

          {stepDef.key === 'about' && (
            <View>
              <View style={wizStyles.avatarRow}>
                <Pressable onPress={pickPhoto} style={wizStyles.avatarWrap}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={wizStyles.avatarImg} />
                  ) : (
                    <View style={wizStyles.avatarPlaceholder}>
                      <Ionicons name="camera-outline" size={26} color={ORANGE} />
                    </View>
                  )}
                  <View style={wizStyles.avatarBadge}><Ionicons name="add" size={14} color="#fff" /></View>
                </Pressable>
                <Text style={wizStyles.avatarHint}>Add a profile photo (optional)</Text>
              </View>
              <Field label="Full name" value={name} onChangeText={setName} placeholder="e.g., Rahul Sharma" autoCapitalize="words" />
              <Field label="About you (optional)" value={bio} onChangeText={setBio} placeholder="A line or two about yourself" multiline maxLength={200} />
            </View>
          )}

          {stepDef.key === 'dob' && (
            <View>
              <DobCalendar value={dob} onChange={setDob} />
              {dob ? (
                <Text style={wizStyles.dobEcho}>
                  Selected: {dob.getDate()} {MONTHS[dob.getMonth()].slice(0, 3)} {dob.getFullYear()}
                </Text>
              ) : null}
            </View>
          )}

          {stepDef.key === 'language' && (
            <View style={{ gap: 12, marginTop: 8 }}>
              <ChoiceCard icon="language-outline" title="English" sub="Default" selected={language === 'en'} onPress={() => setLanguage('en')} />
              <ChoiceCard icon="language-outline" title="हिन्दी" sub="Hindi" selected={language === 'hi'} onPress={() => setLanguage('hi')} />
            </View>
          )}

          {stepDef.key === 'location' && (
            <View>
              <Pressable onPress={useCurrentLocation} style={wizStyles.useLocationBtn}>
                <Ionicons name="navigate-outline" size={16} color={ORANGE} />
                <Text style={wizStyles.useLocationText}>Use my current location</Text>
              </Pressable>
              <Field label="City" value={city} onChangeText={setCity} placeholder="e.g., Balotra" autoCapitalize="words" />
              <Field label="Area / neighborhood (optional)" value={area} onChangeText={setArea} placeholder="Your area" autoCapitalize="words" />
            </View>
          )}

          {stepDef.key === 'referral' && (
            <View>
              <Field label="Referral code (optional)" value={referral} onChangeText={setReferral} placeholder="Enter code" autoCapitalize="characters" />
            </View>
          )}

          {error ? <Text style={wizStyles.errorText}>{error}</Text> : null}
        </Animated.View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={wizStyles.footer}>
        <Pressable
          onPress={next}
          disabled={!canContinue || saving}
          style={[wizStyles.cta, (!canContinue || saving) && { opacity: 0.55 }]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={wizStyles.ctaText}>{step === STEPS.length - 1 ? 'Finish setup' : 'Continue'}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const wizStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CREAM },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3E4D2', alignItems: 'center', justifyContent: 'center' },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EBDCC9' },
  dotActive: { backgroundColor: ORANGE, width: 18 },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 26, color: INK, letterSpacing: -0.3, marginTop: 10 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: INK_SOFT, marginTop: 6, marginBottom: 18 },
  choiceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CREAM_CARD, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#F3E4D2',
  },
  choiceIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  choiceTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: INK },
  choiceSub: { fontFamily: 'Inter_400Regular', fontSize: 12.5, color: INK_SOFT, marginTop: 2 },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: INK, marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3E4D2',
    paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Inter_500Medium', fontSize: 15, color: INK,
  },
  avatarRow: { alignItems: 'center', marginBottom: 16 },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: ORANGE_SOFT, alignItems: 'center', justifyContent: 'center' },
  avatarBadge: {
    position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13,
    backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: CREAM,
  },
  avatarHint: { fontFamily: 'Inter_400Regular', fontSize: 12.5, color: INK_SOFT, marginTop: 8 },
  dobEcho: { marginTop: 12, textAlign: 'center', fontFamily: 'Inter_600SemiBold', color: ORANGE_DEEP, fontSize: 13 },
  useLocationBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: ORANGE_SOFT, marginBottom: 12 },
  useLocationText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: ORANGE_DEEP },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 12.5, color: '#DC2626', marginTop: 12 },
  footer: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 6, backgroundColor: 'transparent' },
  cta: {
    height: 54, borderRadius: 999, backgroundColor: ORANGE,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 16, elevation: 6,
  },
  ctaText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
});
