import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated as RNAnimated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/design';
import { FlowScreen, PrimaryButton, OutlineButton } from '@/components/FlowUI';

export default function WelcomeScreen() {
  const router = useRouter();

  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(50)).current;
  const scaleAnim = useRef(new RNAnimated.Value(0.8)).current;
  const showContentRef = useRef(false);
  const [showContent, setShowContent] = React.useState(false);

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      RNAnimated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      RNAnimated.timing(scaleAnim, {
        toValue: 1,
        delay: 200,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowContent(true);
    });
  }, []);

  const continueToAuth = () => {
    router.replace('/login');
  };

  const continueAsGuest = () => {
    router.replace('/login');
  };

  return (
    <FlowScreen style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.heroSection}>
        {/* Decorative background elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />

        {/* App Logo & Branding */}
        <RNAnimated.View
          style={[
            styles.iconContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconBackground}>
            <Ionicons name="people-outline" size={48} color={Colors.brand.primary} />
          </View>
          <View style={styles.iconPulse} />
        </RNAnimated.View>

        <RNAnimated.Text
          style={[
            styles.eyebrow,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          LOCAL BUDDY
        </RNAnimated.Text>
        <RNAnimated.Text
          style={[
            styles.title,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          Small help, close to home.
        </RNAnimated.Text>
        <RNAnimated.Text
          style={[
            styles.subtitle,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          Find trusted local help for everyday tasks, or earn by helping people around you.
        </RNAnimated.Text>

        {/* Feature highlights */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="flash-outline" size={20} color={Colors.brand.primary} />
            </View>
            <Text style={styles.featureText}>Quick & Easy</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.brand.secondary} />
            </View>
            <Text style={styles.featureText}>Verified Buddies</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="cash-outline" size={20} color={Colors.semantic.success} />
            </View>
            <Text style={styles.featureText}>Instant Payments</Text>
          </View>
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={[styles.buttonContainer, showContent && styles.buttonContainerVisible]}>
        <PrimaryButton
          label="Get Started"
          onPress={continueToAuth}
          size="lg"
          variant="primary"
        />
        <OutlineButton
          label="I already have an account"
          onPress={continueAsGuest}
          size="lg"
        />
        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text style={styles.linkText}>Terms of Service</Text>{' '}
          and{' '}
          <Text style={styles.linkText}>Privacy Policy</Text>
        </Text>
      </View>
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[8],
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Colors.brand.primary + '0A',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.brand.secondary + '0A',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: '50%',
    right: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.brand.primary + '05',
  },
  iconContainer: {
    marginBottom: Spacing[6],
    position: 'relative',
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.elevated,
  },
  iconPulse: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: Colors.brand.primary + '30',
  },
  eyebrow: {
    color: Colors.brand.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: Spacing[3],
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.text.primary,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: Spacing[8],
    paddingHorizontal: Spacing[4],
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 340,
    marginTop: Spacing[8],
    marginBottom: Spacing[10],
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  featureText: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[4],
    paddingTop: Spacing[2],
    opacity: 0,
  },
  buttonContainerVisible: {
    opacity: 1,
  },
  termsText: {
    textAlign: 'center',
    color: Colors.text.muted,
    fontSize: 12,
    lineHeight: 20,
    marginTop: Spacing[6],
  },
  linkText: {
    color: Colors.brand.primary,
    fontWeight: '700',
  },
});
