/**
 * Language Settings Screen - Language and region preferences
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

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  
  const isDark = theme === 'dark';
  const [language, setLanguage] = React.useState('en');
  const [region, setRegion] = React.useState('US');
  const [autoTranslate, setAutoTranslate] = React.useState(false);
  const [translateLanguage, setTranslateLanguage] = React.useState('en');

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  ];

  const regions = [
    { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
    { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷' },
    { code: 'ES', name: 'Spain', currency: 'EUR', flag: '🇪🇸' },
    { code: 'IT', name: 'Italy', currency: 'EUR', flag: '🇮🇹' },
    { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵' },
    { code: 'BR', name: 'Brazil', currency: 'BRL', flag: '🇧🇷' },
    { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
    { code: 'CN', name: 'China', currency: 'CNY', flag: '🇨🇳' },
  ];

  const handleLanguageChange = (code: string) => {
    setLanguage(code);
    Alert.alert('Language Changed', `App language has been changed to ${languages.find(l => l.code === code)?.name}. Restart the app to apply changes.`);
  };

  const handleRegionChange = (code: string) => {
    setRegion(code);
    Alert.alert('Region Changed', `Region has been changed to ${regions.find(r => r.code === code)?.name}. Currency and date formats will update.`);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Language & Region</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Language */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>App Language</Text>
          <Text style={[styles.sectionSubtitle, { color: isDark ? '#888' : '#666' }]}>
            Choose your preferred language for the app interface
          </Text>
          
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageOption,
                { 
                  backgroundColor: isDark ? '#2a2a2a' : '#fff',
                  borderColor: language === lang.code ? '#4F46E5' : '#eee',
                  borderWidth: language === lang.code ? 2 : 1,
                }
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <View style={styles.languageInfo}>
                <Text style={[styles.languageName, { color: isDark ? '#fff' : '#000' }]}>{lang.name}</Text>
                <Text style={[styles.languageNative, { color: isDark ? '#888' : '#666' }]}>{lang.nativeName}</Text>
              </View>
              {language === lang.code && <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Region */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Region</Text>
          <Text style={[styles.sectionSubtitle, { color: isDark ? '#888' : '#666' }]}>
            Affects currency, date format, and available features
          </Text>
          
          {regions.map((reg) => (
            <TouchableOpacity
              key={reg.code}
              style={[
                styles.regionOption,
                { 
                  backgroundColor: isDark ? '#2a2a2a' : '#fff',
                  borderColor: region === reg.code ? '#4F46E5' : '#eee',
                  borderWidth: region === reg.code ? 2 : 1,
                }
              ]}
              onPress={() => handleRegionChange(reg.code)}
            >
              <Text style={styles.regionFlag}>{reg.flag}</Text>
              <View style={styles.regionInfo}>
                <Text style={[styles.regionName, { color: isDark ? '#fff' : '#000' }]}>{reg.name}</Text>
                <Text style={[styles.regionCurrency, { color: isDark ? '#888' : '#666' }]}>Currency: {reg.currency}</Text>
              </View>
              {region === reg.code && <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Translation Settings */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Translation</Text>
          
          <SettingToggle
            title="Auto-Translate Messages"
            description="Automatically translate messages in other languages"
            value={autoTranslate}
            onChange={setAutoTranslate}
            icon="translate-outline"
            color="#4F46E5"
            isDark={isDark}
          />
          
          {autoTranslate && (
            <View style={styles.translateLanguageContainer}>
              <Text style={[styles.translateLabel, { color: isDark ? '#fff' : '#000' }]}>Translate To</Text>
              <TouchableOpacity
                style={[
                  styles.translateLanguageButton,
                  { backgroundColor: isDark ? '#2a2a2a' : '#fff', borderColor: '#eee' }
                ]}
                onPress={() => Alert.alert('Select Language', 'Choose your preferred translation language')}
              >
                <Text style={[styles.translateLanguageText, { color: isDark ? '#fff' : '#000' }]}>
                  {languages.find(l => l.code === translateLanguage)?.name || 'English'}
                </Text>
                <Ionicons name="chevron-down-outline" size={20} color={isDark ? '#888' : '#999'} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Date & Time Format */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Date & Time Format</Text>
          
          <SettingItem
            title="Date Format"
            description="MM/DD/YYYY (US) • DD/MM/YYYY (UK/EU) • YYYY-MM-DD (ISO)"
            icon="calendar-outline"
            color="#4F46E5"
            isDark={isDark}
            onPress={() => Alert.alert('Date Format', 'Date format follows your region setting.') }
            showArrow
          />
          
          <SettingItem
            title="Time Format"
            description="12-hour (US) • 24-hour (EU/ISO)"
            icon="time-outline"
            color="#10B981"
            isDark={isDark}
            onPress={() => Alert.alert('Time Format', 'Time format follows your region setting.') }
            showArrow
          />
          
          <SettingItem
            title="First Day of Week"
            description="Sunday (US) • Monday (EU/ISO)"
            icon="calendar-number-outline"
            color="#F59E0B"
            isDark={isDark}
            onPress={() => Alert.alert('Week Start', 'First day of week follows your region setting.') }
            showArrow
          />
        </View>

        {/* Number Format */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Number Format</Text>
          
          <SettingItem
            title="Decimal Separator"
            description="Period (1,234.56) • Comma (1.234,56)"
            icon="ellipsis-horizontal-outline"
            color="#4F46E5"
            isDark={isDark}
            onPress={() => Alert.alert('Decimal Separator', 'Number format follows your region setting.') }
            showArrow
          />
          
          <SettingItem
            title="Digit Grouping"
            description="Thousands separator style"
            icon="hash-outline"
            color="#10B981"
            isDark={isDark}
            onPress={() => Alert.alert('Digit Grouping', 'Digit grouping follows your region setting.') }
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
  showArrow = false 
}: any) => (
  <TouchableOpacity 
    style={[styles.settingItem, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
    onPress={onPress}
  >
    <View style={[styles.settingIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
      <Text style={[styles.settingDescription, { color: isDark ? '#888' : '#666' }]}>{description}</Text>
    </View>
    {showArrow && <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#888' : '#999'} />}
  </TouchableOpacity>
);

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
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  languageOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    borderWidth: 1,
  },
  languageFlag: { fontSize: 28, marginRight: 16 },
  languageInfo: { flex: 1 },
  languageName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  languageNative: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  regionOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    borderWidth: 1,
  },
  regionFlag: { fontSize: 28, marginRight: 16 },
  regionInfo: { flex: 1 },
  regionName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  regionCurrency: { fontSize: 13, fontFamily: 'Inter_400Regular' },
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
  translateLanguageContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  translateLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 8 },
  translateLanguageButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1,
  },
  translateLanguageText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
});