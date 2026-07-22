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
import { useUIStore } from '@/store/uiStore';

export default function FAQScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  
  const isDark = theme === 'dark';
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
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>FAQ</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}>
          <Ionicons name="search-outline" size={22} color={isDark ? '#888' : '#999'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#fff' : '#000' }]}
            placeholder="Search questions..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-outline" size={22} color={isDark ? '#888' : '#999'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredFaqs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#000' }, { marginTop: 16 }]}>No results found</Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#888' : '#666' }, { marginTop: 8 }]}>Try different keywords or browse categories below</Text>
          </View>
        ) : (
          filteredFaqs.map((category, catIndex) => (
            <View key={catIndex} style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: catIndex === 0 ? 16 : 16 }]}>
              <Text style={[styles.categoryTitle, { color: isDark ? '#fff' : '#000' }]}>{category.category}</Text>
              <View style={styles.faqList}>
                {category.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.faqItem, { borderBottomWidth: itemIndex < category.items.length - 1 ? 1 : 0, borderBottomColor: '#eee' }]}
                    onPress={() => toggleExpand(item.id)}
                  >
                    <View style={styles.faqQuestionContainer}>
                      <Text style={[styles.faqQuestion, { color: isDark ? '#fff' : '#000' }]}>{item.question}</Text>
                      <Ionicons 
                        name={expandedItems.has(item.id) ? 'remove-outline' : 'add-outline'} 
                        size={24} 
                        color={isDark ? '#888' : '#666'}
                        style={styles.faqIcon}
                      />
                    </View>
                    {expandedItems.has(item.id) && (
                      <Text style={[styles.faqAnswer, { color: isDark ? '#ccc' : '#333' }, { marginTop: 12 }]}>{item.answer}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}

        {/* Still need help? */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.categoryTitle, { color: isDark ? '#fff' : '#000' }]}>Still need help?</Text>
          <Text style={[styles.helpDesc, { color: isDark ? '#888' : '#666' }, { marginBottom: 16 }]}>Can't find what you're looking for? Our support team is here to help.</Text>
          <TouchableOpacity style={styles.contactButton} onPress={() => router.push('/contact-support')}>
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  categoryTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  faqList: { gap: 0 },
  faqItem: { paddingVertical: 16 },
  faqQuestionContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 16, fontFamily: 'Inter_600SemiBold', flex: 1, paddingRight: 16 },
  faqIcon: { flexShrink: 0 },
  faqAnswer: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 32 },
  helpDesc: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  contactButton: { backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  contactButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});