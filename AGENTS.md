# AGENTS.md — Local Buddy

> Expo HAS CHANGED — read the exact versioned docs at
> https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Architecture (MVP)
- **Frontend**: Expo (RN, SDK 57) + expo-router, TypeScript, NativeWind,
  Zustand stores (persisted), Inter fonts only.
- **Backend**: Express + TypeScript in `backend/`, single data layer =
  **Firestore** (firebase-admin). REST only under `/api/v1`. Deployed to
  **Render** via `render.yaml` + `backend/Dockerfile`.
- **Realtime**: client-side Firestore `onSnapshot` listeners in
  `services/realtime.ts` — there is NO Socket.IO server.
- **Auth**: MojoAuth Email OTP → backend issues Firebase custom token →
  client signs in with Firebase JS SDK. Identity = email (Firebase user email).
- **Mock data**: completely removed from production flow. Screens use real
  backend data, loading, and empty/error states only (no dummy arrays).
- **Money**: whole INR (not paise); PayU top-up + in-app release; the
  withdrawal feature was removed in the MVP.

## Deleted (do not reintroduce)
Prisma, Supabase, cron worker (`backend/src/jobs`), Socket.IO
(`websocket/`), `routes/{admin,upload,transactions}.ts`,
`services/{supabase,location,notifications}.ts`, `types/user.ts`,
`config/index.ts`, `jsconfig.json`, typing indicators, Razorpay references,
old onboarding screens (`(onboarding)/{permissions,kyc,profile-setup,
onboarding-referral}.tsx`), `(screens)/security-settings.tsx`.

## Onboarding (single wizard)
- `app/(onboarding)/setup.tsx` is the ONLY setup flow (welcome → setup → home).
  Steps: role → name/photo/bio → DOB (inline mini-calendar) → language
  (English/हिन्दी) → city/area → referral. Design: cream `#FFF7EC` bg, orange
  `#FF6B35` CTAs, rounded cards.
- Everything saves in ONE `PUT /users/me/profile` (AuthContext.updateProfile)
  with `profileCompleted: true`; photo goes through `uploadToCloudinary`.
- Profile edits (`edit-profile.tsx`, `account-settings.tsx`) also write via
  AuthContext (REST) — never the store-only `authStore.updateProfile`.
- Languages: only `en`/`hi`; region fixed to India (INR).
- Notification/location settings screens write through to the backend
  (`/notifications/preferences`, `/users/me/profile` preferences).

## KYC (MVP — manual approval)
- User submits docs: app → Cloudinary (upload) → `POST /api/v1/users/me/kyc` → Firestore.
  Backend sets `kyc.status: 'pending'` and adds doc metadata to `kyc.documents[]`.
- **Admin approval**: open Firebase Console → Firestore → `users/<userId>` → set
  **`kycApproved: true`**. The app listens to the user doc in realtime
  (`services/realtime.ts` → `userProfile` listener) and instantly sets
  `authStore` KYC status to `verified` + `kycStore.isVerified = true` —
  all KYC-gated features (create task, apply, wallet) unlock immediately.
- Set `kycApproved: false` (or delete the field) to revoke.
- Backend `requireKYC` accepts any of: `kyc.status === 'verified'`,
  `kyc.approved === true`, or top-level `kycApproved === true`.
- New users are created with `kycApproved: false` by default; older docs
  are self-healed — `requireAuth` backfills `kycApproved: false` when the
  field is missing. `firestore.rules` blocks client writes to it
  (console/Admin SDK only — same as `wallet`, `stats`, `kyc`).
- Admin API alternative: `PUT /api/v1/users/kyc-review/:userId` with
  header `x-admin-key` and body `{ "approve": true|false }` also keeps
  top-level `kycApproved` in sync.

## Error contract (frontend ↔ backend)
- Backend errors are `{ "error": "message", "code": "...", details? }`
  (zod failures: `{ error: 'Validation failed', errors: [{field, message}] }`).
- NEVER read `err.response.data.message` in the app — use
  `getApiErrorMessage(err, fallback)` from `services/api.ts` (also handles
  401/403/429/5xx/network fallbacks). Store actions rethrow; screens alert.
- Every REST call auto-shows the centered orange `GlobalLoader`
  (`uiStore.globalLoading` ref-counted in `services/api.ts`; opt out per
  request with `skipGlobalLoader: true` in the axios config).

## Conventions
- Store↔screen contracts: stores call REST first, then update local state;
  Firestore listeners re-sync.
- One source of truth for constants: `constants/app.ts`.
- Use the versioned Expo docs linked above.
