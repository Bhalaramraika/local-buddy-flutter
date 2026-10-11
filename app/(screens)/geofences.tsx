/**
 * Geofences Screen - Manage location-based alerts and geofences
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

interface Geofence {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  type: 'arrival' | 'departure' | 'both';
  contacts: string[]; // contact IDs to notify
  isActive: boolean;
  createdAt: string;
  triggerCount: number;
  lastTriggered: string | null;
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
}

export default function GeofencesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    radius: 100,
    type: 'both' as 'arrival' | 'departure' | 'both',
    contacts: [] as string[],
  });
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Contacts are loaded from SOS contacts endpoint

  // Geofences are loaded from the /location/geofences endpoint


  const loadGeofences = async () => {
    setLoading(true);
    try {
      const [geoRes, sosRes] = await Promise.all([
        apiGet<{ geofences: any[] }>('/location/geofences').catch(() => ({ geofences: [] })),
        apiGet<{ contacts: any[] }>('/sos/contacts').catch(() => ({ contacts: [] })),
      ]);
      setGeofences((geoRes?.geofences || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        address: g.address || '',
        latitude: g.latitude,
        longitude: g.longitude,
        radius: g.radiusMeters,
        type: 'both',
        isActive: g.enabled !== false,
        contacts: g.notifyContacts || [],
        createdAt: g.createdAt || new Date().toISOString(),
        triggerCount: 0,
        lastTriggered: null,
      })));
      setContacts((sosRes?.contacts || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        avatar: (c.name || 'C').slice(0, 2).toUpperCase(),
      })));
    } catch (e) {
      console.warn('[Geofences] load failed:', e);
      setGeofences([]);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer data loading past the first commit so no sync setState happens in the effect body
    void Promise.resolve().then(() => {     loadGeofences(); });
  }, []);

  const handleToggleGeofence = (geofenceId: string, isActive: boolean) => {
    if (!isActive) {
      Alert.alert(
        'Deactivate Geofence',
        'Are you sure you want to deactivate this geofence? You won\'t receive alerts for this location.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Deactivate', style: 'destructive', onPress: () => toggleGeofence(geofenceId) },
        ]
      );
    } else {
      toggleGeofence(geofenceId);
    }
  };

  const toggleGeofence = (geofenceId: string) => {
    setGeofences(prev => prev.map(g => 
      g.id === geofenceId ? { ...g, isActive: !g.isActive } : g
    ));
  };

  const handleDeleteGeofence = (geofenceId: string) => {
    Alert.alert(
      'Delete Geofence',
      'This will permanently delete the geofence and its history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteGeofence(geofenceId) },
      ]
    );
  };

  const deleteGeofence = (geofenceId: string) => {
    setGeofences(prev => prev.filter(g => g.id !== geofenceId));
  };

  const handleEditGeofence = (geofence: Geofence) => {
    setEditingGeofence(geofence);
    setFormData({
      name: geofence.name,
      address: geofence.address,
      radius: geofence.radius,
      type: geofence.type,
      contacts: geofence.contacts,
    });
    setSelectedLocation({ lat: geofence.latitude, lng: geofence.longitude });
    setShowAddModal(true);
  };

  const handleAddGeofence = () => {
    setEditingGeofence(null);
    setFormData({
      name: '',
      address: '',
      radius: 100,
      type: 'both',
      contacts: [],
    });
    setSelectedLocation(null);
    setShowAddModal(true);
  };

  const handleSaveGeofence = () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    if (editingGeofence) {
      // Update existing
      setGeofences(prev => prev.map(g => 
        g.id === editingGeofence.id 
          ? { ...g, ...formData, latitude: selectedLocation.lat, longitude: selectedLocation.lng }
          : g
      ));
    } else {
      // Create new
      const newGeofence: Geofence = {
        id: Date.now().toString(),
        ...formData,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
        triggerCount: 0,
        lastTriggered: null,
      };
      setGeofences(prev => [newGeofence, ...prev]);
    }
    setShowAddModal(false);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'arrival': return 'Arrival Only';
      case 'departure': return 'Departure Only';
      case 'both': return 'Arrival & Departure';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'arrival': return Colors.semantic.success;
      case 'departure': return Colors.semantic.warning;
      case 'both': return Colors.brand.accent;
      default: return Colors.text.muted;
    }
  };

  const GeofenceCard = ({ geofence }: { geofence: Geofence }) => {
    const accent = getTypeColor(geofence.type);
    return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 360 }}
    >
    <TouchableOpacity
      style={styles.geofenceCard}
      onPress={() => handleEditGeofence(geofence)}
      activeOpacity={0.92}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: accent + '1A' }]}>
          <Ionicons name={geofence.type === 'arrival' ? 'navigate' : geofence.type === 'departure' ? 'exit' : 'location'} size={20} color={accent} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{geofence.name}</Text>
          <Text style={styles.cardAddress} numberOfLines={1}>{geofence.address}</Text>
        </View>
        <Switch
          value={geofence.isActive}
          onValueChange={(val) => handleToggleGeofence(geofence.id, val)}
          trackColor={{ false: Colors.border.medium, true: Colors.brand.accent }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="radio-button-on" size={13} color={Colors.text.muted} />
          <Text style={styles.detailText}>Radius: {geofence.radius}m</Text>
        </View>
        <View style={styles.detailItem}>
          <View style={[styles.typeBadge, { backgroundColor: `${accent}1A` }]}>
            <Text style={[styles.typeBadgeText, { color: accent }]}>{getTypeLabel(geofence.type)}</Text>
          </View>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="people" size={13} color={Colors.text.muted} />
          <Text style={styles.detailText}>{geofence.contacts.length} contact{geofence.contacts.length === 1 ? '' : 's'} notified</Text>
        </View>
      </View>

      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{geofence.triggerCount}</Text>
          <Text style={styles.statLabel}>Triggers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue} numberOfLines={1}>{geofence.lastTriggered || 'Never'}</Text>
          <Text style={styles.statLabel}>Last Triggered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: geofence.isActive ? Colors.semantic.success : Colors.text.muted }]}>
            {geofence.isActive ? 'Active' : 'Off'}
          </Text>
          <Text style={styles.statLabel}>Status</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleEditGeofence(geofence); }}>
          <Ionicons name="create" size={16} color={Colors.brand.accent} />
          <Text style={[styles.actionButtonText, { color: Colors.brand.accentPressed }]}>Edit</Text>
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleDeleteGeofence(geofence.id); }}>
          <Ionicons name="trash" size={16} color={Colors.semantic.error} />
          <Text style={[styles.actionButtonText, { color: Colors.semantic.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
    </MotiView>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Geofences"
        subtitle="Safe zones with alerts"
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={handleAddGeofence} style={styles.addBtn} hitSlop={8} accessibilityLabel="Create geofence">
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Stats */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400 }} style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            {[
              { label: 'Total', value: geofences.length, icon: 'location' as const, color: Colors.brand.accent, soft: Colors.brand.accentSoft },
              { label: 'Active', value: geofences.filter(g => g.isActive).length, icon: 'checkmark-circle' as const, color: Colors.semantic.success, soft: Colors.semantic.successSoft },
              { label: 'Triggers', value: geofences.reduce((sum, g) => sum + g.triggerCount, 0), icon: 'flash' as const, color: Colors.semantic.warning, soft: Colors.semantic.warningSoft },
              { label: 'Contacts', value: new Set(geofences.flatMap(g => g.contacts)).size, icon: 'people' as const, color: Colors.semantic.info, soft: Colors.semantic.infoSoft },
            ].map((stat) => (
              <View key={stat.label} style={styles.summaryItem}>
                <View style={[styles.summaryIcon, { backgroundColor: stat.soft }]}>
                  <Ionicons name={stat.icon} size={18} color={stat.color} />
                </View>
                <Text style={styles.summaryValue}>{stat.value}</Text>
                <Text style={styles.summaryLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </MotiView>

        {/* Geofences List */}
        <SettingSection title={`Geofences (${geofences.length})`}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingBadge}>
                <Ionicons name="location" size={24} color={Colors.brand.accent} />
              </View>
              <Text style={styles.loadingText}>Loading geofences...</Text>
            </View>
          ) : geofences.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="location" size={32} color={Colors.brand.accent} />
              </View>
              <Text style={styles.emptyTitle}>No geofences yet</Text>
              <Text style={styles.emptyDesc}>Tap + to create your first geofence</Text>
              <View style={{ marginTop: Spacing[4] }}>
                <SoftButton label="Create Geofence" variant="accent" icon="add" fullWidth={false} onPress={handleAddGeofence} style={{ paddingHorizontal: Spacing[7] }} withGlow />
              </View>
            </View>
          ) : (
            geofences.map(geofence => (
              <GeofenceCard key={geofence.id} geofence={geofence} />
            ))
          )}
        </SettingSection>

        {/* Settings */}
        <SettingSection title="Geofence settings">
          <SettingItem
            title="Background Location"
            subtitle="Allow geofences to work when app is closed"
            onPress={() => Alert.alert('Background Location', 'Background location settings coming soon')}
          />
          <SettingItem
            title="Notification Preferences"
            subtitle="Customize how you receive geofence alerts"
            onPress={() => Alert.alert('Notifications', 'Notification settings coming soon')}
          />
          <SettingItem
            title="Default Radius"
            subtitle="Set default radius for new geofences (100m)"
            onPress={() => Alert.alert('Default Radius', 'Radius settings coming soon')}
          />
          <SettingItem
            title="Battery Optimization"
            subtitle="Balance accuracy with battery usage"
            onPress={() => Alert.alert('Battery', 'Battery optimization coming soon')}
          />
        </SettingSection>

        <SettingSection title="Advanced">
          <SettingItem
            title="Geofence History"
            subtitle="View all past geofence triggers"
            onPress={() => Alert.alert('History', 'History feature coming soon')}
          />
          <SettingItem
            title="Export Geofence Data"
            subtitle="Download your geofence data as CSV"
            onPress={() => Alert.alert('Export', 'Export feature coming soon')}
          />
          <SettingItem
            title="Import Geofences"
            subtitle="Import geofences from a file"
            onPress={() => Alert.alert('Import', 'Import feature coming soon')}
          />
        </SettingSection>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true} onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingGeofence ? 'Edit geofence' : 'Create geofence'}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalCloseBtn} hitSlop={8}>
                <Ionicons name="close" size={16} color={Colors.semantic.error} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.inputShell}>
                <View style={styles.inputIconChip}>
                  <Ionicons name="alarm" size={14} color={Colors.brand.accent} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Geofence name (e.g., Home, Work, Gym)"
                  placeholderTextColor={Colors.text.muted}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  autoFocus
                />
              </View>

              <View style={[styles.inputShell, { marginTop: Spacing[3] }]}>
                <View style={styles.inputIconChip}>
                  <Ionicons name="navigate" size={14} color={Colors.brand.accent} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Address or place name"
                  placeholderTextColor={Colors.text.muted}
                  value={formData.address}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                />
              </View>

              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => Alert.alert('Map', 'Map picker coming soon - using default SF location for demo')}
                activeOpacity={0.9}
              >
                <View style={styles.mapButtonContent}>
                  <View style={styles.inputIconChip}>
                    <Ionicons name="map" size={14} color={Colors.brand.accent} />
                  </View>
                  <Text style={styles.mapButtonText} numberOfLines={1}>
                    {selectedLocation ? `Location: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}` : 'Tap to select on map'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
              </TouchableOpacity>

              <View style={{ marginTop: Spacing[4] }}>
                <Text style={styles.modalSectionTitle}>Radius: {formData.radius}m</Text>
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderTrack}>
                    <View style={[styles.sliderProgress, { width: `${(formData.radius / 500) * 100}%` }]} />
                  </View>
                </View>
                <View style={styles.radiusPresets}>
                  {[100, 200, 300, 500].map((r) => {
                    const active = formData.radius === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        onPress={() => setFormData(prev => ({ ...prev, radius: r }))}
                        style={[styles.radiusChip, active && styles.radiusChipActive]}
                      >
                        <Text style={[styles.radiusChipText, active && { color: '#FFFFFF' }]}>{r}m</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>50m</Text>
                  <Text style={styles.sliderLabel}>500m</Text>
                </View>
              </View>

              <Text style={[styles.modalSectionTitle, { marginTop: Spacing[5] }]}>Alert type</Text>
              <View style={styles.typeOptions}>
                {(['arrival', 'departure', 'both'] as const).map((type) => {
                  const active = formData.type === type;
                  const accent = getTypeColor(type);
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeOption, active && { borderColor: accent, backgroundColor: accent + '12' }]}
                      onPress={() => setFormData(prev => ({ ...prev, type }))}
                      activeOpacity={0.9}
                    >
                      <View style={[styles.typeOptionIcon, { backgroundColor: active ? accent : accent + '1A' }]}>
                        <Ionicons name={type === 'arrival' ? 'navigate' : type === 'departure' ? 'exit' : 'location'} size={16} color={active ? '#FFFFFF' : accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.typeOptionTitle, active && { color: accent }]}>{getTypeLabel(type)}</Text>
                        <Text style={styles.typeOptionDesc}>
                          {type === 'arrival' ? 'Notify when arriving' : type === 'departure' ? 'Notify when leaving' : 'Notify for both'}
                        </Text>
                      </View>
                      {active ? <Ionicons name="checkmark-circle" size={19} color={accent} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.modalSectionTitle, { marginTop: Spacing[5] }]}>Notify contacts</Text>
              <View style={styles.contactOptions}>
                {contacts.map(contact => {
                  const active = formData.contacts.includes(contact.id);
                  return (
                    <TouchableOpacity
                      key={contact.id}
                      style={[styles.contactOption, active && styles.contactOptionSelected]}
                      onPress={() => setFormData(prev => ({
                        ...prev,
                        contacts: prev.contacts.includes(contact.id)
                          ? prev.contacts.filter(c => c !== contact.id)
                          : [...prev.contacts, contact.id]
                      }))}
                      activeOpacity={0.9}
                    >
                      <View style={[styles.contactAvatar, active && { backgroundColor: Colors.brand.accent }]}>
                        <Text style={[styles.contactAvatarText, active && { color: '#fff' }]}>{contact.avatar}</Text>
                      </View>
                      <Text style={[styles.contactName, active && { color: Colors.brand.accentPressed }]} numberOfLines={1}>{contact.name}</Text>
                      {active ? <Ionicons name="checkmark-circle" size={17} color={Colors.brand.accent} /> : null}
                    </TouchableOpacity>
                  );
                })}
                {contacts.length === 0 ? (
                  <View style={styles.emptyContacts}>
                    <Ionicons name="people-outline" size={20} color={Colors.text.muted} />
                    <Text style={styles.emptyContactsText}>Add contacts in SOS contacts first</Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddModal(false)} activeOpacity={0.85}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <SoftButton
                  label={editingGeofence ? 'Save changes' : 'Create geofence'}
                  variant="accent"
                  icon="checkmark"
                  onPress={handleSaveGeofence}
                  disabled={!formData.name || !formData.address || !selectedLocation}
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

const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <MotiView
    from={{ opacity: 0, translateY: 12 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 380 }}
    style={[styles.section, { marginTop: Spacing[5] }]}
  >
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </MotiView>
);

const SettingItem = ({
  title,
  subtitle,
  onPress,
  showArrow = true,
  destructive = false,
  trailing,
}: any) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={styles.settingItemLeft}>
      <Text style={[styles.settingTitle, destructive && { color: Colors.semantic.error }]}>{title}</Text>
      {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
    </View>
    <View style={styles.settingTrailing}>
      {trailing ? <Text style={styles.settingTrailingText}>{trailing}</Text> : null}
      {showArrow ? <Ionicons name="chevron-forward" size={16} color={destructive ? Colors.semantic.error : Colors.text.muted} /> : null}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { paddingTop: Spacing[2], paddingBottom: 40, paddingHorizontal: 0 },

  addBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.brand.accent,
    alignItems: 'center', justifyContent: 'center', ...Shadows.buttonOrange,
  },

  section: {
    borderRadius: BorderRadius.lg, marginHorizontal: Spacing[5],
    paddingHorizontal: Spacing[4], paddingTop: Spacing[4], paddingBottom: Spacing[2],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    overflow: 'hidden', ...Shadows.card,
  },
  sectionTitle: {
    fontSize: 11.5, fontFamily: Typography.fontFamily.bold, textTransform: 'uppercase',
    letterSpacing: 1.2, color: Colors.brand.accentPressed, marginBottom: Spacing[2], marginLeft: 2,
  },

  summaryCard: {
    borderRadius: BorderRadius.lg, padding: Spacing[5],
    marginHorizontal: Spacing[5], marginTop: Spacing[4],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[2] },
  summaryValue: { fontSize: 19, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary },
  summaryLabel: { fontSize: 10, fontFamily: Typography.fontFamily.medium, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.6, color: Colors.text.muted, marginTop: 2 },

  geofenceCard: {
    borderRadius: BorderRadius.lg, padding: Spacing[4], marginHorizontal: 0, marginBottom: Spacing[3],
    backgroundColor: Colors.surface.primary, borderWidth: 1, borderColor: Colors.border.light,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[3] },
  cardIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  cardAddress: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 2 },
  cardDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], marginBottom: Spacing[3] },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  typeBadge: { paddingHorizontal: Spacing[2] + 2, paddingVertical: 3, borderRadius: BorderRadius.pill },
  typeBadgeText: { fontSize: 11, fontFamily: Typography.fontFamily.bold, textTransform: 'uppercase', letterSpacing: 0.4 },
  cardStats: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing[3], borderTopWidth: 1, borderTopColor: Colors.border.light, marginBottom: Spacing[3] },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.border.light },
  statValue: { fontSize: 14.5, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary },
  statLabel: { fontSize: 10, fontFamily: Typography.fontFamily.medium, textTransform: 'uppercase', letterSpacing: 0.5, color: Colors.text.muted, marginTop: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border.light, paddingTop: Spacing[3] },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing[2] },
  actionButtonText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold },
  actionDivider: { width: 1, height: 22, backgroundColor: Colors.border.light },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingVertical: Spacing[3] + 2, borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  settingItemLeft: { flex: 1 },
  settingTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  settingSubtitle: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },
  settingTrailing: { flexDirection: 'row', alignItems: 'center' },
  settingTrailingText: { fontSize: 12.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.muted, marginRight: Spacing[2] },
  loadingContainer: { alignItems: 'center', paddingVertical: Spacing[10], gap: Spacing[3] },
  loadingBadge: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  emptyState: { alignItems: 'center', paddingVertical: Spacing[10] },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3],
  },
  emptyTitle: { fontSize: 16, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  emptyDesc: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, textAlign: 'center', paddingHorizontal: Spacing[8], marginTop: 4 },
  emptyAction: {
    marginTop: Spacing[4], paddingHorizontal: Spacing[6], paddingVertical: Spacing[3],
    backgroundColor: Colors.brand.accent, borderRadius: BorderRadius.pill, ...Shadows.buttonOrange,
  },
  emptyActionText: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(30,18,9,0.45)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    padding: Spacing[5], paddingBottom: Spacing[6], maxHeight: '85%',
    backgroundColor: Colors.surface.elevated, ...Shadows.floating,
  },
  modalHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: Colors.border.medium, alignSelf: 'center', marginBottom: Spacing[3] },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[4] },
  modalTitle: { fontSize: 20, fontFamily: Typography.fontFamily.display, color: Colors.text.primary },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.semantic.errorSoft, alignItems: 'center', justifyContent: 'center' },
  modalBody: { gap: 0 },
  inputShell: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    paddingHorizontal: Spacing[3], borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border.light, backgroundColor: Colors.surface.primary,
  },
  inputIconChip: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.brand.accentSoft, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, paddingVertical: Spacing[3] + 1, fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.primary },
  mapButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[3], borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border.light, marginTop: Spacing[3],
    backgroundColor: Colors.surface.primary,
  },
  mapButtonContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], flex: 1 },
  mapButtonText: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, flex: 1 },
  modalSectionTitle: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginBottom: Spacing[2], marginLeft: 2 },
  sliderContainer: { height: 20, marginTop: Spacing[2], paddingHorizontal: 2 },
  sliderTrack: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: Colors.surface.tertiary },
  sliderProgress: { height: '100%', borderRadius: 4, backgroundColor: Colors.brand.accent },
  radiusPresets: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[3] },
  radiusChip: {
    flex: 1, paddingVertical: Spacing[2], borderRadius: BorderRadius.pill,
    alignItems: 'center', backgroundColor: Colors.surface.primary,
    borderWidth: 1.5, borderColor: Colors.border.light,
  },
  radiusChipActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary },
  radiusChipText: { fontSize: 11.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing[1] },
  sliderLabel: { fontSize: 10.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
  typeOptions: { gap: Spacing[2], marginTop: Spacing[2] },
  typeOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border.light, backgroundColor: Colors.surface.primary,
  },
  typeOptionSelected: {},
  typeOptionIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  typeOptionTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  typeOptionDesc: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },
  contactOptions: { gap: Spacing[2], marginTop: Spacing[2] },
  contactOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[3], borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border.light, backgroundColor: Colors.surface.primary,
  },
  contactOptionSelected: { borderColor: Colors.brand.accent, backgroundColor: Colors.brand.accentSoft },
  contactAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.surface.tertiary, justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  contactAvatarText: { fontSize: 12, fontFamily: Typography.fontFamily.bold, color: Colors.text.secondary },
  contactName: { fontSize: 13.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary, flex: 1 },
  emptyContacts: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2],
    paddingVertical: Spacing[4], borderRadius: BorderRadius.md, backgroundColor: Colors.surface.primary,
    borderWidth: 1, borderColor: Colors.border.light,
  },
  emptyContactsText: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
  modalFooter: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[5], alignItems: 'center' },
  modalCancelBtn: {
    paddingHorizontal: Spacing[5], paddingVertical: Spacing[3] + 2, borderRadius: BorderRadius.pill,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface.tertiary,
  },
  modalCancelText: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary },
});