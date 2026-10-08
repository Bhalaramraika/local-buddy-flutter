/**
 * Settings Screen - App settings and preferences
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, showToast } = useUIStore();
  
  const isDark = theme === 'dark';
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => showToast('Account deletion requested', 'info') },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { 
          icon: 'person-outline', 
          label: 'Edit Profile', 
          onPress: () => router.push('/(screens)/edit-profile'),
          iconType: 'Ionicons'
        },
        { 
          icon: 'shield-checkmark-outline', 
          label: 'KYC Verification', 
          onPress: () => router.push('/(screens)/kyc-status'),
          iconType: 'Ionicons'
        },
        { 
          icon: 'card-outline', 
          label: 'Referral Program', 
          onPress: () => router.push('/(screens)/referral'),
          iconType: 'Ionicons'
        },
        { 
          icon: 'trophy-outline', 
          label: 'Achievements', 
          onPress: () => router.push('/(screens)/achievements'),
          iconType: 'Ionicons'
        },
        { 
          icon: 'stats-chart-outline', 
          label: 'My Stats', 
          onPress: () => router.push('/(screens)/stats'),
          iconType: 'Ionicons'
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: 'moon-outline', 
          label: 'Dark Mode', 
          type: 'switch',
          value: isDark,
          onValueChange: (value: boolean) => setTheme(value ? 'dark' : 'light'),
          iconType: 'Ionicons'
        },
        { 
          icon: 'notifications-outline', 
          label: 'Notifications', 
          onPress: () => router.push('/(screens)/notifications'),
          iconType: 'Ionicons'
        },
        { 
          icon: 'language-outline', 
          label: 'Language', 
          onPress: () => router.push('/(screens)/language-settings'),
          iconType: 'Ionicons'
        },
        { 
          icon: 'location-outline', 
          label: 'Location Settings', 
          onPress: () => router.push('/(screens)/location-settings'),
          iconType: 'Ionicons'
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        { 
          icon: 'eye-outline', 
          label: 'Privacy Settings', 
          onPress: () => router.push('/(screens)/privacy-settings'),
          iconType: 'Ionicons'
        },
        { 
          icon: 'ban-outline', 
          label: 'Blocked Users', 
          onPress: () => router.push('/(screens)/blocked-users'),
          iconType: 'Ionicons'
        },
        { 
          icon: 'database-outline', 
          label: 'Data Usage', 
          onPress: () => router.push('/(screens)/data-usage'),
          iconType: 'Ionicons'
        },
      ],
    },
    {
      title: 'Support',
      items: [
        { 
          icon: 'help-circle-outline', 
          label: 'Help Center', 
          onPress: () => router.push('/(screens)/help'),
          iconType: 'Ionicons'
        },
        { 
          icon: 'chatbubble-ellipses-outline', 
          label: 'Contact Support', 
          onPress: () => router.push('/(screens)/contact-support'),
          iconType: 'Ionicons'
        },
        { 
          icon: 'document-text-outline', 
          label: 'Terms of Service', 
          onPress: () => router.push('/(screens)/terms'),
          iconType: 'Ionicons'
        },
        { 
          icon: 'shield-outline', 
          label: 'Privacy Policy', 
          onPress: () => router.push('/(screens)/privacy'),
          iconType: 'Ionicons'
        },
        { 
          icon: 'flag-outline', 
          label: 'Community Guidelines', 
          onPress: () => router.push('/(screens)/guidelines'),
          iconType: 'Ionicons'
        },
      ],
    },
    {
      title: 'About',
      items: [
        { 
          icon: 'information-circle-outline', 
          label: 'About LocalBuddy', 
          onPress: () => router.push('/(screens)/about'),
          iconType: 'Ionicons'
        },
        { 
          icon: 'build-outline', 
          label: 'Version 1.0.0', 
          disabled: true,
          iconType: 'Ionicons'
        },
      ],
    },
  ];

  const renderIcon = (name: string, type: string, color: string) => {
    switch (type) {
      case 'Ionicons':
        return <Ionicons name={name as any} size={22} color={color} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={name as any} size={22} color={color} />;
      case 'Feather':
        return <Feather name={name as any} size={22} color={color} />;
      case 'AntDesign':
        return <AntDesign name={name as any} size={22} color={color} />;
      default:
        return <Ionicons name={name as any} size={22} color={color} />;
    }
  };

  const renderItem = (item: any) => {
    const isDisabled = item.disabled;
    const iconColor = isDisabled ? (isDark ? '#555' : '#999') : (isDark ? '#fff' : '#000');
    const textColor = isDisabled ? (isDark ? '#555' : '#999') : (isDark ? '#fff' : '#000');
    
    return (
      <TouchableOpacity 
        style={[styles.item, isDisabled && styles.itemDisabled]}
        onPress={item.onPress}
        disabled={isDisabled}
      >
        <View style={styles.itemIcon}>
          {renderIcon(item.icon, item.iconType, iconColor)}
        </View>
        <Text style={[styles.itemLabel, { color: textColor }]}>{item.label}</Text>
        {item.type === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: '#767577', true: Colors.brand.primary }}
            thumbColor={isDark ? '#fff' : '#f5f5f5'}
            disabled={isDisabled}
          />
        ) : !isDisabled && (
          <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#555' : '#999'} />
        )}
      </TouchableOpacity>
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
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Settings</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <View style={[styles.userCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <View style={styles.userCardContent}>
            <View style={styles.userAvatar}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.userAvatarImage} />
              ) : (
                <Text style={styles.userAvatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: isDark ? '#fff' : '#000' }]}>{user?.name || 'User'}</Text>
              <Text style={[styles.userEmail, { color: isDark ? '#888' : '#666' }]}>{user?.email || 'user@example.com'}</Text>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={section.title} style={[styles.section, { marginTop: sectionIndex === 0 ? 24 : 16 }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#888' : '#666' }]}>{section.title}</Text>
            <View style={[styles.sectionContent, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
              {section.items.map((item, itemIndex) => (
                <View key={item.label} style={itemIndex === section.items.length - 1 ? {} : styles.itemDivider}>
                  {renderItem(item)}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Danger Zone */}
        <View style={[styles.section, { marginTop: 16, marginBottom: 40 }]}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
          <View style={[styles.sectionContent, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteAccount}>
              <View style={styles.dangerIcon}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </View>
              <Text style={styles.dangerLabel}>Delete Account</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
            <View style={styles.itemDivider} />
            <TouchableOpacity style={styles.dangerItem} onPress={handleLogout}>
              <View style={styles.dangerIcon}>
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              </View>
              <Text style={styles.dangerLabel}>Sign Out</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Need to import Image
import { Image } from 'react-native';
import { Colors } from '@/constants/design';

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  userCard: { borderRadius: 28, padding: 16, marginBottom: 8 },
  userCardContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  userAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.brand.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  userAvatarImage: { width: '100%', height: '100%' },
  userAvatarText: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  userEmail: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 2 },
  section: { borderRadius: 28, overflow: 'hidden' },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  sectionContent: { borderRadius: 32, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  itemDisabled: { opacity: 0.5 },
  itemIcon: { width: 28, alignItems: 'center' },
  itemLabel: { flex: 1, fontSize: 16, fontFamily: 'Inter_500Medium' },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: '#eee', marginLeft: 58 },
  dangerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  dangerIcon: { width: 28, alignItems: 'center' },
  dangerLabel: { flex: 1, fontSize: 16, fontFamily: 'Inter_500Medium', color: '#EF4444' },
});