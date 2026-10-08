/**
 * KYC Status Screen - View KYC verification status
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Image,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { apiGet } from '@/services/api';

export default function KYCStatusScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, showToast } = useUIStore();

  const isDark = theme === 'dark';
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
  const tickScale = useRef(new Animated.Value(0)).current;
  const tickRing = useRef(new Animated.Value(0)).current;
  const heroFade = useRef(new Animated.Value(0)).current;

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
    if (storeApproved) setKycStatus('verified');
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
          icon: 'check-circle-outline',
          color: '#10B981',
          bg: '#10B98115',
          title: 'Verified',
          subtitle: 'Your identity has been verified',
          actionLabel: 'View Details',
        };
      case 'pending':
        return {
          icon: 'time-outline',
          color: '#F59E0B',
          bg: '#F59E0B15',
          title: 'Under Review',
          subtitle: 'We\'re reviewing your documents',
          actionLabel: 'Check Status',
        };
      case 'rejected':
        return {
          icon: 'close-circle-outline',
          color: '#EF4444',
          bg: '#EF444415',
          title: 'Rejected',
          subtitle: 'Your verification was not approved',
          actionLabel: 'Resubmit',
        };
      default:
        return {
          icon: 'shield-outline',
          color: '#6B7280',
          bg: '#6B728015',
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
      case 'completed': return { icon: 'check-circle-outline', color: '#10B981' };
      case 'submitted': return { icon: 'time-outline', color: '#F59E0B' };
      case 'rejected': return { icon: 'close-circle-outline', color: '#EF4444' };
      default: return { icon: 'circle-outline', color: '#9CA3AF' };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>KYC Verification</Text>
            <View style={{ width: 44 }} />
          </View>
        </View>
        <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Ionicons name="refresh" size={32} color="#8B85FF" />
          <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>Loading verification status...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>KYC Verification</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isApproved ? (
          /* ================= KYC APPROVED HERO ================= */
          <View style={[styles.approvedHero, { backgroundColor: isDark ? '#14261C' : '#ECFDF5' }]}>
            <View style={styles.tickWrap}>
              <Animated.View
                style={[
                  styles.tickRingOuter,
                  {
                    transform: [
                      {
                        scale: tickRing.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }),
                      },
                    ],
                    opacity: tickRing.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 0.2, 0] }),
                  },
                ]}
              />
              <Animated.View style={[styles.tickCircle, { transform: [{ scale: tickScale }] }]}>
                <Ionicons name="checkmark" size={56} color="#fff" />
              </Animated.View>
            </View>

            <Animated.View style={{ opacity: heroFade, alignItems: 'center' }}>
              <Text style={styles.approvedTitle}>KYC Approved</Text>
              <Text style={[styles.approvedSub, { color: isDark ? '#9CE5B8' : '#047857' }]}>
                Your identity is verified — welcome to the trusted circle.
              </Text>

              <View style={styles.unlockedChipsRow}>
                {[
                  { icon: 'add-circle-outline', label: 'Post tasks' },
                  { icon: 'briefcase-outline', label: 'Apply to tasks' },
                  { icon: 'wallet-outline', label: 'Wallet & top-up' },
                  { icon: 'shield-checkmark-outline', label: 'Verified badge' },
                ].map((f) => (
                  <View key={f.label} style={[styles.unlockedChip, { backgroundColor: isDark ? '#1B3A2A' : '#fff' }]}>
                    <Ionicons name={f.icon as any} size={14} color="#10B981" />
                    <Text style={[styles.unlockedChipText, { color: isDark ? '#D1FAE5' : '#065F46' }]}>{f.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.allUnlockedPill}>
                <Ionicons name="lock-open-outline" size={14} color="#fff" />
                <Text style={styles.allUnlockedText}>All features unlocked</Text>
              </View>

              <TouchableOpacity
                style={[styles.statusAction, { backgroundColor: '#10B98115', marginTop: 20 }]}
                onPress={() => router.push('/(screens)/kyc-documents')}
              >
                <Text style={[styles.statusActionText, { color: '#10B981' }]}>View Documents</Text>
                <Ionicons name="chevron-forward-outline" size={20} color="#10B981" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          /* ================= NORMAL STATUS CARD ================= */
          <View style={[styles.statusCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusIcon, { backgroundColor: statusConfig.bg }]}>
                <Ionicons name={statusConfig.icon as any} size={28} color={statusConfig.color} />
              </View>
              <View style={styles.statusInfo}>
                <Text style={[styles.statusTitle, { color: isDark ? '#fff' : '#000' }]}>{statusConfig.title}</Text>
                <Text style={[styles.statusSubtitle, { color: isDark ? '#888' : '#666' }]}>{statusConfig.subtitle}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.statusAction, { backgroundColor: statusConfig.bg }]} onPress={handleAction}>
              <Text style={[styles.statusActionText, { color: statusConfig.color }]}>{statusConfig.actionLabel}</Text>
              <Ionicons name="chevron-forward-outline" size={20} color={statusConfig.color} />
            </TouchableOpacity>
          </View>
        )}

        {/* Benefits (hidden once approved — no longer a sales pitch) */}
        {!isApproved && (
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Why Verify?</Text>
          <View style={styles.benefitsGrid}>
            {[
              { icon: 'shield-checkmark-outline', title: 'Trust & Safety', desc: 'Build trust with other users' },
              { icon: 'cash-outline', title: 'Higher Limits', desc: 'Increase withdrawal limits' },
              { icon: 'star-outline', title: 'Priority Support', desc: 'Get faster customer support' },
              { icon: 'lock-closed-outline', title: 'Account Security', desc: 'Protect against fraud' },
            ].map((benefit) => (
              <View key={benefit.title} style={styles.benefitCard}>
                <View style={[styles.benefitIcon, { backgroundColor: '#8B85FF15' }]}>
                  <Ionicons name={benefit.icon as any} size={22} color="#8B85FF" />
                </View>
                <Text style={[styles.benefitTitle, { color: isDark ? '#fff' : '#000' }]}>{benefit.title}</Text>
                <Text style={[styles.benefitDesc, { color: isDark ? '#888' : '#666' }]}>{benefit.desc}</Text>
              </View>
            ))}
          </View>
        </View>
        )}

        {/* Requirements */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Requirements</Text>
          {requirements.map((req) => {
            const status = getRequirementStatus(req.id);
            const { icon, color } = getRequirementIcon(status);
            return (
              <View key={req.id} style={styles.requirementItem}>
                <View style={[styles.requirementIcon, { backgroundColor: `${color}15` }]}>
                  <Ionicons name={icon as any} size={20} color={color} />
                </View>
                <View style={styles.requirementInfo}>
                  <View style={styles.requirementHeader}>
                    <Text style={[styles.requirementLabel, { color: isDark ? '#fff' : '#000' }]}>{req.label}</Text>
                    {req.required && <Text style={styles.requiredBadge}>Required</Text>}
                  </View>
                  <Text style={[styles.requirementStatus, { color }]}>
                    {status === 'completed' && 'Completed'}
                    {status === 'submitted' && 'Submitted - Under Review'}
                    {status === 'rejected' && 'Rejected - Needs Resubmission'}
                    {status === 'pending' && 'Not Started'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#555' : '#999'} />
              </View>
            );
          })}
        </View>

        {/* Info */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16, marginBottom: 40 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Information</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle-outline" size={20} color="#8B85FF" style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: isDark ? '#ddd' : '#444' }]}>Your data is encrypted and stored securely</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle-outline" size={20} color="#8B85FF" style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: isDark ? '#ddd' : '#444' }]}>We never share your documents with third parties</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle-outline" size={20} color="#8B85FF" style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: isDark ? '#ddd' : '#444' }]}>Verification typically takes 24-48 hours</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle-outline" size={20} color="#8B85FF" style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: isDark ? '#ddd' : '#444' }]}>You can update documents anytime from settings</Text>
            </View>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter_400Regular', marginTop: 12 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  statusCard: { borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#eee' },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  statusIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statusSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 4 },
  statusAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10 },
  statusActionText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  section: { borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  benefitCard: { flex: 1, minWidth: '45%', maxWidth: '50%', padding: 16, borderRadius: 32, backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#eee' },
  benefitIcon: { width: 44, height: 44, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  benefitTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginBottom: 4 },
  benefitDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  requirementItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  requirementIcon: { width: 40, height: 40, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  requirementInfo: { flex: 1 },
  requirementHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  requirementLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  requiredBadge: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#EF4444', backgroundColor: '#EF444415', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  requirementStatus: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  infoList: { gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIcon: { marginTop: 2 },
  infoText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, flex: 1 },
  // ---- KYC Approved hero ----
  approvedHero: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B98130',
  },
  tickWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  tickRingOuter: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#10B981',
  },
  tickCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  approvedTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#10B981', marginBottom: 6, textAlign: 'center' },
  approvedSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  unlockedChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 },
  unlockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#10B98130',
  },
  unlockedChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  allUnlockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  allUnlockedText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
});