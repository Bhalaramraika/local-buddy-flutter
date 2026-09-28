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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';

export default function EditTaskScreen() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams();
  const { theme } = useUIStore();
  const { user } = useAuthStore();
  const { tasks, updateTask, isLoading, fetchTasks } = useTaskStore();
  
  const isDark = theme === 'dark';
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
      style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Edit Task</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.formContainer, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          
          {/* Title */}
          <FormField 
            label="Task Title"
            error={errors.title}
            isDark={isDark}
          >
            <TextInput
              style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
              maxLength={100}
            />
          </FormField>

          {/* Description */}
          <FormField 
            label="Description"
            error={errors.description}
            isDark={isDark}
          >
            <TextInput
              style={[styles.textarea, { color: isDark ? '#fff' : '#000' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what needs to be done"
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
          </FormField>

          {/* Category */}
          <FormField 
            label="Category"
            error={errors.category}
            isDark={isDark}
          >
            <View style={styles.categorySelector}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat ? styles.categoryChipActive : {},
                    { backgroundColor: category === cat ? '#4F46E5' : (isDark ? '#333' : '#f5f5f5') }
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    { color: category === cat ? '#fff' : (isDark ? '#fff' : '#000') }
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormField>

          {/* Budget & Deadline Row */}
          <View style={styles.row}>
            <FormField 
              label="Budget ($)"
              error={errors.budget}
              isDark={isDark}
              style={styles.halfField}
            >
              <TextInput
                style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                value={budget}
                onChangeText={setBudget}
                placeholder="0.00"
                keyboardType="numeric"
                maxLength={10}
              />
            </FormField>

            <FormField 
              label="Deadline"
              error={errors.deadline}
              isDark={isDark}
              style={styles.halfField}
            >
              <TouchableOpacity 
                style={[styles.datePicker, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}
                onPress={() => {
                  // Date picker would open here
                  const date = new Date();
                  date.setDate(date.getDate() + 7);
                  setDeadline(date.toISOString().split('T')[0]);
                }}
              >
                <Ionicons name="calendar-outline" size={22} color={isDark ? '#888' : '#666'} />
                <Text style={[styles.datePickerText, { color: deadline ? (isDark ? '#fff' : '#000') : (isDark ? '#888' : '#666') }]}>
                  {deadline || 'Select date'}
                </Text>
              </TouchableOpacity>
            </FormField>
          </View>

          {/* Location */}
          <FormField 
            label="Location"
            error={errors.location}
            isDark={isDark}
          >
            <View style={styles.locationInput}>
              <Ionicons name="location-outline" size={22} color={isDark ? '#888' : '#666'} />
              <TextInput
                style={[styles.input, { color: isDark ? '#fff' : '#000', flex: 1 }]}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter location or use current"
              />
              <TouchableOpacity onPress={() => setLocation('Current Location')}>
                <Ionicons name="navigate-outline" size={22} color="#4F46E5" />
              </TouchableOpacity>
            </View>
          </FormField>

          {/* Requirements */}
          <FormField 
            label="Requirements (Optional)"
            isDark={isDark}
          >
            <TextInput
              style={[styles.textarea, { color: isDark ? '#fff' : '#000' }]}
              value={requirements}
              onChangeText={setRequirements}
              placeholder="Any special requirements or skills needed"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </FormField>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Updating...</Text>
            ) : (
              <Text style={styles.submitButtonText}>Update Task</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const FormField = ({ label, error, isDark, children, style }: any) => (
  <View style={[styles.field, style]}>
    <Text style={[styles.fieldLabel, { color: isDark ? '#fff' : '#000' }]}>{label}</Text>
    {children}
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  deleteButton: { padding: 8 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  formContainer: { borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#eee' },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  input: { height: 52, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, fontFamily: 'Inter_400Regular' },
  textarea: { minHeight: 100, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, fontSize: 16, fontFamily: 'Inter_400Regular', textAlignVertical: 'top' },
  categorySelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  categoryChipActive: { borderColor: '#4F46E5' },
  categoryChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  halfField: { flex: 1 },
  datePicker: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 52, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 16 },
  datePickerText: { fontSize: 16, fontFamily: 'Inter_400Regular', flex: 1 },
  locationInput: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 52, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 16, backgroundColor: '#fafafa' },
  errorText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#EF4444', marginTop: 6 },
  submitButton: { height: 56, borderRadius: 16, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});