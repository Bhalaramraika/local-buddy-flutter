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
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

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
  const { theme } = useUIStore();
  const { user } = useAuthStore();
  
  const isDark = theme === 'dark';
  const [geofences, setGeofences] = useState<Geofence[]>([]);
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

  const mockContacts: Contact[] = [
    { id: '1', name: 'Sarah Johnson', avatar: 'SJ' },
    { id: '2', name: 'Mike Chen', avatar: 'MC' },
    { id: '3', name: 'Emma Wilson', avatar: 'EW' },
    { id: '4', name: 'David Park', avatar: 'DP' },
    { id: '5', name: 'Lisa Thompson', avatar: 'LT' },
  ];

  const mockGeofences: Geofence[] = [
    {
      id: '1',
      name: 'Home',
      address: '123 Main St, San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      radius: 100,
      type: 'both',
      contacts: ['1', '3'],
      isActive: true,
      createdAt: '2024-01-15',
      triggerCount: 24,
      lastTriggered: '2 hours ago',
    },
    {
      id: '2',
      name: 'Work Office',
      address: '450 Mission St, San Francisco, CA',
      latitude: 37.7895,
      longitude: -122.3971,
      radius: 150,
      type: 'arrival',
      contacts: ['2'],
      isActive: true,
      createdAt: '2024-01-20',
      triggerCount: 18,
      lastTriggered: 'This morning',
    },
    {
      id: '3',
      name: 'Gym',
      address: '200 Market St, San Francisco, CA',
      latitude: 37.7906,
      longitude: -122.4012,
      radius: 50,
      type: 'departure',
      contacts: ['4'],
      isActive: false,
      createdAt: '2024-02-01',
      triggerCount: 12,
      lastTriggered: '3 days ago',
    },
    {
      id: '4',
      name: 'Grocery Store',
      address: '555 California St, San Francisco, CA',
      latitude: 37.7912,
      longitude: -122.4005,
      radius: 80,
      type: 'both',
      contacts: ['5'],
      isActive: true,
      createdAt: '2024-02-10',
      triggerCount: 8,
      lastTriggered: 'Yesterday',
    },
  ];


  const loadGeofences = async () => {
    // Yield before touching state so React never sees sync setState in the mount effect
    await Promise.resolve();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setGeofences(mockGeofences);
    setLoading(false);
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
      case 'arrival': return '#10B981';
      case 'departure': return '#F59E0B';
      case 'both': return '#4F46E5';
      default: return '#6B7280';
    }
  };

  const GeofenceCard = ({ geofence }: { geofence: Geofence }) => (
    <TouchableOpacity 
      style={[styles.geofenceCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff', borderColor: isDark ? '#333' : '#eee' }]}
      onPress={() => handleEditGeofence(geofence)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons name={geofence.type === 'arrival' ? 'navigate-outline' : geofence.type === 'departure' ? 'exit-outline' : 'location-outline'} size={24} color={getTypeColor(geofence.type)} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: isDark ? '#fff' : '#000' }]}>{geofence.name}</Text>
          <Text style={[styles.cardAddress, { color: isDark ? '#888' : '#666' }]}>{geofence.address}</Text>
        </View>
        <Switch
          value={geofence.isActive}
          onValueChange={(val) => handleToggleGeofence(geofence.id, val)}
          trackColor={{ false: '#767577', true: '#4F46E5' }}
          thumbColor={isDark ? '#fff' : '#f5f5f5'}
        />
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="radio-button-on-outline" size={14} color={isDark ? '#666' : '#999'} />
          <Text style={[styles.detailText, { color: isDark ? '#888' : '#666' }]}>Radius: {geofence.radius}m</Text>
        </View>
        <View style={styles.detailItem}>
          <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor(geofence.type)}15` }]}>
            <Text style={[styles.typeBadgeText, { color: getTypeColor(geofence.type) }]}>{getTypeLabel(geofence.type)}</Text>
          </View>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={14} color={isDark ? '#666' : '#999'} />
          <Text style={[styles.detailText, { color: isDark ? '#888' : '#666' }]}>{geofence.contacts.length} contact(s) notified</Text>
        </View>
      </View>

      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{geofence.triggerCount}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Triggers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{geofence.lastTriggered || 'Never'}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Last Triggered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{geofence.isActive ? 'Active' : 'Inactive'}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Status</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleEditGeofence(geofence); }}>
          <Ionicons name="create-outline" size={18} color={isDark ? '#888' : '#666'} />
          <Text style={[styles.actionButtonText, { color: isDark ? '#888' : '#666' }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { borderLeftWidth: 1, borderLeftColor: isDark ? '#333' : '#eee' }]} onPress={(e) => { e.stopPropagation(); handleDeleteGeofence(geofence.id); }}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderBottomColor: isDark ? '#333' : '#eee' }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Geofences</Text>
        <TouchableOpacity onPress={handleAddGeofence}>
          <Ionicons name="add-outline" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Stats */}
        <View style={[styles.summaryCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginHorizontal: 16, marginTop: 16 }]}>
          <View style={styles.summaryRow}>
            {[
              { label: 'Total Geofences', value: geofences.length, icon: 'location-outline', color: '#4F46E5' },
              { label: 'Active', value: geofences.filter(g => g.isActive).length, icon: 'checkmark-circle-outline', color: '#10B981' },
              { label: 'Total Triggers', value: geofences.reduce((sum, g) => sum + g.triggerCount, 0), icon: 'flash-outline', color: '#F59E0B' },
              { label: 'Contacts Notified', value: new Set(geofences.flatMap(g => g.contacts)).size, icon: 'people-outline', color: '#EC4899' },
            ].map((stat, i) => (
              <View key={i} style={styles.summaryItem}>
                <View style={[styles.summaryIcon, { backgroundColor: `${stat.color}15` }]}>
                  <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                </View>
                <Text style={[styles.summaryValue, { color: isDark ? '#fff' : '#000' }]}>{stat.value}</Text>
                <Text style={[styles.summaryLabel, { color: isDark ? '#888' : '#666' }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Geofences List */}
        <SettingSection title={`Geofences (${geofences.length})`}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: isDark ? '#888' : '#666' }]}>Loading geofences...</Text>
            </View>
          ) : geofences.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyTitle, { color: isDark ? '#888' : '#666' }, { marginTop: 12 }]}>No geofences yet</Text>
              <Text style={[styles.emptyDesc, { color: isDark ? '#666' : '#999' }, { marginTop: 4 }]}>Tap + to create your first geofence</Text>
              <TouchableOpacity style={styles.emptyAction} onPress={handleAddGeofence}>
                <Text style={styles.emptyActionText}>Create Geofence</Text>
              </TouchableOpacity>
            </View>
          ) : (
            geofences.map(geofence => (
              <GeofenceCard key={geofence.id} geofence={geofence} />
            ))
          )}
        </SettingSection>

        {/* Settings */}
        <SettingSection title="Geofence Settings">
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
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>{editingGeofence ? 'Edit Geofence' : 'Create Geofence'}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close-outline" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', borderColor: isDark ? '#333' : '#ddd', color: isDark ? '#fff' : '#000' }]}
                placeholder="Geofence name (e.g., Home, Work, Gym)"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                autoFocus
              />

              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', borderColor: isDark ? '#333' : '#ddd', color: isDark ? '#fff' : '#000', marginTop: 12 }]}
                placeholder="Address or place name"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={formData.address}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
              />

              <TouchableOpacity 
                style={[styles.mapButton, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', borderColor: isDark ? '#333' : '#ddd' }]}
                onPress={() => Alert.alert('Map', 'Map picker coming soon - using default SF location for demo')}
              >
                <View style={styles.mapButtonContent}>
                  <Ionicons name="map-outline" size={20} color={isDark ? '#888' : '#666'} />
                  <Text style={[styles.mapButtonText, { color: isDark ? '#888' : '#666' }]}>
                    {selectedLocation ? `Location: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}` : 'Tap to select on map'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#666' : '#999'} />
              </TouchableOpacity>

              <View style={{ marginTop: 16 }}>
                <Text style={[styles.modalSectionTitle, { color: isDark ? '#fff' : '#000' }]}>Radius: {formData.radius}m</Text>
                <View style={styles.sliderContainer}>
                  <View style={[styles.sliderTrack, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]}>
                    <View style={[styles.sliderProgress, { backgroundColor: '#4F46E5', width: `${(formData.radius / 500) * 100}%` }]} />
                  </View>
                </View>
                <View style={styles.sliderLabels}>
                  <Text style={[styles.sliderLabel, { color: isDark ? '#888' : '#666' }]}>50m</Text>
                  <Text style={[styles.sliderLabel, { color: isDark ? '#888' : '#666' }]}>500m</Text>
                </View>
              </View>

              <Text style={[styles.modalSectionTitle, { color: isDark ? '#fff' : '#000', marginTop: 20 }]}>Alert Type</Text>
              <View style={styles.typeOptions}>
                {(['arrival', 'departure', 'both'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      formData.type === type && styles.typeOptionSelected,
                      { backgroundColor: formData.type === type ? `${getTypeColor(type)}15` : (isDark ? '#1a1a1a' : '#f0f0f0'), borderColor: formData.type === type ? getTypeColor(type) : (isDark ? '#333' : '#ddd') }
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, type }))}
                  >
                    <View style={[styles.typeOptionIcon, { backgroundColor: formData.type === type ? getTypeColor(type) : 'transparent' }]}>
                      <Ionicons name={type === 'arrival' ? 'navigate-outline' : type === 'departure' ? 'exit-outline' : 'location-outline'} size={18} color={formData.type === type ? '#fff' : getTypeColor(type)} />
                    </View>
                    <View>
                      <Text style={[styles.typeOptionTitle, { color: formData.type === type ? getTypeColor(type) : (isDark ? '#fff' : '#000') }]}>{getTypeLabel(type)}</Text>
                      <Text style={[styles.typeOptionDesc, { color: isDark ? '#888' : '#666' }]}>
                        {type === 'arrival' ? 'Notify when arriving' : type === 'departure' ? 'Notify when leaving' : 'Notify for both'}
                      </Text>
                    </View>
                    {formData.type === type && <Ionicons name="checkmark-circle-outline" size={20} color={getTypeColor(type)} />}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalSectionTitle, { color: isDark ? '#fff' : '#000', marginTop: 20 }]}>Notify Contacts</Text>
              <View style={styles.contactOptions}>
                {mockContacts.map(contact => (
                  <TouchableOpacity
                    key={contact.id}
                    style={[
                      styles.contactOption,
                      formData.contacts.includes(contact.id) && styles.contactOptionSelected,
                      { backgroundColor: formData.contacts.includes(contact.id) ? '#4F46E515' : (isDark ? '#1a1a1a' : '#f0f0f0'), borderColor: formData.contacts.includes(contact.id) ? '#4F46E5' : (isDark ? '#333' : '#ddd') }
                    ]}
                    onPress={() => setFormData(prev => ({
                      ...prev,
                      contacts: prev.contacts.includes(contact.id)
                        ? prev.contacts.filter(c => c !== contact.id)
                        : [...prev.contacts, contact.id]
                    }))}
                  >
                    <View style={styles.contactAvatar}>
                      <Text style={styles.contactAvatarText}>{contact.avatar}</Text>
                    </View>
                    <Text style={[styles.contactName, { color: formData.contacts.includes(contact.id) ? '#4F46E5' : (isDark ? '#fff' : '#000') }]}>{contact.name}</Text>
                    {formData.contacts.includes(contact.id) && <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButtonPrimary, { backgroundColor: formData.name && formData.address && selectedLocation ? '#4F46E5' : '#999' }]} onPress={handleSaveGeofence} disabled={!formData.name || !formData.address || !selectedLocation}>
                <Text style={styles.modalButtonTextPrimary}>{editingGeofence ? 'Save Changes' : 'Create Geofence'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={[styles.section, { marginTop: 16 }]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const SettingItem = ({ 
  title, 
  subtitle, 
  onPress, 
  showArrow = false, 
  destructive = false,
  trailing,
}: any) => (
  <TouchableOpacity 
    style={styles.settingItem}
    onPress={onPress}
  >
    <View style={styles.settingItemLeft}>
      <Text style={[styles.settingTitle, { color: destructive ? '#EF4444' : undefined }]}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    <View style={styles.settingTrailing}>
      {trailing && <Text style={styles.settingTrailingText}>{trailing}</Text>}
      {showArrow && <Ionicons name="chevron-forward-outline" size={20} color="#999" />}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Inter_700Bold' },
  scrollContent: { paddingTop: 16, paddingBottom: 40 },
  section: { borderRadius: 16, padding: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  summaryCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  summaryValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  summaryLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  geofenceCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4F46E515', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  cardAddress: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  cardDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  typeBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  cardStats: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee', marginBottom: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: '#eee' },
  statValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  cardActions: { flexDirection: 'row', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  actionButtonText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  settingItemLeft: { flex: 1 },
  settingTitle: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  settingSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  settingTrailing: { flexDirection: 'row', alignItems: 'center' },
  settingTrailingText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#999', marginRight: 8 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
  emptyAction: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#4F46E5', borderRadius: 10 },
  emptyActionText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  modalBody: { gap: 16 },
  input: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
  mapButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  mapButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mapButtonText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  modalSectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  sliderContainer: { height: 20, marginTop: 8 },
  sliderTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  sliderProgress: { height: '100%', borderRadius: 2 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  sliderLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  typeOptions: { gap: 8, marginTop: 8 },
  typeOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  typeOptionSelected: {},
  typeOptionIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  typeOptionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  typeOptionDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  contactOptions: { gap: 8, marginTop: 8 },
  contactOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  contactOptionSelected: {},
  contactAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
  contactAvatarText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  contactName: { fontSize: 15, fontFamily: 'Inter_500Medium', flex: 1 },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalButtonSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  modalButtonTextSecondary: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#000' },
  modalButtonPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalButtonTextPrimary: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
});