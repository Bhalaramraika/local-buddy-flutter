# Development & AI Constraints Rules (Rules.md)
**Project:** Local Buddy (Mobile App)
**Framework:** React Native Expo (Managed Workflow)
**Role of Document:** Strict boundary definition for AI Code Generators (Cursor, Copilot, etc.) and Human Developers.

---

## 1. AI & Code Generation Directives (CRITICAL)
Any AI reading this repository MUST adhere strictly to the following protocols:
*   **Zero Backend Modification:** The AI is strictly prohibited from modifying, suggesting changes to, or refactoring the Next.js backend API routes (`/api/*`), Firebase Security Rules, or Firestore Database Schema. The mobile app MUST adapt to the backend, not the other way around.
*   **Acknowledge Legacy Mismatches:** If the AI detects a mismatch (e.g., 30% commission in web localization vs. 15% in actual code), it must default to the **functional code logic (15%)** and implement it in the mobile app without attempting to "fix" the backend.
*   **No Hallucinated Libraries:** The AI must only use libraries explicitly mentioned in `Architecture.md` or native Expo libraries (`expo-xxx`). Do not invent or import unsupported React Native libraries.

---

## 2. Framework Constraints: Expo & React Native
### 2.1 Managed Workflow Absolute Law
*   **Rule:** This project operates 100% on the **Expo Managed Workflow**.
*   **Enforcement:** NEVER run `npx react-native eject` or `npx expo run:ios/android` in a way that generates standard `/ios` or `/android` folders.
*   **Native Modules:** If a third-party SDK is required, it must be integrated using Expo Config Plugins in `app.json`. Bare React Native libraries requiring manual `pod install` or `build.gradle` modifications are strictly BANNED.

### 2.2 Navigation (Expo Router)
*   **Rule:** All routing must use **Expo Router** (file-based routing).
*   **Enforcement:** Do not install or use `@react-navigation/native` directly. Use `import { router, Link } from 'expo-router';`.
*   **Deep Linking:** Use Expo Router's built-in URL parsing for handling PayU webhooks and Push Notification taps.

---

## 3. Security & Environment Variable Rules
### 3.1 Zero-Trust Client Protocol
*   **Rule:** The mobile app is an untrusted environment. It can easily be decompiled.
*   **Enforcement:** NEVER store secret keys in the app. 
    *   No PayU Merchant Salts.
    *   No Fast2SMS API Keys.
    *   No Brevo SMTP Keys.
    *   No Firebase Admin SDK Service Accounts.
    *   No Cloudinary Secret Keys.
*   **Allowed Keys:** Only public-facing keys are allowed in `.env` (e.g., `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_MAPS_API_KEY`).

### 3.2 Data Mutability Limits
*   **Rule:** Clients cannot bypass database rules.
*   **Enforcement:** Do not write complex server-side logic in the mobile app. Trigger existing Next.js APIs or rely on Firestore security rules. For example, never calculate the final wallet deduction on the client without a Firestore transaction ensuring the user has enough balance.

---

## 4. Payment & Financial Data Rules (PayU)
### 4.1 Strict Idempotency 
*   **Rule:** Double charges will destroy platform trust.
*   **Enforcement:** When generating a hash for a payment, the `txnid` must strictly follow this exact string interpolation:
    *   For Top-ups: `` wallet--ID--${user.uid}--TIME--${Date.now()} ``
    *   For Commission: `` commission--ID--${user.uid}--TIME--${Date.now()} ``
*   **No Local Hashing:** The app must ALWAYS POST to `/api/payu/hash` to get the SHA512 hash. The JS `crypto` library must not be used on the client.

### 4.2 Untrusted Success States
*   **Rule:** A deep-link returning `status=success` from PayU is not proof of payment.
*   **Enforcement:** When the WebView redirects to the success deep-link, the UI may show a "Processing" animation, but the final success state must ONLY be rendered after confirming the updated `walletBalance` from the live Firestore snapshot.

---

## 5. UI, Styling & Platform Parity Rules
### 5.1 NativeWind & Styling
*   **Rule:** Tailwind CSS (`NativeWind v4`) is the ONLY accepted styling method.
*   **Enforcement:** Avoid `StyleSheet.create`. Do not use inline styles (`style={{ margin: 10 }}`) unless dynamically calculating dimensions (e.g., `react-native-reanimated` shared values).

### 5.2 Platform-Specific Adjustments
*   **Rule:** The app must look native on both iOS and Android.
*   **Enforcement:** 
    *   Always use `SafeAreaView` from `react-native-safe-area-context`.
    *   Wrap input-heavy screens (like Task Creation) in `KeyboardAvoidingView` (behavior="padding" for iOS, "height" for Android).
    *   Use `Platform.OS` checks if a specific native UI paradigm differs (e.g., Picker styles).

---

## 6. Performance & Memory Optimization Rules
### 6.1 List Rendering
*   **Rule:** Never use standard `ScrollView` or `FlatList` for long lists (e.g., Feed, Chat).
*   **Enforcement:** Use `@shopify/flash-list` exclusively for the Task Feed and Chat Messages to ensure 60fps scrolling and prevent memory leaks. Define accurate `estimatedItemSize`.

### 6.2 Asset & Media Management
*   **Rule:** Do not download large images repeatedly.
*   **Enforcement:** Use `expo-image` for all external media. It includes built-in disk and memory caching. 
*   **Uploads:** Before sending an image to the Cloudinary API, use `expo-image-manipulator` to compress it (max 1080x1080, 0.7 quality) to save bandwidth for users in Tier-2/3 areas (Balotra).

### 6.3 State Hook Performance
*   **Rule:** Unnecessary re-renders drain battery and slow the app.
*   **Enforcement:** Wrap all Firestore data processing functions in `useMemo` or `useCallback`.

---

## 7. Error Handling & Resilience
### 7.1 Graceful Degradation
*   **Rule:** The app must not crash when APIs fail or network drops.
*   **Enforcement:** 
    *   All Axios calls to the Next.js backend must be wrapped in `try/catch` blocks.
    *   Provide explicit Toast/Alert feedback. Do not log generic "Error occurred" to the user. Say: "Unable to process payment due to network. Don't worry, your money is safe."

### 7.2 Permission Handling
*   **Rule:** Respect user privacy and OS boundaries.
*   **Enforcement:** When requesting Camera, Location, or Notifications via Expo APIs, handle the `status !== 'granted'` case. Show a custom UI explaining *why* Local Buddy needs the permission before blindly triggering the OS prompt.

---

## 8. Specific Feature Porting Rules (Web to Native)
*   **SOS Feature:** The web uses a `setInterval` animation. On mobile, use `react-native-gesture-handler` `LongPressGestureHandler` combined with `expo-haptics` to build physical resistance into the button press.
*   **Chat Regex Blocker:** The regex that detects 10-digit numbers to prevent phone number sharing MUST be evaluated `onChangeText` in the text input, blocking the UI send button before the user even attempts to write to Firestore.
*   **Jitsi Video Calls:** Do not try to embed Jitsi in an iFrame. Use Expo `Linking.openURL()` to bounce the user to their device's browser or the native Jitsi Meet app.

---
*End of Document - Rules.md*
