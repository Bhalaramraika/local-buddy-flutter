/**
 * Blocked Users Screen - Manage blocked users
 */

import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  const { user } = useAuthStore();
  
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showAddBlock, setShowAddBlock] = React.useState(false);
  const [blockUsername, setBlockUsername] = React.useState('');

  const blockedUsers = [
    { id: '1', username: 'spammer123', name: 'John Spammer', avatar: null, blockedDate: '2024-01-15', reason: 'Spam messages' },
    { id: '2', username: 'fakeuser456', name: 'Fake User', avatar: null, blockedDate: '2024-01-10', reason: 'Harassment' },
    { id: '3', username: 'scammer789', name: 'Scam Artist', avatar: null, blockedDate: '2024-01-05', reason: 'Fraud attempt' },
    { id: '4', username: 'botaccount', name: 'Bot Account', avatar: null, blockedDate: '2024-01-01', reason: 'Automated behavior' },
  ];

  const filteredUsers = blockedUsers.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUnblock = (userId: string, username: string) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock @${username}? They will be able to contact you again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unblock', style: 'destructive', onPress: () => Alert.alert('Unblocked', `@${username} has been unblocked.`) }
      ]
    );
  };

  const handleBlockUser = () => {
    if (!blockUsername.trim()) {
      Alert.alert('Error', 'Please enter a username to block.');
      return;
    }
    Alert.alert('User Blocked', `@${blockUsername} has been blocked.`, [
      { text: 'OK', onPress: () => { setBlockUsername(''); setShowAddBlock(false); } }
    ]);
  };

  const handleReportUser = (username: string) => {
    Alert.alert(
      'Report User',
      `Report @${username} for violating community guidelines?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => Alert.alert('Reported', 'Thank you for reporting. Our team will review.') }
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
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Blocked Users</Text>
          <TouchableOpacity onPress={() => setShowAddBlock(true)}>
            <Ionicons name="person-add-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <View style={[styles.searchInputWrapper, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
            <Ionicons name="search-outline" size={22} color={isDark ? '#888' : '#999'} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? '#fff' : '#000' }]}
              placeholder="Search blocked users..."
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: isDark ? '#fff' : '#000' }]}>{blockedUsers.length}</Text>
            <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Blocked Users</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDark ? '#333' : '#eee' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: isDark ? '#fff' : '#000' }]}>This Month</Text>
            <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>New Blocks</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDark ? '#333' : '#eee' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: isDark ? '#fff' : '#000' }]}>0</Text>
            <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Pending Reports</Text>
          </View>
        </View>

        {/* Blocked Users List */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Blocked Users ({blockedUsers.length})</Text>
          </View>
          
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-circle-outline" size={64} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyTitle, { color: isDark ? '#888' : '#666' }]}>No blocked users found</Text>
              <Text style={[styles.emptyDesc, { color: isDark ? '#666' : '#999' }]}>{searchQuery ? 'Try a different search' : 'Users you block will appear here'}</Text>
            </View>
          ) : (
            filteredUsers.map((blockedUser) => (
              <View key={blockedUser.id} style={styles.blockedUserItem}>
                <View style={styles.userAvatar}>
                  <Text style={[styles.avatarText, { color: isDark ? '#fff' : '#000' }]}>{blockedUser.name.charAt(0)}</Text>
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.userHeader}>
                    <Text style={[styles.userName, { color: isDark ? '#fff' : '#000' }]}>{blockedUser.name}</Text>
                    <Text style={[styles.userUsername, { color: isDark ? '#888' : '#666' }]}>@{blockedUser.username}</Text>
                  </View>
                  <View style={styles.userMeta}>
                    <Text style={[styles.userMetaText, { color: isDark ? '#888' : '#666' }]}>Blocked on {blockedUser.blockedDate}</Text>
                    <Text style={[styles.userMetaText, { color: isDark ? '#888' : '#666' }]}>Reason: {blockedUser.reason}</Text>
                  </View>
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity 
                    onPress={() => handleReportUser(blockedUser.username)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="flag-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleUnblock(blockedUser.id, blockedUser.username)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="person-remove-outline" size={20} color="#10B981" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* What happens when you block */}
        <View style={[styles.infoSection, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.infoTitle, { color: isDark ? '#fff' : '#000' }]}>What happens when you block someone?</Text>
          <View style={styles.infoList}>
            {[
              'They cannot send you messages or task requests',
              'They cannot see your profile or activity',
              'They cannot find you in search results',
              'You will not see their content or notifications',
              'Previous messages remain but are hidden',
              'They are not notified when you block them',
            ].map((item, index) => (
              <View key={index} style={styles.infoItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: isDark ? '#ddd' : '#333' }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Block Modal */}
      {showAddBlock && (
        <View style={styles.modalOverlay} onTouchStart={() => setShowAddBlock(false)}>
          <View style={[styles.modal, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]} onTouchStart={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>Block User</Text>
              <TouchableOpacity onPress={() => setShowAddBlock(false)}>
                <Ionicons name="close-outline" size={28} color={isDark ? '#888' : '#666'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDesc, { color: isDark ? '#888' : '#666' }]}>Enter the username of the person you want to block. They will not be notified.</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#fff' : '#000' }]}
              placeholder="@username"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={blockUsername}
              onChangeText={setBlockUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => { setBlockUsername(''); setShowAddBlock(false); }} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBlockUser} style={styles.modalConfirmBtn}>
                <Text style={styles.modalConfirmText}>Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  searchContainer: { paddingHorizontal: 4 },
  searchInputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    height: 48,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
  statsContainer: { 
    flexDirection: 'row', 
    borderRadius: 16, 
    paddingVertical: 16, 
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  statDivider: { width: 1, height: 40 },
  section: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  blockedUserItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userAvatar: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    backgroundColor: '#4F46E5', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  avatarText: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  userInfo: { flex: 1 },
  userHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  userName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  userUsername: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  userMeta: { gap: 2 },
  userMetaText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  userActions: { flexDirection: 'row', gap: 12 },
  actionButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#f5f5f5', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  infoSection: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  infoTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  infoList: { gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIcon: { marginTop: 2 },
  infoText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },
  modalOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    paddingHorizontal: 20 
  },
  modal: { 
    borderRadius: 20, 
    padding: 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 20, 
    elevation: 10 
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  modalDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 20, lineHeight: 20 },
  modalInput: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    fontSize: 16, 
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { 
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 12, 
    backgroundColor: '#f5f5f5', 
    alignItems: 'center' 
  },
  modalCancelText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#333' },
  modalConfirmBtn: { 
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 12, 
    backgroundColor: '#EF4444', 
    alignItems: 'center' 
  },
  modalConfirmText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});