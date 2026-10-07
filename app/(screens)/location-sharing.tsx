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
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { apiGet } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

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
  <View style={{ marginHorizontal: 16, marginTop: 16 }}>
    <Text style={{ fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 }}>{title}</Text>
    {children}
  </View>
);

const SettingItem = ({ title, subtitle, children, onPress, showArrow = true }: any) => (
  <TouchableOpacity 
    style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}
    onPress={onPress}
  >
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 16, color: '#000' }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{subtitle}</Text>}
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {children}
      {showArrow && <Ionicons name="chevron-forward-outline" size={20} color="#999" />}
    </View>
  </TouchableOpacity>
);

const SettingToggle = ({ title, subtitle, value, onValueChange }: any) => (
  <View style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 16, color: '#000' }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{subtitle}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#767577', true: '#8B85FF' }}
      thumbColor="#fff"
    />
  </View>
);

const ShareCard = ({ share, onToggleShare, onExtendShare }: { share: LocationShare; onToggleShare: (id: string, val: boolean) => void; onExtendShare: (id: string) => void }) => (
  <View style={{ backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#eee', overflow: 'hidden' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#8B85FF', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{share.avatar}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>{share.name}</Text>
        <Text style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{share.relationship}</Text>
      </View>
      <Switch
        value={share.isActive}
        onValueChange={(val: boolean) => onToggleShare(share.id, val)}
        trackColor={{ false: '#767577', true: '#8B85FF' }}
        thumbColor="#fff"
      />
    </View>
    
    <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name="time-outline" size={14} color="#999" />
        <Text style={{ fontSize: 13, color: '#666', marginLeft: 8 }}>Sharing since {share.sharingSince}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name={share.expiresAt ? 'time-outline' : 'infinite-outline'} size={14} color={share.expiresAt === 'expired' ? '#EF4444' : '#999'} />
        <Text style={{ fontSize: 13, color: share.expiresAt === 'expired' ? '#EF4444' : '#666', marginLeft: 8 }}>
          {share.expiresAt === 'expired' ? 'Sharing expired' : share.expiresAt ? `Expires ${share.expiresAt}` : 'Sharing indefinitely'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="lock-closed-outline" size={14} color="#999" />
        <Text style={{ fontSize: 13, color: '#666', marginLeft: 8 }}>
          Sharing: {share.permissions.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}
        </Text>
      </View>
    </View>

    {share.isActive && share.expiresAt && share.expiresAt !== 'expired' && (
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: '#EEF2FF', marginHorizontal: 16, marginBottom: 16, borderRadius: 8 }} onPress={() => onExtendShare(share.id)}>
        <Ionicons name="time-outline" size={14} color="#8B85FF" />
        <Text style={{ color: '#8B85FF', fontWeight: '600', marginLeft: 8 }}>Extend Sharing</Text>
      </TouchableOpacity>
    )}

    {!share.isActive && (
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: '#f0f0f0', marginHorizontal: 16, marginBottom: 16, borderRadius: 8 }} onPress={() => onToggleShare(share.id, true)}>
        <Ionicons name="location-outline" size={14} color="#8B85FF" />
        <Text style={{ color: '#8B85FF', fontWeight: '600', marginLeft: 8 }}>Resume Sharing</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default function LocationSharingScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  const { user } = useAuthStore();
  
  const isDark = theme === 'dark';
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
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderBottomColor: isDark ? '#333' : '#eee' }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Location Sharing</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Ionicons name="person-add-outline" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current Location Status */}
        <View style={[styles.statusCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginHorizontal: 16, marginTop: 16 }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
            <View style={styles.statusInfo}>
              <Text style={[styles.statusTitle, { color: isDark ? '#fff' : '#000' }]}>Location Sharing Active</Text>
              <Text style={[styles.statusSubtitle, { color: isDark ? '#888' : '#666' }]}>Your location is visible to {shares.filter(s => s.isActive).length} contact(s)</Text>
            </View>
          </View>
          <SettingToggle
            title="Share My Location"
            subtitle="Allow others to see your real-time location"
            value={true}
            onValueChange={(val: boolean) => Alert.alert(val ? 'Enabled' : 'Disabled', 'Location sharing ' + (val ? 'enabled' : 'disabled'))}
          />
          <SettingItem
            title="Share Battery Level"
            subtitle="Include battery percentage with location"
            value={true}
            onValueChange={(val: boolean) => Alert.alert('Battery Sharing', val ? 'Enabled' : 'Disabled')}
          />
          <SettingToggle
            title="Share Movement Status"
            subtitle="Show when you're moving vs stationary"
            value={false}
            onValueChange={(val: boolean) => Alert.alert('Movement Sharing', val ? 'Enabled' : 'Disabled')}
          />
        </View>

        {/* Active Shares */}
        <SettingSection title={`Active Shares (${shares.filter(s => s.isActive).length})`}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: isDark ? '#888' : '#666' }]}>Loading shares...</Text>
            </View>
          ) : shares.filter(s => s.isActive).length === 0 ? (
            <View style={styles.emptyShares}>
              <Ionicons name="people-outline" size={48} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyTitle, { color: isDark ? '#888' : '#666' }, { marginTop: 12 }]}>No active location shares</Text>
              <Text style={[styles.emptyDesc, { color: isDark ? '#666' : '#999' }, { marginTop: 4 }]}>Tap + to start sharing with a contact</Text>
            </View>
          ) : (
            shares.filter(s => s.isActive).map(share => (
              <ShareCard key={share.id} share={share} onToggleShare={handleToggleShare} onExtendShare={handleExtendShare} />
            ))
          )}
        </SettingSection>

        {/* Expired/Inactive Shares */}
        {shares.filter(s => !s.isActive).length > 0 && (
          <SettingSection title={`Previous Shares (${shares.filter(s => !s.isActive).length})`}>
            {shares.filter(s => !s.isActive).map(share => (
              <ShareCard key={share.id} share={share} onToggleShare={handleToggleShare} onExtendShare={handleExtendShare} />
            ))}
          </SettingSection>
        )}

        {/* Settings */}
        <SettingSection title="Location Settings">
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
        <SettingSection title="Privacy & Security">
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
          <SettingItem
            title="Delete All Location Data"
            subtitle="Permanently remove all location history"
            onPress={() => Alert.alert('Delete Data', 'This will permanently delete all location data', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive' },
            ])}
          />
        </SettingSection>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Share Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true} onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>Share Location With</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close-outline" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', borderColor: isDark ? '#333' : '#ddd', color: isDark ? '#fff' : '#000' }]}
                placeholder="Contact name or phone number"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={newShareContact}
                onChangeText={setNewShareContact}
                autoFocus
              />
              
              <Text style={[styles.modalSectionTitle, { color: isDark ? '#fff' : '#000' }, { marginTop: 20 }]}>Duration</Text>
              <View style={styles.durationOptions}>
                {['1h', '4h', '24h', 'indefinite'].map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationOption,
                      newShareDuration === duration && styles.durationOptionSelected,
                      { backgroundColor: newShareDuration === duration ? '#8B85FF' : (isDark ? '#1a1a1a' : '#f0f0f0'), borderColor: newShareDuration === duration ? '#8B85FF' : (isDark ? '#333' : '#ddd') }
                    ]}
                    onPress={() => setNewShareDuration(duration as any)}
                  >
                    <Text style={[styles.durationOptionText, { color: newShareDuration === duration ? '#fff' : (isDark ? '#fff' : '#000') }]}>
                      {duration === '1h' ? '1 Hour' : duration === '4h' ? '4 Hours' : duration === '24h' ? '24 Hours' : 'Indefinite'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalSectionTitle, { color: isDark ? '#fff' : '#000' }, { marginTop: 20 }]}>Permissions</Text>
              <View style={styles.permissionOptions}>
                {(['location', 'battery', 'movement'] as const).map((perm) => (
                  <View key={perm} style={styles.permissionOption}>
                    <TouchableOpacity
                      style={styles.permissionOptionContent}
                      onPress={() => setNewSharePermissions(prev => 
                        prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
                      )}
                    >
                      <View style={[
                        styles.permissionCheckbox,
                        newSharePermissions.includes(perm) && styles.permissionCheckboxChecked,
                        { backgroundColor: newSharePermissions.includes(perm) ? '#8B85FF' : 'transparent', borderColor: newSharePermissions.includes(perm) ? '#8B85FF' : (isDark ? '#555' : '#ccc') }
                      ]}>
                        {newSharePermissions.includes(perm) && <Ionicons name="checkmark" size={16} color="#fff" />}
                      </View>
                      <View style={styles.permissionInfo}>
                        <Text style={[styles.permissionName, { color: isDark ? '#fff' : '#000' }]}>{perm.charAt(0).toUpperCase() + perm.slice(1)}</Text>
                        <Text style={[styles.permissionDesc, { color: isDark ? '#888' : '#666' }]}>
                          {perm === 'location' ? 'Real-time GPS location' : perm === 'battery' ? 'Battery percentage' : 'Movement status (moving/stationary)'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setShowAddModal(false)}>
                <Text style={[styles.modalButtonTextSecondary, { color: isDark ? '#fff' : '#000' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButtonPrimary, { backgroundColor: newShareContact.trim() ? '#8B85FF' : '#999' }]} onPress={handleAddShare} disabled={!newShareContact.trim()}>
                <Text style={styles.modalButtonTextPrimary}>Start Sharing</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Inter_700Bold' },
  scrollContent: { paddingTop: 16, paddingBottom: 40 },
  section: { borderRadius: 16, padding: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  statusCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  statusIndicator: { width: 10, height: 10, borderRadius: 5 },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  statusSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  settingItemLeft: { flex: 1 },
  settingItemRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingTitle: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  settingSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  shareCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  shareHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  shareAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#8B85FF', justifyContent: 'center', alignItems: 'center' },
  shareAvatarText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  shareInfo: { flex: 1 },
  shareName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  shareRelationship: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  shareDetails: { gap: 8, marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  extendButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: '#8B85FF15', borderRadius: 10 },
  extendButtonText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#8B85FF' },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  emptyShares: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  modalBody: { gap: 16 },
  input: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
  modalSectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  durationOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  durationOptionSelected: {},
  durationOptionText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  permissionOptions: { gap: 12 },
  permissionOption: {},
  permissionOptionContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  permissionCheckbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  permissionCheckboxChecked: {},
  permissionInfo: { flex: 1 },
  permissionName: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  permissionDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalButtonSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  modalButtonTextSecondary: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#000' },
  modalButtonPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalButtonTextPrimary: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
});