/**
 * Create Task Screen - Post a new task
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useLocationStore } from '@/store/locationStore';

export default function CreateTaskScreen() {
  const router = useRouter();
  const { createTask, isCreating, clearError } = useTaskStore();
  const { user, isAuthenticated } = useAuthStore();
  const { theme } = useUIStore();
  const { currentLocation, requestLocationPermission } = useLocationStore();
  
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    budgetType: 'fixed' as 'fixed' | 'hourly',
    location: '',
    latitude: 0,
    longitude: 0,
    deadline: '',
    skills: [] as string[],
    isUrgent: false,
    isRemote: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showSkillPicker, setShowSkillPicker] = useState(false);

  const categories = [
    'Cleaning', 'Delivery', 'Handyman', 'Tutoring', 'Pet Care',
    'Grocery Shopping', 'Tech Support', 'Moving Help', 'Gardening',
    'Event Staffing', 'Photography', 'Writing', 'Design', 'Other'
  ];

  const availableSkills = [
    'Cleaning', 'Organizing', 'Heavy Lifting', 'Driving', 'Navigation',
    'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Assembly',
    'Teaching', 'Mentoring', 'Childcare', 'Pet Walking', 'Pet Feeding',
    'Shopping', 'Cooking', 'Meal Prep', 'Computer Repair', 'Software Help',
    'Network Setup', 'Data Entry', 'Research', 'Writing', 'Editing',
    'Graphic Design', 'Video Editing', 'Photography', 'Translation',
    'Administrative', 'Customer Service', 'Event Planning', 'Decorating'
  ];

  useEffect(() => {
    let mounted = true;
    if (isAuthenticated && currentLocation && mounted) {
      setFormData(prev => ({
        ...prev,
        location: currentLocation.address || '',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }));
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    requestLocationPermission();
    return () => { mounted = false; };
  }, [isAuthenticated, currentLocation, requestLocationPermission]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    else if (formData.title.length < 5) newErrors.title = 'Title must be at least 5 characters';
    else if (formData.title.length > 100) newErrors.title = 'Title must be less than 100 characters';
    
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    else if (formData.description.length < 20) newErrors.description = 'Description must be at least 20 characters';
    else if (formData.description.length > 2000) newErrors.description = 'Description must be less than 2000 characters';
    
    if (!formData.category) newErrors.category = 'Please select a category';
    
    if (!formData.budget.trim()) newErrors.budget = 'Budget is required';
    else if (isNaN(Number(formData.budget)) || Number(formData.budget) <= 0) newErrors.budget = 'Please enter a valid amount';
    
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    
    if (!formData.deadline) newErrors.deadline = 'Please select a deadline';
    else {
      const deadlineDate = new Date(formData.deadline);
      const now = new Date();
      if (deadlineDate <= now) newErrors.deadline = 'Deadline must be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      budget: Number(formData.budget),
      budgetType: formData.budgetType,
      location: formData.location.trim(),
      latitude: formData.latitude,
      longitude: formData.longitude,
      deadline: new Date(formData.deadline).toISOString(),
      skills: formData.skills,
      isUrgent: formData.isUrgent,
      isRemote: formData.isRemote,
    };
    
    const success = await createTask(taskData);
    if (success) {
      Alert.alert('Success', 'Task created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  const handleCategorySelect = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
    setSelectedCategory(category);
    setShowCategoryPicker(false);
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill) 
        : [...prev, skill]
    );
  };

  const handleSkillDone = () => {
    setFormData(prev => ({ ...prev, skills: selectedSkills }));
    setShowSkillPicker(false);
  };

  const renderCategoryPicker = () => (
    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <View style={[styles.modalContent, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>Select Category</Text>
          <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
            <Ionicons name="close-outline" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalList}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.modalItem,
                selectedCategory === cat && styles.modalItemSelected,
                { backgroundColor: selectedCategory === cat ? '#4F46E520' : 'transparent' }
              ]}
              onPress={() => handleCategorySelect(cat)}
            >
              <Text style={[
                styles.modalItemText,
                { color: selectedCategory === cat ? '#4F46E5' : isDark ? '#fff' : '#000' }
              ]}>
                {cat}
              </Text>
              {selectedCategory === cat && (
                <Ionicons name="checkmark" size={20} color="#4F46E5" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderSkillPicker = () => (
    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <View style={[styles.modalContent, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { maxHeight: '80%' }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>Select Skills (Multiple)</Text>
          <TouchableOpacity onPress={handleSkillDone}>
            <Text style={styles.modalDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalList}>
          {availableSkills.map(skill => (
            <TouchableOpacity
              key={skill}
              style={[
                styles.modalItem,
                selectedSkills.includes(skill) && styles.modalItemSelected,
                { backgroundColor: selectedSkills.includes(skill) ? '#4F46E520' : 'transparent' }
              ]}
              onPress={() => handleSkillToggle(skill)}
            >
              <Text style={[
                styles.modalItemText,
                { color: selectedSkills.includes(skill) ? '#4F46E5' : isDark ? '#fff' : '#000' }
              ]}>
                {skill}
              </Text>
              {selectedSkills.includes(skill) && (
                <Ionicons name="checkmark" size={20} color="#4F46E5" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={styles.authPrompt}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={80} color={isDark ? '#666' : '#ccc'} />
          <Text style={[styles.authTitle, { color: isDark ? '#fff' : '#000' }]}>Create Task</Text>
          <Text style={[styles.authSubtitle, { color: isDark ? '#888' : '#666' }]}>Sign in to post a new task</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Create Task</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#fff' : '#000' }]}>Task Title *</Text>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <Ionicons name="text-outline" size={20} color={isDark ? '#888' : '#666'} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Need help moving furniture"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              maxLength={100}
              placeholderTextColor={isDark ? '#888' : '#999'}
            />
          </View>
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#fff' : '#000' }]}>Description *</Text>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe what you need help with..."
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              maxLength={2000}
              multiline
              numberOfLines={5}
              placeholderTextColor={isDark ? '#888' : '#999'}
            />
          </View>
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          <Text style={[styles.charCount, { color: isDark ? '#888' : '#666' }]}>
            {formData.description.length}/2000
          </Text>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#fff' : '#000' }]}>Category *</Text>
          <TouchableOpacity
            style={[styles.selectWrapper, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Ionicons name="grid-outline" size={20} color={isDark ? '#888' : '#666'} style={styles.inputIcon} />
            <Text style={[
              styles.selectText,
              { color: formData.category ? (isDark ? '#fff' : '#000') : (isDark ? '#888' : '#999') }
            ]}>
              {formData.category || 'Select a category'}
            </Text>
            <Ionicons name="chevron-down-outline" size={20} color={isDark ? '#888' : '#666'} />
          </TouchableOpacity>
          {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#fff' : '#000' }]}>Budget *</Text>
          <View style={styles.budgetRow}>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { flex: 1 }]}>
              <Text style={[styles.currencyLabel, { color: isDark ? '#fff' : '#000' }]}>₹</Text>
              <TextInput
                style={[styles.textInput, { paddingLeft: 0 }]}
                placeholder="Amount"
                value={formData.budget}
                onChangeText={(text) => setFormData(prev => ({ ...prev, budget: text }))}
                keyboardType="numeric"
                placeholderTextColor={isDark ? '#888' : '#999'}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.budgetTypeButton,
                formData.budgetType === 'fixed' && styles.budgetTypeButtonActive,
                { backgroundColor: formData.budgetType === 'fixed' ? '#4F46E5' : (isDark ? '#2a2a2a' : '#f0f0f0') }
              ]}
              onPress={() => setFormData(prev => ({ ...prev, budgetType: 'fixed' }))}
            >
              <Text style={[
                styles.budgetTypeText,
                { color: formData.budgetType === 'fixed' ? '#fff' : (isDark ? '#fff' : '#000') }
              ]}>
                Fixed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.budgetTypeButton,
                formData.budgetType === 'hourly' && styles.budgetTypeButtonActive,
                { backgroundColor: formData.budgetType === 'hourly' ? '#4F46E5' : (isDark ? '#2a2a2a' : '#f0f0f0') }
              ]}
              onPress={() => setFormData(prev => ({ ...prev, budgetType: 'hourly' }))}
            >
              <Text style={[
                styles.budgetTypeText,
                { color: formData.budgetType === 'hourly' ? '#fff' : (isDark ? '#fff' : '#000') }
              ]}>
                /hour
              </Text>
            </TouchableOpacity>
          </View>
          {errors.budget && <Text style={styles.errorText}>{errors.budget}</Text>}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#fff' : '#000' }]}>Location *</Text>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <Ionicons name="location-outline" size={20} color={isDark ? '#888' : '#666'} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter location or use current"
              value={formData.location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              placeholderTextColor={isDark ? '#888' : '#999'}
            />
          </View>
          <TouchableOpacity style={styles.useLocationButton} onPress={() => {
            if (currentLocation) {
              setFormData(prev => ({
                ...prev,
                location: currentLocation.address || '',
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }));
            }
          }}>
            <Ionicons name="gps-outline" size={16} color="#4F46E5" />
            <Text style={styles.useLocationText}>Use Current Location</Text>
          </TouchableOpacity>
          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
        </View>

        {/* Deadline */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#fff' : '#000' }]}>Deadline *</Text>
          <TouchableOpacity
            style={[styles.selectWrapper, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
            onPress={() => {
              // In a real app, show a date picker modal
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              setFormData(prev => ({ ...prev, deadline: tomorrow.toISOString() }));
            }}
          >
            <Ionicons name="calendar-outline" size={20} color={isDark ? '#888' : '#666'} style={styles.inputIcon} />
            <Text style={[
              styles.selectText,
              { color: formData.deadline ? (isDark ? '#fff' : '#000') : (isDark ? '#888' : '#999') }
            ]}>
              {formData.deadline ? new Date(formData.deadline).toLocaleDateString() : 'Select deadline'}
            </Text>
            <Ionicons name="chevron-down-outline" size={20} color={isDark ? '#888' : '#666'} />
          </TouchableOpacity>
          {errors.deadline && <Text style={styles.errorText}>{errors.deadline}</Text>}
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#fff' : '#000' }]}>Required Skills</Text>
          <TouchableOpacity
            style={[styles.selectWrapper, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
            onPress={() => setShowSkillPicker(true)}
          >
            <Ionicons name="construct-outline" size={20} color={isDark ? '#888' : '#666'} style={styles.inputIcon} />
            <Text style={[
              styles.selectText,
              { color: formData.skills.length > 0 ? (isDark ? '#fff' : '#000') : (isDark ? '#888' : '#999') }
            ]}>
              {formData.skills.length > 0 
                ? `${formData.skills.length} skill${formData.skills.length > 1 ? 's' : ''} selected`
                : 'Select skills (optional)'
              }
            </Text>
            <Ionicons name="chevron-down-outline" size={20} color={isDark ? '#888' : '#666'} />
          </TouchableOpacity>
          {formData.skills.length > 0 && (
            <View style={styles.selectedSkills}>
              {formData.skills.map(skill => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                  <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))}>
                    <Ionicons name="close" size={14} color={isDark ? '#888' : '#666'} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#fff' : '#000' }]}>Options</Text>
          
          <View style={styles.optionRow}>
            <View style={styles.optionItem}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  formData.isUrgent && styles.checkboxChecked,
                  { backgroundColor: formData.isUrgent ? '#4F46E5' : 'transparent' }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, isUrgent: !prev.isUrgent }))}
              >
                {formData.isUrgent && <Ionicons name="checkmark" size={18} color="#fff" />}
              </TouchableOpacity>
              <Text style={[styles.optionLabel, { color: isDark ? '#fff' : '#000' }]}>Urgent Task</Text>
            </View>
            <View style={styles.optionItem}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  formData.isRemote && styles.checkboxChecked,
                  { backgroundColor: formData.isRemote ? '#4F46E5' : 'transparent' }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, isRemote: !prev.isRemote }))}
              >
                {formData.isRemote && <Ionicons name="checkmark" size={18} color="#fff" />}
              </TouchableOpacity>
              <Text style={[styles.optionLabel, { color: isDark ? '#fff' : '#000' }]}>Remote Friendly</Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isCreating && styles.submitButtonDisabled,
            { backgroundColor: isCreating ? '#4F46E580' : '#4F46E5' }
          ]}
          onPress={handleSubmit}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Ionicons name="refresh" size={20} color="#fff" style={styles.spinning} />
              <Text style={styles.submitButtonText}>Creating...</Text>
            </>
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Post Task</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {showCategoryPicker && renderCategoryPicker()}
      {showSkillPicker && renderSkillPicker()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0' },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular', color: '#000' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  selectWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0' },
  selectText: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular', marginLeft: 10 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetTypeButton: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0' },
  budgetTypeButtonActive: {},
  budgetTypeText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  currencyLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginRight: 8 },
  useLocationButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingVertical: 8 },
  useLocationText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#4F46E5' },
  selectedSkills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  skillChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#4F46E520', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  skillChipText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#4F46E5' },
  optionRow: { flexDirection: 'row', gap: 16 },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: {},
  optionLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  errorText: { color: '#EF4444', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 6 },
  charCount: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4, textAlign: 'right' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, marginTop: 8 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  spinning: { animation: 'spin 1s linear infinite' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  modalDoneText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#4F46E5' },
  modalList: { maxHeight: 300 },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalItemSelected: {},
  modalItemText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  authTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 16, textAlign: 'center' },
  authSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
});