/**
 * Help & Support Screen - Help center and support options
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader } from '@/components/ui';

export default function HelpScreen() {
  const router = useRouter();

  const helpCategories = [
    {
      title: 'Getting Started',
      icon: 'rocket-outline',
      items: [
        { title: 'How to create an account', route: '/(screens)/faq?topic=getting-started' },
        { title: 'Setting up your profile', route: '/(screens)/faq?topic=profile-setup' },
        { title: 'Finding your first task', route: '/(screens)/faq?topic=first-task' },
        { title: 'Understanding the dashboard', route: '/(screens)/faq?topic=dashboard' },
      ],
    },
    {
      title: 'Tasks & Earnings',
      icon: 'briefcase-outline',
      items: [
        { title: 'How to apply for tasks', route: '/(screens)/faq?topic=apply-tasks' },
        { title: 'Task categories explained', route: '/(screens)/faq?topic=categories' },
        { title: 'Getting paid', route: '/(screens)/faq?topic=getting-paid' },
        { title: 'Task completion & reviews', route: '/(screens)/faq?topic=completion' },
        { title: 'Disputes & cancellations', route: '/(screens)/faq?topic=disputes' },
      ],
    },
    {
      title: 'Wallet & Payments',
      icon: 'wallet-outline',
      items: [
        { title: 'Adding funds to wallet', route: '/(screens)/faq?topic=add-funds' },
        { title: 'Withdrawing earnings', route: '/(screens)/faq?topic=withdraw' },
        { title: 'Transaction history', route: '/(screens)/faq?topic=transactions' },
        { title: 'Payment methods', route: '/(screens)/faq?topic=payment-methods' },
        { title: 'Fees & limits', route: '/(screens)/faq?topic=fees' },
      ],
    },
    {
      title: 'Messaging & Communication',
      icon: 'chatbubble-outline',
      items: [
        { title: 'Starting a conversation', route: '/(screens)/faq?topic=start-chat' },
        { title: 'Sharing location & files', route: '/(screens)/faq?topic=sharing' },
        { title: 'Voice & video calls', route: '/(screens)/faq?topic=calls' },
        { title: 'Blocking & reporting users', route: '/(screens)/faq?topic=blocking' },
      ],
    },
    {
      title: 'Account & Security',
      icon: 'shield-checkmark-outline',
      items: [
        { title: 'Two-factor authentication', route: '/(screens)/faq?topic=2fa' },
        { title: 'Privacy settings', route: '/(screens)/faq?topic=privacy' },
        { title: 'KYC verification', route: '/(screens)/faq?topic=kyc' },
        { title: 'Deleting your account', route: '/(screens)/faq?topic=delete-account' },
      ],
    },
    {
      title: 'Technical Issues',
      icon: 'build-outline',
      items: [
        { title: 'App not working properly', route: '/(screens)/faq?topic=app-issues' },
        { title: 'Notifications not showing', route: '/(screens)/faq?topic=notifications' },
        { title: 'Location services', route: '/(screens)/faq?topic=location' },
        { title: 'Updating the app', route: '/(screens)/faq?topic=updates' },
      ],
    },
  ];

  const quickActions = [
    {
      icon: 'chatbubble-ellipses',
      title: 'Contact Support',
      subtitle: 'Chat with our support team',
      color: Colors.brand.accent,
      soft: Colors.brand.accentSoft,
      onPress: () => router.push('/(screens)/contact-support'),
    },
    {
      icon: 'document-text',
      title: 'FAQ',
      subtitle: 'Browse frequently asked questions',
      color: Colors.semantic.success,
      soft: Colors.semantic.successSoft,
      onPress: () => router.push('/(screens)/faq'),
    },
    {
      icon: 'flag',
      title: 'Report a Problem',
      subtitle: 'Report bugs or issues',
      color: Colors.semantic.warning,
      soft: Colors.semantic.warningSoft,
      onPress: () => router.push('/(screens)/contact-support?type=bug'),
    },
    {
      icon: 'bulb',
      title: 'Suggest a Feature',
      subtitle: 'Share your ideas with us',
      color: Colors.brand.primary,
      soft: '#1E120912',
      onPress: () => router.push('/(screens)/contact-support?type=feature'),
    },
  ];

  const contactOptions = [
    {
      icon: 'mail-outline',
      title: 'Email Support',
      subtitle: 'support@localbuddy.app',
      onPress: () => Linking.openURL('mailto:support@localbuddy.app'),
    },
    {
      icon: 'chatbubble-outline',
      title: 'Live Chat',
      subtitle: 'Available 9am - 6pm EST',
      onPress: () => router.push('/(screens)/contact-support'),
    },
    {
      icon: 'call-outline',
      title: 'Phone Support',
      subtitle: '+1 (555) 123-4567',
      onPress: () => Linking.openURL('tel:+15551234567'),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Help & support" subtitle="Guides, contact and fixes" onBack={() => router.back()} />

        {/* Quick Actions */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400 }} style={styles.section}>
          <Text style={styles.sectionEyebrow}>QUICK ACTIONS</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, i) => (
              <MotiView
                key={action.title}
                from={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 380, delay: 60 + i * 70 }}
                style={{ width: '48.2%' }}
              >
                <Pressable style={({ pressed }) => [styles.quickActionCard, pressed && { transform: [{ scale: 0.97 }] }]} onPress={action.onPress}>
                  <View style={[styles.quickActionIcon, { backgroundColor: action.soft }]}>
                    <Ionicons name={action.icon as any} size={20} color={action.color} />
                  </View>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                </Pressable>
              </MotiView>
            ))}
          </View>
        </MotiView>

        {/* Help Categories */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 220 }} style={styles.section}>
          <Text style={styles.sectionEyebrow}>HELP TOPICS</Text>
          {helpCategories.map((category, ci) => (
            <View key={category.title} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryIcon}>
                  <Ionicons name={category.icon as any} size={19} color={Colors.brand.accent} />
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <View style={styles.categoryCount}>
                  <Text style={styles.categoryCountText}>{category.items.length}</Text>
                </View>
              </View>
              <View style={styles.categoryItems}>
                {category.items.map((item, ii) => (
                  <TouchableOpacity
                    key={item.title}
                    style={[styles.categoryItem, ii === category.items.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => router.push(item.route as any)}
                  >
                    <Text style={styles.categoryItemText}>{item.title}</Text>
                    <Ionicons name="chevron-forward" size={15} color={Colors.text.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </MotiView>

        {/* Contact Options */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 340 }} style={styles.section}>
          <Text style={styles.sectionEyebrow}>CONTACT US</Text>
          {contactOptions.map((option, i) => (
            <View key={option.title} style={[styles.contactItem, i < contactOptions.length - 1 && { marginBottom: Spacing[3] }]}>
              <View style={styles.contactIcon}>
                <Ionicons name={option.icon as any} size={18} color={Colors.brand.accent} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>{option.title}</Text>
                <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
              </View>
              <TouchableOpacity onPress={option.onPress} style={styles.contactGoBtn} hitSlop={8}>
                <Ionicons name="arrow-forward" size={15} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </MotiView>

        {/* App Info */}
        <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 420, delay: 460 }} style={{ marginBottom: 40 }}>
          <View style={styles.appInfo}>
            <View style={styles.appIcon}>
              <Ionicons name="people" size={30} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>LocalBuddy</Text>
            <View style={styles.appVersionPill}>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
            </View>
            <Text style={styles.appDescription}>Your local task marketplace</Text>
          </View>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { paddingHorizontal: Spacing[5], paddingTop: Spacing[1], paddingBottom: 40 },

  section: { marginBottom: Spacing[5], marginTop: Spacing[4] },
  sectionEyebrow: {
    fontSize: 11, fontFamily: Typography.fontFamily.bold, color: Colors.brand.accentPressed,
    letterSpacing: 1.4, marginBottom: Spacing[3],
  },

  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], justifyContent: 'space-between' },
  quickActionCard: {
    width: '100%', padding: Spacing[4], borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border.light,
    backgroundColor: Colors.surface.elevated, ...Shadows.card,
  },
  quickActionIcon: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[3],
  },
  quickActionTitle: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginBottom: 3 },
  quickActionSubtitle: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, lineHeight: 16 },

  categoryCard: {
    borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border.light,
    backgroundColor: Colors.surface.elevated, marginTop: Spacing[3], ...Shadows.card,
  },
  categoryHeader: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing[4], gap: Spacing[3],
    borderBottomWidth: 1, borderBottomColor: Colors.border.light, backgroundColor: Colors.surface.creamSoft,
  },
  categoryIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.brand.accentSoft, justifyContent: 'center', alignItems: 'center' },
  categoryTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, flex: 1 },
  categoryCount: {
    minWidth: 24, height: 24, borderRadius: 12, backgroundColor: Colors.brand.accent,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  categoryCountText: { fontSize: 11, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  categoryItems: { paddingHorizontal: Spacing[4] },
  categoryItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing[3] + 2, borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  categoryItemText: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, flex: 1, marginRight: 8 },

  contactItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing[4], borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },
  contactIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand.accentSoft, justifyContent: 'center', alignItems: 'center', marginRight: Spacing[3] },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  contactSubtitle: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },
  contactGoBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.brand.primary,
    alignItems: 'center', justifyContent: 'center', ...Shadows.button,
  },

  appInfo: {
    alignItems: 'center', padding: Spacing[6], borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.brand.primary, ...Shadows.button,
  },
  appIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.brand.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3], ...Shadows.buttonOrange,
  },
  appName: { fontSize: 21, fontFamily: Typography.fontFamily.display, color: '#FFFFFF' },
  appVersionPill: {
    marginTop: Spacing[2], backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[3], paddingVertical: 3,
  },
  appVersion: { fontSize: 11, fontFamily: Typography.fontFamily.medium, color: 'rgba(255,255,255,0.9)' },
  appDescription: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: 'rgba(255,255,255,0.7)', marginTop: Spacing[2] },
});