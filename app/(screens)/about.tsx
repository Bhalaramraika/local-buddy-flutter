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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader } from '@/components/ui';

export default function AboutScreen() {
  const router = useRouter();
  const appVersion = '1.0.0';
  const buildNumber = '100';

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open link'));
  };

  const FEATURES = [
    { icon: 'shield-checkmark', title: 'Verified Buddies', desc: 'KYC verification for all service providers' },
    { icon: 'card', title: 'Secure Payments', desc: 'Escrow protection for every transaction' },
    { icon: 'chatbubbles', title: 'In-App Chat', desc: 'Communicate directly with your buddy' },
    { icon: 'location', title: 'Local Focus', desc: 'Find help in your neighborhood' },
    { icon: 'star', title: 'Ratings & Reviews', desc: 'Transparent feedback system' },
    { icon: 'gift', title: 'Referral Rewards', desc: 'Earn credits by inviting friends' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="About" subtitle="LocalBuddy — local help, real trust" onBack={() => router.back()} />

        {/* App Logo & Info hero */}
        <MotiView
          from={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 440 }}
          style={styles.heroCard}
        >
          <View style={styles.logo}>
            <Ionicons name="people" size={36} color="#fff" />
          </View>
          <Text style={styles.appName}>LocalBuddy</Text>
          <Text style={styles.appTagline}>Your local task marketplace</Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>v{appVersion} · Build {buildNumber}</Text>
          </View>
        </MotiView>

        {/* Description */}
        <MotableSection index={1} title="About LocalBuddy">
          <Text style={styles.descriptionText}>
            LocalBuddy connects you with trusted local buddies for everyday tasks and errands.
            Whether you need help with grocery shopping, home repairs, tech assistance, or any other task,
            find reliable help in your neighborhood.
          </Text>
          <Text style={[styles.descriptionText, { marginTop: Spacing[3] }]}>
            Our mission is to build stronger communities by making it easy to give and receive help locally.
            Every buddy is verified through our KYC process, and all transactions are protected by our secure escrow system.
          </Text>
        </MotableSection>

        {/* Features */}
        <MotableSection index={2} title="Key features">
          <View style={styles.featuresList}>
            {FEATURES.map((feature) => (
              <View key={feature.title} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={19} color={Colors.brand.accent} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </MotableSection>

        {/* Legal Links */}
        <MotableSection index={3} title="Legal & policies">
          <View style={styles.legalLinks}>
            <LegalLinkItem icon="document-text" title="Terms of Service" onPress={() => router.push('/terms')} />
            <LegalLinkItem icon="shield" title="Privacy Policy" onPress={() => router.push('/privacy')} />
            <LegalLinkItem icon="people" title="Community Guidelines" onPress={() => router.push('/guidelines')} />
            <LegalLinkItem icon="logo-github" title="Open Source Licenses" onPress={() => handleOpenUrl('https://github.com/localbuddy/licenses')} last />
          </View>
        </MotableSection>

        {/* Contact */}
        <MotableSection index={4} title="Contact us">
          <View style={styles.legalLinks}>
            <ContactLinkItem icon="mail" title="Email Support" value="support@localbuddy.app" onPress={() => handleOpenUrl('mailto:support@localbuddy.app')} />
            <ContactLinkItem icon="globe" title="Website" value="localbuddy.app" onPress={() => handleOpenUrl('https://localbuddy.app')} />
            <ContactLinkItem icon="logo-twitter" title="Twitter" value="@LocalBuddyApp" onPress={() => handleOpenUrl('https://twitter.com/LocalBuddyApp')} last />
          </View>
        </MotableSection>

        {/* Copyright */}
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>© 2024 LocalBuddy. All rights reserved.</Text>
          <Text style={[styles.copyrightText, { marginTop: 4 }]}>Made with ❤️ for local communities</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function MotableSection({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 420, delay: index * 90 }}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </MotiView>
  );
}

const LegalLinkItem = ({ icon, title, onPress, last }: any) => (
  <TouchableOpacity style={[styles.linkItem, last && { borderBottomWidth: 0 }]} onPress={onPress}>
    <View style={styles.linkIcon}>
      <Ionicons name={icon} size={18} color={Colors.brand.accent} />
    </View>
    <Text style={styles.linkTitle}>{title}</Text>
    <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
  </TouchableOpacity>
);

const ContactLinkItem = ({ icon, title, value, onPress, last }: any) => (
  <TouchableOpacity style={[styles.linkItem, last && { borderBottomWidth: 0 }]} onPress={onPress}>
    <View style={styles.linkIcon}>
      <Ionicons name={icon} size={18} color={Colors.brand.accent} />
    </View>
    <View style={styles.linkContent}>
      <Text style={styles.linkTitle}>{title}</Text>
      <Text style={styles.linkValue}>{value}</Text>
    </View>
    <Ionicons name="open-outline" size={16} color={Colors.text.muted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { paddingHorizontal: Spacing[5], paddingBottom: 40 },

  heroCard: {
    alignItems: 'center', paddingVertical: Spacing[8], marginBottom: Spacing[4],
    backgroundColor: Colors.brand.primary, borderRadius: BorderRadius['2xl'],
    ...Shadows.button,
  },
  logo: {
    width: 84, height: 84, borderRadius: 26, backgroundColor: Colors.brand.accent,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[4], ...Shadows.buttonOrange,
  },
  appName: { fontSize: 30, fontFamily: Typography.fontFamily.display, color: '#FFFFFF' },
  appTagline: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  versionPill: {
    marginTop: Spacing[4], backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: BorderRadius.pill, paddingHorizontal: Spacing[4], paddingVertical: 5,
  },
  versionText: { fontSize: 11.5, fontFamily: Typography.fontFamily.medium, color: 'rgba(255,255,255,0.9)' },

  section: {
    borderRadius: BorderRadius.lg, padding: Spacing[5], marginBottom: Spacing[4],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  sectionTitle: { fontSize: 18, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, marginBottom: Spacing[4] },
  descriptionText: { fontSize: 14, fontFamily: Typography.fontFamily.body, lineHeight: 22, color: Colors.text.secondary },

  featuresList: { gap: Spacing[4] },
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  featureIcon: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing[3], backgroundColor: Colors.brand.accentSoft,
  },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginBottom: 2 },
  featureDesc: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },

  legalLinks: {},
  linkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[3] + 2, borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  linkIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing[3],
  },
  linkTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary, flex: 1 },
  linkContent: { flex: 1 },
  linkValue: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },

  copyrightContainer: { alignItems: 'center', paddingTop: Spacing[6], paddingBottom: Spacing[2] },
  copyrightText: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, textAlign: 'center' },
});