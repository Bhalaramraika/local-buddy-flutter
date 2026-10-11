/**
 * Edit Task Screen - Edit existing task details
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTaskStore } from '@/store/taskStore';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader, SoftButton } from '@/components/ui';

export default function EditTaskScreen() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams();
  const { tasks, updateTask, fetchTasks } = useTaskStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [requirements, setRequirements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const task = tasks.find(t => t.id === taskId);

  const [prevTask, setPrevTask] = useState(task);
  if (prevTask !== task) {
    setPrevTask(task);
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setCategory(task.category);
      setBudget(task.budget?.amount?.toString() || '');
      setLocation(task.location?.address || '');
      setDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
      setRequirements(Array.isArray(task.requirements) ? task.requirements.join(', ') : (task.requirements || ''));
    }
  }

  useEffect(() => {
    if (!task && taskId) {
      fetchTasks();
    }
  }, [task, taskId, fetchTasks]);

  const categories = [
    'Cleaning', 'Delivery', 'Handyman', 'Tutoring', 
    'Pet Care', 'Tech Help', 'Moving', 'Shopping', 'Other'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!category) newErrors.category = 'Category is required';
    if (!budget || parseFloat(budget) <= 0) newErrors.budget = 'Valid budget is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (!deadline) newErrors.deadline = 'Deadline is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !task) return;
    
    setIsSubmitting(true);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        budget: parseFloat(budget),
        location: location.trim(),
        deadline: new Date(deadline).toISOString(),
        requirements: requirements.trim(),
      });
      Alert.alert('Success', 'Task updated successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          // Delete logic would go here
          router.back();
        }},
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={{ paddingHorizontal: Spacing[5], paddingTop: Spacing[5] }}>
        <ScreenHeader
          title="Edit task"
          subtitle="Update details anytime"
          onBack={() => router.back()}
          right={
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={8} accessibilityLabel="Delete task">
              <Ionicons name="trash" size={16} color={Colors.semantic.error} />
            </TouchableOpacity>
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420 }}
          style={styles.formContainer}
        >
          {/* Title */}
          <FormField label="Task title" error={errors.title}>
            <View style={styles.inputShell}>
              <View style={styles.inputIconChip}>
                <Ionicons name="text" size={14} color={Colors.brand.accent} />
              </View>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter task title"
                placeholderTextColor={Colors.text.muted}
                maxLength={100}
              />
            </View>
          </FormField>

          {/* Description */}
          <FormField label="Description" error={errors.description}>
            <TextInput
              style={styles.textarea}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what needs to be done"
              placeholderTextColor={Colors.text.muted}
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
          </FormField>

          {/* Category */}
          <FormField label="Category" error={errors.category}>
            <View style={styles.categorySelector}>
              {categories.map(cat => {
                const active = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    {active ? <Ionicons name="checkmark" size={11} color="#FFFFFF" /> : null}
                    <Text style={[styles.categoryChipText, active && { color: '#FFFFFF' }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FormField>

          {/* Budget & Deadline Row */}
          <View style={styles.row}>
            <FormField label="Budget (₹)" error={errors.budget} style={styles.halfField}>
              <View style={styles.inputShell}>
                <View style={styles.currencyChip}>
                  <Text style={styles.currencyText}>₹</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="0"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </FormField>

            <FormField label="Deadline" error={errors.deadline} style={styles.halfField}>
              <TouchableOpacity
                style={styles.datePicker}
                onPress={() => {
                  // Date picker would open here
                  const date = new Date();
                  date.setDate(date.getDate() + 7);
                  setDeadline(date.toISOString().split('T')[0]);
                }}
              >
                <View style={styles.dateChip}>
                  <Ionicons name="calendar" size={13} color={Colors.brand.accent} />
                </View>
                <Text style={[styles.datePickerText, !deadline && { color: Colors.text.muted }]} numberOfLines={1}>
                  {deadline || 'Select date'}
                </Text>
              </TouchableOpacity>
            </FormField>
          </View>

          {/* Location */}
          <FormField label="Location" error={errors.location}>
            <View style={styles.inputShell}>
              <View style={styles.inputIconChip}>
                <Ionicons name="location" size={14} color={Colors.brand.accent} />
              </View>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter location or use current"
                placeholderTextColor={Colors.text.muted}
              />
              <TouchableOpacity onPress={() => setLocation('Current Location')} style={styles.navChip} hitSlop={8}>
                <Ionicons name="navigate" size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </FormField>

          {/* Requirements */}
          <FormField label="Requirements (optional)">
            <TextInput
              style={styles.textarea}
              value={requirements}
              onChangeText={setRequirements}
              placeholder="Any special requirements or skills needed"
              placeholderTextColor={Colors.text.muted}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </FormField>

          {/* Submit Button */}
          <SoftButton
            label={isSubmitting ? 'Updating…' : 'Update task'}
            variant="accent"
            size="lg"
            icon="checkmark-circle"
            onPress={handleSubmit}
            loading={isSubmitting}
            withGlow
          />

          <View style={{ height: 40 }} />
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const FormField = ({ label, error, children, style }: any) => (
  <View style={[styles.field, style]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
    {error ? (
      <View style={styles.errorRow}>
        <Ionicons name="alert-circle" size={12} color={Colors.semantic.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  deleteBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.semantic.errorSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: Spacing[5], paddingBottom: 60 },
  formContainer: {
    borderRadius: BorderRadius.lg, padding: Spacing[5],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  field: { marginBottom: Spacing[5] },
  fieldLabel: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginBottom: Spacing[2], marginLeft: 2 },
  inputShell: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    borderWidth: 1.5, borderColor: Colors.border.light, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3], backgroundColor: Colors.surface.primary, minHeight: 54,
  },
  inputIconChip: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  currencyChip: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.semantic.successSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  currencyText: { fontSize: 14, fontFamily: Typography.fontFamily.bold, color: Colors.semantic.success },
  navChip: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.brand.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  input: { flex: 1, fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.primary, paddingVertical: Spacing[3] },
  textarea: {
    minHeight: 100, borderWidth: 1.5, borderColor: Colors.border.light, borderRadius: BorderRadius.md,
    padding: Spacing[4], fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.primary,
    backgroundColor: Colors.surface.primary, textAlignVertical: 'top',
  },
  categorySelector: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] + 1, borderRadius: BorderRadius.pill,
    borderWidth: 1.5, borderColor: Colors.border.light, backgroundColor: Colors.surface.primary,
  },
  categoryChipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primary, ...Shadows.button },
  categoryChipText: { fontSize: 12.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  row: { flexDirection: 'row', gap: Spacing[3] },
  halfField: { flex: 1 },
  datePicker: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2], minHeight: 54,
    borderWidth: 1.5, borderColor: Colors.border.light, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3], backgroundColor: Colors.surface.primary,
  },
  dateChip: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  datePickerText: { flex: 1, fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.primary },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing[2], marginLeft: 2 },
  errorText: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: Colors.semantic.error },
});