/**
 * Edit Profile Screen - Update user profile information
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, isLoading: authLoading } = useAuthStore();
  const { theme, showToast } = useUIStore();
  
  const isDark = theme === 'dark';
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
    
    const skillsArray = formData.skills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    await updateProfile({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      bio: formData.bio.trim() || undefined,
      skills: skillsArray,
      location: formData.location.trim() || undefined,
      avatar: avatar || undefined,
    });
    const success = true;
    
    setIsSaving(false);
    
    if (success) {
      showToast('Profile updated successfully!', 'success');
      router.back();
    } else {
      showToast('Failed to update profile', 'error');
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

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <Text style={[
              styles.saveButtonText,
              isSaving ? styles.saveButtonTextDisabled : styles.saveButtonTextActive
            ]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarPlaceholder, { color: isDark ? '#fff' : '#fff' }]}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              )}
              <TouchableOpacity style={styles.avatarEditButton} onPress={pickImage}>
                <Ionicons name="camera-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.avatarActions}>
              <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={18} color="#4F46E5" />
                <Text style={styles.changePhotoButtonText}>Change Photo</Text>
              </TouchableOpacity>
              {(avatar || user?.avatar) && (
                <TouchableOpacity style={styles.removePhotoButton} onPress={removeAvatar}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.removePhotoButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Basic Info */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }, { marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Basic Information</Text>
          
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#fff' : '#000' }]}>Full Name *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: isDark ? '#2a2a2a' : '#fafafa' }]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter your full name"
              placeholderTextColor={isDark ? '#888' : '#999'}
              autoCapitalize="words"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#fff' : '#000' }]}>Email *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: isDark ? '#2a2a2a' : '#fafafa' }]}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter your email"
              placeholderTextColor={isDark ? '#888' : '#999'}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#fff' : '#000' }]}>Phone Number</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: isDark ? '#2a2a2a' : '#fafafa' }]}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Enter your phone number"
              placeholderTextColor={isDark ? '#888' : '#999'}
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#fff' : '#000' }]}>Location</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: isDark ? '#2a2a2a' : '#fafafa' }]}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="Your city/area"
              placeholderTextColor={isDark ? '#888' : '#999'}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Bio */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }, { marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>About You</Text>
          
          <View style={styles.field}>
            <TextInput
              style={[styles.textInput, styles.textArea, { backgroundColor: isDark ? '#2a2a2a' : '#fafafa' }]}
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              placeholder="Tell others about yourself..."
              placeholderTextColor={isDark ? '#888' : '#999'}
              multiline
              numberOfLines={4}
              maxLength={500}
              autoCapitalize="sentences"
            />
            <Text style={[styles.charCount, { color: isDark ? '#888' : '#999' }]}>
              {formData.bio.length}/500
            </Text>
          </View>
        </View>

        {/* Skills */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }, { marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Skills</Text>
          
          <View style={styles.field}>
            <TextInput
              style={[styles.textInput, { backgroundColor: isDark ? '#2a2a2a' : '#fafafa' }]}
              value={formData.skills}
              onChangeText={(text) => setFormData({ ...formData, skills: text })}
              placeholder="Cleaning, Delivery, Handyman, Tutoring..."
              placeholderTextColor={isDark ? '#888' : '#999'}
              autoCapitalize="words"
            />
            <Text style={[styles.fieldHint, { color: isDark ? '#888' : '#999' }]}>
              Separate skills with commas
            </Text>
          </View>
          
          {/* Skill Suggestions */}
          <View style={styles.skillSuggestions}>
            <Text style={[styles.skillSuggestionsLabel, { color: isDark ? '#888' : '#666' }]}>Popular Skills</Text>
            <View style={styles.skillTags}>
              {['Cleaning', 'Delivery', 'Handyman', 'Tutoring', 'Pet Care', 'Grocery Shopping', 'Tech Support', 'Moving Help', 'Gardening', 'Photography'].map((skill) => (
                <TouchableOpacity
                  key={skill}
                  style={[
                    styles.skillTag,
                    formData.skills.toLowerCase().includes(skill.toLowerCase()) && styles.skillTagSelected
                  ]}
                  onPress={() => {
                    const skills = formData.skills.split(',').map(s => s.trim()).filter(s => s);
                    const index = skills.findIndex(s => s.toLowerCase() === skill.toLowerCase());
                    if (index >= 0) {
                      skills.splice(index, 1);
                    } else {
                      skills.push(skill);
                    }
                    setFormData({ ...formData, skills: skills.join(', ') });
                  }}
                >
                  <Text style={[
                    styles.skillTagText,
                    formData.skills.toLowerCase().includes(skill.toLowerCase()) && styles.skillTagTextSelected
                  ]}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }, { marginTop: 16, marginBottom: 40 }]}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
          
          <TouchableOpacity style={styles.dangerButton}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
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
  saveButtonText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  saveButtonTextActive: { color: '#4F46E5' },
  saveButtonTextDisabled: { color: '#888' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  section: { borderRadius: 16, padding: 20 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 20 },
  avatarSection: { alignItems: 'center' },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', fontSize: 36, fontFamily: 'Inter_700Bold' },
  avatarEditButton: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarActions: { flexDirection: 'row', gap: 16 },
  changePhotoButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  changePhotoButtonText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#4F46E5' },
  removePhotoButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  removePhotoButtonText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#EF4444' },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 8 },
  textInput: { fontSize: 16, fontFamily: 'Inter_400Regular', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#eee', color: '#000' },
  textArea: { paddingTop: 14, textAlignVertical: 'top' },
  errorText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#EF4444', marginTop: 6 },
  charCount: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'right', marginTop: 6 },
  fieldHint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 6 },
  skillSuggestions: { marginTop: 12 },
  skillSuggestionsLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 10 },
  skillTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#4F46E5', backgroundColor: '#4F46E515' },
  skillTagSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  skillTagText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#4F46E5' },
  skillTagTextSelected: { color: '#fff' },
  dangerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#EF444415', borderRadius: 12, borderWidth: 1, borderColor: '#EF4444' },
  dangerButtonText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#EF4444' },
});