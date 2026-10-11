/**
 * Contact Support Screen - Get help from support team
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader, SoftButton } from '@/components/ui';

export default function ContactSupportScreen() {
  const router = useRouter();

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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Contact support" subtitle="We're here to help — 24×7" onBack={() => router.back()} />

        {/* Quick Actions */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400 }} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick help</Text>
          <View style={styles.quickActionsGrid}>
            {([
              { id: 'chat', icon: 'chatbubbles', title: 'Live Chat', desc: '9 AM – 6 PM EST', color: Colors.semantic.success, soft: Colors.semantic.successSoft },
              { id: 'email', icon: 'mail', title: 'Email Us', desc: 'support@localbuddy.app', color: Colors.brand.accent, soft: Colors.brand.accentSoft },
              { id: 'phone', icon: 'call', title: 'Call Us', desc: '+1 (800) 555-0123', color: Colors.semantic.warning, soft: Colors.semantic.warningSoft },
              { id: 'faq', icon: 'help-circle', title: 'Browse FAQ', desc: 'Common questions', color: Colors.brand.primary, soft: '#1E120912' },
            ] as const).map((action, index) => (
              <MotiView
                key={action.id}
                from={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 360, delay: 60 + index * 70 }}
                style={{ width: '48.2%' }}
              >
                <Pressable
                  style={({ pressed }) => [styles.quickActionCard, pressed && { transform: [{ scale: 0.97 }] }]}
                  onPress={() => handleQuickAction(action.id)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: action.soft }]}>
                    <Ionicons name={action.icon as any} size={22} color={action.color} />
                  </View>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionDesc}>{action.desc}</Text>
                </Pressable>
              </MotiView>
            ))}
          </View>
        </MotiView>

        {/* Support Form */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 420, delay: 180 }} style={styles.section}>
          <Text style={styles.sectionTitle}>Send us a message</Text>
          <Text style={styles.formDesc}>Can&apos;t find what you need? Fill out the form below and we&apos;ll get back to you.</Text>

          {/* Category Selector */}
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.categoryScroll}>
            {categories.map((cat) => {
              const active = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={active ? '#FFFFFF' : Colors.brand.accent}
                  />
                  <Text style={[styles.categoryChipText, active && { color: '#FFFFFF' }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Subject Field */}
          <View style={{ marginTop: Spacing[5] }}>
            <Text style={styles.fieldLabel}>Subject</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Brief summary of your issue"
              placeholderTextColor={Colors.text.muted}
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
            />
          </View>

          {/* Message Field */}
          <View style={{ marginTop: Spacing[4] }}>
            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your issue in detail..."
              placeholderTextColor={Colors.text.muted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              maxLength={2000}
            />
            <Text style={styles.charCount}>
              {message.length}/2000
            </Text>
          </View>

          {/* Submit Button */}
          <View style={{ marginTop: Spacing[5] }}>
            <SoftButton
              label={isSubmitting ? 'Sending…' : 'Submit request'}
              variant="accent"
              size="lg"
              icon="paper-plane"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              withGlow
            />
          </View>
        </MotiView>

        {/* Response Time Info */}
        <MotableContinuation delay={280}>
          <View style={styles.infoSection}>
            {[
              { icon: 'time', title: 'Response time', desc: 'We typically respond within 24 hours. Urgent safety issues are prioritized.', tint: Colors.semantic.warning, soft: Colors.semantic.warningSoft },
              { icon: 'mail', title: 'Email confirmation', desc: "You'll receive an email with your ticket number for tracking.", tint: Colors.brand.accent, soft: Colors.brand.accentSoft },
              { icon: 'chatbubbles', title: 'Follow-up in chat', desc: 'Continue the conversation in-app once we respond.', tint: Colors.semantic.success, soft: Colors.semantic.successSoft },
            ].map((row, i) => (
              <View key={row.title} style={[styles.infoRow, i > 0 && { marginTop: Spacing[3] }]}>
                <View style={[styles.infoIcon, { backgroundColor: row.soft }]}>
                  <Ionicons name={row.icon as any} size={19} color={row.tint} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>{row.title}</Text>
                  <Text style={styles.infoDesc}>{row.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </MotableContinuation>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MotableContinuation({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 420, delay }} style={{ marginTop: Spacing[4] }}>
      {children}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { paddingHorizontal: Spacing[5], paddingBottom: 40 },
  section: {
    borderRadius: BorderRadius.lg, padding: Spacing[5],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  sectionTitle: { fontSize: 18, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, marginBottom: Spacing[4] },
  formDesc: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, lineHeight: 21, color: Colors.text.secondary, marginBottom: Spacing[5] },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing[3] },
  quickActionCard: {
    width: '100%', padding: Spacing[4], borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border.light, backgroundColor: Colors.surface.primary,
    alignItems: 'center',
  },
  quickActionIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[2] },
  quickActionTitle: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, textAlign: 'center', marginBottom: 2 },
  quickActionDesc: { fontSize: 10.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, textAlign: 'center' },
  fieldLabel: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginBottom: Spacing[2], marginLeft: 2 },
  categoryScroll: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] + 1,
    borderRadius: BorderRadius.pill, borderWidth: 1.5, borderColor: Colors.border.light,
    backgroundColor: Colors.surface.primary,
  },
  categoryChipActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary, ...Shadows.button },
  categoryChipText: { fontSize: 12.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary },
  textInput: {
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] + 2, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border.light, backgroundColor: Colors.surface.primary,
    fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.primary,
  },
  textArea: {
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] + 2, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border.light, backgroundColor: Colors.surface.primary,
    fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.primary,
    textAlignVertical: 'top', minHeight: 120,
  },
  charCount: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, marginTop: Spacing[2], textAlign: 'right' },
  infoSection: {
    borderRadius: BorderRadius.lg, padding: Spacing[5],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },
  infoIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginBottom: 2 },
  infoDesc: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, lineHeight: 18 },
});