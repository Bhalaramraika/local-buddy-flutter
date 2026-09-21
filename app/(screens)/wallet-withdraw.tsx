/**
 * Wallet Withdraw Screen
 * Withdraw money from wallet to bank account
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency } from '@/utils/helpers';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export default function WalletWithdrawScreen() {
  const router = useRouter();
  const { amount: paramAmount } = useLocalSearchParams<{ amount?: string }>();
  
  const { 
    wallet, 
    bankAccounts,
    defaultBankAccount,
    withdraw,
    isWithdrawing,
    fetchBankAccounts,
  } = useWalletStore();
  
  const { user, isAuthenticated } = useAuthStore();
  const { showToast, showModal, hideModal, setGlobalLoading } = useUIStore();
  
  const [amount, setAmount] = useState<string>(paramAmount || '');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(defaultBankAccount?.id || null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  });
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  useEffect(() => {
    if (paramAmount && !amount) {
      setAmount(paramAmount);
    }
    // Fetch bank accounts on mount
    fetchBankAccounts();
  }, [paramAmount, amount, fetchBankAccounts]);

  const handleQuickAmount = (quickAmount: number) => {
    const maxWithdrawable = wallet?.balance || 0;
    if (quickAmount > maxWithdrawable) {
      showToast(`Insufficient balance. Max: ${formatCurrency(maxWithdrawable)}`, 'error');
      return;
    }
    setAmount(String(quickAmount));
    setCustomAmount('');
    setShowCustomInput(false);
  };

  const handleCustomAmount = (text: string) => {
    setCustomAmount(text);
    setAmount(text);
    setShowCustomInput(true);
  };

  const validateAmount = (): boolean => {
    const numAmount = parseFloat(amount);
    const maxWithdrawable = wallet?.balance || 0;
    
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return false;
    }
    if (numAmount < 100) {
      showToast('Minimum withdrawal amount is ₹100', 'error');
      return false;
    }
    if (numAmount > maxWithdrawable) {
      showToast(`Insufficient balance. Available: ${formatCurrency(maxWithdrawable)}`, 'error');
      return false;
    }
    if (numAmount > 100000) {
      showToast('Maximum withdrawal per transaction is ₹1,00,000', 'error');
      return false;
    }
    if (!selectedAccountId) {
      showToast('Please select a bank account', 'error');
      return false;
    }
    return true;
  };

  const handleWithdraw = async () => {
    if (!validateAmount()) return;
    if (!isAuthenticated) {
      showToast('Please login to withdraw money', 'error');
      router.push('/login');
      return;
    }

    setIsProcessing(true);
    setGlobalLoading(true);

    try {
      const numAmount = parseFloat(amount);
      const selectedAccount = bankAccounts.find(acc => acc.id === selectedAccountId);
      
      if (!selectedAccount) {
        throw new Error('Selected bank account not found');
      }

      const result = await withdraw({
        amount: numAmount,
        bankAccountId: selectedAccountId,
        description: `Withdrawal to ${selectedAccount.bankName} ending ${selectedAccount.accountNumber.slice(-4)}`,
      });

      if (result) {
        showToast(`₹${numAmount} withdrawn successfully!`, 'success');
        router.back();
      } else {
        showToast('Withdrawal failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Withdraw error:', error);
      showToast('Withdrawal failed. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
      setGlobalLoading(false);
    }
  };

  const handleAddBankAccount = async () => {
    if (!newAccount.accountHolderName.trim() ||
        !newAccount.accountNumber.trim() ||
        !newAccount.ifscCode.trim() ||
        !newAccount.bankName.trim()) {
      showToast('Please fill all fields', 'error');
      return;
    }

    // Validate IFSC code format
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(newAccount.ifscCode.toUpperCase())) {
      showToast('Please enter a valid IFSC code', 'error');
      return;
    }

    // Validate account number (9-18 digits)
    const accNumRegex = /^\d{9,18}$/;
    if (!accNumRegex.test(newAccount.accountNumber)) {
      showToast('Please enter a valid account number', 'error');
      return;
    }

    setIsAddingAccount(true);
    try {
      // In a real app, this would call an API to add the bank account
      // For now, we'll simulate adding it to the store
      showToast('Bank account added successfully!', 'success');
      setShowAddAccountModal(false);
      setNewAccount({
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
      });
    } catch (error) {
      showToast('Failed to add bank account', 'error');
    } finally {
      setIsAddingAccount(false);
    }
  };

  const renderBankAccount = (account: typeof bankAccounts[0]) => {
    const isSelected = selectedAccountId === account.id;
    const isDefault = account.isDefault;
    
    return (
      <TouchableOpacity
        style={[
          styles.bankAccountCard,
          isSelected && styles.bankAccountCardSelected,
        ]}
        onPress={() => setSelectedAccountId(account.id)}
      >
        <View style={styles.bankAccountHeader}>
          <View style={styles.bankInfo}>
            <Text style={styles.bankName}>{account.bankName}</Text>
            <Text style={styles.accountNumber}>
              **** **** **** {account.accountNumber.slice(-4)}
            </Text>
          </View>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>
        <View style={styles.bankAccountDetails}>
          <Text style={styles.accountHolderName}>{account.accountHolderName}</Text>
          <Text style={styles.ifscCode}>IFSC: {account.ifscCode}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#4F46E5" style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  const renderQuickAmount = (quickAmount: number) => {
    const maxWithdrawable = wallet?.balance || 0;
    const isDisabled = quickAmount > maxWithdrawable;
    const isSelected = amount === String(quickAmount) && !showCustomInput;
    
    return (
      <TouchableOpacity
        style={[
          styles.quickAmountBtn,
          isSelected && styles.quickAmountBtnSelected,
          isDisabled && styles.quickAmountBtnDisabled,
        ]}
        onPress={() => !isDisabled && handleQuickAmount(quickAmount)}
        disabled={isDisabled}
      >
        <Text style={[
          styles.quickAmountText,
          isSelected && styles.quickAmountTextSelected,
          isDisabled && styles.quickAmountTextDisabled,
        ]}>
          ₹{quickAmount.toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.authPrompt}>
        <MaterialCommunityIcons name="account-circle" size={80} color="#ccc" />
        <Text style={styles.authTitle}>Login Required</Text>
        <Text style={styles.authSubtitle}>
          Please login to withdraw money from your wallet
        </Text>
        <TouchableOpacity style={styles.authButton} onPress={() => router.push('/login')}>
          <Text style={styles.authButtonText}>Login / Sign Up</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const maxWithdrawable = wallet?.balance || 0;
  const hasBankAccounts = bankAccounts.length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(maxWithdrawable)}
          </Text>
          <Text style={styles.maxWithdrawable}>
            Max withdrawable: {formatCurrency(maxWithdrawable)}
          </Text>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Withdrawal Amount</Text>
          
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleCustomAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
              maxLength={6}
              autoFocus
            />
          </View>

          {/* Quick Amount Buttons */}
          <Text style={styles.quickAmountLabel}>Quick Amount</Text>
          <View style={styles.quickAmountsRow}>
            {QUICK_AMOUNTS.map(renderQuickAmount)}
          </View>

          {/* Custom Amount Toggle */}
          <TouchableOpacity 
            style={[
              styles.customAmountBtn,
              showCustomInput && styles.customAmountBtnActive,
            ]}
            onPress={() => setShowCustomInput(!showCustomInput)}
          >
            <Text style={[
              styles.customAmountBtnText,
              showCustomInput && styles.customAmountBtnTextActive,
            ]}>
              {showCustomInput ? 'Use Quick Amounts' : 'Enter Custom Amount'}
            </Text>
            <Ionicons 
              name={showCustomInput ? 'remove-circle' : 'add-circle'} 
              size={20} 
              color="#4F46E5" 
            />
          </TouchableOpacity>
        </View>

        {/* Bank Account Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Bank Account</Text>
            {hasBankAccounts && (
              <TouchableOpacity 
                style={styles.addAccountBtn}
                onPress={() => setShowAddAccountModal(true)}
              >
                <Ionicons name="add" size={20} color="#4F46E5" />
                <Text style={styles.addAccountBtnText}>Add New</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {hasBankAccounts ? (
            <View style={styles.bankAccountsList}>
              {bankAccounts.map(renderBankAccount)}
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addFirstAccountBtn}
              onPress={() => setShowAddAccountModal(true)}
            >
              <MaterialCommunityIcons name="bank-plus" size={48} color="#4F46E5" />
              <Text style={styles.addFirstAccountText}>Add Your First Bank Account</Text>
              <Text style={styles.addFirstAccountSubtext}>
                Required to withdraw money
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Withdrawal Amount</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(parseFloat(amount) || 0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Processing Fee</Text>
            <Text style={styles.summaryValue}>
              {parseFloat(amount) > 0 ? '₹0' : '₹0'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST (18%)</Text>
            <Text style={styles.summaryValue}>
              {parseFloat(amount) > 0 ? '₹0' : '₹0'}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryLabel}>You Will Receive</Text>
            <Text style={styles.summaryTotalValue}>
              {formatCurrency(parseFloat(amount) || 0)}
            </Text>
          </View>
        </View>

        {/* Withdraw Button */}
        <TouchableOpacity
          style={[
            styles.withdrawBtn,
            isProcessing && styles.withdrawBtnDisabled,
            !hasBankAccounts && styles.withdrawBtnDisabled,
            maxWithdrawable < 100 && styles.withdrawBtnDisabled,
          ]}
          onPress={handleWithdraw}
          disabled={isProcessing || !hasBankAccounts || maxWithdrawable < 100}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <Ionicons name="arrow-down-circle" size={24} color="#fff" />
              <Text style={styles.withdrawBtnText}>Withdraw Money</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={18} color="#4F46E5" />
            <Text style={styles.infoText}>
              Minimum withdrawal: ₹100 • Maximum per transaction: ₹1,00,000
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time" size={18} color="#4F46E5" />
            <Text style={styles.infoText}>
              Funds credited within 24 hours (UPI: Instant)
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={18} color="#4F46E5" />
            <Text style={styles.infoText}>
              Secured transactions • No hidden charges
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add Bank Account Modal */}
      <Modal visible={showAddAccountModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Bank Account</Text>
              <TouchableOpacity onPress={() => setShowAddAccountModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Account Holder Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newAccount.accountHolderName}
                  onChangeText={(text) => setNewAccount({...newAccount, accountHolderName: text})}
                  placeholder="As per bank records"
                  autoCapitalize="words"
                />
              </View>
              
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Account Number</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newAccount.accountNumber}
                  onChangeText={(text) => setNewAccount({...newAccount, accountNumber: text})}
                  placeholder="Enter account number"
                  keyboardType="numeric"
                  maxLength={18}
                />
              </View>
              
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>IFSC Code</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newAccount.ifscCode}
                  onChangeText={(text) => setNewAccount({...newAccount, ifscCode: text.toUpperCase()})}
                  placeholder="e.g., SBIN0001234"
                  autoCapitalize="characters"
                  maxLength={11}
                />
              </View>
              
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Bank Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newAccount.bankName}
                  onChangeText={(text) => setNewAccount({...newAccount, bankName: text})}
                  placeholder="e.g., State Bank of India"
                  autoCapitalize="words"
                />
              </View>
              
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Set as Default</Text>
                <TouchableOpacity style={styles.defaultToggle}>
                  <View style={[
                    styles.toggleTrack,
                    bankAccounts.length === 0 && styles.toggleTrackActive,
                  ]}>
                    <View style={[
                      styles.toggleThumb,
                      bankAccounts.length === 0 && styles.toggleThumbActive,
                    ]} />
                  </View>
                  <Text style={styles.defaultToggleText}>
                    {bankAccounts.length === 0 ? 'First account will be default' : 'Make this my default account'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => setShowAddAccountModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalConfirmBtn,
                  isAddingAccount && styles.modalConfirmBtnDisabled,
                ]}
                onPress={handleAddBankAccount}
                disabled={isAddingAccount}
              >
                {isAddingAccount ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Add Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  balanceCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  maxWithdrawable: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  addAccountBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#4F46E5',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currencySymbol: {
    fontSize: 28,
    fontFamily: 'Inter_600SemiBold',
    color: '#10B981',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    paddingVertical: 16,
  },
  quickAmountLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 12,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickAmountBtnSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  quickAmountBtnDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.5,
  },
  quickAmountText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#374151',
  },
  quickAmountTextSelected: {
    color: '#fff',
  },
  quickAmountTextDisabled: {
    color: '#9CA3AF',
  },
  customAmountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customAmountBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  customAmountBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  customAmountBtnTextActive: {
    color: '#10B981',
  },
  bankAccountsList: {
    gap: 12,
  },
  bankAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bankAccountCardSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  bankAccountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  defaultBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  bankAccountDetails: {
    flex: 1,
  },
  accountHolderName: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#374151',
    marginBottom: 2,
  },
  ifscCode: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#9CA3AF',
  },
  checkIcon: {
    marginLeft: 8,
  },
  addFirstAccountBtn: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
  },
  addFirstAccountText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#4F46E5',
    marginTop: 12,
  },
  addFirstAccountSubtext: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#10B981',
  },
  withdrawBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  withdrawBtnDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  withdrawBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#374151',
    flex: 1,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  authTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  authButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
  },
  authButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  modalField: {
    marginBottom: 20,
  },
  modalFieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: '#10B981',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    marginLeft: 20,
  },
  defaultToggleText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#374151',
  },
  modalConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#10B981',
  },
  modalConfirmBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalConfirmBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});