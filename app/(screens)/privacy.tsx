/**
 * Privacy Policy Screen
 */

import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';

export default function PrivacyScreen() {
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
      id: 'introduction',
      title: '1. Introduction',
      content: `LocalBuddy, Inc. ("LocalBuddy", "we", "us", "our") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application, website, and services (collectively, the "Service").

Please read this policy carefully. By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use the Service.`,
    },
    {
      id: 'information-collected',
      title: '2. Information We Collect',
      content: `We collect the following categories of information:

Personal Information:
• Account data: name, email, phone number, date of birth, profile photo
• Identity verification: government ID, selfie (for KYC), background check results
• Payment info: bank account details, card tokens (processed by Stripe)
• Location: precise GPS location (when enabled), approximate location from IP

Usage Data:
• Task activity: posts, applications, completions, ratings, reviews
• Messages: chat content between users
• App interactions: feature usage, session duration, crashes, performance
• Device info: model, OS, unique identifiers, push notification tokens

Third-Party Sources:
• Social login providers (Google, Apple): name, email, profile photo
• Background check providers: criminal records (for eligible categories)
• Payment processors: transaction history, verification status`,
    },
    {
      id: 'how-we-use',
      title: '3. How We Use Your Information',
      content: `We use your information for:

Service Provision:
• Create and manage your account
• Verify identity and run background checks
• Match Posters with Buddies based on location, skills, availability
• Process payments and manage escrow
• Enable in-app communication

Safety & Security:
• Detect and prevent fraud, abuse, illegal activity
• Enforce Terms of Service and Community Guidelines
• Respond to safety incidents and emergencies
• Comply with legal obligations

Improvement & Personalization:
• Analyze usage to improve features and performance
• Personalize task recommendations and search results
• Send relevant notifications (task updates, promotions, safety alerts)
• Conduct research and analytics

Marketing (with consent):
• Send promotional emails and push notifications
• Display targeted in-app offers
• You can opt out anytime in Settings → Notifications`,
    },
    {
      id: 'sharing',
      title: '4. Information Sharing & Disclosure',
      content: `We do not sell your personal information. We share data only as follows:

With Other Users:
• Your name, photo, rating, verification badge, and public profile info with matched users
• Task details with applicants and assigned Buddies
• Messages with conversation participants

With Service Providers (under contract):
• Payment processors (Stripe): payment data
• Cloud providers (AWS, Google Cloud): hosting, storage
• Communication services (Twilio, SendGrid): SMS, email
• Analytics (Amplitude, Mixpanel): usage analytics
• Background check vendors: identity verification data
• Customer support tools (Intercom, Zendesk): support tickets

Legal & Safety:
• Law enforcement with valid legal process
• Courts and regulators as required
• To protect rights, property, or safety of LocalBuddy, users, or public
• In connection with merger, acquisition, or asset sale

Aggregated Data:
• We may share anonymized, aggregated analytics with partners and publicly`,
    },
    {
      id: 'data-retention',
      title: '5. Data Retention',
      content: `We retain your information for as long as necessary to:
• Provide the Service and fulfill our contractual obligations
• Comply with legal obligations (typically 7 years for financial records)
• Resolve disputes and enforce agreements
• Maintain safety and security records

Account Deletion:
• Upon request, we delete your account and personal data within 30 days
• Some data may be retained in backups for up to 90 days
• Anonymized analytics data is retained indefinitely
• Legal holds may extend retention periods`,
    },
    {
      id: 'your-rights',
      title: '6. Your Rights & Choices',
      content: `Depending on your jurisdiction, you may have the following rights:

Access & Portability:
• Request a copy of your personal data
• Receive data in a portable, machine-readable format

Correction & Deletion:
• Correct inaccurate or incomplete data
• Request deletion of your personal data (subject to legal exceptions)

Restriction & Objection:
• Restrict processing of your data
• Object to processing for direct marketing
• Object to automated decision-making

Withdraw Consent:
• Withdraw consent for optional processing (marketing, analytics) anytime

To exercise these rights, email privacy@localbuddy.app or use Settings → Data & Privacy. We respond within 30 days.`,
    },
    {
      id: 'california',
      title: '7. California Privacy Rights (CCPA/CPRA)',
      content: `If you are a California resident, you have additional rights:

• Right to Know: Categories and specific pieces of personal information collected
• Right to Delete: Request deletion (with exceptions)
• Right to Opt-Out: Opt out of "sale" or "sharing" of personal information
• Right to Non-Discrimination: No retaliation for exercising rights

We do not "sell" personal information as defined by CCPA. We "share" data with analytics and advertising partners for cross-context behavioral advertising. You can opt out via Settings → Data & Privacy → Do Not Sell/Share My Info.

Authorized Agent: You may designate an authorized agent to submit requests on your behalf with written permission.`,
    },
    {
      id: 'international',
      title: '8. International Data Transfers',
      content: `LocalBuddy is headquartered in the United States. Your data may be transferred to and processed in countries with different data protection laws, including the US.

We ensure adequate protection through:
• Standard Contractual Clauses (SCCs) for EU/UK transfers
• Adequacy decisions where applicable
• Binding Corporate Rules for intra-group transfers
• Your consent for specific transfers

By using the Service, you consent to such transfers.`,
    },
    {
      id: 'security',
      title: '9. Data Security',
      content: `We implement appropriate technical and organizational measures:

• Encryption: AES-256 at rest, TLS 1.3 in transit
• Access Controls: Role-based access, principle of least privilege
• Authentication: MFA for staff, secure password hashing (bcrypt)
• Monitoring: Intrusion detection, vulnerability scanning, penetration testing
• Incident Response: 72-hour breach notification per GDPR/CCPA
• Certifications: SOC 2 Type II, ISO 27001 (in progress)

No method of transmission or storage is 100% secure. We cannot guarantee absolute security.`,
    },
    {
      id: 'children',
      title: '10. Children\'s Privacy',
      content: `The Service is not directed to children under 18. We do not knowingly collect personal information from children under 18. If you believe a child has provided us with personal information, contact privacy@localbuddy.app and we will delete it.`,
    },
    {
      id: 'changes',
      title: '11. Changes to This Policy',
      content: `We may update this Privacy Policy periodically. Material changes will be communicated via:
• In-app notification
• Email to your registered address
• Prominent notice on the Service

The "Last Updated" date at the top indicates the latest revision. Continued use constitutes acceptance.`,
    },
    {
      id: 'contact',
      title: '12. Contact Us',
      content: `Questions, concerns, or requests regarding this Privacy Policy or your data?

Data Protection Officer: dpo@localbuddy.app
Privacy Team: privacy@localbuddy.app
General Support: support@localbuddy.app
Mail: LocalBuddy, Inc., Attn: Privacy, 123 Market St, San Francisco, CA 94105

EU/UK Representative: LocalBuddy EU GmbH, Berlin, Germany - eu-privacy@localbuddy.app

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
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Privacy Policy</Text>
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

        {/* Quick Links */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Quick Actions</Text>
          <View style={styles.quickLinks}>
            <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/(screens)/data-usage')}>
              <Ionicons name="settings-outline" size={22} color="#8B85FF" style={{ marginRight: 12 }} />
              <Text style={[styles.quickLinkText, { color: isDark ? '#fff' : '#000' }]}>Manage Your Data</Text>
              <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#666' : '#999'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLink} onPress={() => handleOpenUrl('mailto:privacy@localbuddy.app')}>
              <Ionicons name="mail-outline" size={22} color="#10B981" style={{ marginRight: 12 }} />
              <Text style={[styles.quickLinkText, { color: isDark ? '#fff' : '#000' }]}>Contact Privacy Team</Text>
              <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#666' : '#999'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/terms')}>
              <Ionicons name="document-text-outline" size={22} color="#F59E0B" style={{ marginRight: 12 }} />
              <Text style={[styles.quickLinkText, { color: isDark ? '#fff' : '#000' }]}>Read Terms of Service</Text>
              <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#666' : '#999'} />
            </TouchableOpacity>
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
  metaContainer: { paddingVertical: 12, borderRadius: 26, borderWidth: 1, borderColor: '#eee', marginBottom: 16 },
  metaText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  section: { borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  sectionContent: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  quickLinks: { gap: 12, marginTop: 8 },
  quickLink: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  quickLinkText: { fontSize: 15, fontFamily: 'Inter_500Medium', flex: 1 },
});