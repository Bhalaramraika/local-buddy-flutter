/**
 * Wallet Top-Up Screen
 * Add money to wallet with multiple payment options
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency } from '@/utils/helpers';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const PAYMENT_METHODS = [
  { id: 'upi', name: 'UPI', icon: 'qr-code-scan', color: '#4F46E5' },
  { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card', color: '#10B981' },
  { id: 'netbanking', name: 'Net Banking', icon: 'bank', color: '#F59E0B' },
  { id: 'wallet', name: 'Wallet Balance', icon: 'wallet', color: '#EF4444' },
];

export default function WalletTopupScreen() {
  const router = useRouter();
  const { amount: paramAmount } = useLocalSearchParams<{ amount?: string }>();
  
  const { 
    wallet, 
    createRazorpayOrder, 
    verifyPayment, 
    addMoney,
    isRazorpayLoading,
    razorpayOrder,
  } = useWalletStore();
  
  const { user, isAuthenticated } = useAuthStore();
  const { showToast, setGlobalLoading } = useUIStore();
  
  const [amount, setAmount] = useState<string>(paramAmount || '');
  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (paramAmount && !amount) {
      setAmount(paramAmount);
    }
  }, [paramAmount, amount]);

  const handleQuickAmount = (quickAmount: number) => {
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
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return false;
    }
    if (numAmount < 10) {
      showToast('Minimum amount is ₹10', 'error');
      return false;
    }
    if (numAmount > 100000) {
      showToast('Maximum amount is ₹1,00,000', 'error');
      return false;
    }
    return true;
  };

  const handleAddMoney = async () => {
    if (!validateAmount()) return;
    if (!isAuthenticated) {
      showToast('Please login to add money', 'error');
      router.push('/login');
      return;
    }

    setIsProcessing(true);
    setGlobalLoading(true);

    try {
      const numAmount = parseFloat(amount);
      
      // Create Razorpay order
      const order = await createRazorpayOrder({
        amount: numAmount,
        currency: 'INR',
        receipt: `topup_${Date.now()}`,
      });

      if (!order) {
        throw new Error('Failed to create payment order');
      }

      // Here you would typically open Razorpay WebView or native SDK
      // For now, we'll simulate the payment flow
      showToast('Redirecting to payment...', 'info');
      
      // Simulate payment completion for demo
      setTimeout(async () => {
        try {
          const verified = await verifyPayment({
            razorpay_order_id: order.id,
            razorpay_payment_id: `pay_${Date.now()}`,
            razorpay_signature: 'signature',
          });

          if (verified) {
            await addMoney(numAmount, order.id);
            showToast(`₹${numAmount} added successfully!`, 'success');
            router.back();
          } else {
            showToast('Payment verification failed', 'error');
          }
        } catch (error) {
          showToast('Payment failed. Please try again.', 'error');
        } finally {
          setIsProcessing(false);
          setGlobalLoading(false);
        }
      }, 2000);

    } catch (error) {
      console.error('Add money error:', error);
      showToast('Failed to initiate payment', 'error');
      setIsProcessing(false);
      setGlobalLoading(false);
    }
  };

  const renderPaymentMethod = (method: typeof PAYMENT_METHODS[0]) => {
    const isSelected = selectedMethod === method.id;
    return (
      <TouchableOpacity
        style={[
          styles.paymentMethod,
          isSelected && styles.paymentMethodSelected,
        ]}
        onPress={() => setSelectedMethod(method.id)}
      >
        <View style={[styles.paymentMethodIcon, { backgroundColor: `${method.color}20` }]}>
          <MaterialCommunityIcons name={method.icon} size={24} color={method.color} />
        </View>
        <Text style={[
          styles.paymentMethodName,
          isSelected && styles.paymentMethodNameSelected,
        ]}>
          {method.name}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
        )}
      </TouchableOpacity>
    );
  };

  const renderQuickAmount = (quickAmount: number) => {
    const isSelected = amount === String(quickAmount) && !showCustomInput;
    return (
      <TouchableOpacity
        style={[
          styles.quickAmountBtn,
          isSelected && styles.quickAmountBtnSelected,
        ]}
        onPress={() => handleQuickAmount(quickAmount)}
      >
        <Text style={[
          styles.quickAmountText,
          isSelected && styles.quickAmountTextSelected,
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
          Please login to add money to your wallet
        </Text>
        <TouchableOpacity style={styles.authButton} onPress={() => router.push('/login')}>
          <Text style={styles.authButtonText}>Login / Sign Up</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Wallet Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(wallet?.balance || 0)}
          </Text>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Amount</Text>
          
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
              showCustomAmount && styles.customAmountBtnActive,
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

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethodsGrid}>
            {PAYMENT_METHODS.map(renderPaymentMethod)}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount to Add</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(parseFloat(amount) || 0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Convenience Fee</Text>
            <Text style={styles.summaryValue}>
              {parseFloat(amount) > 0 ? '₹0' : '₹0'}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryLabel}>Total Payable</Text>
            <Text style={styles.summaryTotalValue}>
              {formatCurrency(parseFloat(amount) || 0)}
            </Text>
          </View>
        </View>

        {/* Add Money Button */}
        <TouchableOpacity
          style={[
            styles.addMoneyBtn,
            isProcessing && styles.addMoneyBtnDisabled,
          ]}
          onPress={handleAddMoney}
          disabled={isProcessing || !amount || parseFloat(amount) <= 0}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.addMoneyBtnText}>Add Money</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={16} color="#10B981" />
          <Text style={styles.securityText}>
            Secured by Razorpay • 128-bit SSL Encryption • RBI Compliant
          </Text>
        </View>
      </ScrollView>
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
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    shadowColor: '#4F46E5',
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    marginBottom: 16,
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
    color: '#4F46E5',
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
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  quickAmountText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#374151',
  },
  quickAmountTextSelected: {
    color: '#fff',
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
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  customAmountBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
  },
  customAmountBtnTextActive: {
    color: '#4F46E5',
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  paymentMethod: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentMethodSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
    borderWidth: 2,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#374151',
    flex: 1,
  },
  paymentMethodNameSelected: {
    color: '#4F46E5',
    fontFamily: 'Inter_600SemiBold',
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
    color: '#4F46E5',
  },
  addMoneyBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addMoneyBtnDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  addMoneyBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 12,
  },
  securityText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#9CA3AF',
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
});