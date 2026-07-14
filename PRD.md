# Product Requirements Document (PRD)
**Product Name:** Local Buddy
**Platform:** React Native Expo (Mobile App - iOS & Android)
**Current Stage:** Production-Ready Mobile Migration (from Web)
**Target Market:** Tier-2 & Tier-3 Indian Cities (Focus: Balotra, Rajasthan)
**Business Model:** Hyperlocal P2P Task Marketplace (15% Commission / Escrow)

---

## 1. Executive Summary & Vision
### 1.1 The Vision
Local Buddy aims to democratize the gig economy for Tier-2 and Tier-3 cities in India. While giants like Urban Company or Swiggy focus on standardized services in metros, Local Buddy focuses on **hyperlocal, unstructured micro-tasks** (e.g., dropping a tiffin, fixing a printer, standing in a queue, bringing medicines). 

### 1.2 Why Mobile Migration?
The existing Next.js web application successfully validated the idea, but a true hyperlocal marketplace requires hardware-level capabilities that web browsers restrict:
*   **Persistent Trust:** Hardware-backed Push Notifications (FCM) ensure Buddies don't miss urgent tasks.
*   **Live Tracking:** Background Geolocation (`expo-location`) is strictly required for the Poster's peace of mind.
*   **Instant Safety:** A hardware-linked SOS gesture (long-press with haptics) is impossible on the web.
*   **Hardware Access:** Native camera compression prevents users from uploading 10MB images and crashing the server on slow 4G networks.

---

## 2. Market Context & User Psychology (Tier-2/3 Focus)
Building for cities like Balotra requires acknowledging specific user behaviors:
*   **Trust Deficit:** Users are hesitant to pay online before the work is done. Hence, the **Escrow Model** (money locked in wallet, released post-completion) and **Cash Mode** are critical.
*   **Network Variability:** The app must load fast and use aggressive caching (Shimmer screens, `expo-image`) to survive patchy 4G networks.
*   **Platform Bypass Risk:** If users share phone numbers, they will bypass the platform to avoid the 15% commission. The in-app chat must strictly block phone numbers.

---

## 3. User Personas
### 3.1 The "Poster" (Demand Side)
*   **Profile:** Shop owner, working professional, or a homemaker (Age: 25-55).
*   **Goal:** Needs to outsource a low-skill, time-consuming task instantly.
*   **Pain Points:** Cannot find reliable help locally; afraid of strangers entering their premises or stealing money.
*   **App Expectation:** Simplicity, upfront pricing, live tracking, and an SOS guarantee.

### 3.2 The "Buddy" (Supply Side)
*   **Profile:** College student, early freelancer, or part-time worker (Age: 18-26).
*   **Goal:** Wants to earn pocket money flexibly without joining a full-time delivery fleet.
*   **Pain Points:** Exploitation, delayed payments, lack of professional identity.
*   **App Expectation:** Instant payout (wallet withdrawal), fair ratings, gamified XP, and clear task boundaries.

---

## 4. Core Feature Specifications (Micro-Level Depth)

### 4.1 Authentication & Secure Onboarding
**Objective:** Frictionless entry but strict verification before any transaction.
*   **Guest Mode:** Anonymous Auth allows users to browse the feed without logging in. (Increases conversion rate).
*   **OTP Login:** 10-digit phone number -> Custom Token via backend (`/api/auth/otp/send`). 
    *   *Security:* 3 requests per 10 mins. 5 wrong attempts lock the account for 30 minutes.
*   **5-Step Onboarding Gate:**
    *   If `profileCompleted == false`, block access to Tabs.
    *   Collect: Role, Language (Hindi/English), Avatar (via proxy to Cloudinary), DOB (Must be > 14 years to comply with labor laws), and optional Referral Code.

### 4.2 The Task Marketplace Engine
**Objective:** The heart of the app. Must prevent race conditions.
*   **Task Creation (Poster):**
    *   3-Step Wizard: Details -> Location (Native Map Pin) -> Pricing (Budget + Tip).
    *   *Wallet Lock:* If `Payment Mode = Online`, the system strictly checks `walletBalance >= (budget+tip)`. A Firestore transaction deducts this amount instantly upon creation.
*   **Task Feed (Buddy):**
    *   Renders via `@shopify/flash-list` for 60fps scrolling.
    *   Tasks are sorted dynamically by Haversine distance (`geohash`) from the Buddy's live location.
*   **Task Acceptance Logic (Strict Rules):**
    *   Rule 1: Buddy MUST be KYC Verified.
    *   Rule 2: Buddy cannot have an existing `Assigned` task (No multitasking to ensure quality).
    *   Rule 3: Buddy's `commissionDue` MUST be <= ₹200. (Prevents Buddies from doing only cash tasks and never paying the platform fee).

### 4.3 Real-Time Chat & Escrow Payouts
**Objective:** Communication and financial settlement in one place.
*   **Thread Creation:** A chat document is generated automatically the moment a task transitions to `Assigned`.
*   **Regex Moderation:** Client-side regex actively scans the text input for 10-digit sequences. If detected, the send button disables, and a red toast warns the user.
*   **Payment Handshake:**
    *   Buddy taps **"Request Payment"** -> Sends a system message bubble.
    *   Poster taps **"Release Payment"** -> Triggers Firestore Transaction.
    *   *Online Mode:* Poster funds transferred to Buddy (minus 15% platform fee).
    *   *Cash Mode:* Task marked paid. App adds `15% of budget` to Buddy's `commissionDue` ledger.

### 4.4 Wallet & Financial Integrity (PayU)
**Objective:** Flawless handling of top-ups and commission settlements.
*   **Architecture:** Zero client-side hashing. Mobile calls `/api/payu/hash`.
*   **Idempotency (Double-Charge Prevention):** Every transaction ID (`txnid`) uses a strict format: `wallet--ID--{uid}--TIME--{timestamp}`. The backend webhook strictly checks this before updating balances.
*   **WebView Integration:** The app opens `react-native-webview` for the PayU gateway. Once the URL shifts to the success deep-link (`localbuddy://wallet?status=success`), the WebView closes and triggers a Firestore refetch.

### 4.5 Trust Stack: KYC, SOS & Live Tracking
**Objective:** Build absolute physical safety and community trust.
*   **Live Tracking:** Once a task is `Assigned`, the app uses `expo-location` to fetch Buddy coordinates every 50 meters, updating Firestore. The Poster sees a live polyline on their map.
*   **KYC Verification (`/verify`):** 
    *   Forces live camera capture for selfie (no gallery uploads to prevent spoofing). 
    *   Documents are compressed heavily before Cloudinary upload.
*   **SOS Feature:**
    *   A persistent button on active tasks. Requires a 3-second long press.
    *   *Feedback:* Escalating haptic vibrations.
    *   *Action:* Triggers `/api/sos/send-alert`, dispatching a Fast2SMS alert with live Google Maps coordinates to the emergency contact.

### 4.6 Gamification & Retention Engine
**Objective:** Make Buddies addicted to completing tasks efficiently.
*   **XP System:** Every completed task grants XP (e.g., +50 XP).
*   **Levels:** Users rank up from "Rookie" to "Pro" to "Elite". Future phases will offer reduced commission fees for Elite Buddies.
*   **Leaderboard:** Global ranking of the top 50 Buddies based on XP, encouraging competitive task completion.
*   **Badges:** Visual flairs on the profile (e.g., "5-Star Streak").

---

## 5. Task State Machine Diagram
This exact flow must be respected by the mobile UI state at all times:

| State | Who Actions It? | Backend Mutation / Trigger |
| :--- | :--- | :--- |
| **Open** | Poster | `walletBalance` deducted (if online mode). |
| **Assigned**| Buddy | `chats` document created. Task locked to Buddy. |
| **Completed**| Buddy | Chat system-message sent to Poster. |
| **Paid** | Poster | Wallet credited / `commissionDue` incremented. |
| **Cancelled**| Either | If Assigned, reverts to Open. If Open, deletes. |

---

## 6. Non-Functional Requirements (NFRs)
### 6.1 Performance Parameters
*   **Time to Interactive (TTI):** App must load and show the Task Feed within 2.5 seconds on a mid-range Android (e.g., Redmi Note 10).
*   **Scroll Fluidity:** `FlashList` must guarantee zero frame drops while rendering 50+ task cards.
*   **Battery Optimization:** Background location tracking must pause immediately once a task transitions to `Paid` or `Cancelled`.

### 6.2 Data Security & Privacy
*   **Zero Secrets Policy:** No API keys for PayU, Cloudinary, Fast2SMS, or Brevo will exist in the Expo codebase.
*   **Rule Enforcement:** The React Native app must never calculate the final payout amounts locally. It only passes intents to Firestore, relying on backend Security Rules to validate math.

---

## 7. Out of Scope for V1 Mobile MVP
To prevent scope creep and launch faster, the following are deferred to V2:
*   In-app dispute resolution center (currently handled manually via admin).
*   Complex multi-stop delivery routes.
*   Subscription plans for power-posters.

---
*End of PRD - Master Document*
