# LocalBuddy Backend Deployment Guide (Render)

MVP architecture: single Express web service. Realtime is client-side
Firestore listeners — no socket server, no worker, no cron jobs.

## Prerequisites
- Render account (https://render.com)
- Git-connected repo with this codebase
- Credentials below

## Required env vars (Render dashboard)

| Variable | Source |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `HOST` | `0.0.0.0` |
| `FIREBASE_PROJECT_ID` | Firebase Console → Service Accounts |
| `FIREBASE_CLIENT_EMAIL` | Service account JSON |
| `FIREBASE_PRIVATE_KEY` | Service account JSON (keep `\n` escapes) |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `JWT_EXPIRY` | `7d` |
| `PAYU_MERCHANT_KEY` | PayU Merchant Dashboard |
| `PAYU_MERCHANT_SALT` | PayU Merchant Dashboard |
| `PAYU_BASE_URL` | `https://test.payu.in` (test) / `https://secure.payu.in` (prod) |
| `MOJOAUTH_API_KEY` | MojoAuth Dashboard (Email OTP) |
| `MOJOAUTH_API_SECRET` | MojoAuth Dashboard |
| `MOJOAUTH_BASE_URL` | `https://api.mojoauth.com` |
| `CORS_ORIGIN` | Your app domain or `*` in dev |
| `APP_URL` | Same as service URL |

Not needed anymore: Supabase, Prisma/Postgres, Socket.IO, Cloudinary,
Fast2SMS, Brevo, worker/cron env vars.

## Deploy
1. Push repo to GitHub.
2. Render → New → Blueprint → select repo (auto-detects `render.yaml`).
3. Or manually: New Web Service → Docker → root dir `backend`, root Dockerfile `backend/Dockerfile`.
4. Set env vars above.
5. Health check path: `/health`.

## App config
Set `EXPO_PUBLIC_API_BASE_URL` in the Expo app `.env` to the Render URL:
```
EXPO_PUBLIC_API_BASE_URL=https://localbuddy-api.onrender.com/api/v1
```

## Secrets hygiene (IMPORTANT)
The repo previously had real Firebase/PayU credentials committed in
`backend/.env` and `.env.example`. Rotate these keys in their dashboards
before going public, and never commit `.env`.
