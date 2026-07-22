/**
 * Screens Route Group Layout
 * Stack navigator for profile, settings, notifications, help screens
 */

import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 18,
        },
        headerTintColor: '#000',
        cardStyle: styles.card,
        gestureEnabled: true,
      }}
    >
      {/* Profile Screens */}
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="kyc-status" options={{ title: 'KYC Status' }} />
      <Stack.Screen name="kyc-documents" options={{ title: 'KYC Documents' }} />
      <Stack.Screen name="referral" options={{ title: 'Referral Program' }} />
      <Stack.Screen name="my-referrals" options={{ title: 'My Referrals' }} />
      <Stack.Screen name="achievements" options={{ title: 'Achievements' }} />
      <Stack.Screen name="stats" options={{ title: 'Statistics' }} />
      
      {/* Settings Screens */}
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="account-settings" options={{ title: 'Account' }} />
      <Stack.Screen name="privacy-settings" options={{ title: 'Privacy' }} />
      <Stack.Screen name="notification-settings" options={{ title: 'Notifications' }} />
      <Stack.Screen name="location-settings" options={{ title: 'Location' }} />
      <Stack.Screen name="appearance-settings" options={{ title: 'Appearance' }} />
      <Stack.Screen name="language-settings" options={{ title: 'Language' }} />
      <Stack.Screen name="security-settings" options={{ title: 'Security' }} />
      <Stack.Screen name="blocked-users" options={{ title: 'Blocked Users' }} />
      <Stack.Screen name="data-usage" options={{ title: 'Data Usage' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
      
      {/* Notification Screens */}
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="notification-detail" options={{ title: 'Notification' }} />
      
      {/* Help & Support Screens */}
      <Stack.Screen name="help" options={{ title: 'Help & Support' }} />
      <Stack.Screen name="faq" options={{ title: 'FAQ' }} />
      <Stack.Screen name="contact-support" options={{ title: 'Contact Support' }} />
      <Stack.Screen name="terms" options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="guidelines" options={{ title: 'Community Guidelines' }} />
      
      {/* Wallet Screens */}
      <Stack.Screen name="wallet-history" options={{ title: 'Transaction History' }} />
      <Stack.Screen name="wallet-topup" options={{ title: 'Add Money' }} />
      <Stack.Screen name="wallet-withdraw" options={{ title: 'Withdraw' }} />
      <Stack.Screen name="wallet-details" options={{ title: 'Transaction Details' }} />
      <Stack.Screen name="transaction-detail" options={{ title: 'Transaction' }} />
      
      {/* Task Screens */}
      <Stack.Screen name="task-detail" options={{ title: 'Task Details' }} />
      <Stack.Screen name="create-task" options={{ title: 'Create Task' }} />
      <Stack.Screen name="edit-task" options={{ title: 'Edit Task' }} />
      <Stack.Screen name="my-tasks" options={{ title: 'My Tasks' }} />
      <Stack.Screen name="task-applications" options={{ title: 'Applications' }} />
      <Stack.Screen name="task-reviews" options={{ title: 'Reviews' }} />
      
      {/* Chat Screens */}
      <Stack.Screen name="chat-detail" options={{ title: 'Chat' }} />
      <Stack.Screen name="new-chat" options={{ title: 'New Chat' }} />
      <Stack.Screen name="group-chat" options={{ title: 'Group Chat' }} />
      <Stack.Screen name="chat-settings" options={{ title: 'Chat Settings' }} />
      
      {/* Location Screens */}
      <Stack.Screen name="nearby-buddies" options={{ title: 'Nearby Buddies' }} />
      <Stack.Screen name="location-sharing" options={{ title: 'Location Sharing' }} />
      <Stack.Screen name="geofences" options={{ title: 'Geofences' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
  },
});