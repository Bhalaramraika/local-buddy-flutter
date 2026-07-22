/**
 * About Screen - App information and version
 */

import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Image,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';

export default function AboutScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  
  const isDark = theme === 'dark';
  const appVersion = '1.0.0';
  const buildNumber = '100';

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open link'));
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>About</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Logo & Info */}
        <View style={styles.appInfoSection}>
          <View style={styles.logoContainer}>
            <View style={[styles.logo, { backgroundColor: '#4F46E5' }]}>
              <Ionicons name="people-outline" size={48} color="#fff" />
            </View>
          </View>
          <Text style={[styles.appName, { color: isDark ? '#fff' : '#000' }]}>LocalBuddy</Text>
          <Text style={[styles.appTagline, { color: isDark ? '#888' : '#666' }]}>Your Local Task Marketplace</Text>
          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, { color: isDark ? '#888' : '#666' }]}>Version {appVersion}</Text>
            <Text style={[styles.versionText, { color: isDark ? '#666' : '#999' }]}>Build {buildNumber}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>About LocalBuddy</Text>
          <Text style={[styles.descriptionText, { color: isDark ? '#ccc' : '#333' }]}>
            LocalBuddy connects you with trusted local buddies for everyday tasks and errands. 
            Whether you need help with grocery shopping, home repairs, tech assistance, or any other task, 
            find reliable help in your neighborhood.
          </Text>
          <Text style={[styles.descriptionText, { color: isDark ? '#ccc' : '#333', marginTop: 12 }]}>
            Our mission is to build stronger communities by making it easy to give and receive help locally. 
            Every buddy is verified through our KYC process, and all transactions are protected by our secure escrow system.
          </Text>
        </View>

        {/* Features */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Key Features</Text>
          <View style={styles.featuresList}>
            {[
              { icon: 'shield-checkmark-outline', title: 'Verified Buddies', desc: 'KYC verification for all service providers' },
              { icon: 'card-outline', title: 'Secure Payments', desc: 'Escrow protection for every transaction' },
              { icon: 'chatbubbles-outline', title: 'In-App Chat', desc: 'Communicate directly with your buddy' },
              { icon: 'location-outline', title: 'Local Focus', desc: 'Find help in your neighborhood' },
              { icon: 'star-outline', title: 'Ratings & Reviews', desc: 'Transparent feedback system' },
              { icon: 'gift-outline', title: 'Referral Rewards', desc: 'Earn credits by inviting friends' },
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#4F46E515' }]}>
                  <Ionicons name={feature.icon} size={24} color="#4F46E5" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: isDark ? '#fff' : '#000' }]}>{feature.title}</Text>
                  <Text style={[styles.featureDesc, { color: isDark ? '#888' : '#666' }]}>{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Legal Links */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Legal & Policies</Text>
          <View style={styles.legalLinks}>
            <LegalLinkItem 
              icon="document-text-outline" 
              title="Terms of Service" 
              onPress={() => router.push('/terms')} 
              isDark={isDark} 
            />
            <LegalLinkItem 
              icon="shield-outline" 
              title="Privacy Policy" 
              onPress={() => router.push('/privacy')} 
              isDark={isDark} 
            />
            <LegalLinkItem 
              icon="people-outline" 
              title="Community Guidelines" 
              onPress={() => router.push('/guidelines')} 
              isDark={isDark} 
            />
            <LegalLinkItem 
              icon="logo-github" 
              title="Open Source Licenses" 
              onPress={() => handleOpenUrl('https://github.com/localbuddy/licenses')} 
              isDark={isDark} 
            />
          </View>
        </View>

        {/* Contact */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Contact Us</Text>
          <View style={styles.contactLinks}>
            <ContactLinkItem 
              icon="mail-outline" 
              title="Email Support" 
              value="support@localbuddy.app"
              onPress={() => handleOpenUrl('mailto:support@localbuddy.app')}
              isDark={isDark} 
            />
            <ContactLinkItem 
              icon="globe-outline" 
              title="Website" 
              value="localbuddy.app"
              onPress={() => handleOpenUrl('https://localbuddy.app')}
              isDark={isDark} 
            />
            <ContactLinkItem 
              icon="logo-twitter" 
              title="Twitter" 
              value="@LocalBuddyApp"
              onPress={() => handleOpenUrl('https://twitter.com/LocalBuddyApp')}
              isDark={isDark} 
            />
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightContainer}>
          <Text style={[styles.copyrightText, { color: isDark ? '#666' : '#999' }]}>
            © 2024 LocalBuddy. All rights reserved.
          </Text>
          <Text style={[styles.copyrightText, { color: isDark ? '#666' : '#999', marginTop: 4 }]}>
            Made with ❤️ for local communities
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const LegalLinkItem = ({ icon, title, onPress, isDark }: any) => (
  <TouchableOpacity style={styles.legalLinkItem} onPress={onPress}>
    <View style={[styles.legalLinkIcon, { backgroundColor: '#4F46E515' }]}>
      <Ionicons name={icon} size={22} color="#4F46E5" />
    </View>
    <Text style={[styles.legalLinkTitle, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
    <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#666' : '#999'} />
  </TouchableOpacity>
);

const ContactLinkItem = ({ icon, title, value, onPress, isDark }: any) => (
  <TouchableOpacity style={styles.contactLinkItem} onPress={onPress}>
    <View style={[styles.contactLinkIcon, { backgroundColor: '#4F46E515' }]}>
      <Ionicons name={icon} size={22} color="#4F46E5" />
    </View>
    <View style={styles.contactLinkContent}>
      <Text style={[styles.contactLinkTitle, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
      <Text style={[styles.contactLinkValue, { color: isDark ? '#888' : '#666' }]}>{value}</Text>
    </View>
    <Ionicons name="open-outline" size={20} color={isDark ? '#666' : '#999'} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  appInfoSection: { alignItems: 'center', paddingVertical: 24 },
  logoContainer: { marginBottom: 16 },
  logo: { width: 96, height: 96, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  appName: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  appTagline: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  versionContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  versionText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  descriptionText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  featuresList: { gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  featureIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  featureDesc: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  legalLinks: { gap: 8 },
  legalLinkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  legalLinkIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  legalLinkTitle: { fontSize: 16, fontFamily: 'Inter_500Medium', flex: 1 },
  contactLinks: { gap: 8 },
  contactLinkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  contactLinkIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  contactLinkContent: { flex: 1 },
  contactLinkTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  contactLinkValue: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  copyrightContainer: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  copyrightText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});