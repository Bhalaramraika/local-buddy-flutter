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
`config/index.ts`, `jsconfig.json`, typing indicators, Razorpay references.

## Conventions
- Store↔screen contracts: stores call REST first, then update local state;
  Firestore listeners re-sync.
- One source of truth for constants: `constants/app.ts`.
- Use the versioned Expo docs linked above.
