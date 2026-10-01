/**
 * Wallet Top-Up Screen (PayU only)
 * Amount input → backend signed PayU params → hosted checkout in WebView →
 * backend verifies the response hash → wallet credited server-side → we refresh.
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { buildPayUHtml, parsePayURedirect } from '@/services/payment';
import { formatCurrency } from '@/utils/helpers';
import { FlowScreen, FlowHeader, PrimaryButton, ErrorMessage } from '@/components/FlowUI';
import { Colors, Spacing, BorderRadius } from '@/constants/design';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 50000;

export default function WalletTopupScreen() {
  const router = useRouter();
  const { amount: paramAmount } = useLocalSearchParams<{ amount?: string }>();

  const { wallet, startTopup, refreshAfterPayment, isProcessing } = useWalletStore();
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
      setCheckout({ html: buildPayUHtml(res.payuParams, res.payuUrl) });
    } else {
      showToast(res.error || 'Failed to initiate payment', 'error');
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
        <Ionicons name="person-circle-outline" size={80} color={Colors.text.muted} />
        <Text style={styles.authTitle}>Login Required</Text>
        <Text style={styles.authSubtitle}>Please login to add money to your wallet</Text>
        <View style={{ width: '100%', marginTop: Spacing[5] }}>
          <PrimaryButton label="Login / Sign Up" onPress={() => router.push('/login')} />
        </View>
      </View>
    );
  }

  if (result) {
    return (
      <FlowScreen>
        <FlowHeader eyebrow="PAYMENT" title={result === 'success' ? 'Payment successful' : 'Payment failed'} />
        <View style={styles.resultCard}>
          <Ionicons
            name={result === 'success' ? 'checkmark-circle' : 'close-circle'}
            size={72}
            color={result === 'success' ? Colors.semantic.success : Colors.semantic.error}
          />
          <Text style={styles.resultAmount}>{formatCurrency(parseFloat(amount) || 0)}</Text>
          <Text style={styles.resultText}>
            {result === 'success'
              ? 'Amount added to your wallet.'
              : 'The payment was declined or cancelled. Your wallet was not charged.'}
          </Text>
          <View style={{ width: '100%', marginTop: Spacing[6] }}>
            <PrimaryButton label="Back to wallet" onPress={() => router.back()} />
          </View>
          {result === 'failed' ? (
            <View style={{ width: '100%', marginTop: Spacing[3] }}>
              <PrimaryButton
                label="Try again"
                variant="outline"
                onPress={() => setResult(null)}
              />
            </View>
          ) : null}
        </View>
      </FlowScreen>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <FlowHeader onBack={() => router.back()} eyebrow="WALLET" title="Add money" subtitle="Securely add funds to your LocalBuddy wallet with PayU." />

        {/* Current Balance (real server data via wallet store) */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Wallet Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(wallet?.balance || 0)}</Text>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
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
            {QUICK_AMOUNTS.map((amt) => (
              <Text
                key={amt}
                onPress={() => setAmount(String(amt))}
                style={[styles.quickAmountBtn, amount === String(amt) && styles.quickAmountBtnSelected]}
              >
                ₹{amt.toLocaleString('en-IN')}
              </Text>
            ))}
          </View>
        </View>

        <ErrorMessage message={error} />

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(parseFloat(amount) || 0)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryLabel}>Total payable</Text>
            <Text style={styles.summaryTotalValue}>{formatCurrency(parseFloat(amount) || 0)}</Text>
          </View>
        </View>

        <PrimaryButton
          label="Pay with PayU"
          onPress={handleAddMoney}
          loading={isProcessing}
          disabled={!amount || parseFloat(amount) <= 0}
        />

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
            <Text onPress={() => setCheckout(null)} style={styles.webviewClose}>Cancel</Text>
          </View>
          {checkout ? (
            <WebView
              source={{ html: checkout.html }}
              onNavigationStateChange={onNav}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color={Colors.brand.primary} />
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
  scrollContent: { padding: Spacing[6], paddingBottom: Spacing[12] },
  authPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
  authTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginTop: Spacing[4] },
  authSubtitle: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing[2] },
  balanceCard: {
    backgroundColor: Colors.brand.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing[6],
    marginBottom: Spacing[6],
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  balanceAmount: { color: '#fff', fontSize: 32, fontWeight: '700', marginTop: Spacing[2] },
  section: { marginBottom: Spacing[6] },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.text.primary, marginBottom: Spacing[3] },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    paddingHorizontal: Spacing[4],
  },
  currencySymbol: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, marginRight: Spacing[2] },
  amountInput: { flex: 1, fontSize: 22, fontWeight: '700', color: Colors.text.primary, paddingVertical: Spacing[4] },
  quickAmountsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginTop: Spacing[3] },
  quickAmountBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface.elevated,
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    overflow: 'hidden',
  },
  quickAmountBtnSelected: { backgroundColor: Colors.brand.primary, color: '#fff' },
  summaryCard: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[5],
    marginBottom: Spacing[6],
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing[2] },
  summaryLabel: { color: Colors.text.secondary, fontSize: 14 },
  summaryValue: { color: Colors.text.primary, fontSize: 14, fontWeight: '600' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: Colors.border.light, marginTop: Spacing[2], paddingTop: Spacing[3] },
  summaryTotalValue: { color: Colors.text.primary, fontSize: 18, fontWeight: '700' },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing[5], gap: Spacing[1] },
  securityText: { color: Colors.text.muted, fontSize: 12 },
  resultCard: { alignItems: 'center', padding: Spacing[6], gap: Spacing[3] },
  resultAmount: { fontSize: 28, fontWeight: '700', color: Colors.text.primary, marginTop: Spacing[2] },
  resultText: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center' },
  webviewContainer: { flex: 1, backgroundColor: '#fff' },
  webviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  webviewTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  webviewClose: { color: Colors.brand.primary, fontSize: 14, fontWeight: '600' },
  webviewLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  webviewLoadingText: { marginTop: Spacing[3], color: Colors.text.secondary },
});
