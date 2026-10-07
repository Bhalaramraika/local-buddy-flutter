/**
 * Location Settings Screen - Location sharing and privacy settings
 */

import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';

export default function LocationSettingsScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  
  const isDark = theme === 'dark';
  const [locationEnabled, setLocationEnabled] = React.useState(true);
  const [shareLocation, setShareLocation] = React.useState(true);
  const [showDistance, setShowDistance] = React.useState(true);
  const [nearbyBuddies, setNearbyBuddies] = React.useState(true);
  const [locationHistory, setLocationHistory] = React.useState(false);
  const [preciseLocation, setPreciseLocation] = React.useState(true);
  const [backgroundLocation, setBackgroundLocation] = React.useState(false);
  const [geofenceAlerts, setGeofenceAlerts] = React.useState(true);

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Location History',
      'This will permanently delete your location history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Cleared', 'Location history has been cleared.') }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Location Settings</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Location Toggle */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Location Access</Text>
          
          <SettingToggle
            title="Location Services"
            description="Allow LocalBuddy to access your location"
            value={locationEnabled}
            onChange={setLocationEnabled}
            icon="location-outline"
            color="#8B85FF"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Precise Location"
            description="Use GPS for exact location (uses more battery)"
            value={preciseLocation}
            onChange={setPreciseLocation}
            icon="gps-outline"
            color="#10B981"
            isDark={isDark}
            disabled={!locationEnabled}
          />
          
          <SettingToggle
            title="Background Location"
            description="Update location even when app is closed"
            value={backgroundLocation}
            onChange={setBackgroundLocation}
            icon="moon-outline"
            color="#F59E0B"
            isDark={isDark}
            disabled={!locationEnabled}
          />
        </View>

        {/* Location Sharing */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Location Sharing</Text>
          
          <SettingToggle
            title="Share My Location"
            description="Let buddies see your approximate location"
            value={shareLocation}
            onChange={setShareLocation}
            icon="share-outline"
            color="#8B85FF"
            isDark={isDark}
            disabled={!locationEnabled}
          />
          
          <SettingToggle
            title="Show Distance"
            description="Display distance to other buddies"
            value={showDistance}
            onChange={setShowDistance}
            icon="ruler-outline"
            color="#10B981"
            isDark={isDark}
            disabled={!locationEnabled || !shareLocation}
          />
          
          <SettingToggle
            title="Nearby Buddies"
            description="Show buddies near your location"
            value={nearbyBuddies}
            onChange={setNearbyBuddies}
            icon="people-outline"
            color="#8B5CF6"
            isDark={isDark}
            disabled={!locationEnabled || !shareLocation}
          />
        </View>

        {/* Geofences */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Geofences</Text>
          
          <SettingToggle
            title="Geofence Alerts"
            description="Get notified when entering/leaving saved areas"
            value={geofenceAlerts}
            onChange={setGeofenceAlerts}
            icon="alert-circle-outline"
            color="#EF4444"
            isDark={isDark}
            disabled={!locationEnabled}
          />
          
          <SettingItem
            title="Manage Geofences"
            description="Add, edit, or remove geofence areas"
            icon="map-outline"
            color="#8B85FF"
            isDark={isDark}
            onPress={() => router.push('/geofences')}
            showArrow
            disabled={!locationEnabled}
          />
        </View>

        {/* Location History */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Location History</Text>
          
          <SettingToggle
            title="Save Location History"
            description="Keep a record of your visited locations"
            value={locationHistory}
            onChange={setLocationHistory}
            icon="time-outline"
            color="#8B85FF"
            isDark={isDark}
            disabled={!locationEnabled}
          />
          
          <SettingItem
            title="View Location History"
            description="See your past locations on a map"
            icon="map-outline"
            color="#10B981"
            isDark={isDark}
            onPress={() => router.push('/(screens)/location-settings')}
            showArrow
            disabled={!locationEnabled || !locationHistory}
          />
          
          <SettingItem
            title="Clear Location History"
            description="Permanently delete all location history"
            icon="trash-outline"
            color="#EF4444"
            isDark={isDark}
            onPress={handleClearHistory}
            showArrow
            destructive
            disabled={!locationEnabled || !locationHistory}
          />
        </View>

        {/* Privacy */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Privacy</Text>
          
          <SettingItem
            title="Location Privacy"
            description="Control who can see your location"
            icon="lock-closed-outline"
            color="#8B85FF"
            isDark={isDark}
            onPress={() => router.push('/(screens)/location-settings')}
            showArrow
          />
          
          <SettingItem
            title="Data Usage"
            description="View how your location data is used"
            icon="analytics-outline"
            color="#10B981"
            isDark={isDark}
            onPress={() => router.push('/(screens)/data-usage')}
            showArrow
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const SettingItem = ({ 
  title, 
  description, 
  icon, 
  color, 
  isDark, 
  onPress, 
  showArrow = false, 
  destructive = false,
  disabled = false,
  trailing 
}: any) => (
  <TouchableOpacity 
    style={[styles.settingItem, { backgroundColor: isDark ? '#2a2a2a' : '#fff', opacity: disabled ? 0.5 : 1 }]}
    onPress={onPress}
    disabled={disabled}
  >
    <View style={[styles.settingIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, { color: destructive ? '#EF4444' : (isDark ? '#fff' : '#000') }]}>{title}</Text>
      <Text style={[styles.settingDescription, { color: isDark ? '#888' : '#666' }]}>{description}</Text>
    </View>
    <View style={styles.settingTrailing}>
      {trailing && <Text style={[styles.settingTrailingText, { color: isDark ? '#888' : '#666' }]}>{trailing}</Text>}
      {showArrow && <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#888' : '#999'} />}
    </View>
  </TouchableOpacity>
);

const SettingToggle = ({ 
  title, 
  description, 
  icon, 
  color, 
  isDark, 
  value, 
  onChange,
  disabled = false
}: any) => (
  <TouchableOpacity style={[styles.settingItem, { backgroundColor: isDark ? '#2a2a2a' : '#fff', opacity: disabled ? 0.5 : 1 }]}>
    <View style={[styles.settingIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
      <Text style={[styles.settingDescription, { color: isDark ? '#888' : '#666' }]}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={disabled ? undefined : onChange}
      trackColor={{ false: '#E5E7EB', true: color }}
      thumbColor={isDark ? '#fff' : '#fff'}
      disabled={disabled}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  settingItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  settingIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  settingDescription: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  settingTrailing: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingTrailingText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});