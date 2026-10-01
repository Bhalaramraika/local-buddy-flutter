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
  Image,
  Alert,
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
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | 'rejected' | 'not_started'>('not_started');
  const [kycData, setKycData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadKYCStatus = async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ kyc: any }>('/users/me/kyc');
      const k = res?.kyc || (res as any)?.data?.kyc || (res as any);
      setKycStatus((k?.status || 'not_started') as any);
      setKycData(k && typeof k === 'object' ? k : null);
    } catch (e) {
      console.warn('[KYC Status] load failed:', e);
      setKycStatus('not_started' as any);
      setKycData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer data loading past first commit so no sync setState happens in the effect body
    void Promise.resolve().then(loadKYCStatus);
  }, []);


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
          <Ionicons name="refresh" size={32} color="#4F46E5" />
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
        {/* Status Card */}
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

        {/* Benefits */}
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
                <View style={[styles.benefitIcon, { backgroundColor: '#4F46E515' }]}>
                  <Ionicons name={benefit.icon as any} size={22} color="#4F46E5" />
                </View>
                <Text style={[styles.benefitTitle, { color: isDark ? '#fff' : '#000' }]}>{benefit.title}</Text>
                <Text style={[styles.benefitDesc, { color: isDark ? '#888' : '#666' }]}>{benefit.desc}</Text>
              </View>
            ))}
          </View>
        </View>

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
              <Ionicons name="information-circle-outline" size={20} color="#4F46E5" style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: isDark ? '#ddd' : '#444' }]}>Your data is encrypted and stored securely</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle-outline" size={20} color="#4F46E5" style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: isDark ? '#ddd' : '#444' }]}>We never share your documents with third parties</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle-outline" size={20} color="#4F46E5" style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: isDark ? '#ddd' : '#444' }]}>Verification typically takes 24-48 hours</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle-outline" size={20} color="#4F46E5" style={styles.infoIcon} />
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
  statusCard: { borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#eee' },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  statusIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statusSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 4 },
  statusAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10 },
  statusActionText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  section: { borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  benefitCard: { flex: 1, minWidth: '45%', maxWidth: '50%', padding: 16, borderRadius: 12, backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#eee' },
  benefitIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  benefitTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginBottom: 4 },
  benefitDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  requirementItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  requirementIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  requirementInfo: { flex: 1 },
  requirementHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  requirementLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  requiredBadge: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#EF4444', backgroundColor: '#EF444415', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  requirementStatus: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  infoList: { gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIcon: { marginTop: 2 },
  infoText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, flex: 1 },
});