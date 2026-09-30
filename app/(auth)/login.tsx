import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/design';
import { FlowScreen, PrimaryButton, TextButton, FlowHeader, FlowInput, ErrorMessage, Card, flowStyles } from '@/components/FlowUI';
import { authService, normalizeEmail } from '@/services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const requestOtp = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await authService.requestOtp(normalizedEmail);
      router.push({ pathname: '/otp', params: { email: normalizedEmail, mode: 'login' } });
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Unable to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlowScreen style={styles.container}>
      <View style={styles.backgroundDecor}>
        <View style={styles.decorTop} />
        <View style={styles.decorBottom} />
      </View>

      <View style={styles.contentContainer}>
        <FlowHeader 
          eyebrow="LOCAL BUDDY" 
          title="Welcome back" 
          subtitle="Sign in with your email to continue." 
        />

        <Card style={styles.formCard}>
          <FlowInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            error={error}
            placeholderTextColor="#94A3B8"
          />
          <ErrorMessage message={error} />

          <PrimaryButton 
            label="Continue with OTP" 
            onPress={requestOtp} 
            loading={loading}
            size="lg"
            variant="primary"
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <Pressable style={styles.socialButton} onPress={() => {}}>
              <Ionicons name="logo-google" size={24} color={Colors.text.primary} />
              <Text style={styles.socialButtonText}>Google</Text>
            </Pressable>
            <Pressable style={styles.socialButton} onPress={() => {}}>
              <Ionicons name="logo-apple" size={24} color={Colors.text.primary} />
              <Text style={styles.socialButtonText}>Apple</Text>
            </Pressable>
          </View>
        </Card>

        <View style={styles.footer}>
          <TextButton 
            label="Create a new account" 
            onPress={() => router.push('/register')} 
          />
          <TextButton 
            label="Forgot password?" 
            onPress={() => router.push('/forgot-password')} 
          />
          <TextButton 
            label="Back to welcome" 
            onPress={() => router.replace('/welcome')} 
          />
        </View>
      </View>
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
  },
  backgroundDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decorTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.brand.primary + '08',
  },
  decorBottom: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.brand.secondary + '08',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[8],
    justifyContent: 'center',
  },
  formCard: {
    padding: Spacing[6],
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing[6],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.light,
  },
  dividerText: {
    color: Colors.text.muted,
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: Spacing[4],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[4],
    marginTop: Spacing[4],
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface.secondary,
  },
  socialButtonText: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: Spacing[2],
  },
  footer: {
    paddingTop: Spacing[8],
    alignItems: 'center',
  },
});

