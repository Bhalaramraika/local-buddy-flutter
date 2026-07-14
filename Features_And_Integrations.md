# Comprehensive Features & Integrations Blueprint (Hybrid DB Architecture)
**Project:** Local Buddy (Hyperlocal Task Marketplace)
**Platform:** React Native Expo (Mobile) & Next.js (API Proxy & Cron Jobs)
**Architecture Pattern:** Dual-Database Hybrid (Firebase NoSQL + Supabase PostgreSQL)
**Goal:** Maximum Scalability, Zero Vendor Lock-in, and Extreme Cost Optimization.

---

## 1. Architectural Masterplan: Why Two Databases?
To build a sustainable platform for Tier-2/3 cities (where margins are thin at 15% commission), the infrastructure must be bulletproof against scaling costs.
*   **The Problem:** Firebase bills per document read/write. Live tracking (updating location every 50 meters) and Chat (hundreds of messages) will bankrupt the startup at scale.
*   **The Solution:** We use a **Hybrid Data Layer**. 
    *   Low-frequency, relational-light data (Auth, User Profiles, Task Feed) stays on **Firebase**.
    *   High-frequency, relational-heavy data (Chat, Messages, Live Location tracking) moves to **Supabase (PostgreSQL)** using real-time WebSockets.

---

## 2. The Tech Stack & Integration Map

### 2.1 Supabase (PostgreSQL) - The High-Frequency Engine
**Role:** Handles all real-time, heavy read/write operations.
*   **Live Location Tracking (`live_locations` table):**
    *   *Feature:* When a task is 'Assigned', the Buddy's app pushes Lat/Lng coordinates directly to Supabase every 50 meters via `@supabase/supabase-js`.
    *   *Real-time:* The Poster subscribes to this Postgres row via Supabase Realtime (WebSockets) to see the Buddy moving smoothly on their native map.
*   **In-App Chat Engine (`chats` & `messages` tables):**
    *   *Feature:* 1-on-1 task communication.
    *   *Schema:* Relational mapping (`chat_id`, `task_id`, `sender_id`, `message_body`, `created_at`).
    *   *Scale:* Postgres handles millions of rows effortlessly without charging per-message read costs.
*   **Typing Indicators & Presence:** Built natively using Supabase Broadcast channels (ephemeral state that doesn’t even write to the database).

### 2.2 Firebase (Auth & NoSQL Database) - The Core State
**Role:** Handles User Identity, App Bootstrap, and Marketplace Feed.
*   **Firebase Authentication:**
    *   Handles phone OTPs (if using native Firebase Phone Auth) and Google Sign-in.
    *   Issues the primary JWT token. (This token is passed to Supabase via RLS policies to authenticate Postgres requests).
*   **Firestore Database (Low-Frequency Collections):**
    *   `users`: Stores Profile, Wallet Balance, Commission Due, KYC Status, and FCM Device Tokens.
    *   `tasks`: The marketplace. Handled via Firestore because we need complex Geohash queries (finding tasks within a 5km radius) which Firestore's NoSQL structure handles beautifully with local caching.
    *   `transactions`: The ledger for PayU escrow records.

### 2.3 FCM (Firebase Cloud Messaging) - Auto Push Server
*(Replaces all external SMS/Email tools like Fast2SMS and Brevo)*
**Role:** The single source of truth for all alerts and transactional notifications.
*   **Automated Server Triggers (Next.js Backend):**
    *   When a Buddy accepts a task, the Next.js server fires an FCM push to the Poster: *"Buddy has been assigned to your task!"*
    *   When a new message arrives in Supabase, a database webhook hits the Next.js server, which instantly sends an FCM push to the offline user.
*   **SOS Emergency Handling (FCM Over SMS):**
    *   Instead of paid SMS, the 3-second SOS hold triggers an **Aggressive High-Priority FCM Push** to the registered emergency contact's app, bypassing silent mode (Critical Alert), along with an instant alert to the Admin Retool Dashboard.

### 2.4 PayU - Financial & Escrow Gateway
**Role:** Processing all actual fiat currency movements.
*   **Escrow / Wallet Top-ups:** Posters add money to their in-app wallet via PayU (Cards/UPI). Money stays in the `walletBalance` until the task is complete.
*   **Commission Clearance:** Buddies pay their accumulated 15% platform fee via PayU when their `commissionDue` hits the ₹200 threshold lock.
*   **Security Protocol:** The React Native app NEVER computes payment hashes. It calls `POST /api/payu/hash` on the Next.js backend, opens the PayU UI in a `WebView`, and waits for the Next.js Webhook to confidently update the Firebase wallet balance.

### 5. Cloudinary - Media & Image Pipeline
**Role:** Handling, compressing, and serving user-generated images.
*   **KYC Pipeline:** Buddy takes a live selfie and ID photo via `expo-camera`.
*   **Compression:** The mobile app heavily compresses the image locally to save the user's mobile data.
*   **Proxy Upload:** App sends the base64 string to `POST /api/upload`. The Next.js server uploads it to Cloudinary securely using server-side secrets.
*   **Serving:** Cloudinary delivers images dynamically (e.g., auto-formatting to WebP, resizing avatars on the fly) via its CDN to ensure the app loads fast even on 3G/4G networks in Balotra.

### 6. Open Street Map and Live navigation*
free live map both buddy and poster location or map with live navigation।
there also have an optional open directions in Google map option 
---


## 3. Advanced Feature Map (Driven by the New Stack)

### 3.1 The "Zero-Latency" Chat Experience
*   Powered by Supabase PostgreSQL.
*   Includes client-side regex moderation (blocking 10-digit phone numbers in the UI before they even hit Supabase).
*   Contextual "Action Bubbles": Special message blocks in the chat where the Buddy clicks "Request ₹150" and the Poster clicks "Release Payment".

### 3.2 Marketplace Geofencing (Firebase)
*   When a Poster drops a pin on the map, it saves the `lat`, `lng`, and `geohash`.
*   The Buddy’s app queries Firestore for `Open` tasks matching their current geohash prefix.
*   The Haversine formula runs locally on the Buddy's phone to render accurate distances ("1.2 KM Away") without stressing the server.

### 3.3 The Financial State Machine
*   **Strict Mutability:** You cannot alter wallet balances from the client.
*   When a Poster releases payment, a **Firestore Transaction** runs:
    1. Reads Poster's wallet (Ensures they have funds).
    2. Deducts Budget + Tip.
    3. Credits Buddy's wallet with (Budget - 15% Fee) + Tip.
    4. Writes a success receipt to the `transactions` collection.
    *(If any step fails, the entire transaction rolls back, preventing lost money).*

### 3.4 Admin & Operations (Retool)
*   The founders use a Retool dashboard connected directly to both Firebase (for user approval/KYC viewing) and Supabase (for monitoring chat abuse or dispute resolution).
*   Founders can manually adjust wallet balances or ban users from this panel without touching code.

---

## 4. Why This Architecture Wins (Investor & Scale Perspective)
1.  **Cost Evasion:** By offloading Chat and Location to Supabase, we bypass the infamous "Firebase Pricing Trap". A buddy can send 10,000 location updates during a delivery, and it costs virtually nothing.
2.  **Consolidated Comms:** Dropping Brevo (Email) and Fast2SMS saves integration time and monthly fees. Relying 100% on native FCM pushes forces users to keep the app installed and notifications turned on.
3.  **Maximum Native Performance:** Expo's `FlashList` combined with Supabase WebSockets ensures the app feels as fast as WhatsApp, even on budget Android devices.

---
*End of Document - Features & Integrations (Hybrid Version)*
