/**
 * Community Guidelines Screen
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

export default function GuidelinesScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  
  const isDark = theme === 'dark';
  const lastUpdated = 'January 15, 2024';
  const version = '1.3';

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open link'));
  };

  const sections = [
    {
      id: 'purpose',
      title: 'Our Purpose',
      icon: 'heart-outline',
      color: '#EF4444',
      content: `LocalBuddy is a community built on trust, respect, and mutual help. These Community Guidelines exist to keep our platform safe, welcoming, and valuable for everyone—whether you're posting a task or lending a hand.

By using LocalBuddy, you agree to follow these guidelines. Violations may result in content removal, account restrictions, or permanent bans.`,
    },
    {
      id: 'safety-first',
      title: '1. Safety First',
      icon: 'shield-checkmark-outline',
      color: '#10B981',
      content: `Your safety is our top priority.

In-Person Meetings:
• Always meet in public, well-lit places for the first time
• Share your live location with a trusted contact via the app
• Use in-app chat until you're comfortable—don't share personal contact info prematurely
• Trust your instincts; if something feels off, leave and report it

Emergency Features:
• Use the in-app emergency button (shakes phone or holds power button) to alert contacts and 911
• Report safety incidents immediately via the task chat or Settings → Report Safety Issue
• We cooperate fully with law enforcement on safety matters

Prohibited:
• Tasks involving weapons, controlled substances, or illegal activities
• Requesting Buddies to enter unsafe environments (roofs, confined spaces, etc.)
• Any activity that puts physical safety at risk`,
    },
    {
      id: 'respect',
      title: '2. Respect & Inclusion',
      icon: 'people-outline',
      color: '#8B85FF',
      content: `Treat everyone with dignity and respect.

Zero Tolerance for:
• Hate speech, discrimination, or harassment based on race, ethnicity, national origin, religion, gender, gender identity, sexual orientation, disability, age, or veteran status
• Sexual harassment or unwanted advances
• Bullying, intimidation, or threats
• Doxxing or sharing private information without consent

Communication Standards:
• Be polite and professional in all messages
• Respond promptly to messages (within 2 hours during active tasks)
• No spam, solicitation, or off-platform communication requests before task acceptance
• Respect boundaries—"no" means no`,
    },
    {
      id: 'quality',
      title: '3. Quality & Reliability',
      icon: 'star-outline',
      color: '#F59E0B',
      content: `Our community thrives when everyone delivers on their commitments.

For Posters:
• Provide clear, accurate task descriptions with photos when helpful
• Set fair budgets reflecting time, skill, and materials
• Be available for questions and provide access as agreed
• Release payment promptly upon satisfactory completion
• Leave honest, constructive reviews

For Buddies:
• Only apply to tasks you're qualified and equipped to complete
• Arrive on time with necessary tools and materials
• Communicate proactively about delays or issues
• Complete work to the agreed standard
• Clean up after yourself

Reliability Metrics:
• On-time arrival rate
• Task completion rate
• Response time
• Review scores
• These affect your visibility and verification tier`,
    },
    {
      id: 'prohibited',
      title: '4. Prohibited Content & Activities',
      icon: 'close-circle-outline',
      color: '#EF4444',
      content: `The following are strictly prohibited on LocalBuddy:

Illegal Activities:
• Any task violating local, state, or federal law
• Unlicensed work requiring professional certification (electrical, plumbing, medical, legal, etc.)
• Tax evasion, cash-only arrangements to avoid reporting

Harmful Content:
• Violence, self-harm, or eating disorder promotion
• Adult content, sexual services, or explicit material
• Drug or alcohol-related tasks (except legal delivery in compliant jurisdictions)
• Gambling, betting, or pyramid schemes

Platform Abuse:
• Creating fake accounts or impersonating others
• Manipulating ratings, reviews, or verification
• Circumventing fees or payment systems
• Scraping, botting, or automated access
• Sharing account credentials

Intellectual Property:
• Posting content you don't own or have rights to
• Using LocalBuddy branding without permission`,
    },
    {
      id: 'payments',
      title: '5. Payments & Disputes',
      icon: 'card-outline',
      color: '#10B981',
      content: `Keep payments on the platform for your protection.

Rules:
• All payments must go through LocalBuddy's escrow system
• No cash, Venmo, Zelle, crypto, or off-platform payments
• No requesting deposits before task acceptance (escrow handles this)
• Tips are optional and processed through the app

Dispute Process:
1. Try to resolve directly via chat (document everything)
2. If unresolved, either party can open a dispute within 48 hours of completion
3. Our support team mediates; both sides provide evidence
4. Decision based on task description, messages, photos, and reviews
5. Appeals available within 7 days for new evidence

Prohibited:
• Threatening negative reviews for leverage
• False claims or fabricated evidence
• Chargebacks without using dispute process first`,
    },
    {
      id: 'privacy',
      title: '6. Privacy & Data',
      icon: 'lock-closed-outline',
      color: '#8B85FF',
      content: `Respect everyone's privacy.

• Don't share other users' personal info (address, phone, ID docs) outside the task
• Don't record audio/video without explicit consent
• Delete task-related photos and data after completion unless needed for disputes
• Report privacy violations immediately

We protect your data per our Privacy Policy. We never sell personal information.`,
    },
    {
      id: 'reporting',
      title: '7. Reporting & Enforcement',
      icon: 'flag-outline',
      color: '#F59E0B',
      content: `Help keep LocalBuddy safe by reporting violations.

How to Report:
• In-app: Task chat → ⋮ menu → Report User/Task
• Profile: User profile → ⋮ → Report
• Settings → Help → Report Safety Issue
• Email: safety@localbuddy.app (for urgent matters)

What Happens Next:
1. Our Trust & Safety team reviews within 24 hours (4 hours for safety emergencies)
2. You'll receive a confirmation and case number
3. We may request additional information
4. Actions taken: warning, content removal, temporary suspension, permanent ban
5. You'll be notified of the outcome (privacy laws may limit details)

Retaliation against reporters is prohibited and results in immediate ban.

False Reports:
Knowingly filing false reports is a violation and may result in account action.`,
    },
    {
      id: 'enforcement',
      title: '8. Enforcement Actions',
      icon: 'shield-outline',
      color: '#EF4444',
      content: `We enforce guidelines consistently and proportionally.

Action Levels:
• Warning: First minor violation; educational
• Content Removal: Violating content taken down
• Feature Restriction: Limited posting, messaging, or applying
• Temporary Suspension: 24 hours to 30 days
• Permanent Ban: Severe or repeated violations

Factors Considered:
• Severity and nature of violation
• History of prior violations
• Intent and pattern of behavior
• Impact on other users
• Cooperation with investigation

Appeals:
• Submit via Settings → Account → Appeal within 14 days
• Provide new evidence or context
• Decisions final after appeal review

Law Enforcement:
We comply with valid legal requests and report credible threats of violence.`,
    },
    {
      id: 'community',
      title: '9. Building a Great Community',
      icon: 'sparkles-outline',
      color: '#10B981',
      content: `Beyond rules, we encourage:

• Go the extra mile—small gestures build trust
• Leave detailed, helpful reviews for others
• Refer friends and neighbors to grow the community
• Share tips and best practices in community forums
• Participate in LocalBuddy events and meetups
• Suggest features via Settings → Feedback

Recognitions:
• Top-rated Buddies get "Community Champion" badge
• Helpful Posters earn "Great Client" status
• Referral rewards for bringing quality members
• Annual community awards`,
    },
    {
      id: 'changes',
      title: '10. Changes to Guidelines',
      icon: 'document-text-outline',
      color: '#8B85FF',
      content: `We may update these guidelines as our community evolves. Material changes will be announced via in-app notification and email. Continued use constitutes acceptance.

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
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Community Guidelines</Text>
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
            <View style={styles.sectionHeader}>
              <View style={[styles.iconBadge, { backgroundColor: `${section.color}20` }]}>
                <Ionicons name={section.icon as any} size={24} color={section.color} />
              </View>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>{section.title}</Text>
            </View>
            <Text style={[styles.sectionContent, { color: isDark ? '#ccc' : '#333' }]}>{section.content}</Text>
          </View>
        ))}

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Quick Actions</Text>
          <View style={styles.quickLinks}>
            <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/contact-support')}>
              <Ionicons name="chatbubble-outline" size={22} color="#8B85FF" style={{ marginRight: 12 }} />
              <Text style={[styles.quickLinkText, { color: isDark ? '#fff' : '#000' }]}>Contact Support</Text>
              <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#666' : '#999'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLink} onPress={() => handleOpenUrl('mailto:safety@localbuddy.app')}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#10B981" style={{ marginRight: 12 }} />
              <Text style={[styles.quickLinkText, { color: isDark ? '#fff' : '#000' }]}>Report Safety Issue</Text>
              <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#666' : '#999'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/terms')}>
              <Ionicons name="document-text-outline" size={22} color="#F59E0B" style={{ marginRight: 12 }} />
              <Text style={[styles.quickLinkText, { color: isDark ? '#fff' : '#000' }]}>Read Terms of Service</Text>
              <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#666' : '#999'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/privacy')}>
              <Ionicons name="lock-closed-outline" size={22} color="#6366F1" style={{ marginRight: 12 }} />
              <Text style={[styles.quickLinkText, { color: isDark ? '#fff' : '#000' }]}>Read Privacy Policy</Text>
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
  metaContainer: { paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 16 },
  metaText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  section: { borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#eee' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', flex: 1 },
  sectionContent: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  quickLinks: { gap: 12, marginTop: 8 },
  quickLink: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fafafa', borderRadius: 12 },
  quickLinkText: { fontSize: 15, fontFamily: 'Inter_500Medium', flex: 1 },
});