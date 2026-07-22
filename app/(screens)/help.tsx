/**
 * Help & Support Screen - Help center and support options
 */

import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';

export default function HelpScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  
  const isDark = theme === 'dark';

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
      icon: 'chatbubble-ellipses-outline',
      title: 'Contact Support',
      subtitle: 'Chat with our support team',
      color: '#4F46E5',
      onPress: () => router.push('/(screens)/contact-support'),
    },
    {
      icon: 'document-text-outline',
      title: 'FAQ',
      subtitle: 'Browse frequently asked questions',
      color: '#10B981',
      onPress: () => router.push('/(screens)/faq'),
    },
    {
      icon: 'flag-outline',
      title: 'Report a Problem',
      subtitle: 'Report bugs or issues',
      color: '#F59E0B',
      onPress: () => router.push('/(screens)/contact-support?type=bug'),
    },
    {
      icon: 'bulb-outline',
      title: 'Suggest a Feature',
      subtitle: 'Share your ideas with us',
      color: '#8B5CF6',
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
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Help & Support</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchWrapper, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <Ionicons name="search-outline" size={22} color={isDark ? '#888' : '#999'} style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Search help articles...</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={action.title}
                style={[styles.quickActionCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
                onPress={action.onPress}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={[styles.quickActionTitle, { color: isDark ? '#fff' : '#000' }]}>{action.title}</Text>
                <Text style={[styles.quickActionSubtitle, { color: isDark ? '#888' : '#666' }]}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Help Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Help Topics</Text>
          {helpCategories.map((category) => (
            <View key={category.title} style={[styles.categoryCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 12 }]}>
              <TouchableOpacity style={styles.categoryHeader}>
                <View style={styles.categoryIcon}>
                  <Ionicons name={category.icon} size={22} color="#4F46E5" />
                </View>
                <Text style={[styles.categoryTitle, { color: isDark ? '#fff' : '#000' }]}>{category.title}</Text>
                <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#555' : '#999'} />
              </TouchableOpacity>
              <View style={styles.categoryItems}>
                {category.items.map((item) => (
                  <TouchableOpacity 
                    key={item.title}
                    style={styles.categoryItem}
                    onPress={() => router.push(item.route)}
                  >
                    <Text style={[styles.categoryItemText, { color: isDark ? '#ddd' : '#444' }]}>{item.title}</Text>
                    <Ionicons name="chevron-forward-outline" size={18} color={isDark ? '#555' : '#999'} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Contact Us</Text>
          {contactOptions.map((option) => (
            <TouchableOpacity 
              key={option.title}
              style={[styles.contactItem, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
              onPress={option.onPress}
            >
              <View style={styles.contactIcon}>
                <Ionicons name={option.icon} size={22} color="#4F46E5" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactTitle, { color: isDark ? '#fff' : '#000' }]}>{option.title}</Text>
                <Text style={[styles.contactSubtitle, { color: isDark ? '#888' : '#666' }]}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#555' : '#999'} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <View style={[styles.appInfo, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <View style={styles.appIcon}>
              <Ionicons name="logo-localbuddy" size={48} color="#4F46E5" />
            </View>
            <Text style={[styles.appName, { color: isDark ? '#fff' : '#000' }]}>LocalBuddy</Text>
            <Text style={[styles.appVersion, { color: isDark ? '#888' : '#666' }]}>Version 1.0.0</Text>
            <Text style={[styles.appDescription, { color: isDark ? '#888' : '#666' }]}>Your local task marketplace</Text>
          </View>
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
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  searchContainer: { marginBottom: 24 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  searchIcon: { marginRight: 10 },
  searchPlaceholder: { fontSize: 16, fontFamily: 'Inter_400Regular', color: '#999', flex: 1 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickActionCard: { flex: 1, minWidth: '45%', maxWidth: '50%', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  quickActionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginBottom: 4 },
  quickActionSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  categoryCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  categoryIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4F46E515', justifyContent: 'center', alignItems: 'center' },
  categoryTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', flex: 1 },
  categoryItems: { paddingHorizontal: 16, paddingBottom: 16 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  categoryItemText: { fontSize: 15, fontFamily: 'Inter_400Regular', flex: 1, marginRight: 8 },
  contactItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  contactIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4F46E515', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  contactSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 2 },
  appInfo: { alignItems: 'center', padding: 32, borderRadius: 16, borderWidth: 1, borderColor: '#eee' },
  appIcon: { marginBottom: 12 },
  appName: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  appVersion: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 4 },
  appDescription: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 8 },
});