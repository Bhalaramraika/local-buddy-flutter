/**
 * Wallet Top-Up Screen (PayU only) — Soft Modern
 * Cocoa balance card, big rupee input, quick-amount pills,
 * green "Pay" CTA (positive money action), hosted checkout modal.
 * Payment flow logic unchanged.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { buildPayUHtml, parsePayURedirect } from '@/services/payment';
import { formatCurrency } from '@/utils/helpers';
import { SoftButton, ScreenHeader } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 50000;

export default function WalletTopupScreen() {
  const router = useRouter();
  const { amount: paramAmount } = useLocalSearchParams<{ amount?: string }>();

  const { wallet, balance, startTopup, refreshAfterPayment, isProcessing } = useWalletStore();
  const currentBalance = wallet?.balance ?? balance.available;
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();

  const [amount, setAmount] = useState<string>(paramAmount || '');
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{ html: string } | null>(null);
  const [result, setResult] = useState<'success' | 'failed' | null>(null);

  const validate = (): boolean => {
    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError(`Enter a valid amount (₹${MIN_AMOUNT} – ₹${MAX_AMOUNT})`);
      return false;
    }
    if (num < MIN_AMOUNT) {
      setError(`Minimum amount is ₹${MIN_AMOUNT}`);
      return false;
    }
    if (num > MAX_AMOUNT) {
      setError(`Maximum amount is ₹${MAX_AMOUNT}`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleAddMoney = async () => {
    if (!validate()) return;
    if (!isAuthenticated) {
      showToast('Please login to add money', 'error');
      router.push('/login');
      return;
    }
    const res = await startTopup(parseFloat(amount));
    if ('payuParams' in res) {
      setError(null);
      setCheckout({ html: buildPayUHtml(res.payuParams, res.payuUrl) });
    } else {
      const msg = (res as any).error || 'Failed to initiate payment';
      // Always show the exact server message — inline (stays visible) + toast
      setError(msg);
      showToast(msg, 'error');
      if (String(msg).toLowerCase().includes('kyc')) {
        Alert.alert(
          'Complete KYC required',
          'PayU payments require verified KYC. Please complete your KYC first.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Complete KYC', onPress: () => router.push('/(screens)/kyc-status') },
          ]
        );
      }
    }
  };

  const onNav = (nav: WebViewNavigation) => {
    const parsed = parsePayURedirect(nav.url);
    if (parsed.done) {
      setCheckout(null);
      setResult(parsed.status);
      if (parsed.status === 'success') {
        refreshAfterPayment();
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.authPrompt}>
        <MotiView from={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 450 }} style={{ alignItems: 'center' }}>
          <View style={styles.authIconWrap}>
            <Ionicons name="wallet" size={40} color={Colors.brand.accent} />
          </View>
          <Text style={styles.authTitle}>Login Required</Text>
          <Text style={styles.authSubtitle}>Please login to add money to your wallet</Text>
          <SoftButton label="Login / Sign Up" variant="accent" fullWidth={false} icon="arrow-forward" onPress={() => router.push('/login')} style={{ paddingHorizontal: Spacing[8], marginTop: Spacing[5] }} withGlow />
        </MotiView>
      </View>
    );
  }

  if (result) {
    const ok = result === 'success';
    return (
      <View style={styles.resultScreen}>
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 13, stiffness: 160 }}
          style={styles.resultCard}
        >
          <View style={[styles.resultIconWrap, { backgroundColor: ok ? Colors.semantic.successSoft : Colors.semantic.errorSoft }]}>
            <Ionicons name={ok ? 'checkmark' : 'close'} size={44} color={ok ? Colors.semantic.success : Colors.semantic.error} />
          </View>
          <Text style={styles.resultTitle}>{ok ? 'Payment successful' : 'Payment failed'}</Text>
          <Text style={styles.resultAmount}>{formatCurrency(parseFloat(amount) || 0)}</Text>
          <Text style={styles.resultText}>
            {ok
              ? 'Amount added to your wallet.'
              : 'The payment was declined or cancelled. Your wallet was not charged.'}
          </Text>
          <SoftButton label="Back to wallet" variant="primary" onPress={() => router.back()} style={{ marginTop: Spacing[5] }} />
          {!ok ? (
            <SoftButton label="Try again" variant="outline" onPress={() => setResult(null)} style={{ marginTop: Spacing[3] }} />
          ) : null}
        </MotiView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Add money" subtitle="Secure top-up via PayU" onBack={() => router.back()} />
        {/* Cocoa balance card */}
        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 420 }}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceLabelRow}>
              <View style={styles.balanceIconChip}>
                <Ionicons name="wallet" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.balanceLabel}>Current Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>{formatCurrency(currentBalance)}</Text>
          </View>
        </MotiView>

        {/* Amount Input */}
        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 420, delay: 90 }} style={styles.section}>
          <Text style={styles.sectionTitle}>Enter amount</Text>
          <View style={[styles.amountInputContainer, error ? styles.amountInputError : null]}>
            <View style={styles.rupeeChip}>
              <Text style={styles.currencySymbol}>₹</Text>
            </View>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^\d.]/g, ''))}
              placeholder={`${MIN_AMOUNT} – ${MAX_AMOUNT}`}
              placeholderTextColor={Colors.text.muted}
              keyboardType="numeric"
              maxLength={6}
              autoFocus
            />
          </View>
          <View style={styles.quickAmountsRow}>
            {QUICK_AMOUNTS.map((amt) => {
              const active = amount === String(amt);
              return (
                <Pressable
                  key={amt}
                  onPress={() => setAmount(String(amt))}
                  style={[styles.quickAmountBtn, active && styles.quickAmountBtnSelected]}
                >
                  <Text style={[styles.quickAmountText, active && styles.quickAmountTextSelected]}>
                    ₹{amt.toLocaleString('en-IN')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </MotiView>

        {error ? (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 240 }} style={styles.errorRow}>
            <Ionicons name="alert-circle" size={15} color={Colors.semantic.error} />
            <Text style={styles.error}>{error}</Text>
          </MotiView>
        ) : null}

        {/* Summary */}
        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 420, delay: 180 }} style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(parseFloat(amount) || 0)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryLabel}>Total payable</Text>
            <Text style={styles.summaryTotalValue}>{formatCurrency(parseFloat(amount) || 0)}</Text>
          </View>
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 420, delay: 260 }}>
          <SoftButton
            label="Pay with PayU"
            onPress={handleAddMoney}
            loading={isProcessing}
            disabled={!amount || parseFloat(amount) <= 0}
            variant="success"
            size="lg"
            icon="lock-closed"
            withGlow
          />
        </MotiView>

        <View style={styles.securityRow}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.semantic.success} />
          <Text style={styles.securityText}>Powered by PayU • Payments verified on our servers</Text>
        </View>
      </ScrollView>

      {/* PayU hosted checkout */}
      <Modal visible={!!checkout} animationType="slide" onRequestClose={() => setCheckout(null)}>
        <View style={styles.webviewContainer}>
          <View style={styles.webviewHeader}>
            <Text style={styles.webviewTitle}>PayU Secure Checkout</Text>
            <Pressable onPress={() => setCheckout(null)} hitSlop={8}>
              <View style={styles.webviewCloseWrap}>
                <Ionicons name="close" size={15} color={Colors.semantic.error} />
                <Text style={styles.webviewClose}>Cancel</Text>
              </View>
            </Pressable>
          </View>
          {checkout ? (
            <WebView
              source={{ html: checkout.html }}
              onNavigationStateChange={onNav}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color={Colors.brand.accent} />
                  <Text style={styles.webviewLoadingText}>Connecting to PayU…</Text>
                </View>
              )}
            />
          ) : null}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { padding: Spacing[5], paddingBottom: Spacing[12] },

  authPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[8], backgroundColor: Colors.surface.primary },
  authIconWrap: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4], ...Shadows.card,
  },
  authTitle: { fontSize: 25, fontFamily: Typography.fontFamily.display, color: Colors.text.primary },
  authSubtitle: { fontSize: 14, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing[2] },

  balanceCard: {
    backgroundColor: Colors.brand.primary, borderRadius: BorderRadius.xl,
    padding: Spacing[5], marginBottom: Spacing[6], ...Shadows.button,
  },
  balanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  balanceIconChip: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11.5, fontFamily: Typography.fontFamily.medium, textTransform: 'uppercase', letterSpacing: 1 },
  balanceAmount: { color: '#FFFFFF', fontSize: 34, fontFamily: Typography.fontFamily.bold, marginTop: Spacing[2], letterSpacing: 0.3 },

  section: { marginBottom: Spacing[5] },
  sectionTitle: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginBottom: Spacing[3], marginLeft: Spacing[1] },
  amountInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: Colors.border.light, paddingLeft: Spacing[3], ...Shadows.card,
  },
  amountInputError: { borderColor: Colors.semantic.error },
  rupeeChip: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  currencySymbol: { fontSize: 20, fontFamily: Typography.fontFamily.bold, color: Colors.brand.accentPressed },
  amountInput: {
    flex: 1, fontSize: 24, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary,
    paddingVertical: Spacing[4], paddingHorizontal: Spacing[3],
  },
  quickAmountsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginTop: Spacing[3] },
  quickAmountBtn: {
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] + 2,
    borderRadius: BorderRadius.pill, backgroundColor: Colors.surface.elevated,
    borderWidth: 1.5, borderColor: Colors.border.light,
  },
  quickAmountBtnSelected: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary, ...Shadows.button },
  quickAmountText: { color: Colors.text.primary, fontSize: 13.5, fontFamily: Typography.fontFamily.semiBold },
  quickAmountTextSelected: { color: '#FFFFFF' },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing[4], marginLeft: Spacing[1] },
  error: { color: Colors.semantic.error, fontSize: 13, fontFamily: Typography.fontFamily.medium, flex: 1 },

  summaryCard: {
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    padding: Spacing[5], marginBottom: Spacing[6],
    borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing[2] },
  summaryLabel: { color: Colors.text.secondary, fontSize: 13.5, fontFamily: Typography.fontFamily.body },
  summaryValue: { color: Colors.text.primary, fontSize: 14, fontFamily: Typography.fontFamily.semiBold },
  summaryTotal: { borderTopWidth: 1, borderTopColor: Colors.border.light, marginTop: Spacing[2], paddingTop: Spacing[3] },
  summaryTotalValue: { color: Colors.brand.primary, fontSize: 19, fontFamily: Typography.fontFamily.bold },

  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing[5], gap: Spacing[1] },
  securityText: { color: Colors.text.muted, fontSize: 12, fontFamily: Typography.fontFamily.body },

  resultScreen: { flex: 1, backgroundColor: Colors.surface.primary, alignItems: 'center', justifyContent: 'center', padding: Spacing[6] },
  resultCard: {
    alignItems: 'center', backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius['2xl'],
    borderWidth: 1, borderColor: Colors.border.light, padding: Spacing[7], width: '100%', ...Shadows.elevated,
  },
  resultIconWrap: {
    width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  resultTitle: { fontSize: 24, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, textAlign: 'center' },
  resultAmount: { fontSize: 32, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary, marginTop: Spacing[2] },
  resultText: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing[2], lineHeight: 20 },

  webviewContainer: { flex: 1, backgroundColor: Colors.surface.primary },
  webviewHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.border.light,
    backgroundColor: Colors.surface.elevated,
  },
  webviewTitle: { fontSize: 16, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  webviewCloseWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.semantic.errorSoft, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[3], paddingVertical: 6,
  },
  webviewClose: { color: Colors.semantic.error, fontSize: 13, fontFamily: Typography.fontFamily.semiBold },
  webviewLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  webviewLoadingText: { marginTop: Spacing[3], color: Colors.text.secondary, fontFamily: Typography.fontFamily.body },
});
