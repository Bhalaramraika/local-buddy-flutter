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
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader } from '@/components/ui';

export default function GuidelinesScreen() {
  const router = useRouter();

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
      icon: 'people',
      color: Colors.semantic.success,
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
      icon: 'lock-closed',
      color: Colors.semantic.info,
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
      icon: 'document-text',
      color: Colors.brand.primary,
      content: `We may update these guidelines as our community evolves. Material changes will be announced via in-app notification and email. Continued use constitutes acceptance.

Last updated: ${lastUpdated} | Version ${version}`,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Community guidelines" subtitle={`v${version} • Updated ${lastUpdated}`} onBack={() => router.back()} />

        {/* Meta Info */}
        <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380 }} style={styles.metaContainer}>
          <Ionicons name="people" size={13} color={Colors.text.muted} />
          <Text style={styles.metaText}>Last updated: {lastUpdated}</Text>
          <View style={styles.metaDot} />
          <Ionicons name="document-text-outline" size={13} color={Colors.text.muted} />
          <Text style={styles.metaText}>Version: {version}</Text>
        </MotiView>

        {/* Sections */}
        {sections.map((section, index) => (
          <MotiView
            key={section.id}
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 360, delay: Math.min(index, 8) * 40 }}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.iconBadge, { backgroundColor: `${section.color}1A` }]}>
                <Ionicons name={section.icon as any} size={18} color={section.color} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </MotiView>
        ))}

        {/* Quick Actions */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 250 }} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickLinks}>
            {[
              { label: 'Contact Support', icon: 'chatbubble' as const, color: Colors.brand.accent, bg: Colors.brand.accentSoft, onPress: () => router.push('/contact-support') },
              { label: 'Report Safety Issue', icon: 'shield-checkmark' as const, color: Colors.semantic.success, bg: Colors.semantic.successSoft, onPress: () => handleOpenUrl('mailto:safety@localbuddy.app') },
              { label: 'Read Terms of Service', icon: 'document-text' as const, color: Colors.semantic.warning, bg: Colors.semantic.warningSoft, onPress: () => router.push('/terms') },
              { label: 'Read Privacy Policy', icon: 'lock-closed' as const, color: Colors.brand.primary, bg: '#1E120912', onPress: () => router.push('/privacy') },
            ].map((item, i) => (
              <TouchableOpacity key={item.label} style={styles.quickLink} onPress={item.onPress}>
                <View style={[styles.quickLinkIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={17} color={item.color} />
                </View>
                <Text style={styles.quickLinkText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </MotiView>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { paddingHorizontal: Spacing[5], paddingBottom: 40 },
  metaContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2],
    paddingVertical: Spacing[3], borderRadius: BorderRadius.pill, marginBottom: Spacing[4],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.cardPressed,
  },
  metaText: { fontSize: 11.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.secondary },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.border.medium, marginHorizontal: 4 },
  section: {
    borderRadius: BorderRadius.lg, padding: Spacing[5], marginBottom: Spacing[4],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[3] },
  iconBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, flex: 1 },
  sectionContent: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, lineHeight: 22, color: Colors.text.secondary },
  quickLinks: { gap: Spacing[3] },
  quickLink: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingVertical: Spacing[3], paddingHorizontal: Spacing[3],
    backgroundColor: Colors.surface.primary, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border.light,
  },
  quickLinkIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  quickLinkText: { fontSize: 14, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary, flex: 1 },
});