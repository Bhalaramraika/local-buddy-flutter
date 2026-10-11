/**
 * FAQ Screen - Frequently Asked Questions
 */

import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader, SoftButton } from '@/components/ui';

export default function FAQScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  const faqs = [
    {
      category: 'Getting Started',
      items: [
        {
          id: 'faq-1',
          question: 'How do I create an account?',
          answer: 'Download the LocalBuddy app, tap "Sign Up", and follow the prompts. You can sign up with your email, phone number, or social accounts (Google, Apple). After verifying your email/phone, you\'ll be ready to start posting tasks or offering help.',
        },
        {
          id: 'faq-2',
          question: 'What is a "Buddy"?',
          answer: 'A Buddy is a verified local community member who offers help with tasks. All Buddies go through our KYC (Know Your Customer) verification process, which includes identity verification and background checks for certain task categories.',
        },
        {
          id: 'faq-3',
          question: 'How do I post a task?',
          answer: 'Tap the "+" button on the home screen or go to the Tasks tab and tap "Create Task". Fill in the task details: title, description, category, location, budget, and preferred time. Once posted, nearby Buddies can apply to help you.',
        },
        {
          id: 'faq-4',
          question: 'Can I use LocalBuddy in any city?',
          answer: 'LocalBuddy is currently available in major metropolitan areas. Check the app\'s location settings to see if your city is supported. We\'re expanding rapidly - enable notifications to get updates when we launch in your area.',
        },
      ],
    },
    {
      category: 'Tasks & Payments',
      items: [
        {
          id: 'faq-5',
          question: 'How does payment work?',
          answer: 'When you post a task, the budget is held in escrow. Once the Buddy completes the task and you confirm satisfaction, the funds are released to the Buddy. If there\'s a dispute, our support team mediates. Payments are processed securely through our payment partners.',
        },
        {
          id: 'faq-6',
          question: 'What payment methods are accepted?',
          answer: 'We accept major credit/debit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and bank transfers. You can also use your LocalBuddy wallet balance, which can be topped up via any of these methods.',
        },
        {
          id: 'faq-7',
          question: 'Can I cancel a task?',
          answer: 'Yes, you can cancel a task before a Buddy accepts it. If a Buddy has already accepted, you can request cancellation - both parties must agree. If the Buddy has started work, cancellation may involve partial payment based on work completed.',
        },
        {
          id: 'faq-8',
          question: 'What if I\'m not satisfied with the work?',
          answer: 'You have 24 hours after task completion to raise a dispute. Our support team will review the task details, chat history, and any evidence (photos, receipts) to make a fair decision. Funds remain in escrow during dispute resolution.',
        },
        {
          id: 'faq-9',
          question: 'Are there any fees?',
          answer: 'LocalBuddy charges a 10% service fee on completed tasks (minimum $1). This covers platform maintenance, payment processing, insurance, and support. There are no fees for posting tasks or browsing.',
        },
      ],
    },
    {
      category: 'Safety & Verification',
      items: [
        {
          id: 'faq-10',
          question: 'How does KYC verification work?',
          answer: 'Buddies must submit a government-issued ID and a selfie for facial recognition. For certain categories (childcare, elderly care, home access), we also run background checks. Verified Buddies get a badge on their profile.',
        },
        {
          id: 'faq-11',
          question: 'Is my personal information safe?',
          answer: 'Yes. We use bank-level encryption (AES-256) for data at rest and TLS 1.3 for data in transit. We never sell your data. See our Privacy Policy for full details on data collection and usage.',
        },
        {
          id: 'faq-12',
          question: 'What safety features exist for in-person meetings?',
          answer: 'We offer: real-time location sharing with trusted contacts, in-app emergency button, verified profiles with ratings, secure in-app chat (no need to share phone numbers), and task completion confirmation with photos.',
        },
        {
          id: 'faq-13',
          question: 'How do I report a problem or unsafe behavior?',
          answer: 'Use the "Report" button on any user profile, task, or chat. For emergencies, use the SOS button in the app (shares location with emergency contacts and local authorities). Our safety team reviews reports within 2 hours.',
        },
      ],
    },
    {
      category: 'Account & Wallet',
      items: [
        {
          id: 'faq-14',
          question: 'How do I withdraw earnings?',
          answer: 'Go to Wallet → Withdraw. Minimum withdrawal is $10. Funds typically arrive in 1-3 business days for bank transfers, instantly for eligible debit cards. First withdrawal requires identity verification.',
        },
        {
          id: 'faq-15',
          question: 'What is the referral program?',
          answer: 'Invite friends with your unique referral code. When they complete their first task (as poster or Buddy), you both get $10 credit. There\'s no limit on referrals. Track your referrals in the Referral section.',
        },
        {
          id: 'faq-16',
          question: 'How do I delete my account?',
          answer: 'Go to Settings → Account → Delete Account. This is irreversible - all your data, tasks, messages, and wallet balance will be permanently deleted. You must withdraw any remaining balance first.',
        },
        {
          id: 'faq-17',
          question: 'Can I have multiple accounts?',
          answer: 'No, each person is limited to one account. Multiple accounts violate our Terms of Service and may result in all accounts being suspended. If you need to switch roles (poster ↔ Buddy), you can do so within your single account.',
        },
      ],
    },
    {
      category: 'Technical Issues',
      items: [
        {
          id: 'faq-18',
          question: 'The app is crashing/freezing. What should I do?',
          answer: 'Try: 1) Force close and reopen the app, 2) Check for updates in the App Store/Play Store, 3) Restart your phone, 4) Reinstall the app (your data is saved in the cloud). If issues persist, contact support with your device model and OS version.',
        },
        {
          id: 'faq-19',
          question: 'I\'m not receiving notifications.',
          answer: 'Check: 1) App notification settings (Settings → Notifications), 2) Phone system settings allow LocalBuddy notifications, 3) You\'re not in Do Not Disturb mode, 4) Background app refresh is enabled. If still not working, log out and back in.',
        },
        {
          id: 'faq-20',
          question: 'How do I change my language/region?',
          answer: 'Go to Settings → Language & Region. Select your preferred language (12 supported) and region. The app will restart to apply changes. Date, time, currency, and number formats update automatically based on region.',
        },
      ],
    },
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.items.length > 0);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="FAQ"
        subtitle="Answers to common questions"
        onBack={() => router.back()}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.text.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search questions..."
            placeholderTextColor={Colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.text.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredFaqs.length === 0 ? (
          <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 400 }} style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="search" size={30} color={Colors.brand.accent} />
            </View>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyDesc}>Try different keywords or browse categories below</Text>
          </MotiView>
        ) : (
          filteredFaqs.map((category, catIndex) => (
            <MotiView
              key={catIndex}
              from={{ opacity: 0, translateY: 14 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 380, delay: catIndex * 70 }}
              style={styles.section}
            >
              <View style={styles.categoryHeaderRow}>
                <View style={styles.categoryIconWrap}>
                  <Ionicons
                    name={
                      catIndex === 0 ? 'rocket' : catIndex === 1 ? 'card' : catIndex === 2 ? 'shield-checkmark' : catIndex === 3 ? 'wallet' : 'build'
                    }
                    size={14}
                    color={Colors.brand.accent}
                  />
                </View>
                <Text style={styles.categoryTitle}>{category.category}</Text>
              </View>
              <View style={styles.faqList}>
                {category.items.map((item, itemIndex) => {
                  const expanded = expandedItems.has(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.faqItem, itemIndex < category.items.length - 1 && styles.faqItemDivider, expanded && styles.faqItemExpanded]}
                      onPress={() => toggleExpand(item.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.faqQuestionContainer}>
                        <View style={[styles.faqQIcon, expanded && styles.faqQIconActive]}>
                          <Text style={styles.faqQMark}>?</Text>
                        </View>
                        <Text style={[styles.faqQuestion, expanded && { color: Colors.brand.accentPressed }]}>{item.question}</Text>
                        <View style={[styles.faqChevron, expanded && styles.faqChevronActive]}>
                          <Ionicons
                            name={expanded ? 'remove' : 'add'}
                            size={16}
                            color={expanded ? '#FFFFFF' : Colors.brand.accent}
                          />
                        </View>
                      </View>
                      {expanded ? (
                        <Text style={styles.faqAnswer}>{item.answer}</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </MotiView>
          ))
        )}

        {/* Still need help? */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 350 }} style={styles.stillHelpCard}>
          <View style={styles.stillHelpIconWrap}>
            <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
          </View>
          <Text style={styles.stillHelpTitle}>Still need help?</Text>
          <Text style={styles.helpDesc}>Can&apos;t find what you&apos;re looking for? Our support team is here to help.</Text>
          <SoftButton label="Contact support" variant="accent" size="md" icon="mail" onPress={() => router.push('/contact-support')} style={{ marginTop: Spacing[4], paddingHorizontal: Spacing[7] }} fullWidth={false} withGlow />
        </MotiView>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  searchContainer: { paddingHorizontal: Spacing[5], paddingBottom: Spacing[3] },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[4], height: 50, borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },
  searchIcon: { marginRight: Spacing[2] },
  searchInput: { flex: 1, fontSize: 14.5, fontFamily: Typography.fontFamily.body, color: Colors.text.primary },
  scrollContent: { paddingHorizontal: Spacing[5], paddingBottom: 40, paddingTop: Spacing[1] },
  section: {
    borderRadius: BorderRadius.lg, padding: Spacing[4], marginTop: Spacing[4],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  categoryHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[3] },
  categoryIconWrap: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryTitle: { fontSize: 16.5, fontFamily: Typography.fontFamily.display, color: Colors.text.primary },
  faqList: {},
  faqItem: { paddingVertical: Spacing[3] + 2, borderRadius: BorderRadius.sm, paddingHorizontal: 2 },
  faqItemDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  faqItemExpanded: { backgroundColor: Colors.surface.primary, paddingHorizontal: Spacing[3], borderRadius: BorderRadius.md, marginHorizontal: -8 },
  faqQuestionContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  faqQIcon: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.surface.tertiary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  faqQIconActive: { backgroundColor: Colors.brand.accentSoft },
  faqQMark: { fontSize: 12, fontFamily: Typography.fontFamily.bold, color: Colors.brand.accentPressed },
  faqQuestion: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, flex: 1 },
  faqChevron: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  faqChevronActive: { backgroundColor: Colors.brand.accent },
  faqIcon: { flexShrink: 0 },
  faqAnswer: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, lineHeight: 21, color: Colors.text.secondary, marginTop: Spacing[3], marginLeft: 38 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing[12] },
  emptyIconWrap: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3],
  },
  emptyTitle: { fontSize: 16.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  emptyDesc: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, textAlign: 'center', paddingHorizontal: Spacing[8], marginTop: 4 },
  stillHelpCard: {
    borderRadius: BorderRadius.lg, padding: Spacing[6], marginTop: Spacing[4], alignItems: 'center',
    backgroundColor: Colors.brand.primary, ...Shadows.button,
  },
  stillHelpIconWrap: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3],
  },
  stillHelpTitle: { fontSize: 17, fontFamily: Typography.fontFamily.display, color: '#FFFFFF' },
  helpDesc: { fontSize: 13, fontFamily: Typography.fontFamily.body, lineHeight: 20, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 6 },
});