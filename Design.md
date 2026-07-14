# Premium Design System & Animation Blueprint (Design.md)
**Project:** Local Buddy (Mobile App)
**Design Philosophy:** Ultra-Professional, Fluid, Premium Fintech-Grade UX.
**Animation Engine:** `react-native-reanimated` (v3), `moti`, `lottie-react-native`, & `expo-blur`.

---

## 1. Core Visual Identity & Vibe
Local Buddy will not look like a basic utility app. It will feel like a premium, high-end platform where users feel absolutely safe linking their wallets and taking on tasks.
*   **The Aesthetic:** Modern, minimalist, with subtle depth. We will use absolute whites, deep premium blues, and glassmorphism (frosted glass) effects for overlays.
*   **The Motion:** Every touch must have a reaction. Zero static screens. Everything slides, fades, bounces, or morphs into place using physics-based spring animations.

---

## 2. Advanced Color Palette (Tailwind / NativeWind)
Colors must scream "Premium" and "Trust".

### 2.1 Brand Colors
*   **Premium Primary (Trust & Tech):** `bg-indigo-600` (`#4F46E5`) to `bg-indigo-900`. Used with gradients for high-priority buttons.
*   **Electric Accent (Action):** `bg-cyan-500` (`#06B6D4`). Used for glowing indicators, active tabs, and hyper-links.
*   **App Background:** `bg-slate-50` (`#F8FAFC`). An ultra-light premium grey, making the pure white cards pop out.

### 2.2 Semantic & Status Colors
*   **Success (Mint):** `text-emerald-500`, `bg-emerald-50`. Soft green for "Payment Released" or "Task Completed".
*   **Escrow/Lock (Gold):** `text-amber-500`, `bg-amber-50`. For pending verifications and wallet locks.
*   **Destructive (Rose):** `text-rose-500`, `bg-rose-50`. For SOS and cancel actions.

### 2.3 Shadows & Elevation (The "Floating" Effect)
*   **Soft Drop Shadow:** Instead of harsh black shadows, we use colored shadows. A primary button will have a faint indigo shadow (`shadow-indigo-500/30`) to look like it's glowing.
*   **Card Elevation:** Soft, diffused shadows (`shadow-xl`) that make the task cards look like they are floating above the background.

---

## 3. Typography Architecture
*   **Primary Font:** `Plus Jakarta Sans` or `Outfit` (via `expo-font`). These fonts are geometric, highly professional, and widely used in modern tech startups.
*   **Scale:**
    *   **Display:** 32px, ExtraBold, Tracking-Tight (-1px). For Wallet Balance (`₹4,500.00`).
    *   **H1:** 24px, Bold. Screen headers.
    *   **H2:** 18px, SemiBold. Card titles.
    *   **Body:** 14px, Medium, `text-slate-600`.
    *   **Label:** 12px, Bold, Uppercase, tracking-widest. For tags like `[URGENT]`.

---

## 4. The Animation Engine (Core Deliverable)
Every screen and interaction is governed by `react-native-reanimated` and `moti`. This is the exact animation catalog the AI must implement:

### 4.1 Route & Screen Transitions
*   **Shared Element Transition:** When a user taps a "Task Card" on the Home Feed, the card doesn't just open a new screen—it physically *morphs and expands* into the Task Detail screen. The title slides up, and the map expands fluidly.
*   **Bottom Tabs:** Tapping a tab bar icon triggers a subtle "bounce" (`spring` physics) and a glowing dot indicator slides smoothly to the active tab.

### 4.2 Micro-Interactions (Button & Touch)
*   **Bounciness:** EVERY button in the app uses a custom `<ScaleButton>` component. When pressed, the button scales down to `0.95` instantly, and when released, it springs back to `1.0` with a slight wobble (stiffness: 200, damping: 15).
*   **Skeleton Loaders:** No spinning wheels for data fetching. We use Shimmering Skeleton screens. A gradient wave continuously sweeps across greyed-out boxes while the feed loads.

### 4.3 Gestures & Physics
*   **Swipe to Action:** In the Chat/Task list, swiping left reveals a hidden "Cancel" or "Delete" button with a spring-loaded rubber-band effect.
*   **Bottom Sheets (`@gorhom/bottom-sheet`):** Modals (like Escrow confirmation or Filters) don't just pop up. They slide up from the bottom, allowing the user to seamlessly drag them up and down. The background blurs (`expo-blur` intensity 50) as the sheet rises.

### 4.4 High-End Lottie Animations
Instead of static SVGs, we use Lottie JSON files for premium feedback:
*   **Empty States:** A high-quality looping animation of a magnifying glass or a ghost for "No Tasks Found".
*   **Success Splash:** When a payment is successful, a 3D-style green checkmark draws itself dynamically on the screen.
*   **Confetti Cannon:** Integrated via Zustand. Releasing a payment triggers a 60fps particle system (confetti) overlay covering the entire screen for 2.5 seconds.

---

## 5. Elite UI Components Blueprint

### 5.1 Glassmorphism Tab Bar
*   The bottom navigation bar is not a solid color. It is a floating capsule (border radius 30px) positioned slightly above the bottom edge.
*   It uses `BlurView` (`expo-blur`) so users can faintly see the task feed scrolling *underneath* the tab bar. 

### 5.2 The "Action" Footer (Task Details)
*   A fixed footer at the bottom of the Task Detail screen.
*   **Gradient CTA:** The "Accept Task" button uses `expo-linear-gradient` (Indigo-500 to Cyan-500).
*   **Pulse Effect:** If a task is "Urgent", the Accept button emits a continuous, soft pulsing animation (opacity 1 to 0.6) to draw the eye immediately.

### 5.3 The Interactive Map (Tracking)
*   Custom map styling via JSON. The map hides unnecessary POIs (Points of Interest) and uses a clean, grey/blue premium color scheme.
*   **Pulsing User Location:** The Buddy's live location is not a static dot; it's a glowing blue orb with a radar-like rippling animation expanding outward.

### 5.4 SOS Trigger (Haptic & Visual Escalation)
*   **Visual:** A stark, deep-red button. When pressed and held, a white ring traces the perimeter of the button using Reanimated `StrokeDashoffset`. 
*   **Haptic Sync:** As the ring fills, the phone executes a heartbeat haptic pattern (`expo-haptics`). When the ring completes (3 seconds), a heavy vibration triggers, the screen flashes red for 100ms, and the SOS goes out.

---

## 6. Development Rules for UI/UX
*   **Strict FPS Target:** The UI thread must never drop below 60 FPS. All heavy animations must run on the UI thread using Reanimated's `useAnimatedStyle`. Do not use React `useState` for animation values.
*   **Image Caching:** Profile pictures and KYC docs must use `expo-image` with `transition={200}` to fade in smoothly once loaded from Cloudinary.
*   **Keyboard Handling:** Inputs must glide up smoothly with the keyboard. Use `react-native-keyboard-controller` for frame-perfect keyboard synchronization (preventing the input from jumping abruptly).

---
*End of Document - Design.md*
