/**
 * Contact Support Screen - Get help from support team
 */

import React from 'react';
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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';

export default function ContactSupportScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  
  const isDark = theme === 'dark';
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [category, setCategory] = React.useState('general');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const categories = [
    { id: 'general', label: 'General Inquiry', icon: 'help-circle-outline' },
    { id: 'task', label: 'Task Issue', icon: 'clipboard-outline' },
    { id: 'payment', label: 'Payment & Billing', icon: 'card-outline' },
    { id: 'account', label: 'Account & Profile', icon: 'person-outline' },
    { id: 'safety', label: 'Safety & Security', icon: 'shield-outline' },
    { id: 'technical', label: 'Technical Issue', icon: 'construct-outline' },
    { id: 'feedback', label: 'Feedback & Suggestions', icon: 'bulb-outline' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
  ];

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please fill in both subject and message.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    Alert.alert(
      'Ticket Submitted',
      'Your support request has been received. Our team will respond within 24 hours. You\'ll receive an email confirmation with your ticket number.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'chat':
        Alert.alert('Live Chat', 'Live chat is available 9 AM - 6 PM EST. Would you like to start a chat now?', [
          { text: 'Later', style: 'cancel' },
          { text: 'Start Chat', onPress: () => Alert.alert('Connecting...', 'Connecting you to a support agent...') }
        ]);
        break;
      case 'email':
        Linking.openURL('mailto:support@localbuddy.app?subject=Support Request').catch(() => 
          Alert.alert('Error', 'Could not open email app')
        );
        break;
      case 'phone':
        Linking.openURL('tel:+18005550123').catch(() => 
          Alert.alert('Error', 'Could not open phone app')
        );
        break;
      case 'faq':
        router.push('/faq');
        break;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Contact Support</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Quick Help</Text>
          <View style={styles.quickActionsGrid}>
            {[
              { id: 'chat', icon: 'chatbubbles-outline', title: 'Live Chat', desc: '9 AM - 6 PM EST', color: '#10B981' },
              { id: 'email', icon: 'mail-outline', title: 'Email Us', desc: 'support@localbuddy.app', color: '#4F46E5' },
              { id: 'phone', icon: 'call-outline', title: 'Call Us', desc: '+1 (800) 555-0123', color: '#F59E0B' },
              { id: 'faq', icon: 'help-circle-outline', title: 'Browse FAQ', desc: 'Common questions', color: '#6B7280' },
            ].map((action, index) => (
              <TouchableOpacity 
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => handleQuickAction(action.id)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={[styles.quickActionTitle, { color: isDark ? '#fff' : '#000' }]}>{action.title}</Text>
                <Text style={[styles.quickActionDesc, { color: isDark ? '#888' : '#666' }]}>{action.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Support Form */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Send Us a Message</Text>
          <Text style={[styles.formDesc, { color: isDark ? '#888' : '#666' }, { marginBottom: 20 }]}>Can&apos;t find what you need? Fill out the form below and we&apos;ll get back to you.</Text>

          {/* Category Selector */}
          <Text style={[styles.fieldLabel, { color: isDark ? '#fff' : '#000' }]}>Category</Text>
          <View style={styles.categoryScroll}>
            {categories.map((cat, index) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { 
                    backgroundColor: category === cat.id ? '#4F46E5' : (isDark ? '#333' : '#f0f0f0'),
                    borderColor: category === cat.id ? '#4F46E5' : '#ddd',
                  }
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Ionicons 
                  name={cat.icon} 
                  size={18} 
                  color={category === cat.id ? '#fff' : (isDark ? '#888' : '#666')} 
                  style={{ marginRight: 6 }}
                />
                <Text style={[
                  styles.categoryChipText, 
                  { color: category === cat.id ? '#fff' : (isDark ? '#fff' : '#000') }
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Subject Field */}
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#fff' : '#000' }]}>Subject</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: isDark ? '#333' : '#fafafa', color: isDark ? '#fff' : '#000' }]}
              placeholder="Brief summary of your issue"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
            />
          </View>

          {/* Message Field */}
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#fff' : '#000' }]}>Message</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: isDark ? '#333' : '#fafafa', color: isDark ? '#fff' : '#000' }]}
              placeholder="Describe your issue in detail..."
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              maxLength={2000}
            />
            <Text style={[styles.charCount, { color: isDark ? '#666' : '#999' }, { marginTop: 8, textAlign: 'right' }]}>
              {message.length}/2000
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: isSubmitting ? '#999' : '#4F46E5' }, { marginTop: 24 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Sending...</Text>
            ) : (
              <Text style={styles.submitButtonText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Response Time Info */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="time-outline" size={22} color="#10B981" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: isDark ? '#fff' : '#000' }]}>Response Time</Text>
              <Text style={[styles.infoDesc, { color: isDark ? '#888' : '#666' }]}>We typically respond within 24 hours. Urgent safety issues are prioritized.</Text>
            </View>
          </View>
          <View style={[styles.infoRow, { marginTop: 12 }]}>
            <View style={[styles.infoIcon, { backgroundColor: '#4F46E515' }]}>
              <Ionicons name="mail-outline" size={22} color="#4F46E5" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: isDark ? '#fff' : '#000' }]}>Email Confirmation</Text>
              <Text style={[styles.infoDesc, { color: isDark ? '#888' : '#666' }]}>You&apos;ll receive an email with your ticket number for tracking.</Text>
            </View>
          </View>
          <View style={[styles.infoRow, { marginTop: 12 }]}>
            <View style={[styles.infoIcon, { backgroundColor: '#F59E0B15' }]}>
              <Ionicons name="chatbubbles-outline" size={22} color="#F59E0B" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: isDark ? '#fff' : '#000' }]}>Follow-up in Chat</Text>
              <Text style={[styles.infoDesc, { color: isDark ? '#888' : '#666' }]}>Continue the conversation in-app once we respond.</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  formDesc: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  quickActionCard: { 
    width: '48%', 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#eee',
    alignItems: 'center',
  },
  quickActionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  quickActionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginBottom: 4 },
  quickActionDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  fieldLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  categoryScroll: { flexDirection: 'row', gap: 8 },
  categoryChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  textInput: { 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#ddd',
    fontSize: 16, 
    fontFamily: 'Inter_400Regular',
  },
  textArea: { 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#ddd',
    fontSize: 16, 
    fontFamily: 'Inter_400Regular',
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  submitButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12, flexShrink: 0 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  infoDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
});