/**
 * Appearance Settings Screen - Theme, display, and UI customization
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

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const { theme, setTheme } = useUIStore();
  
  const isDark = theme === 'dark';
  const [fontSize, setFontSize] = React.useState<'small' | 'medium' | 'large'>('medium');
  const [animationsEnabled, setAnimationsEnabled] = React.useState(true);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [highContrast, setHighContrast] = React.useState(false);
  const [compactMode, setCompactMode] = React.useState(false);
  const [showAvatars, setShowAvatars] = React.useState(true);
  const [showBadges, setShowBadges] = React.useState(true);

  const themes = [
    { id: 'light', name: 'Light', icon: 'sunny-outline', color: '#F59E0B' },
    { id: 'dark', name: 'Dark', icon: 'moon-outline', color: '#4F46E5' },
    { id: 'system', name: 'System', icon: 'phone-portrait-outline', color: '#10B981' },
  ];

  const fontSizes = [
    { id: 'small', name: 'Small', size: 14 },
    { id: 'medium', name: 'Medium', size: 16 },
    { id: 'large', name: 'Large', size: 18 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Appearance</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Selection */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Theme</Text>
          
          {themes.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.themeOption,
                { 
                  backgroundColor: isDark ? '#2a2a2a' : '#fff',
                  borderColor: theme === t.id ? t.color : '#eee',
                  borderWidth: theme === t.id ? 2 : 1,
                }
              ]}
              onPress={() => setTheme(t.id as 'light' | 'dark' | 'system')}
            >
              <View style={[styles.themeIcon, { backgroundColor: `${t.color}15` }]}>
                <Ionicons name={t.icon} size={24} color={t.color} />
              </View>
              <View style={styles.themeContent}>
                <Text style={[styles.themeName, { color: isDark ? '#fff' : '#000' }]}>{t.name}</Text>
                <Text style={[styles.themeDesc, { color: isDark ? '#888' : '#666' }]}>
                  {t.id === 'system' ? 'Follow system settings' : `${t.name} mode always`}
                </Text>
              </View>
              {theme === t.id && <Ionicons name="checkmark-circle" size={24} color={t.color} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Font Size */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Font Size</Text>
          
          {fontSizes.map((fs) => (
            <TouchableOpacity
              key={fs.id}
              style={[
                styles.fontOption,
                { 
                  backgroundColor: isDark ? '#2a2a2a' : '#fff',
                  borderColor: fontSize === fs.id ? '#4F46E5' : '#eee',
                  borderWidth: fontSize === fs.id ? 2 : 1,
                }
              ]}
              onPress={() => setFontSize(fs.id as 'small' | 'medium' | 'large')}
            >
              <View style={styles.fontPreview}>
                <Text style={{ fontSize: fs.size, fontFamily: 'Inter_400Regular', color: isDark ? '#fff' : '#000' }}>
                  Sample text preview
                </Text>
              </View>
              <View style={styles.fontInfo}>
                <Text style={[styles.fontName, { color: isDark ? '#fff' : '#000' }]}>{fs.name}</Text>
                <Text style={[styles.fontSize, { color: isDark ? '#888' : '#666' }]}>{fs.size}pt</Text>
              </View>
              {fontSize === fs.id && <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Display Options */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Display</Text>
          
          <SettingToggle
            title="Animations"
            description="Enable smooth transitions and animations"
            value={animationsEnabled}
            onChange={setAnimationsEnabled}
            icon="flash-outline"
            color="#4F46E5"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Reduced Motion"
            description="Minimize motion effects for accessibility"
            value={reducedMotion}
            onChange={setReducedMotion}
            icon="remove-circle-outline"
            color="#EF4444"
            isDark={isDark}
          />
          
          <SettingToggle
            title="High Contrast"
            description="Increase color contrast for better visibility"
            value={highContrast}
            onChange={setHighContrast}
            icon="contrast-outline"
            color="#10B981"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Compact Mode"
            description="Reduce spacing for more content on screen"
            value={compactMode}
            onChange={setCompactMode}
            icon="compress-outline"
            color="#F59E0B"
            isDark={isDark}
          />
        </View>

        {/* Content Display */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Content Display</Text>
          
          <SettingToggle
            title="Show Avatars"
            description="Display user profile pictures"
            value={showAvatars}
            onChange={setShowAvatars}
            icon="person-circle-outline"
            color="#4F46E5"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Show Badges"
            description="Display achievement and verification badges"
            value={showBadges}
            onChange={setShowBadges}
            icon="ribbon-outline"
            color="#F59E0B"
            isDark={isDark}
          />
        </View>

        {/* Preview */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Preview</Text>
          
          <View style={[styles.previewCard, { backgroundColor: isDark ? '#1a1a1a' : '#fafafa' }]}>
            <View style={styles.previewHeader}>
              <View style={styles.previewAvatar}>
                <Text style={styles.previewAvatarText}>JB</Text>
              </View>
              <View>
                <Text style={[styles.previewName, { color: isDark ? '#fff' : '#000' }]}>John Buddy</Text>
                <Text style={[styles.previewSub, { color: isDark ? '#888' : '#666' }]}>Super Buddy • 4.9★</Text>
              </View>
              {showBadges && (
                <View style={styles.previewBadges}>
                  <View style={[styles.badge, { backgroundColor: '#F59E0B' }]}>
                    <Text style={styles.badgeText}>⭐</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: '#4F46E5' }]}>
                    <Text style={styles.badgeText}>✓</Text>
                  </View>
                </View>
              )}
            </View>
            <Text style={[styles.previewText, { color: isDark ? '#fff' : '#000', fontSize: fontSize === 'small' ? 14 : fontSize === 'medium' ? 16 : 18 }]}>
              This is a preview of how content will appear with your current settings. 
              Adjust theme, font size, and display options above to see changes.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const SettingToggle = ({ 
  title, 
  description, 
  icon, 
  color, 
  isDark, 
  value, 
  onChange 
}: any) => (
  <TouchableOpacity style={[styles.settingItem, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
    <View style={[styles.settingIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
      <Text style={[styles.settingDescription, { color: isDark ? '#888' : '#666' }]}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: '#E5E7EB', true: color }}
      thumbColor={isDark ? '#fff' : '#fff'}
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
  themeOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    borderWidth: 1,
  },
  themeIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  themeContent: { flex: 1 },
  themeName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  themeDesc: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  fontOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    borderWidth: 1,
  },
  fontPreview: { flex: 1, paddingRight: 16 },
  fontInfo: { marginRight: 16 },
  fontName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  fontSize: { fontSize: 13, fontFamily: 'Inter_400Regular' },
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
  previewCard: { 
    borderRadius: 12, 
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  previewAvatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#4F46E5', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12,
  },
  previewAvatarText: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  previewName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  previewSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  previewBadges: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
  badge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 12, color: '#fff' },
  previewText: { fontFamily: 'Inter_400Regular', lineHeight: 22 },
});