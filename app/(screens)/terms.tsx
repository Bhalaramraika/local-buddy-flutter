/**
 * Terms of Service Screen
 */

import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';

export default function TermsScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  
  const isDark = theme === 'dark';
  const lastUpdated = 'January 15, 2024';
  const version = '2.1';

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open link'));
  };

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      content: `By accessing or using the LocalBuddy mobile application, website, or services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.

These Terms constitute a legally binding agreement between you ("User", "you", or "your") and LocalBuddy, Inc. ("LocalBuddy", "we", "us", or "our").`,
    },
    {
      id: 'eligibility',
      title: '2. Eligibility',
      content: `You must be at least 18 years old to use the Service. By using the Service, you represent and warrant that you are 18 or older and have the legal capacity to enter into these Terms.

If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.`,
    },
    {
      id: 'accounts',
      title: '3. Accounts & Registration',
      content: `To use certain features, you must create an account. You agree to:
• Provide accurate, current, and complete information
• Maintain the security of your account credentials
• Notify us immediately of any unauthorized use
• Accept responsibility for all activities under your account

You may not create multiple accounts, use another person's account without permission, or transfer your account. We reserve the right to suspend or terminate accounts that violate these Terms.`,
    },
    {
      id: 'services',
      title: '4. Services Description',
      content: `LocalBuddy is a platform that connects users who need help with tasks ("Posters") with verified local service providers ("Buddies"). Our services include:
• Task posting and browsing
• Buddy verification and background checks
• Secure escrow payment processing
• In-app messaging and communication
• Rating and review system
• Referral and rewards program

We do not employ Buddies, nor are we a party to any agreement between Posters and Buddies. We provide the platform and tools to facilitate connections.`,
    },
    {
      id: 'user-conduct',
      title: '5. User Conduct',
      content: `You agree not to:
• Use the Service for illegal activities or to violate any laws
• Post tasks involving illegal, harmful, or prohibited activities
• Harass, threaten, or abuse other users
• Impersonate others or misrepresent your identity
• Attempt to bypass security measures or verification
• Use automated systems to access the Service
• Interfere with the Service's operation or other users' enjoyment
• Collect or store personal data of other users without consent

Prohibited task categories include: illegal activities, weapons, drugs, adult content, gambling, and any activity requiring professional licensing without verification.`,
    },
    {
      id: 'payments',
      title: '6. Payments & Fees',
      content: `Payment Terms:
• Posters set a budget for each task; funds are held in escrow
• Buddies receive payment after task completion and Poster confirmation
• LocalBuddy charges a 10% service fee (minimum $1) on completed tasks
• Fees are deducted from the Buddy's earnings
• Withdrawals: minimum $10, 1-3 business days processing

Refunds:
• Full refund if task is cancelled before Buddy acceptance
• Partial refunds may apply if work has commenced
• Disputes are resolved per our Dispute Resolution policy
• No refunds for service fees

All payments are processed through our payment partners (Stripe, etc.). We are not a financial institution.`,
    },
    {
      id: 'verification',
      title: '7. Verification & Trust',
      content: `Buddy Verification:
• Identity verification (government ID + selfie)
• Background checks for sensitive categories
• Ongoing monitoring and re-verification
• Verified badge displayed on profiles

We reserve the right to deny or revoke verification at any time. Verification does not guarantee service quality or safety. Users should exercise their own judgment.`,
    },
    {
      id: 'intellectual-property',
      title: '8. Intellectual Property',
      content: `LocalBuddy Content:
• All content, features, and functionality (excluding User Content) are owned by LocalBuddy and protected by copyright, trademark, and other laws.

User Content:
• You retain ownership of content you post (task descriptions, photos, messages)
• You grant LocalBuddy a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content for Service operation
• You represent you have rights to all content you post

Feedback:
• Any feedback, suggestions, or ideas you provide become LocalBuddy's property without compensation.`,
    },
    {
      id: 'privacy',
      title: '9. Privacy',
      content: `Your privacy is important. Our Privacy Policy explains how we collect, use, and protect your information. By using the Service, you consent to our Privacy Policy.

Key points:
• We collect account info, task data, messages, location, and usage data
• We use data to provide, improve, and secure the Service
• We share data with service providers, payment processors, and as required by law
• You have rights to access, correct, delete, and port your data`,
    },
    {
      id: 'disclaimers',
      title: '10. Disclaimers & Limitation of Liability',
      content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

LOCALBUDDY DOES NOT WARRANT THAT:
• The Service will be uninterrupted, secure, or error-free
• Buddies are qualified, licensed, or insured for specific tasks
• Task outcomes will meet your expectations
• User information is accurate or truthful

TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOCALBUDDY SHALL NOT BE LIABLE FOR:
• Indirect, incidental, special, consequential, or punitive damages
• Loss of profits, data, use, or goodwill
• Service interruptions, data loss, or unauthorized access
• Actions or omissions of Buddies or Posters
• Any amount exceeding fees paid by you in the 12 months prior to the claim`,
    },
    {
      id: 'indemnification',
      title: '11. Indemnification',
      content: `You agree to indemnify, defend, and hold harmless LocalBuddy and its officers, directors, employees, and agents from and against any claims, damages, losses, liabilities, and expenses (including attorneys' fees) arising from:
• Your use of the Service
• Your violation of these Terms
• Your violation of any third-party rights
• Your User Content
• Any task you post or perform`,
    },
    {
      id: 'disputes',
      title: '12. Dispute Resolution',
      content: `Informal Resolution:
Before filing a claim, you agree to contact us at legal@localbuddy.app to attempt informal resolution.

Binding Arbitration:
If informal resolution fails, disputes will be resolved by binding arbitration administered by the American Arbitration Association under its Consumer Arbitration Rules. Arbitration will be conducted in English, in your county of residence (or remotely).

Class Action Waiver:
YOU AGREE TO RESOLVE DISPUTES INDIVIDUALLY, NOT AS A CLASS ACTION OR REPRESENTATIVE PROCEEDING.

Exceptions:
• Small claims court actions
• Injunctive relief for intellectual property violations
• Claims by LocalBuddy for non-payment of fees`,
    },
    {
      id: 'termination',
      title: '13. Termination',
      content: `We may suspend or terminate your access to the Service at any time, with or without cause, including for:
• Violation of these Terms
• Fraudulent or illegal activity
• Harm to other users or the platform
• Extended inactivity (12+ months)

Upon termination:
• Your license to use the Service ends immediately
• You remain liable for obligations incurred prior to termination
• We may retain your data per our Privacy Policy
• Earned but unwithdrawn funds are forfeited if termination is for cause`,
    },
    {
      id: 'governing-law',
      title: '14. Governing Law',
      content: `These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of law principles. Any litigation not subject to arbitration shall be brought exclusively in the federal or state courts of Delaware.`,
    },
    {
      id: 'changes',
      title: '15. Changes to Terms',
      content: `We may modify these Terms at any time. Material changes will be communicated via:
• In-app notification
• Email to your registered address
• Prominent notice on the Service

Continued use after changes constitutes acceptance. If you disagree, you must stop using the Service and may terminate your account.`,
    },
    {
      id: 'contact',
      title: '16. Contact Us',
      content: `Questions about these Terms? Contact us at:
• Email: legal@localbuddy.app
• Mail: LocalBuddy, Inc., 123 Market St, San Francisco, CA 94105
• In-app: Settings → Help → Contact Support

Last updated: ${lastUpdated} | Version ${version}`,
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
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Terms of Service</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Meta Info */}
        <View style={[styles.metaContainer, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.metaText, { color: isDark ? '#888' : '#666' }]}>Last updated: {lastUpdated}</Text>
          <Text style={[styles.metaText, { color: isDark ? '#888' : '#666' }]}>Version: {version}</Text>
        </View>

        {/* Sections */}
        {sections.map((section, index) => (
          <View key={section.id} style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: index === 0 ? 16 : 16 }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>{section.title}</Text>
            <Text style={[styles.sectionContent, { color: isDark ? '#ccc' : '#333' }]}>{section.content}</Text>
          </View>
        ))}

        {/* Acceptance Notice */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <View style={styles.noticeBox}>
            <Ionicons name="information-circle-outline" size={24} color="#4F46E5" style={{ marginRight: 12 }} />
            <Text style={[styles.noticeText, { color: isDark ? '#ccc' : '#333' }]}>
              By continuing to use LocalBuddy, you acknowledge that you have read, understood, and agree to these Terms of Service.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
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
  metaContainer: { paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 16 },
  metaText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  section: { borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  sectionContent: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  noticeBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, backgroundColor: '#4F46E515', borderRadius: 12 },
  noticeText: { fontSize: 14, fontFamily: 'Inter_500Medium', lineHeight: 22, flex: 1 },
});