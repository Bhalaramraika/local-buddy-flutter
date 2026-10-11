# AGENTS.md — Local Buddy

> Expo HAS CHANGED — read the exact versioned docs at
> https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Architecture (MVP)
- **Frontend**: Expo (RN, SDK 57) + expo-router, TypeScript, NativeWind,
  Zustand stores (persisted).
  **Theme = "Soft Modern"** (soft orange #FF6B35 on warm neutrals): font stack
  Poppins (primary UI) + Playfair Display (big headlines) + Inter (small body);
  antique-white background #FAEBD7, cocoa #1E1209 as main accent, orange #F77051
  CTAs/progress, soft red for destructive, success green #10B981. Every screen is
  fully self-styled for it — see `constants/design.ts` for the single token source.
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
onboarding-referral}.tsx`), `(screens)/security-settings.tsx`,
`(screens)/blocked-users.tsx` (entire block-user feature was removed).

## Task lifecycle (4 states — enforced everywhere)
- `tasks.status` is exactly one of **`open` | `assigned` | `completed` | `deleted`**
  (backend `TaskStatus` in `backend/src/models.ts`; frontend mirrors it in
  `types/index.ts` + `constants/app.ts`). There is NO `paid` status — payment
  release (`POST /wallet/release/:taskId`) only stamps `paidAt` on a
  task that stays `assigned`/`completed`. Show "Paid" in UI when `paidAt` is set.
- Visibility (enforced in BOTH `firestore.rules` → `match /tasks` and the REST
  layer — list `GET /tasks` merges visibility-scoped queries, detail
  `GET /tasks/:id` returns 403 otherwise):
  - `open` → every signed-in user (public marketplace)
  - `assigned` → poster + assigned buddy only
  - `completed` / `deleted` → poster only
- **Auto-assignment (first come, first served)**: `POST /tasks/:id/apply`
  atomically assigns the task to the FIRST buddy who applies — no poster
  confirmation. The transaction assigns buddyId, sets `status: 'assigned'` +
  `assignedAt`, creates the chat, writes the OTP secrets, and records the
  application as `accepted`. A second concurrent applicant gets 409.
  `…/assign` + `applications/:buddyId/decide` remain as manual fallbacks.
- **OTP-gated work flow (Part B)**: assignment (apply auto-assign, `/assign` or
  `applications/:buddyId/decide accept`) stamps `assignedAt` and writes
  `tasks/:id/secrets/otp` = `{ startCode, completeCode }` (random 4-digit each,
  **poster-read-only** per firestore.rules — never put codes on the task doc).
  1. Buddy starts: `POST /tasks/:id/start {otp}` → sets `startedAt`
  2. Online tasks: buddy asks `POST /tasks/:id/request-payment`
     (sets `paymentRequestedAt`) → poster releases `POST /wallet/release/:taskId`
     (sets `paidAt`) — MUST happen before completion
  3. Buddy completes: `POST /tasks/:id/complete {otp}` → requires `startedAt`,
     and for online tasks requires `paidAt`; sets `status: completed` +
     `completedAt`. Cash tasks accrue the 10% platform fee to the buddy's
     `commissionDue` here; response includes `reviewContext` for the rating screen.
  4. Rating screens: `app/(screens)/rate-user.tsx` (poster from task-detail,
     buddy right after completion) → `POST /reviews`.
  `PUT /tasks/:id/status` can no longer mark `completed` (OTP-only; admin
  escape hatch kept).
- Realtime: the `assignedTasks` listener filters `buddyId == uid AND
  status == 'assigned'` (needs the composite index in
  `firestore.indexes.json`; query without the status filter is rejected by
  the rules). Poster OTP card on `task-detail.tsx` live-listens to the
  poster-only `secrets/otp` doc.

## Money model (Part C)
- Buddy ALWAYS receives 100% of `(budget + tip)`; the 10% platform fee
  accrues as negative balance on the buddy: `commissionDue += 0.1 * total`.
  Online tasks: fee accrues at release; cash tasks: at completion.
- Buddy with `commissionDue > ₹200` cannot apply to tasks until dues are
  cleared (`403` from `POST /tasks/:id/apply`). Clear via PayU:
  `POST /wallet/commission/pay` (fixed amount = dues) → callback zeroes
  `commissionDue` (txn `type: 'commission_payment'`, `udf2: 'commission_pay'`).
- Constants: `PLATFORM_FEE_RATE = 0.10`, `COMMISSION_BLOCK_THRESHOLD = 200`
  in `backend/src/models.ts`.
- Frontend: dues card + PayU pay on `app/(tabs)/wallet.tsx`
  (`walletStore.commissionDue`, synced by the realtime user listener);
  pay flow reuses `wallet-topup.tsx?mode=dues`.

## Onboarding (single wizard)
- `app/(onboarding)/setup.tsx` is the ONLY setup flow (welcome → setup → home).
  Steps: role → name/photo/bio → DOB (inline mini-calendar) → language
  (English/हिन्दी) → city/area → referral. Design: antique-white `#FAEBD7` bg,
  orange `#F77051` CTAs, extra-rounded cards (Soft Modern theme).
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
