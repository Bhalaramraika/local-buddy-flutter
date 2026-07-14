# Master Architecture & Technical Blueprint (Architecture.md)
**App Name:** Local Buddy
**Platform:** React Native Expo (Managed Workflow)
**Backend Proxy:** Next.js (App Router API) + Firebase

---

## 1. Product Intent & Migration Principle
*   **Business Model:** Hyperlocal task marketplace (Posters post tasks, Buddies complete them).
*   **Trust Stack:** ID Verification, In-app Chat, Escrow/Cash Settlement, Ratings, Live Location, SOS.
*   **Migration Principle:** 100% preservation of existing Firebase rules, database schema, and Next.js backend contracts. The mobile app only adapts the UI/UX for native iOS/Android paradigms.

---

## 2. Core Technical Architecture
*   **Mobile Framework:** React Native with Expo (Managed Workflow) using `expo-router` for file-based navigation.
*   **Styling:** NativeWind (TailwindCSS) + Reanimated for fluid transitions.
*   **State Management:** Zustand (for transient UI state, auth snapshot) + Custom Firebase Hooks (`useDoc`, `useCollection`) for real-time syncing.
*   **Database & Auth:** Firebase Auth, Firestore, Firebase Admin SDK (on Next.js).
*   **Location Stack:** `expo-location` (for background/foreground tracking) + `react-native-maps` (replaces Leaflet).
*   **External APIs (Proxied):** PayU (Payments), Cloudinary (Images), Brevo (Emails), Fast2SMS (SOS).

---

## 3. Canonical Domain Model & Firestore Topology
The React Native app must strictly adhere to this schema. No client-side alterations allowed.

### 3.1 Primary Collections
*   `users/{userId}`: 
    *   *Fields:* profile, role, KYC flags (`aadharVerified`), wallet balances (`walletBalance`, `commissionDue`), xp/level, referral metadata, skills, emergency contact, payment methods, auto-withdrawal settings, `fcmTokens`, `currentLocation`.
*   `tasks/{taskId}`:
    *   *Fields:* task content, category, budget, tip, location (lat, lng, geohash), deadline, `posterId`, `buddyId`, `paymentMode` (online/cash), status, `chatId`.
*   `chats/{chatId}`:
    *   *Fields:* participants array, taskId, lastMessage summary.
    *   *Sub-collection:* `messages/{messageId}` (senderId, text, timestamp, system-messages).
*   `transactions/{transactionId}`:
    *   *Fields:* userId, taskId (optional), type (`add`, `release`, `commission_payment`, `lock`, `withdraw`), amount, gateway, status, `txnid` (PayU idempotency key).
*   `reviews/{reviewId}`:
    *   *Fields:* rating, comment, reviewerId, revieweeId.
*   `verifications/{verificationId}`:
    *   *Fields:* KYC metadata, uploaded document URLs, selfie URL, pending status.
*   `users/{userId}/notifications/{notificationId}`:
    *   *Fields:* read-state, deep-link routing path.

### 3.2 Operational Collections (Security & Limits)
*   `otp_sessions`: Tracks OTP issuance, expiry (5 mins), and attempts.
*   `user_locks`: Temporary lockout ledger (30-minute block after 5 failed OTP attempts to prevent brute-force).

---

## 4. State Machines & Business Logic (Client-Side Enforcement)

### 4.1 Task Lifecycle Status Transitions
1.  **Open:** Available in marketplace.
2.  **Assigned:** Buddy accepts. (App must create chat thread in same transaction).
3.  **Completed:** Buddy taps "Request Payment" in chat.
4.  **Paid:** Poster releases funds. (Final state).
5.  **Deleted:** Soft-delete marker; filtered out locally from feed.
*   *Reverse Transition:* **Assigned -> Open** (If cancelled by poster/buddy).

### 4.2 Wallet & Finance Execution Rules
*   **Task Creation (Online Mode):** Mobile app must execute a Firestore transaction deducting `budget + tip` from `walletBalance` immediately before writing the task.
*   **Payment Release (Online Mode):** Buddy is credited `(budget - 15% platformFee) + tip`.
*   **Payment Release (Cash Mode):** Buddy receives cash physically. App updates `commissionDue += 15% * budget`.
*   **Idempotency:** All Top-up / Commission PayU calls must check existing `transactions` using `txnid` to prevent double credits.

### 4.3 Active Edge Cases to Preserve
*   Block "Accept Task" if Buddy already has 1 active `Assigned` task.
*   Block "Accept Task" if `aadharVerified != true`.
*   Block "Accept Task" if Buddy's `commissionDue > 200`.
*   Regex block in Chat: If a 10-digit number is typed, block sending and show destructive toast.

---

## 5. Next.js API Contract Map (Mobile Integration)
The React Native app must call these endpoints via an Axios interceptor that injects the Firebase Auth Token.

### 5.1 Payment & Finance Routes
*   **`POST /api/payu/hash`**: Mobile requests SHA512 hash passing `txnid` and `amount`. (Never hash on client).
*   **`POST /api/payu/response`**: Backend handles PayU browser redirect and bounces to mobile deep-link (`localbuddy://wallet?status=success`).
*   **`POST /api/payu/webhook`**: S2S idempotency reconciliation.

### 5.2 Auth & Identity Routes
*   **`POST /api/auth/otp/send`**: Dispatches Fast2SMS OTP. Honors 3 req/10 min cap.
*   **`POST /api/auth/otp/verify`**: Validates custom token, returns `phone_{10digit}` UID.

### 5.3 Utility & Comm Routes
*   **`POST /api/upload`**: Mobile sends compressed base64. Backend proxies to Cloudinary.
*   **`POST /api/send-email`**: Brevo transactional emails.
*   **`POST /api/send-push`**: Mobile registers FCM token; backend sends notifications.
*   **`POST /api/sos/send-alert`**: Mobile sends `lat/lng`; backend dispatches Fast2SMS with Google Maps link.

---

## 6. Screen-by-Screen Native Translation Blueprint

### 6.1 Root & Onboarding
*   **`/` (Home Feed):**
    *   *Native UI:* `FlashList` for cards, native Pull-to-Refresh.
    *   *Logic:* Sorts merged feed (Open + Assigned) by Haversine distance from `user.currentLocation`. Applies priority sorting (`assigned` > `open` > `completed`).
*   **`/onboarding`:**
    *   *Native UI:* 5-step React Navigation stack (Role, Language, Bio/Photo, Age Gate >= 14, Referral).
    *   *Logic:* Transactions write to user doc. Blocks app usage until `profileCompleted == true`.

### 6.2 Task Operations
*   **`/tasks/create`:**
    *   *Native UI:* 3-step wizard (PagerView). `react-native-maps` pin selector for exact geolocation.
    *   *Logic:* Confirms escrow via bottom-sheet before online mode deduction.
*   **`/tasks/[taskId]`:**
    *   *Native UI:* Sticky bottom action bar.
    *   *Logic:* Action enablement strictly dictated by Firestore rules (e.g., only Poster can delete).
*   **`/tracking/[taskId]`:**
    *   *Native UI:* Map route.
    *   *Logic:* Uses `expo-location` background updates to refresh Buddy's `currentLocation` every 30s/50m, redrawing polyline on Poster's map.

### 6.3 Communications
*   **`/chat` & `/chat/[chatId]`:**
    *   *Native UI:* Realtime `FlashList` (inverted). Sticky composer for actions.
    *   *Logic:* Contextual bubbles for "Release Payment". Deep-link to Jitsi (`LocalBuddy-{chatId}`).

### 6.4 Wallet & KYC
*   **`/wallet` & `/wallet/pay-commission`:**
    *   *Native UI:* Balance cards, transaction timeline.
    *   *Logic:* Add Money opens `react-native-webview`. WebView intercepts deep-link on return, reconciles balances via backend, closes itself.
*   **`/verify`:**
    *   *Native UI:* Native `expo-camera` (forces live capture for selfie), `expo-image-picker` for ID docs.
    *   *Logic:* Images natively compressed, sent to `/api/upload`, returns `pending` status.

### 6.5 Settings & Safety
*   **`/sos`:**
    *   *Native UI:* Long-press gesture (3 seconds) + `expo-haptics` escalation.
    *   *Logic:* Must verify GPS permissions before firing API.
*   **`/profile` & `/leaderboard`:**
    *   *Native UI:* XP stat rings, dynamic badge rendering.
    *   *Logic:* Queries users ordered by XP (Limit 50).

---

## 7. App Folder Structure (Expo Router)

```text
/app
├── _layout.tsx                 # Context Providers, Auth Listener, FCM setup
├── index.tsx                   # Auth/Onboarding gatekeeper
├── (auth)
│   ├── login.tsx               # Request OTP
│   └── verify.tsx              # Input OTP
├── (onboarding)                # Stepper flow for new accounts
├── (tabs)
│   ├── index.tsx               # Home / Task Feed
│   ├── wallet.tsx              # Financial dashboard
│   ├── chat.tsx                # Inbox
│   └── profile.tsx             # Stats & Badges
└── (screens)
    ├── task
    │   ├── create.tsx          # Post a task
    │   └── [taskId].tsx        # Task Details
    ├── chat
    │   └── [chatId].tsx        # Messaging thread
    ├── tracking
    │   └── [taskId].tsx        # Live map tracking
    ├── wallet
    │   ├── add-money.tsx       # WebView PayU gateway
    │   └── pay-commission.tsx  # WebView PayU gateway
    └── verify.tsx              # KYC upload

8. Firestore Security Rules (Critical Mobile Parity)
The mobile app relies purely on existing server rules to prevent exploits:
Tasks: Public reads. Updates allowed ONLY if status is Open -> Assigned (by Buddy), or by active Poster/Buddy.
Chats: Reads/Writes strictly locked to arrays where userId in participants.
Transactions: Read restricted to owner. Create allowed for non-anon authenticated users.
Verifications: Read denied entirely (Admin only). Create allowed only by ownerId.
End of Document - Architecture.md