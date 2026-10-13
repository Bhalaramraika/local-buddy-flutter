/**
 * Edit Profile Screen — Soft Modern
 * Hero avatar card with camera badge, cream form sections,
 * skill chips, orange save bar. Profile/save/photo logic unchanged.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/contexts/AuthContext';
import { useUIStore } from '@/store/uiStore';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftButton, ScreenHeader, CachedImage } from '@/components/ui';
import { uploadToCloudinary } from '@/services/upload';
import { getApiErrorMessage } from '@/services/api';

// A freshly-picked gallery image is a local URI (file://, content://, ph://);
// anything starting with http/https is an already-hosted (Cloudinary) URL.
const isLocalUri = (uri?: string | null) => !!uri && !/^https?:\/\//i.test(uri);

const POPULAR_SKILLS = ['Cleaning', 'Delivery', 'Handyman', 'Tutoring', 'Pet Care', 'Grocery Shopping', 'Tech Support', 'Moving Help', 'Gardening', 'Photography'];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  // AuthContext.updateProfile persists to the backend (PUT /users/me/profile)
  // and then syncs the auth store — the store-only version saved locally,
  // which is why edits "reset" after reopening the app.
  const { updateProfile } = useAuth();
  const { showToast } = useUIStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    skills: '',
    location: '',
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [prevUser, setPrevUser] = useState(user);
  // Adjust form during render when user data arrives (React-recommended pattern)
  if (prevUser !== user) {
    setPrevUser(user);
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        skills: user.skills?.join(', ') || '',
        location: user.location || '',
      });
      setAvatar(user.avatar || null);
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const skillsArray = formData.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Photo: upload to Cloudinary first so a hosted URL is what lands in
      // Firestore — local file:// URIs die with the device install.
      let avatarUrl: string | null | undefined = undefined; // undefined = don't touch
      if (isLocalUri(avatar)) {
        const uploaded = await uploadToCloudinary(avatar!, { folder: `avatars/${user?.id || 'user'}` });
        avatarUrl = uploaded.secureUrl;
      } else if (avatar === null && user?.avatar) {
        avatarUrl = null; // user removed the photo
      } else if (avatar && avatar !== user?.avatar) {
        avatarUrl = avatar; // already-hosted URL (kept as-is)
      }

      await updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        skills: skillsArray,
        location: formData.location.trim() || undefined,
        ...(avatarUrl !== undefined ? { avatar: avatarUrl } : {}),
      });

      setIsSaving(false);
      showToast('Profile updated successfully!', 'success');
      router.back();
    } catch (err: any) {
      setIsSaving(false);
      showToast(getApiErrorMessage(err, 'Failed to update profile'), 'error');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const removeAvatar = () => {
    setAvatar(null);
  };

  const toggleSkill = (skill: string) => {
    const skills = formData.skills.split(',').map(s => s.trim()).filter(s => s);
    const index = skills.findIndex(s => s.toLowerCase() === skill.toLowerCase());
    if (index >= 0) {
      skills.splice(index, 1);
    } else {
      skills.push(skill);
    }
    setFormData({ ...formData, skills: skills.join(', ') });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Edit profile" subtitle="Photo, name and details" onBack={() => router.back()} />
        {/* Avatar card */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420 }}
          style={styles.avatarCard}
        >
          <View style={styles.avatarWrapper}>
            {avatar ? (
              <CachedImage source={{ uri: avatar }} style={styles.avatarImage} />
            ) : user?.avatar ? (
              <CachedImage source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <Pressable style={styles.avatarEditButton} onPress={pickImage} accessibilityLabel="Change photo">
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={styles.avatarActions}>
            <Pressable style={styles.changePhotoButton} onPress={pickImage}>
              <Ionicons name="image" size={15} color={Colors.brand.accent} />
              <Text style={styles.changePhotoButtonText}>Change photo</Text>
            </Pressable>
            {(avatar || user?.avatar) ? (
              <Pressable style={styles.removePhotoButton} onPress={removeAvatar}>
                <Ionicons name="trash" size={14} color={Colors.semantic.error} />
                <Text style={styles.removePhotoButtonText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
        </MotiView>

        {/* Basic Info */}
        <MotableSection index={1} title="Basic information">
          <FormField
            label="Full name *"
            icon="person-outline"
            value={formData.name}
            onChangeText={(t) => setFormData({ ...formData, name: t })}
            placeholder="Enter your full name"
            autoCapitalize="words"
            error={errors.name}
          />
          <FormField
            label="Email"
            icon="mail-outline"
            value={formData.email}
            placeholder="Login email"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
            hint="Email is your login ID and cannot be changed here"
          />
          <FormField
            label="Phone number"
            icon="call-outline"
            value={formData.phone}
            onChangeText={(t) => setFormData({ ...formData, phone: t })}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            error={errors.phone}
          />
          <FormField
            label="Location"
            icon="location-outline"
            value={formData.location}
            onChangeText={(t) => setFormData({ ...formData, location: t })}
            placeholder="Your city/area"
            autoCapitalize="words"
            last
          />
        </MotableSection>

        {/* Bio */}
        <MotableSection index={2} title="About you">
          <TextInput
            style={styles.textArea}
            value={formData.bio}
            onChangeText={(t) => setFormData({ ...formData, bio: t })}
            placeholder="Tell others about yourself..."
            placeholderTextColor={Colors.text.muted}
            multiline
            numberOfLines={4}
            maxLength={500}
            autoCapitalize="sentences"
          />
          <Text style={styles.charCount}>{formData.bio.length}/500</Text>
        </MotableSection>

        {/* Skills */}
        <MotableSection index={3} title="Skills">
          <TextInput
            style={styles.fieldInput}
            value={formData.skills}
            onChangeText={(t) => setFormData({ ...formData, skills: t })}
            placeholder="Cleaning, Delivery, Handyman, Tutoring..."
            placeholderTextColor={Colors.text.muted}
            autoCapitalize="words"
          />
          <Text style={styles.fieldHint}>Separate skills with commas</Text>

          <Text style={styles.skillSuggestionsLabel}>Popular skills</Text>
          <View style={styles.skillTags}>
            {POPULAR_SKILLS.map((skill) => {
              const active = formData.skills.toLowerCase().includes(skill.toLowerCase());
              return (
                <Pressable
                  key={skill}
                  style={[styles.skillTag, active && styles.skillTagSelected]}
                  onPress={() => toggleSkill(skill)}
                >
                  <Text style={[styles.skillTagText, active && styles.skillTagTextSelected]}>
                    {skill}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </MotableSection>

        {/* Save */}
        <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 400 }}>
          <SoftButton
            label={isSaving ? 'Saving…' : 'Save changes'}
            onPress={handleSave}
            loading={isSaving}
            variant="accent"
            size="lg"
            icon="checkmark-circle-outline"
            withGlow
          />
        </MotiView>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function MotableSection({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 420, delay: index * 80 }}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </MotiView>
  );
}

function FormField({ label, icon, hint, error, last, ...inputProps }: any) {
  const [focused, setFocused] = React.useState(false);
  const editable = inputProps.editable !== false;
  return (
    <View style={[styles.field, last && { marginBottom: 0 }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[
        styles.fieldWrap,
        focused && styles.fieldWrapFocused,
        error ? { borderColor: Colors.semantic.error } : null,
        !editable && styles.fieldWrapReadonly,
      ]}>
        <View style={[styles.fieldIconWrap, focused && { backgroundColor: Colors.brand.accentSoft }]}>
          <Ionicons name={icon} size={15} color={focused ? Colors.brand.accent : Colors.text.muted} />
        </View>
        <TextInput
          {...inputProps}
          onFocus={(e: any) => { setFocused(true); inputProps.onFocus?.(e); }}
          onBlur={(e: any) => { setFocused(false); inputProps.onBlur?.(e); }}
          placeholderTextColor={Colors.text.muted}
          style={[styles.fieldInputInner, !editable && { color: Colors.text.muted }]}
        />
        {!editable ? (
          <Ionicons name="lock-closed" size={13} color={Colors.text.muted} />
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { paddingHorizontal: Spacing[5], paddingTop: Spacing[5], paddingBottom: 40 },

  avatarCard: {
    alignItems: 'center', backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border.light,
    padding: Spacing[6], marginBottom: Spacing[4], ...Shadows.card,
  },
  avatarWrapper: { position: 'relative', marginBottom: Spacing[4] },
  avatarImage: { width: 104, height: 104, borderRadius: 52 },
  avatarPlaceholder: {
    width: 104, height: 104, borderRadius: 52, backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 38, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  avatarEditButton: {
    position: 'absolute', bottom: 0, right: 0, width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.brand.accent, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: Colors.surface.elevated, ...Shadows.buttonOrange,
  },
  avatarActions: { flexDirection: 'row', gap: Spacing[4] },
  changePhotoButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.brand.accentSoft, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2],
  },
  changePhotoButtonText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.brand.accentPressed },
  removePhotoButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.semantic.errorSoft, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2],
  },
  removePhotoButtonText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.semantic.error },

  section: {
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border.light,
    padding: Spacing[5], marginBottom: Spacing[4], ...Shadows.card,
  },
  sectionTitle: { fontSize: 18, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, marginBottom: Spacing[4] },

  field: { marginBottom: Spacing[5] },
  fieldLabel: { fontSize: 13, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary, marginBottom: Spacing[2], marginLeft: Spacing[1] },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    backgroundColor: Colors.surface.primary, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border.light, paddingHorizontal: Spacing[3],
  },
  fieldWrapFocused: { borderColor: Colors.brand.accent, backgroundColor: Colors.surface.elevated },
  fieldWrapReadonly: { backgroundColor: Colors.surface.tertiary },
  fieldIconWrap: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface.creamSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  fieldInputInner: {
    flex: 1, fontSize: 15, fontFamily: Typography.fontFamily.body,
    color: Colors.text.primary, paddingVertical: Spacing[3] + 2,
  },
  fieldInput: {
    fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.primary,
    backgroundColor: Colors.surface.primary, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border.light,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] + 2,
  },
  textArea: {
    fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.primary,
    backgroundColor: Colors.surface.primary, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border.light,
    paddingHorizontal: Spacing[4], paddingTop: Spacing[4], paddingBottom: Spacing[4],
    minHeight: 110, textAlignVertical: 'top',
  },
  errorText: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: Colors.semantic.error, marginTop: Spacing[1] + 2, marginLeft: Spacing[1] },
  charCount: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, textAlign: 'right', marginTop: Spacing[2] },
  fieldHint: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, marginTop: Spacing[2], marginLeft: Spacing[1] },

  skillSuggestionsLabel: { fontSize: 12.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.secondary, marginTop: Spacing[4], marginBottom: Spacing[2] },
  skillTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  skillTag: {
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], borderRadius: BorderRadius.pill,
    borderWidth: 1.5, borderColor: Colors.border.medium, backgroundColor: Colors.surface.primary,
  },
  skillTagSelected: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary, ...Shadows.button },
  skillTagText: { fontSize: 12.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary },
  skillTagTextSelected: { color: '#FFFFFF' },
});
