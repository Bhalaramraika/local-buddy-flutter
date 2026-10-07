/**
 * Notification Settings Screen - Notification preferences and settings
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

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  
  const isDark = theme === 'dark';
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [emailEnabled, setEmailEnabled] = React.useState(true);
  const [smsEnabled, setSmsEnabled] = React.useState(false);
  const [inAppEnabled, setInAppEnabled] = React.useState(true);
  
  // Task notifications
  const [taskAssigned, setTaskAssigned] = React.useState(true);
  const [taskCompleted, setTaskCompleted] = React.useState(true);
  const [taskCancelled, setTaskCancelled] = React.useState(true);
  const [taskReminders, setTaskReminders] = React.useState(true);
  const [newTaskNearby, setNewTaskNearby] = React.useState(true);
  const [taskApplications, setTaskApplications] = React.useState(true);
  
  // Message notifications
  const [newMessages, setNewMessages] = React.useState(true);
  const [messageReactions, setMessageReactions] = React.useState(false);
  const [groupMessages, setGroupMessages] = React.useState(true);
  
  // Wallet notifications
  const [paymentReceived, setPaymentReceived] = React.useState(true);
  const [paymentSent, setPaymentSent] = React.useState(true);
  const [withdrawalComplete, setWithdrawalComplete] = React.useState(true);
  const [lowBalance, setLowBalance] = React.useState(true);
  
  // Social notifications
  const [newFollower, setNewFollower] = React.useState(true);
  const [newReview, setNewReview] = React.useState(true);
  const [referralSignup, setReferralSignup] = React.useState(true);
  const [achievementUnlocked, setAchievementUnlocked] = React.useState(true);
  
  // System notifications
  const [appUpdates, setAppUpdates] = React.useState(true);
  const [maintenance, setMaintenance] = React.useState(true);
  const [securityAlerts, setSecurityAlerts] = React.useState(true);
  const [marketingEmails, setMarketingEmails] = React.useState(false);

  const handleResetDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all notification settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: () => {
            setPushEnabled(true);
            setEmailEnabled(true);
            setSmsEnabled(false);
            setInAppEnabled(true);
            setTaskAssigned(true);
            setTaskCompleted(true);
            setTaskCancelled(true);
            setTaskReminders(true);
            setNewTaskNearby(true);
            setTaskApplications(true);
            setNewMessages(true);
            setMessageReactions(false);
            setGroupMessages(true);
            setPaymentReceived(true);
            setPaymentSent(true);
            setWithdrawalComplete(true);
            setLowBalance(true);
            setNewFollower(true);
            setNewReview(true);
            setReferralSignup(true);
            setAchievementUnlocked(true);
            setAppUpdates(true);
            setMaintenance(true);
            setSecurityAlerts(true);
            setMarketingEmails(false);
            Alert.alert('Reset Complete', 'All notification settings have been reset to defaults.');
          }
        }
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
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Notifications</Text>
          <TouchableOpacity onPress={handleResetDefaults}>
            <Text style={[styles.resetText, { color: '#8B85FF' }]}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery Methods */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Delivery Methods</Text>
          
          <SettingToggle
            title="Push Notifications"
            description="Receive notifications on your device"
            value={pushEnabled}
            onChange={setPushEnabled}
            icon="notifications-outline"
            color="#8B85FF"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Email Notifications"
            description="Receive notifications via email"
            value={emailEnabled}
            onChange={setEmailEnabled}
            icon="mail-outline"
            color="#10B981"
            isDark={isDark}
          />
          
          <SettingToggle
            title="SMS Notifications"
            description="Receive important alerts via SMS"
            value={smsEnabled}
            onChange={setSmsEnabled}
            icon="chatbubble-outline"
            color="#F59E0B"
            isDark={isDark}
          />
          
          <SettingToggle
            title="In-App Notifications"
            description="Show notifications while using the app"
            value={inAppEnabled}
            onChange={setInAppEnabled}
            icon="cube-outline"
            color="#8B5CF6"
            isDark={isDark}
          />
        </View>

        {/* Task Notifications */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Task Notifications</Text>
          
          <SettingToggle
            title="Task Assigned"
            description="When a task is assigned to you"
            value={taskAssigned}
            onChange={setTaskAssigned}
            icon="clipboard-outline"
            color="#8B85FF"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Task Completed"
            description="When a task you posted is completed"
            value={taskCompleted}
            onChange={setTaskCompleted}
            icon="check-circle-outline"
            color="#10B981"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Task Cancelled"
            description="When a task is cancelled"
            value={taskCancelled}
            onChange={setTaskCancelled}
            icon="close-circle-outline"
            color="#EF4444"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Task Reminders"
            description="Reminders for upcoming tasks"
            value={taskReminders}
            onChange={setTaskReminders}
            icon="alarm-outline"
            color="#F59E0B"
            isDark={isDark}
          />
          
          <SettingToggle
            title="New Tasks Nearby"
            description="New tasks posted in your area"
            value={newTaskNearby}
            onChange={setNewTaskNearby}
            icon="location-outline"
            color="#8B5CF6"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Task Applications"
            description="When someone applies to your task"
            value={taskApplications}
            onChange={setTaskApplications}
            icon="person-add-outline"
            color="#EC4899"
            isDark={isDark}
          />
        </View>

        {/* Message Notifications */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Message Notifications</Text>
          
          <SettingToggle
            title="New Messages"
            description="When you receive a new message"
            value={newMessages}
            onChange={setNewMessages}
            icon="chatbubble-outline"
            color="#8B85FF"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Message Reactions"
            description="When someone reacts to your message"
            value={messageReactions}
            onChange={setMessageReactions}
            icon="heart-outline"
            color="#EF4444"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Group Messages"
            description="Messages in group conversations"
            value={groupMessages}
            onChange={setGroupMessages}
            icon="people-outline"
            color="#10B981"
            isDark={isDark}
          />
        </View>

        {/* Wallet Notifications */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Wallet Notifications</Text>
          
          <SettingToggle
            title="Payment Received"
            description="When you receive a payment"
            value={paymentReceived}
            onChange={setPaymentReceived}
            icon="cash-outline"
            color="#10B981"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Payment Sent"
            description="When a payment is sent from your wallet"
            value={paymentSent}
            onChange={setPaymentSent}
            icon="card-outline"
            color="#8B85FF"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Withdrawal Complete"
            description="When a withdrawal is completed"
            value={withdrawalComplete}
            onChange={setWithdrawalComplete}
            icon="download-outline"
            color="#8B5CF6"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Low Balance Alert"
            description="When your wallet balance is low"
            value={lowBalance}
            onChange={setLowBalance}
            icon="alert-circle-outline"
            color="#EF4444"
            isDark={isDark}
          />
        </View>

        {/* Social Notifications */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Social Notifications</Text>
          
          <SettingToggle
            title="New Follower"
            description="When someone follows you"
            value={newFollower}
            onChange={setNewFollower}
            icon="person-add-outline"
            color="#8B85FF"
            isDark={isDark}
          />
          
          <SettingToggle
            title="New Review"
            description="When you receive a new review"
            value={newReview}
            onChange={setNewReview}
            icon="star-outline"
            color="#F59E0B"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Referral Signup"
            description="When someone signs up with your referral"
            value={referralSignup}
            onChange={setReferralSignup}
            icon="gift-outline"
            color="#EC4899"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Achievement Unlocked"
            description="When you unlock a new achievement"
            value={achievementUnlocked}
            onChange={setAchievementUnlocked}
            icon="trophy-outline"
            color="#F59E0B"
            isDark={isDark}
          />
        </View>

        {/* System Notifications */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>System Notifications</Text>
          
          <SettingToggle
            title="App Updates"
            description="Notifications about app updates"
            value={appUpdates}
            onChange={setAppUpdates}
            icon="cloud-download-outline"
            color="#8B85FF"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Maintenance"
            description="Scheduled maintenance notifications"
            value={maintenance}
            onChange={setMaintenance}
            icon="construct-outline"
            color="#F59E0B"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Security Alerts"
            description="Important security notifications"
            value={securityAlerts}
            onChange={setSecurityAlerts}
            icon="shield-outline"
            color="#EF4444"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Marketing Emails"
            description="Promotional emails and offers"
            value={marketingEmails}
            onChange={setMarketingEmails}
            icon="megaphone-outline"
            color="#8B5CF6"
            isDark={isDark}
          />
        </View>

        {/* Quiet Hours */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Quiet Hours</Text>
          
          <SettingItem
            title="Enable Quiet Hours"
            description="Silence notifications during set hours"
            icon="moon-outline"
            color="#8B85FF"
            isDark={isDark}
            onPress={() => router.push('/(screens)/settings')}
            showArrow
            trailing="10:00 PM - 8:00 AM"
          />
          
          <SettingItem
            title="Customize Schedule"
            description="Set custom quiet hours schedule"
            icon="time-outline"
            color="#10B981"
            isDark={isDark}
            onPress={() => router.push('/(screens)/settings')}
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
  trailing 
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
  resetText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
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