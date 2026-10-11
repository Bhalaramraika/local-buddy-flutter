/**
 * Location Sharing Screen - Manage location sharing preferences and active shares
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useUIStore } from '@/store/uiStore';
import { apiGet } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader, SoftButton } from '@/components/ui';

interface LocationShare {
  id: string;
  name: string;
  avatar: string;
  relationship: string;
  sharingSince: string;
  expiresAt: string | null;
  isActive: boolean;
  permissions: ('location' | 'battery' | 'movement')[];
}

const SettingSection = ({ title, children }: any) => (
  <MotiView
    from={{ opacity: 0, translateY: 12 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 380 }}
    style={{ marginHorizontal: Spacing[5], marginTop: Spacing[4] }}
  >
    <Text style={{
      fontSize: 11.5, fontFamily: Typography.fontFamily.bold, color: Colors.brand.accentPressed,
      letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: Spacing[2], marginLeft: 4,
    }}>{title}</Text>
    <View style={{
      borderRadius: BorderRadius.lg, backgroundColor: Colors.surface.elevated,
      borderWidth: 1, borderColor: Colors.border.light, overflow: 'hidden', ...Shadows.card,
    }}>
      {children}
    </View>
  </MotiView>
);

const SettingItem = ({ title, subtitle, children, onPress, showArrow = true }: any) => (
  <TouchableOpacity
    style={{
      paddingVertical: Spacing[3] + 2, paddingHorizontal: Spacing[4],
      borderBottomWidth: 1, borderBottomColor: Colors.border.light,
      flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    }}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary }}>{title}</Text>
      {subtitle ? <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 2 }}>{subtitle}</Text> : null}
    </View>
    {children}
    {showArrow ? <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} /> : null}
  </TouchableOpacity>
);

const SettingToggle = ({ title, subtitle, value, onValueChange }: any) => (
  <View style={{
    paddingVertical: Spacing[3] + 2, paddingHorizontal: Spacing[4],
    borderBottomWidth: 1, borderBottomColor: Colors.border.light,
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
  }}>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary }}>{title}</Text>
      {subtitle ? <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 2 }}>{subtitle}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Colors.border.medium, true: Colors.brand.accent }}
      thumbColor="#FFFFFF"
    />
  </View>
);

const ShareCard = ({ share, onToggleShare, onExtendShare }: { share: LocationShare; onToggleShare: (id: string, val: boolean) => void; onExtendShare: (id: string) => void }) => (
  <MotiView
    from={{ opacity: 0, translateY: 12 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 360 }}
    style={{
      backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
      marginBottom: Spacing[3], borderWidth: 1, borderColor: Colors.border.light, overflow: 'hidden',
      ...Shadows.card,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[4] }}>
      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.brand.primary, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontFamily: Typography.fontFamily.bold, fontSize: 16 }}>{share.avatar}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary }}>{share.name}</Text>
        <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 }}>{share.relationship}</Text>
      </View>
      <Switch
        value={share.isActive}
        onValueChange={(val: boolean) => onToggleShare(share.id, val)}
        trackColor={{ false: Colors.border.medium, true: Colors.brand.accent }}
        thumbColor="#FFFFFF"
      />
    </View>

    <View style={{ paddingHorizontal: Spacing[4], paddingBottom: Spacing[4], gap: Spacing[2] }}>
      {[
        { icon: 'time' as const, text: `Sharing since ${share.sharingSince}` },
        {
          icon: share.expiresAt ? 'time' as const : 'infinite' as const,
          text: share.expiresAt === 'expired' ? 'Sharing expired' : share.expiresAt ? `Expires ${share.expiresAt}` : 'Sharing indefinitely',
          error: share.expiresAt === 'expired',
        },
        { icon: 'lock-closed' as const, text: `Sharing: ${share.permissions.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}` },
      ].map((row) => (
        <View key={row.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Ionicons name={row.icon} size={13} color={row.error ? Colors.semantic.error : Colors.text.muted} />
          <Text style={{ fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: row.error ? Colors.semantic.error : Colors.text.secondary }}>
            {row.text}
          </Text>
        </View>
      ))}
    </View>

    {share.isActive && share.expiresAt && share.expiresAt !== 'expired' ? (
      <TouchableOpacity
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
          paddingVertical: Spacing[3], marginHorizontal: Spacing[4], marginBottom: Spacing[4],
          backgroundColor: Colors.brand.accentSoft, borderRadius: BorderRadius.pill,
          borderWidth: 1.5, borderColor: Colors.brand.accent + '40',
        }}
        onPress={() => onExtendShare(share.id)}
        activeOpacity={0.85}
      >
        <Ionicons name="time" size={14} color={Colors.brand.accentPressed} />
        <Text style={{ color: Colors.brand.accentPressed, fontFamily: Typography.fontFamily.semiBold, fontSize: 13 }}>Extend Sharing</Text>
      </TouchableOpacity>
    ) : null}

    {!share.isActive ? (
      <TouchableOpacity
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
          paddingVertical: Spacing[3], marginHorizontal: Spacing[4], marginBottom: Spacing[4],
          backgroundColor: Colors.semantic.successSoft, borderRadius: BorderRadius.pill,
          borderWidth: 1.5, borderColor: Colors.semantic.success + '40',
        }}
        onPress={() => onToggleShare(share.id, true)}
        activeOpacity={0.85}
      >
        <Ionicons name="location" size={14} color={Colors.semantic.success} />
        <Text style={{ color: Colors.semantic.success, fontFamily: Typography.fontFamily.semiBold, fontSize: 13 }}>Resume Sharing</Text>
      </TouchableOpacity>
    ) : null}
  </MotiView>
);

export default function LocationSharingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [shares, setShares] = useState<LocationShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShareContact, setNewShareContact] = useState('');
  const [newShareDuration, setNewShareDuration] = useState<'1h' | '4h' | '24h' | 'indefinite'>('24h');
  const [newSharePermissions, setNewSharePermissions] = useState<('location' | 'battery' | 'movement')[]>(['location']);

  // Location shares are loaded from the server (see loadShares)


  const loadShares = async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ shares: any[] }>('/location/shares');
      setShares((res?.shares || []).map((s: any) => ({
        id: s.id,
        name: s.label || (s.sharedWith?.[0] || 'Shared location'),
        avatar: (s.sharedWith?.[0] || 'C').slice(0, 2).toUpperCase(),
        relationship: 'Contact',
        sharingSince: s.createdAt || new Date().toISOString(),
        expiresAt: s.expiresAt || null,
        isActive: !!s.isActive,
        permissions: ['location'] as ('location' | 'battery' | 'movement')[],
      })));
    } catch (e) {
      console.warn('[LocationSharing] load failed:', e);
      setShares([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer data loading past the first commit so no sync setState happens in the effect body
    void Promise.resolve().then(() => {     loadShares(); });
  }, []);

  const handleToggleShare = (shareId: string, isActive: boolean) => {
    if (!isActive) {
      Alert.alert(
        'Stop Sharing',
        'Are you sure you want to stop sharing your location with this person?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Stop Sharing', style: 'destructive', onPress: () => toggleShare(shareId) },
        ]
      );
    } else {
      toggleShare(shareId);
    }
  };

  const toggleShare = (shareId: string) => {
    setShares(prev => prev.map(share => 
      share.id === shareId ? { ...share, isActive: !share.isActive } : share
    ));
  };

  const handleExtendShare = (shareId: string) => {
    Alert.alert(
      'Extend Sharing',
      'How long would you like to extend location sharing?',
      [
        { text: '1 Hour', onPress: () => extendShare(shareId, '1h') },
        { text: '4 Hours', onPress: () => extendShare(shareId, '4h') },
        { text: '24 Hours', onPress: () => extendShare(shareId, '24h') },
        { text: 'Indefinite', onPress: () => extendShare(shareId, 'indefinite') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const extendShare = (shareId: string, duration: string) => {
    setShares(prev => prev.map(share => 
      share.id === shareId ? { ...share, expiresAt: duration === 'indefinite' ? null : `in ${duration}`, isActive: true } : share
    ));
  };

  const handleAddShare = () => {
    if (!newShareContact.trim()) {
      Alert.alert('Error', 'Please enter a contact name or phone number');
      return;
    }
    const newShare: LocationShare = {
      id: Date.now().toString(),
      name: newShareContact,
      avatar: newShareContact.split(' ').map(n => n[0]).join('').toUpperCase(),
      relationship: 'New Contact',
      sharingSince: 'Just now',
      expiresAt: newShareDuration === 'indefinite' ? null : `in ${newShareDuration}`,
      isActive: true,
      permissions: newSharePermissions,
    };
    setShares(prev => [newShare, ...prev]);
    setShowAddModal(false);
    setNewShareContact('');
    setNewShareDuration('24h');
    setNewSharePermissions(['location']);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Location sharing"
        subtitle="Live shares and privacy"
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtn} hitSlop={8} accessibilityLabel="Share with new contact">
            <Ionicons name="person-add" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status banner */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400 }} style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusPulse}>
              <View style={styles.statusPulseDot} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Location sharing active</Text>
              <Text style={styles.statusSubtitle}>Visible to {shares.filter(s => s.isActive).length} contact{shares.filter(s => s.isActive).length === 1 ? '' : 's'}</Text>
            </View>
            <Ionicons name="navigate" size={20} color="rgba(255,255,255,0.7)" />
          </View>
        </MotiView>

        {/* Sharing toggles */}
        <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 100 }} style={styles.toggleCard}>
          <SettingToggle
            title="Share my location"
            subtitle="Allow others to see your real-time location"
            value={true}
            onValueChange={(val: boolean) => Alert.alert(val ? 'Enabled' : 'Disabled', 'Location sharing ' + (val ? 'enabled' : 'disabled'))}
          />
          <SettingToggle
            title="Share battery level"
            subtitle="Include battery percentage with location"
            value={true}
            onValueChange={(val: boolean) => Alert.alert('Battery Sharing', val ? 'Enabled' : 'Disabled')}
          />
          <SettingToggle
            title="Share movement status"
            subtitle="Show when you're moving vs stationary"
            value={false}
            onValueChange={(val: boolean) => Alert.alert('Movement Sharing', val ? 'Enabled' : 'Disabled')}
          />
        </MotiView>

        {/* Active Shares */}
        <SettingSection title={`Active shares (${shares.filter(s => s.isActive).length})`}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading shares...</Text>
            </View>
          ) : shares.filter(s => s.isActive).length === 0 ? (
            <View style={styles.emptyShares}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="people" size={28} color={Colors.brand.accent} />
              </View>
              <Text style={styles.emptyTitle}>No active location shares</Text>
              <Text style={styles.emptyDesc}>Tap + to start sharing with a contact</Text>
            </View>
          ) : (
            shares.filter(s => s.isActive).map(share => (
              <ShareCard key={share.id} share={share} onToggleShare={handleToggleShare} onExtendShare={handleExtendShare} />
            ))
          )}
        </SettingSection>

        {/* Expired/Inactive Shares */}
        {shares.filter(s => !s.isActive).length > 0 ? (
          <SettingSection title={`Previous shares (${shares.filter(s => !s.isActive).length})`}>
            {shares.filter(s => !s.isActive).map(share => (
              <ShareCard key={share.id} share={share} onToggleShare={handleToggleShare} onExtendShare={handleExtendShare} />
            ))}
          </SettingSection>
        ) : null}

        {/* Settings */}
        <SettingSection title="Location settings">
          <SettingItem
            title="Location Accuracy"
            subtitle="High accuracy uses GPS, Wi-Fi, and mobile networks"
            onPress={() => Alert.alert('Location Accuracy', 'Accuracy settings coming soon')}
          />
          <SettingItem
            title="Location History"
            subtitle="View and manage your location history"
            onPress={() => Alert.alert('Location History', 'History feature coming soon')}
          />
          <SettingItem
            title="Geofence Alerts"
            subtitle="Get notified when contacts arrive/leave areas"
            onPress={() => router.push('/geofences')}
          />
          <SettingItem
            title="Emergency Location Sharing"
            subtitle="Automatically share location with emergency contacts"
            onPress={() => Alert.alert('Emergency Sharing', 'Emergency features coming soon')}
          />
        </SettingSection>

        {/* Privacy */}
        <SettingSection title="Privacy & security">
          <SettingItem
            title="Who Can Request My Location"
            subtitle="Everyone / Contacts Only / No One"
            onPress={() => Alert.alert('Location Requests', 'Privacy settings coming soon')}
          />
          <SettingItem
            title="Location Data Retention"
            subtitle="How long to keep location history"
            onPress={() => Alert.alert('Data Retention', 'Retention settings coming soon')}
          />
          <TouchableOpacity
            style={styles.deleteRow}
            onPress={() => Alert.alert('Delete Data', 'This will permanently delete all location data', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive' },
            ])}
            activeOpacity={0.85}
          >
            <View style={styles.deleteIcon}>
              <Ionicons name="trash" size={16} color={Colors.semantic.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deleteTitle}>Delete All Location Data</Text>
              <Text style={styles.deleteSub}>Permanently remove all location history</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.semantic.error} />
          </TouchableOpacity>
        </SettingSection>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Share Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true} onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share location with</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalCloseBtn} hitSlop={8}>
                <Ionicons name="close" size={16} color={Colors.semantic.error} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputShell}>
                <View style={styles.inputIconChip}>
                  <Ionicons name="person" size={14} color={Colors.brand.accent} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Contact name or phone number"
                  placeholderTextColor={Colors.text.muted}
                  value={newShareContact}
                  onChangeText={setNewShareContact}
                  autoFocus
                />
              </View>

              <Text style={styles.modalSectionTitle}>Duration</Text>
              <View style={styles.durationOptions}>
                {(['1h', '4h', '24h', 'indefinite'] as const).map((duration) => {
                  const active = newShareDuration === duration;
                  return (
                    <TouchableOpacity
                      key={duration}
                      style={[styles.durationOption, active && styles.durationOptionSelected]}
                      onPress={() => setNewShareDuration(duration)}
                    >
                      <Text style={[styles.durationOptionText, active && { color: '#FFFFFF' }]}>
                        {duration === '1h' ? '1 Hour' : duration === '4h' ? '4 Hours' : duration === '24h' ? '24 Hours' : 'Indefinite'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.modalSectionTitle}>Permissions</Text>
              <View style={styles.permissionOptions}>
                {(['location', 'battery', 'movement'] as const).map((perm) => {
                  const active = newSharePermissions.includes(perm);
                  return (
                    <TouchableOpacity
                      key={perm}
                      style={[styles.permissionRow, active && styles.permissionRowActive]}
                      onPress={() => setNewSharePermissions(prev =>
                        prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
                      )}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.permissionCheckbox, active && styles.permissionCheckboxChecked]}>
                        {active ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
                      </View>
                      <View style={styles.permissionInfo}>
                        <Text style={styles.permissionName}>{perm.charAt(0).toUpperCase() + perm.slice(1)}</Text>
                        <Text style={styles.permissionDesc}>
                          {perm === 'location' ? 'Real-time GPS location' : perm === 'battery' ? 'Battery percentage' : 'Movement status (moving/stationary)'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddModal(false)} activeOpacity={0.85}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <SoftButton
                  label="Start sharing"
                  variant="accent"
                  icon="share-social"
                  onPress={handleAddShare}
                  disabled={!newShareContact.trim()}
                  withGlow
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { paddingTop: Spacing[4], paddingBottom: 40 },

  addBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.brand.accent,
    alignItems: 'center', justifyContent: 'center', ...Shadows.buttonOrange,
  },

  statusCard: {
    borderRadius: BorderRadius.lg, padding: Spacing[5],
    marginHorizontal: Spacing[5],
    backgroundColor: Colors.semantic.success, ...Shadows.button,
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  statusPulse: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  statusPulseDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFFFFF' },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 16, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },
  statusSubtitle: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: 'rgba(255,255,255,0.78)', marginTop: 2 },

  toggleCard: {
    borderRadius: BorderRadius.lg, marginHorizontal: Spacing[5], marginTop: Spacing[4], overflow: 'hidden',
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },

  loadingContainer: { alignItems: 'center', paddingVertical: Spacing[10] },
  loadingText: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  emptyShares: { alignItems: 'center', paddingVertical: Spacing[10] },
  emptyIconWrap: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3],
  },
  emptyTitle: { fontSize: 15.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  emptyDesc: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 4, textAlign: 'center', paddingHorizontal: Spacing[8] },

  deleteRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingVertical: Spacing[3] + 2, paddingHorizontal: Spacing[4],
    borderTopWidth: 1, borderTopColor: Colors.border.light,
  },
  deleteIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.semantic.errorSoft, alignItems: 'center', justifyContent: 'center' },
  deleteTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.semantic.error },
  deleteSub: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(30,18,9,0.45)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    backgroundColor: Colors.surface.elevated, padding: Spacing[5], paddingBottom: Spacing[6],
    maxHeight: '88%', ...Shadows.floating,
  },
  modalHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: Colors.border.medium, alignSelf: 'center', marginBottom: Spacing[3] },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[4] },
  modalTitle: { fontSize: 20, fontFamily: Typography.fontFamily.display, color: Colors.text.primary },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.semantic.errorSoft, alignItems: 'center', justifyContent: 'center' },
  modalBody: { gap: 0 },
  inputShell: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border.light,
    backgroundColor: Colors.surface.primary, paddingHorizontal: Spacing[3], marginBottom: Spacing[4],
  },
  inputIconChip: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.brand.accentSoft, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.primary, paddingVertical: Spacing[3] + 2 },
  modalSectionTitle: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginBottom: Spacing[2], marginLeft: 2 },

  durationOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[4] },
  durationOption: {
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] + 1, borderRadius: BorderRadius.pill,
    borderWidth: 1.5, borderColor: Colors.border.light, backgroundColor: Colors.surface.primary,
  },
  durationOptionSelected: { backgroundColor: Colors.brand.accent, borderColor: Colors.brand.accent, ...Shadows.buttonOrange },
  durationOptionText: { fontSize: 12.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },

  permissionOptions: { gap: Spacing[2], marginBottom: Spacing[2] },
  permissionRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    padding: Spacing[3], borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border.light, backgroundColor: Colors.surface.primary,
  },
  permissionRowActive: { borderColor: Colors.brand.accent, backgroundColor: Colors.brand.accentSoft },
  permissionCheckbox: {
    width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: Colors.border.medium,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent',
  },
  permissionCheckboxChecked: { backgroundColor: Colors.brand.accent, borderColor: Colors.brand.accent },
  permissionInfo: { flex: 1 },
  permissionName: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  permissionDesc: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },

  modalFooter: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[5], alignItems: 'center' },
  modalCancelBtn: {
    paddingHorizontal: Spacing[5], paddingVertical: Spacing[3] + 2, borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface.tertiary, alignItems: 'center', justifyContent: 'center',
  },
  modalCancelText: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary },
});