/**
 * KYC Status Screen - View KYC verification status
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { apiGet } from '@/services/api';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader } from '@/components/ui';

export default function KYCStatusScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  // Realtime (Firestore listener) already resolved the admin toggle
  // `kycApproved: true` into user.kyc.status = 'verified' — trust it first so
  // the app flips to "KYC Approved" instantly, before the REST fetch returns.
  const storeApproved = user?.kyc?.status === 'verified' || (user?.kyc as any)?.approved === true;
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | 'rejected' | 'not_started'>(
    storeApproved ? 'verified' : 'not_started'
  );
  const [kycData, setKycData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ---- Approved hero animations (green tick pop + chips stagger) ----
  const tickScale = React.useState(() => new Animated.Value(0))[0];
  const tickRing = React.useState(() => new Animated.Value(0))[0];
  const heroFade = React.useState(() => new Animated.Value(0))[0];

  const loadKYCStatus = async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ kyc: any }>('/users/me/kyc');
      const k = res?.kyc || (res as any)?.data?.kyc || (res as any);
      const approvedNow = (res as any)?.kycApproved === true || k?.approved === true;
      setKycStatus(approvedNow ? 'verified' : ((k?.status || 'not_started') as any));
      setKycData(k && typeof k === 'object' ? k : null);
    } catch (e) {
      console.warn('[KYC Status] load failed:', e);
      setKycStatus(storeApproved ? 'verified' : 'not_started');
      setKycData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer data loading past first commit so no sync setState happens in the effect body
    void Promise.resolve().then(loadKYCStatus);
  }, []);

  // Store override can arrive any time (realtime toggle while screen is open)
  useEffect(() => {
    if (!storeApproved) return;
    void Promise.resolve().then(() => setKycStatus('verified'));
  }, [storeApproved]);

  const isApproved = kycStatus === 'verified';

  useEffect(() => {
    if (!isApproved) return;
    tickScale.setValue(0);
    tickRing.setValue(0);
    heroFade.setValue(0);
    Animated.sequence([
      Animated.spring(tickScale, { toValue: 1, damping: 9, stiffness: 180, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(heroFade, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(tickRing, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(tickRing, { toValue: 0, duration: 0, useNativeDriver: true }),
          ])
        ),
      ]),
    ]).start();
  }, [isApproved]);


  const getStatusConfig = () => {
    switch (kycStatus) {
      case 'verified':
        return {
          icon: 'checkmark-circle',
          color: Colors.semantic.success,
          bg: Colors.semantic.successSoft,
          title: 'Verified',
          subtitle: 'Your identity has been verified',
          actionLabel: 'View Details',
        };
      case 'pending':
        return {
          icon: 'time',
          color: Colors.semantic.warning,
          bg: Colors.semantic.warningSoft,
          title: 'Under Review',
          subtitle: 'We\'re reviewing your documents',
          actionLabel: 'Check Status',
        };
      case 'rejected':
        return {
          icon: 'close-circle',
          color: Colors.semantic.error,
          bg: Colors.semantic.errorSoft,
          title: 'Rejected',
          subtitle: 'Your verification was not approved',
          actionLabel: 'Resubmit',
        };
      default:
        return {
          icon: 'shield',
          color: Colors.text.secondary,
          bg: Colors.surface.tertiary,
          title: 'Not Started',
          subtitle: 'Verify your identity to unlock all features',
          actionLabel: 'Start Verification',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const handleAction = () => {
    if (kycStatus === 'not_started' || kycStatus === 'rejected') {
      router.push('/(screens)/kyc-documents');
    } else if (kycStatus === 'pending') {
      showToast('Your documents are under review. This usually takes 24-48 hours.', 'info');
    } else if (kycStatus === 'verified') {
      router.push('/(screens)/kyc-documents');
    }
  };

  const requirements = [
    { id: 'identity', label: 'Government ID', icon: 'card-outline', required: true },
    { id: 'selfie', label: 'Selfie Verification', icon: 'camera-outline', required: true },
    { id: 'address', label: 'Proof of Address', icon: 'location-outline', required: false },
    { id: 'phone', label: 'Phone Verification', icon: 'call-outline', required: true },
    { id: 'email', label: 'Email Verification', icon: 'mail-outline', required: true },
  ];

  const getRequirementStatus = (id: string) => {
    if (kycStatus === 'verified') return 'completed';
    if (kycStatus === 'pending') return 'submitted';
    if (kycStatus === 'rejected' && id === 'identity') return 'rejected';
    return 'pending';
  };

  const getRequirementIcon = (status: string) => {
    switch (status) {
      case 'completed': return { icon: 'checkmark-circle', color: Colors.semantic.success };
      case 'submitted': return { icon: 'time', color: Colors.semantic.warning };
      case 'rejected': return { icon: 'close-circle', color: Colors.semantic.error };
      default: return { icon: 'ellipse-outline', color: Colors.text.muted };
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="KYC Verification" subtitle="Identity checks" onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBadge}>
            <Ionicons name="shield-checkmark" size={30} color={Colors.brand.accent} />
          </View>
          <Text style={styles.loadingText}>Loading verification status...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="KYC Verification" subtitle="Identity checks" onBack={() => router.back()} />
        {isApproved ? (
          /* ================= KYC APPROVED HERO ================= */
          <View style={styles.approvedHero}>
            <View style={styles.tickWrap}>
              <Animated.View
                style={[
                  styles.tickRingOuter,
                  {
                    transform: [{ scale: tickRing.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
                    opacity: tickRing.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 0.2, 0] }),
                  },
                ]}
              />
              <Animated.View style={[styles.tickCircle, { transform: [{ scale: tickScale }] }]}>
                <Ionicons name="checkmark" size={56} color="#fff" />
              </Animated.View>
            </View>

            <Animated.View style={{ opacity: heroFade, alignItems: 'center', width: '100%' }}>
              <Text style={styles.approvedTitle}>KYC Approved</Text>
              <Text style={styles.approvedSub}>
                Your identity is verified — welcome to the trusted circle.
              </Text>

              <View style={styles.unlockedChipsRow}>
                {[
                  { icon: 'add-circle', label: 'Post tasks' },
                  { icon: 'briefcase', label: 'Apply to tasks' },
                  { icon: 'wallet', label: 'Wallet & top-up' },
                  { icon: 'shield-checkmark', label: 'Verified badge' },
                ].map((f) => (
                  <View key={f.label} style={styles.unlockedChip}>
                    <Ionicons name={f.icon as any} size={13} color={Colors.semantic.success} />
                    <Text style={styles.unlockedChipText}>{f.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.allUnlockedPill}>
                <Ionicons name="lock-open" size={13} color="#fff" />
                <Text style={styles.allUnlockedText}>All features unlocked</Text>
              </View>

              <TouchableOpacity
                style={styles.docsLink}
                onPress={() => router.push('/(screens)/kyc-documents')}
              >
                <Text style={styles.docsLinkText}>View documents</Text>
                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          /* ================= NORMAL STATUS CARD ================= */
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusIcon, { backgroundColor: statusConfig.bg }]}>
                <Ionicons name={statusConfig.icon as any} size={26} color={statusConfig.color} />
              </View>
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>{statusConfig.title}</Text>
                <Text style={styles.statusSubtitle}>{statusConfig.subtitle}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.statusAction, { backgroundColor: statusConfig.bg }]} onPress={handleAction}>
              <Text style={[styles.statusActionText, { color: statusConfig.color }]}>{statusConfig.actionLabel}</Text>
              <Ionicons name="chevron-forward" size={16} color={statusConfig.color} />
            </TouchableOpacity>
          </View>
        )}

        {/* Benefits (hidden once approved — no longer a sales pitch) */}
        {!isApproved && (
        <View style={[styles.section, { marginTop: Spacing[4] }]}>
          <Text style={styles.sectionTitle}>Why verify?</Text>
          <View style={styles.benefitsGrid}>
            {[
              { icon: 'shield-checkmark', title: 'Trust & Safety', desc: 'Build trust with other users', color: Colors.brand.accent, bg: Colors.brand.accentSoft },
              { icon: 'cash', title: 'Higher Limits', desc: 'Increase withdrawal limits', color: Colors.semantic.success, bg: Colors.semantic.successSoft },
              { icon: 'star', title: 'Priority Support', desc: 'Get faster customer support', color: Colors.semantic.warning, bg: Colors.semantic.warningSoft },
              { icon: 'lock-closed', title: 'Account Security', desc: 'Protect against fraud', color: Colors.brand.primary, bg: '#1E120912' },
            ].map((benefit) => (
              <View key={benefit.title} style={styles.benefitCard}>
                <View style={[styles.benefitIcon, { backgroundColor: benefit.bg }]}>
                  <Ionicons name={benefit.icon as any} size={20} color={benefit.color} />
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDesc}>{benefit.desc}</Text>
              </View>
            ))}
          </View>
        </View>
        )}

        {/* Requirements */}
        <View style={[styles.section, { marginTop: Spacing[4] }]}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {requirements.map((req, i) => {
            const status = getRequirementStatus(req.id);
            const { icon, color } = getRequirementIcon(status);
            return (
              <View key={req.id} style={[styles.requirementItem, i < requirements.length - 1 && styles.requirementDivider]}>
                <View style={[styles.requirementIcon, { backgroundColor: `${color}1A` }]}>
                  <Ionicons name={icon as any} size={17} color={color} />
                </View>
                <View style={styles.requirementInfo}>
                  <View style={styles.requirementHeader}>
                    <Text style={styles.requirementLabel}>{req.label}</Text>
                    {req.required ? <Text style={styles.requiredBadge}>Required</Text> : null}
                  </View>
                  <Text style={[styles.requirementStatus, { color }]}>
                    {status === 'completed' && 'Completed'}
                    {status === 'submitted' && 'Submitted - Under review'}
                    {status === 'rejected' && 'Rejected - Needs resubmission'}
                    {status === 'pending' && 'Not started'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={Colors.text.muted} />
              </View>
            );
          })}
        </View>

        {/* Info */}
        <View style={[styles.section, { marginTop: Spacing[4], marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Good to know</Text>
          <View style={styles.infoList}>
            {[
              'Your data is encrypted and stored securely',
              'We never share your documents with third parties',
              'Verification typically takes 24-48 hours',
              'You can update documents anytime from settings',
            ].map((info) => (
              <View key={info} style={styles.infoItem}>
                <View style={styles.infoDotWrap}>
                  <Ionicons name="information" size={11} color={Colors.brand.accent} />
                </View>
                <Text style={styles.infoText}>{info}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing[4] },
  loadingBadge: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', ...Shadows.card,
  },
  loadingText: { fontSize: 14, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  scrollContent: { paddingHorizontal: Spacing[5], paddingBottom: 40 },

  statusCard: {
    borderRadius: BorderRadius.lg, padding: Spacing[5],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4], marginBottom: Spacing[4] },
  statusIcon: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 20, fontFamily: Typography.fontFamily.display, color: Colors.text.primary },
  statusSubtitle: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 3 },
  statusAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: Spacing[3] + 2, borderRadius: BorderRadius.pill,
  },
  statusActionText: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold },

  section: {
    borderRadius: BorderRadius.lg, padding: Spacing[5],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  sectionTitle: { fontSize: 18, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, marginBottom: Spacing[4] },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing[3] },
  benefitCard: {
    width: '48.5%', padding: Spacing[4], borderRadius: BorderRadius.md, alignItems: 'center',
    backgroundColor: Colors.surface.primary, borderWidth: 1, borderColor: Colors.border.light,
  },
  benefitIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[2] },
  benefitTitle: { fontSize: 12.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, textAlign: 'center', marginBottom: 2 },
  benefitDesc: { fontSize: 10.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, textAlign: 'center', lineHeight: 14 },

  requirementItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[3] + 2 },
  requirementDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  requirementIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  requirementInfo: { flex: 1 },
  requirementHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: 2 },
  requirementLabel: { fontSize: 14, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary },
  requiredBadge: {
    fontSize: 9.5, fontFamily: Typography.fontFamily.bold, color: Colors.semantic.error,
    backgroundColor: Colors.semantic.errorSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.pill,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  requirementStatus: { fontSize: 12, fontFamily: Typography.fontFamily.body },

  infoList: { gap: Spacing[3] },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2] + 2 },
  infoDotWrap: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
  },
  infoText: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, lineHeight: 19, flex: 1 },

  // ---- KYC Approved hero ----
  approvedHero: {
    borderRadius: BorderRadius['2xl'], padding: Spacing[7], alignItems: 'center',
    backgroundColor: Colors.brand.primary, ...Shadows.button,
  },
  tickWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4] },
  tickRingOuter: {
    position: 'absolute', width: 104, height: 104, borderRadius: 52, backgroundColor: Colors.semantic.success,
  },
  tickCircle: {
    width: 104, height: 104, borderRadius: 52, backgroundColor: Colors.semantic.success,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.semantic.success, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35, shadowRadius: 24, elevation: 10,
  },
  approvedTitle: { fontSize: 26, fontFamily: Typography.fontFamily.display, color: '#FFFFFF', marginBottom: 6, textAlign: 'center' },
  approvedSub: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, textAlign: 'center', lineHeight: 20, marginBottom: Spacing[4], color: 'rgba(255,255,255,0.75)' },
  unlockedChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], justifyContent: 'center', marginBottom: Spacing[4] },
  unlockedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing[3], paddingVertical: 6,
    borderRadius: BorderRadius.pill, backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)',
  },
  unlockedChipText: { fontSize: 11, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },
  allUnlockedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.semantic.success, paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] + 1,
    borderRadius: BorderRadius.pill, marginBottom: Spacing[4],
  },
  allUnlockedText: { color: '#fff', fontSize: 12, fontFamily: Typography.fontFamily.bold },
  docsLink: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[5], paddingVertical: Spacing[2] + 2,
  },
  docsLinkText: { color: '#FFFFFF', fontSize: 13, fontFamily: Typography.fontFamily.semiBold },
});