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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { cachedApiGet, globalCacheKey } from '@/services/cache';
import { CACHE_CONFIG } from '@/constants/app';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader, SoftButton } from '@/components/ui';

export default function CreateTaskScreen() {
  const router = useRouter();
  const { createTask, isCreating, clearError } = useTaskStore();
  const { user, isAuthenticated } = useAuthStore();
  const { currentLocation, requestLocationPermission } = useLocationStore();
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
  const [serverCategories, setServerCategories] = useState<{ id: string; name: string }[]>([]);
  const categoriesList = (serverCategories.length ? serverCategories.map(c => c.name) : categories);

  useEffect(() => {
    let cancelled = false;
    // Categories are effectively static — global 1h TTL cache (a fresh
    // cache hit means zero network; stale paints instantly via onStale).
    cachedApiGet<{ categories: { id: string; name: string }[] }>(
      globalCacheKey('meta:categories'),
      '/meta/categories',
      CACHE_CONFIG.categories,
      {
        onStale: (res) => {
          if (!cancelled && res?.categories?.length) setServerCategories(res.categories);
        },
      }
    )
      .then((res) => { if (!cancelled && res?.categories?.length) setServerCategories(res.categories); })
      .catch(() => {}); // hardcoded fallback list stays the final resort
    return () => { cancelled = true; };
  }, []);

  const availableSkills = [
    'Cleaning', 'Organizing', 'Heavy Lifting', 'Driving', 'Navigation',
    'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Assembly',
    'Teaching', 'Mentoring', 'Childcare', 'Pet Walking', 'Pet Feeding',
    'Shopping', 'Cooking', 'Meal Prep', 'Computer Repair', 'Software Help',
    'Network Setup', 'Data Entry', 'Research', 'Writing', 'Editing',
    'Graphic Design', 'Video Editing', 'Photography', 'Translation',
    'Administrative', 'Customer Service', 'Event Planning', 'Decorating'
  ];

  const [prevLocation, setPrevLocation] = useState(currentLocation);
  // Seed form location when it becomes available
  if (prevLocation !== currentLocation) {
    setPrevLocation(currentLocation);
    if (currentLocation) {
      setFormData(prev => ({
        ...prev,
        location: currentLocation.address || '',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }));
    }
  }

  useEffect(() => {
    requestLocationPermission();
  }, [requestLocationPermission]);

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
    
    try {
      const success = await createTask(taskData);
      if (success) {
        Alert.alert('Success', 'Task created successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to create task. Please try again.';
      if (String(msg).toLowerCase().includes('kyc')) {
        Alert.alert(
          'Complete KYC required',
          'Posting a task requires verified KYC. Please complete your KYC first.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Complete KYC', onPress: () => router.push('/(screens)/kyc-status') },
          ]
        );
      } else {
        Alert.alert('Error', msg || 'Failed to create task. Please try again.');
      }
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
    <Modal
      visible={showCategoryPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCategoryPicker(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowCategoryPicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalContent}
          onPress={() => {}}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select category</Text>
            <TouchableOpacity onPress={() => setShowCategoryPicker(false)} style={styles.modalCloseBtn} hitSlop={8}>
              <Ionicons name="close" size={16} color={Colors.semantic.error} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
            {categoriesList.map(cat => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.modalItem, active && styles.modalItemSelected]}
                  onPress={() => handleCategorySelect(cat)}
                >
                  <View style={[styles.modalItemIcon, active && styles.modalItemIconActive]}>
                    <Ionicons name="pricetag" size={15} color={active ? '#FFFFFF' : Colors.brand.accent} />
                  </View>
                  <Text style={[styles.modalItemText, active && styles.modalItemTextActive]}>
                    {cat}
                  </Text>
                  {active ? <Ionicons name="checkmark-circle" size={19} color={Colors.brand.accent} /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const renderSkillPicker = () => (
    <Modal
      visible={showSkillPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSkillPicker(false)}
    >
      <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { maxHeight: '80%' }]}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select skills (multiple)</Text>
          <TouchableOpacity onPress={handleSkillDone} style={styles.modalDoneBtn} hitSlop={8}>
            <Text style={styles.modalDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
          {availableSkills.map(skill => {
            const active = selectedSkills.includes(skill);
            return (
              <TouchableOpacity
                key={skill}
                style={[styles.modalItem, active && styles.modalItemSelected]}
                onPress={() => handleSkillToggle(skill)}
              >
                <View style={[styles.modalItemIcon, active && styles.modalItemIconActive]}>
                  <Ionicons name="construct" size={15} color={active ? '#FFFFFF' : Colors.brand.accent} />
                </View>
                <Text style={[styles.modalItemText, active && styles.modalItemTextActive]}>
                  {skill}
                </Text>
                {active ? <Ionicons name="checkmark-circle" size={19} color={Colors.brand.accent} /> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
    </Modal>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <MotiView
          from={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 450 }}
          style={styles.authPrompt}
        >
          <View style={styles.authIconWrap}>
            <Ionicons name="clipboard" size={40} color={Colors.brand.accent} />
          </View>
          <Text style={styles.authTitle}>Create Task</Text>
          <Text style={styles.authSubtitle}>Sign in to post a new task</Text>
          <SoftButton label="Sign in" variant="accent" fullWidth={false} icon="arrow-forward" onPress={() => router.push('/login')} style={{ paddingHorizontal: Spacing[8], marginTop: Spacing[5] }} withGlow />
        </MotiView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={{ paddingHorizontal: Spacing[5], paddingTop: Spacing[5] }}>
        <ScreenHeader title="Post a task" subtitle="Describe the help you need" onBack={() => router.back()} style={{ marginBottom: Spacing[3] }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 60 }} style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Task title *</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconChip}>
              <Ionicons name="text" size={15} color={Colors.brand.accent} />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Need help moving furniture"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              maxLength={100}
              placeholderTextColor={Colors.text.muted}
            />
          </View>
          {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
        </MotiView>

        {/* Description */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 120 }} style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Description *</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrap]}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe what you need help with..."
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              maxLength={2000}
              multiline
              numberOfLines={5}
              placeholderTextColor={Colors.text.muted}
            />
          </View>
          {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
          <Text style={styles.charCount}>
            {formData.description.length}/2000
          </Text>
        </MotiView>

        {/* Category */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 180 }} style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Category *</Text>
          <TouchableOpacity
            style={styles.selectWrapper}
            onPress={() => setShowCategoryPicker(true)}
          >
            <View style={styles.inputIconChip}>
              <Ionicons name="grid" size={15} color={Colors.brand.accent} />
            </View>
            <Text style={[styles.selectText, !formData.category && { color: Colors.text.muted }]}>
              {formData.category || 'Select a category'}
            </Text>
            <Ionicons name="chevron-down" size={17} color={Colors.text.muted} />
          </TouchableOpacity>
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
        </MotiView>

        {/* Budget */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 240 }} style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Budget *</Text>
          <View style={styles.budgetRow}>
            <View style={[styles.inputWrapper, { flex: 1, marginBottom: 0 }]}>
              <View style={styles.currencyChip}>
                <Text style={styles.currencyLabel}>₹</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Amount"
                value={formData.budget}
                onChangeText={(text) => setFormData(prev => ({ ...prev, budget: text }))}
                keyboardType="numeric"
                placeholderTextColor={Colors.text.muted}
              />
            </View>
            <View style={styles.budgetTypeSeg}>
              {(['fixed', 'hourly'] as const).map((t) => {
                const active = formData.budgetType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.budgetTypeButton, active && styles.budgetTypeButtonActive]}
                    onPress={() => setFormData(prev => ({ ...prev, budgetType: t }))}
                  >
                    <Text style={[styles.budgetTypeText, active && { color: '#FFFFFF' }]}>
                      {t === 'fixed' ? 'Fixed' : '/hour'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          {errors.budget ? <Text style={styles.errorText}>{errors.budget}</Text> : null}
        </MotiView>

        {/* Location */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 300 }} style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Location *</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconChip}>
              <Ionicons name="location" size={15} color={Colors.brand.accent} />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Enter location or use current"
              value={formData.location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              placeholderTextColor={Colors.text.muted}
            />
          </View>
          <TouchableOpacity
            style={styles.useLocationButton}
            onPress={() => {
              if (currentLocation) {
                setFormData(prev => ({
                  ...prev,
                  location: currentLocation.address || '',
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }));
              }
            }}
          >
            <Ionicons name="navigate" size={14} color={Colors.brand.accentPressed} />
            <Text style={styles.useLocationText}>Use current location</Text>
          </TouchableOpacity>
          {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
        </MotiView>

        {/* Deadline */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 360 }} style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Deadline *</Text>
          <View style={styles.deadlineChips}>
            {[
              { label: 'Tomorrow', days: 1 },
              { label: 'In 2 days', days: 2 },
              { label: 'This week', days: 7 },
            ].map((opt) => {
              const target = new Date();
              target.setDate(target.getDate() + opt.days);
              const active = formData.deadline && new Date(formData.deadline).toDateString() === target.toDateString();
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.deadlineChip, active && styles.deadlineChipActive]}
                  onPress={() => setFormData(prev => ({ ...prev, deadline: target.toISOString() }))}
                >
                  <Ionicons name="calendar-outline" size={13} color={active ? '#FFFFFF' : Colors.brand.accent} />
                  <Text style={[styles.deadlineChipText, active && { color: '#FFFFFF' }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.deadlineChip}
              onPress={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setFormData(prev => ({ ...prev, deadline: tomorrow.toISOString() }));
              }}
            >
              <Ionicons name="calendar" size={13} color={Colors.brand.accent} />
              <Text style={styles.deadlineChipText}>Pick date</Text>
            </TouchableOpacity>
          </View>
          {formData.deadline ? (
            <Text style={styles.deadlineEcho}>
              Due {new Date(formData.deadline).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          ) : null}
          {errors.deadline ? <Text style={styles.errorText}>{errors.deadline}</Text> : null}
        </MotiView>

        {/* Skills */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 420 }} style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Required skills</Text>
          <TouchableOpacity
            style={styles.selectWrapper}
            onPress={() => setShowSkillPicker(true)}
          >
            <View style={styles.inputIconChip}>
              <Ionicons name="construct" size={15} color={Colors.brand.accent} />
            </View>
            <Text style={[styles.selectText, !formData.skills.length && { color: Colors.text.muted }]}>
              {formData.skills.length > 0
                ? `${formData.skills.length} skill${formData.skills.length > 1 ? 's' : ''} selected`
                : 'Select skills (optional)'
              }
            </Text>
            <Ionicons name="chevron-down" size={17} color={Colors.text.muted} />
          </TouchableOpacity>
          {formData.skills.length > 0 ? (
            <View style={styles.selectedSkills}>
              {formData.skills.map(skill => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                  <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))} hitSlop={6}>
                    <Ionicons name="close" size={13} color={Colors.brand.accentPressed} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
        </MotiView>

        {/* Options */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 480 }} style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Options</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[styles.optionCard, formData.isUrgent && styles.optionCardActive]}
              onPress={() => setFormData(prev => ({ ...prev, isUrgent: !prev.isUrgent }))}
            >
              <View style={[styles.optionIcon, formData.isUrgent && { backgroundColor: Colors.semantic.error, borderColor: Colors.semantic.error }]}>
                {formData.isUrgent ? <Ionicons name="flash" size={16} color="#fff" /> : <Ionicons name="flash-outline" size={16} color={Colors.semantic.error} />}
              </View>
              <Text style={[styles.optionTitle, formData.isUrgent && { color: Colors.semantic.error }]}>Urgent task</Text>
              <Text style={styles.optionDesc}>Boosts visibility to nearby buddies</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionCard, formData.isRemote && styles.optionCardActiveRemote]}
              onPress={() => setFormData(prev => ({ ...prev, isRemote: !prev.isRemote }))}
            >
              <View style={[styles.optionIcon, formData.isRemote && { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary }]}>
                {formData.isRemote ? <Ionicons name="desktop" size={16} color="#fff" /> : <Ionicons name="desktop-outline" size={16} color={Colors.brand.primary} />}
              </View>
              <Text style={styles.optionTitle}>Remote friendly</Text>
              <Text style={styles.optionDesc}>Work can be done from anywhere</Text>
            </TouchableOpacity>
          </View>
        </MotiView>

        {/* Submit */}
        <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 540 }}>
          <SoftButton
            label={isCreating ? 'Posting…' : 'Post task'}
            variant="accent"
            size="lg"
            icon="paper-plane"
            onPress={handleSubmit}
            loading={isCreating}
            disabled={isCreating}
            withGlow
          />
          <Text style={styles.submitNote}>Posted tasks notify nearby buddies instantly.</Text>
        </MotiView>
      </ScrollView>

      {showCategoryPicker && renderCategoryPicker()}
      {showSkillPicker && renderSkillPicker()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { paddingHorizontal: Spacing[5], paddingBottom: 120 },

  sectionCard: {
    marginBottom: Spacing[4], padding: Spacing[5], borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  sectionLabel: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginBottom: Spacing[3], marginLeft: 2 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    paddingHorizontal: Spacing[3], borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface.primary, borderWidth: 1.5, borderColor: Colors.border.light,
    minHeight: 54,
  },
  textAreaWrap: { alignItems: 'flex-start' },
  inputIconChip: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  currencyChip: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.semantic.successSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  currencyLabel: { fontSize: 16, fontFamily: Typography.fontFamily.bold, color: Colors.semantic.success },
  textInput: { flex: 1, fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.primary, paddingVertical: Spacing[3] },
  textArea: { minHeight: 110, textAlignVertical: 'top', paddingTop: Spacing[3] },

  selectWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    paddingHorizontal: Spacing[3], minHeight: 54, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface.primary, borderWidth: 1.5, borderColor: Colors.border.light,
  },
  selectText: { flex: 1, fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.primary },

  budgetRow: { flexDirection: 'row', gap: Spacing[2], alignItems: 'center' },
  budgetTypeSeg: {
    flexDirection: 'row', backgroundColor: Colors.surface.tertiary,
    borderRadius: BorderRadius.pill, padding: 4,
  },
  budgetTypeButton: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] + 2, borderRadius: BorderRadius.pill },
  budgetTypeButtonActive: { backgroundColor: Colors.brand.accent, ...Shadows.buttonOrange },
  budgetTypeText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary },

  useLocationButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    marginTop: Spacing[3], paddingVertical: Spacing[2], paddingHorizontal: Spacing[3],
    backgroundColor: Colors.brand.accentSoft, borderRadius: BorderRadius.pill,
  },
  useLocationText: { fontSize: 12.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.brand.accentPressed },

  deadlineChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  deadlineChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] + 1, borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface.primary, borderWidth: 1.5, borderColor: Colors.border.light,
  },
  deadlineChipActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary, ...Shadows.button },
  deadlineChipText: { fontSize: 12.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  deadlineEcho: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.brand.accentPressed, marginTop: Spacing[3], marginLeft: 2 },

  selectedSkills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginTop: Spacing[3] },
  skillChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.brand.accentSoft, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[3], paddingVertical: 6,
  },
  skillChipText: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: Colors.brand.accentPressed },

  optionRow: { flexDirection: 'row', gap: Spacing[3] },
  optionCard: {
    flex: 1, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border.light,
    backgroundColor: Colors.surface.primary, padding: Spacing[4], alignItems: 'center', gap: 4,
  },
  optionCardActive: { borderColor: Colors.semantic.error, backgroundColor: Colors.semantic.errorSoft },
  optionCardActiveRemote: { borderColor: Colors.brand.primary, backgroundColor: '#1E12090A' },
  optionIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface.creamSoft,
    borderWidth: 1.5, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  optionTitle: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  optionDesc: { fontSize: 10.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, textAlign: 'center', lineHeight: 14 },

  errorText: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: Colors.semantic.error, marginTop: Spacing[2], marginLeft: 2 },
  charCount: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, marginTop: 4, textAlign: 'right' },
  submitNote: { textAlign: 'center', fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, marginTop: Spacing[3] },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(30,18,9,0.42)' },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    maxHeight: '70%', backgroundColor: Colors.surface.elevated,
    paddingBottom: Spacing[6], ...Shadows.floating,
  },
  modalHandle: {
    width: 42, height: 5, borderRadius: 3, backgroundColor: Colors.border.medium,
    alignSelf: 'center', marginTop: Spacing[3], marginBottom: Spacing[2],
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[5], paddingVertical: Spacing[3],
    borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  modalTitle: { fontSize: 17, fontFamily: Typography.fontFamily.display, color: Colors.text.primary },
  modalCloseBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.semantic.errorSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  modalDoneBtn: {
    backgroundColor: Colors.brand.accent, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], ...Shadows.buttonOrange,
  },
  modalDoneText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },
  modalList: { flexGrow: 0 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingHorizontal: Spacing[5], paddingVertical: Spacing[3] + 2,
    borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  modalItemSelected: { backgroundColor: Colors.brand.accentSoft },
  modalItemIcon: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surface.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  modalItemIconActive: { backgroundColor: Colors.brand.accent },
  modalItemText: { flex: 1, fontSize: 14.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary },
  modalItemTextActive: { color: Colors.brand.accentPressed },

  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8] },
  authIconWrap: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', ...Shadows.card,
  },
  authTitle: { fontSize: 25, fontFamily: Typography.fontFamily.display, marginTop: Spacing[4], textAlign: 'center', color: Colors.text.primary },
  authSubtitle: { fontSize: 14, fontFamily: Typography.fontFamily.body, marginTop: Spacing[2], textAlign: 'center', color: Colors.text.secondary },
});