# Project Implementation Blueprint (Phases.md)
**Project:** Local Buddy (Mobile App)
**Framework:** React Native Expo (Managed Workflow)
**Methodology:** Agile / 8-Sprint Mobile Migration Strategy

---

## 🧭 Phase 1: Core Infrastructure & Architecture (Sprint 1)
**Goal:** Establish the foundation, routing, styling engine, and Firebase connectivity.

### 1.1 Initialization & Libraries
*   Initialize Expo using Expo Router: `npx create-expo-app@latest -e with-router`
*   Install core dependencies: `firebase`, `zustand`, `axios`, `nativewind`, `tailwindcss`.
*   Configure `app.json` for native capabilities (Bundle ID: `com.localbuddy.app`, Permissions for Network).

### 1.2 Folder Structure & Theming Setup
*   Create the exact folder structure as defined in `Architecture.md` (e.g., `/app`, `/components`, `/store`, `/services`).
*   Configure `tailwind.config.js` with the brand colors (Indigo-600, Cyan-500, Slate-50) defined in the Design specs.

### 1.3 Service Handshakes
*   **Firebase:** Initialize the Firebase SDK in `/services/firebase.ts` using `.env` variables.
*   **Next.js Proxy:** Setup Axios in `/services/api.ts` with a request interceptor to automatically attach the Firebase `getIdToken()` for secure backend communication.

**🎯 Acceptance Criteria:**
*   App boots on Expo Go/Simulator without errors.
*   Tailwind utility classes render correctly on a test component.
*   Axios interceptor successfully prints a Firebase Auth token in the console.

---

## 🔐 Phase 2: Identity, Auth & Onboarding Gate (Sprint 2)
**Goal:** Secure the app entry points and ensure no unverified user reaches the main tabs.

### 2.1 Guest Mode & Phone Login
*   Implement `signInAnonymously()` for first-time app launches to allow feed browsing.
*   Build the Login Screen (Phone Number Input).
*   Wire up `POST /api/auth/otp/send`. Handle the 3-requests-per-10-mins logic locally and show a countdown timer.
*   Build the OTP Verification UI (10-digit input). Wire up `POST /api/auth/otp/verify`.

### 2.2 The Onboarding Transaction
*   Create a React Navigation stack in `/(onboarding)` with 5 screens:
    1. Role Selection (Poster / Buddy).
    2. Language (Hindi / English).
    3. Profile Details (Avatar upload + Bio validation of 20-50 words).
    4. Age Gate (DOB picker ensuring age >= 14).
    5. Referral Code.
*   On completion, execute a Firestore update to set `profileCompleted: true`.

**🎯 Acceptance Criteria:**
*   User can log in via OTP and is forced through onboarding.
*   Routing logic in `_layout.tsx` blocks access to `/(tabs)` if `profileCompleted` is false.

---

## 📍 Phase 3: The Hyperlocal Marketplace (Sprint 3)
**Goal:** Build the core feed where Buddies find tasks based on real-time location.

### 3.1 Location Engine
*   Install `expo-location`. Request `Foreground Location` permissions when the Home screen mounts.
*   Implement `Haversine formula` utility to calculate distance between `user.currentLocation` and `task.geohash`.

### 3.2 High-Performance Feed
*   Install `@shopify/flash-list` (replaces standard FlatList for 60fps performance).
*   Build the `TaskCard` component with dynamic status badges (Open, Assigned, Paid).
*   Create a unified feed that merges `Open` tasks and the user's `Assigned` tasks, sorted by distance and priority.
*   Add native `RefreshControl` for pull-to-refresh functionality.

**🎯 Acceptance Criteria:**
*   List scrolls flawlessly with 50+ mocked tasks.
*   Distance labels (e.g., "1.2 km away") are mathematically accurate.

---

## 💸 Phase 4: Task Creation & Escrow Logic (Sprint 4)
**Goal:** Enable Posters to create tasks and Buddies to accept them with strict database rules.

### 4.1 Task Wizard (`/tasks/create`)
*   Build a 3-step PagerView form.
*   Integrate `react-native-maps` for the Poster to drop a precise location pin.
*   Build the Pricing UI (Budget + Tip).

### 4.2 Escrow Execution (Poster Side)
*   If `paymentMode == 'online'`, verify the local Zustand `walletBalance`.
*   Execute a Firestore `writeBatch`: Deduct `budget+tip` from user doc AND create the new Task doc simultaneously. If the balance is low, trigger a modal routing to "Add Money".

### 4.3 Assignment Logic (Buddy Side)
*   Build Task Detail screen with sticky action footer.
*   When Buddy clicks "Accept", run a Firestore Transaction:
    *   Check `task.status == 'Open'`.
    *   Check `Buddy.commissionDue <= 200`.
    *   Update Task to `Assigned` and create a `chats/{chatId}` document.

**🎯 Acceptance Criteria:**
*   Wallet balances deduct instantly upon online task creation.
*   Race conditions prevented (Two Buddies cannot accept the same task).

---

## 💬 Phase 5: Real-Time Operations & Safety (Sprint 5)
**Goal:** In-app communication, location tracking, and emergency features.

### 5.1 Chat Moderation & UI
*   Build the Chat Room using an inverted `FlashList`. Listen to `messages` subcollection.
*   Implement the **Regex Security Hook**: On text input change, if a 10-digit number is detected, disable the send button and render a destructive warning.

### 5.2 Payment Handshake (In-Chat)
*   Build contextual chat bubbles for "Request Payment" (Buddy) and "Release Payment" (Poster).
*   Implement the Firestore transaction to mark task as `Paid`, deduct 15% platform fee, and credit Buddy's wallet.

### 5.3 Live Tracking & SOS
*   When a task is `Assigned`, use `expo-location` background tasks to update the Buddy's coordinates every 50 meters. Draw a polyline on the Poster's map.
*   Build the SOS Button: Implement `react-native-gesture-handler` (Long Press 3s) + `expo-haptics`. Trigger `POST /api/sos/send-alert`.

**🎯 Acceptance Criteria:**
*   Phone numbers cannot be sent in chat.
*   SOS button requires a deliberate 3-second hold with haptic feedback before firing.

---

## 🏦 Phase 6: PayU Wallet Integration (Sprint 6)
**Goal:** Real money top-ups and commission settlements.

### 6.1 Wallet Dashboard
*   Build UI for Wallet Balance, Commission Due, and Transaction History Timeline.

### 6.2 PayU WebView Flow
*   User inputs top-up amount. App generates `wallet--ID--{uid}--TIME--{timestamp}`.
*   App calls `POST /api/payu/hash` to get SHA512 signature.
*   Open `react-native-webview` rendering the PayU gateway.
*   **Reconciliation:** Monitor `onNavigationStateChange` in WebView. If URL changes to `localbuddy://wallet?status=success`, close WebView, trigger confetti, and refetch balance from Firestore.

**🎯 Acceptance Criteria:**
*   Money is successfully added without the app crashing or losing state.
*   Idempotency works (Refreshing the success page doesn't double-credit).

---

## 🛡️ Phase 7: KYC Verification & Gamification (Sprint 7)
**Goal:** Build physical trust and user retention loops.

### 7.1 KYC Camera Flow (`/verify`)
*   Install `expo-camera` and `expo-image-picker`.
*   Force the user to take a live selfie (disable gallery option for selfie step).
*   Compress images locally using `expo-image-manipulator` (0.7 quality, 1080x1080).
*   Send base64 payload to `POST /api/upload`. Save returned Cloudinary URLs to `verifications` collection.

### 7.2 Profile & XP System
*   Build Profile tab displaying XP progress bar and Level (Rookie/Pro).
*   Query `users` collection ordered by XP (limit 50) for the Leaderboard screen.

**🎯 Acceptance Criteria:**
*   Images upload successfully via proxy and consume less than 500KB of user data.
*   Unverified Buddies remain locked out of task acceptance.

---

## 🚀 Phase 8: Polish, Push Notifications & Deployment (Sprint 8)
**Goal:** Premium feel and App Store readiness.

### 8.1 Push Notifications (FCM)
*   Install `expo-notifications`. Ask for permission on startup.
*   Save the FCM device token to the `users` document array.
*   Set up tap listeners to deep-link users directly into a Chat or Task screen.

### 8.2 UI/UX Polish
*   Implement `react-native-reanimated` shared element transitions (e.g., Task Card expanding into Detail screen).
*   Add Lottie animations for empty states (e.g., "No tasks found in your area").
*   Implement skeleton loading screens instead of basic activity spinners.

### 8.3 Build & Release
*   Configure EAS (`eas.json`) with production secrets.
*   Run `eas build --platform android` for Play Store AAB.
*   Run `eas build --platform ios` for TestFlight.

**🎯 Acceptance Criteria:**
*   App runs consistently at 60fps.
*   Push notifications wake the device and route correctly.
*   Production builds compile without dependency errors.

---
*End of Document - Phases.md*
