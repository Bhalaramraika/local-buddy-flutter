# LocalBuddy Backend Deployment Guide for Render

## Overview
This guide walks you through deploying the LocalBuddy backend to Render using Docker.

## Prerequisites
- Render account (https://render.com)
- GitHub/GitLab repository with this codebase
- All required API credentials (see below)

---

## Required Credentials Checklist

### 1. Firebase Admin SDK (REQUIRED)
**Source:** Firebase Console → Project Settings → Service Accounts → Generate New Private Key

| Variable | Description |
|----------|-------------|
| `FIREBASE_PROJECT_ID` | Your Firebase project ID (e.g., `local-buddy-org`) |
| `FIREBASE_CLIENT_EMAIL` | Service account email from JSON |
| `FIREBASE_PRIVATE_KEY` | Private key from JSON (keep `\n` as literal newlines) |
| `FIREBASE_DATABASE_URL` | `https://<project-id>-default-rtdb.firebaseio.com` |

### 2. JWT Secret (REQUIRED)
```bash
# Generate a secure secret:
openssl rand -base64 32
```
| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | 32+ character random string |
| `JWT_EXPIRY` | Token expiry (default: `7d`) |

### 3. Supabase Service Role Key (REQUIRED)
**Source:** Supabase Dashboard → Settings → API → service_role key (NOT anon key)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | `https://iglyauruqdgtchytypaj.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (starts with `eyJ...`) |

### 4. PayU Payment Gateway
**Source:** PayU Merchant Dashboard

| Variable | Description |
|----------|-------------|
| `PAYU_MERCHANT_KEY` | Merchant key (e.g., `lpIvGs`) |
| `PAYU_MERCHANT_SALT` | Merchant salt |
| `PAYU_BASE_URL` | `https://secure.payu.in` (production) |

### 5. Fast2SMS (OTP Service)
**Source:** Fast2SMS Dashboard → API Key

| Variable | Description |
|----------|-------------|
| `FAST2SMS_API_KEY` | Your Fast2SMS API key |

### 6. Cloudinary (Image/Video Upload)
**Source:** Cloudinary Dashboard → Settings → API Keys

| Variable | Description |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Cloud name (e.g., `dmewodusk`) |
| `CLOUDINARY_API_KEY` | API Key |
| `CLOUDINARY_API_SECRET` | API Secret |

### 7. Brevo / Sendinblue (Email)
**Source:** Brevo Dashboard → SMTP & API → API Keys

| Variable | Description |
|----------|-------------|
| `BREVO_API_KEY` | API key (starts with `xkeysib-`) |

### 8. FCM Server Key (Push Notifications)
**Source:** Firebase Console → Cloud Messaging → Server Key (Legacy)

| Variable | Description |
|----------|-------------|
| `FCM_SERVER_KEY` | Legacy server key |

---

## Deployment Steps

### Step 1: Push Code to Git Repository
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Create Render Services

#### Option A: Using render.yaml (Recommended)
1. Go to https://dashboard.render.com
2. Click **New** → **Blueprint**
3. Connect your repository
4. Render will detect `render.yaml` and create:
   - `localbuddy-api` (Web Service)
   - `localbuddy-worker` (Background Worker)

#### Option B: Manual Creation
1. **Web Service:**
   - New → Web Service
   - Connect repo
   - Runtime: Docker
   - Dockerfile: `./backend/Dockerfile`
   - Context: `./backend`
   - Plan: Starter ($7/mo)
   - Region: Singapore (or closest to users)

2. **Background Worker:**
   - New → Background Worker
   - Same Docker settings
   - Plan: Starter

### Step 3: Configure Environment Variables

In Render Dashboard → Your Service → Environment:

**Required for BOTH services:**
```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Firebase Admin (REQUIRED)
FIREBASE_PROJECT_ID=local-buddy-org
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@local-buddy-org.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://local-buddy-org-default-rtdb.firebaseio.com

# JWT (REQUIRED)
JWT_SECRET=your-32-char-secret-here
JWT_EXPIRY=7d

# Supabase (REQUIRED)
SUPABASE_URL=https://iglyauruqdgtchytypaj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# FCM (for push notifications)
FCM_SERVER_KEY=your-fcm-server-key
```

**Required for Web Service only:**
```
# PayU
PAYU_MERCHANT_KEY=lpIvGs
PAYU_MERCHANT_SALT=your-salt
PAYU_BASE_URL=https://secure.payu.in

# Fast2SMS
FAST2SMS_API_KEY=your-api-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=dmewodusk
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Brevo
BREVO_API_KEY=xkeysib-your-key

# CORS
CORS_ORIGIN=https://localbuddy.app,https://app.localbuddy.app
WS_MAX_CONNECTIONS=10000

# URLs
APP_URL=https://api.localbuddy.app
FRONTEND_URL=https://localbuddy.app
```

### Step 4: Configure Custom Domains (Optional)
1. In Render Dashboard → Service → Settings → Custom Domains
2. Add `api.localbuddy.app` for API
3. Update DNS:
   - CNAME `api` → `your-service.onrender.com`
   - CNAME `app` → `your-frontend.onrender.com`

### Step 5: Deploy
1. Click **Deploy** in Render Dashboard
2. Watch build logs for any errors
3. Check health endpoint: `https://your-service.onrender.com/health`

---

## Health Check Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Basic health check |
| `GET /api/health` | API health with DB check |

---

## Troubleshooting

### Build Fails
- Check Dockerfile syntax
- Ensure all dependencies in `package.json`
- Check Node version (using 20-alpine)

### Service Won't Start
- Check environment variables are set
- Verify `FIREBASE_PRIVATE_KEY` has literal `\n` not actual newlines
- Check logs in Render Dashboard

### WebSocket Issues
- Ensure `WS_MAX_CONNECTIONS` is set
- Check CORS_ORIGIN includes your frontend domain
- Verify health check path is `/health`

### Database Connection Issues
- Verify `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Check Supabase IP allowlist (Render IPs may need adding)

---

## Cost Estimate (Render Starter Plan)

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Web Service | Starter | $7 |
| Background Worker | Starter | $7 |
| **Total** | | **$14/month** |

---

## Post-Deployment Checklist

- [ ] Health endpoint returns 200
- [ ] API endpoints respond correctly
- [ ] WebSocket connections work
- [ ] Push notifications send (test FCM)
- [ ] Payments work (test PayU sandbox)
- [ ] OTP sends (test Fast2SMS)
- [ ] Emails send (test Brevo)
- [ ] Image upload works (test Cloudinary)
- [ ] Custom domains configured
- [ ] SSL certificates active
- [ ] Monitoring/alerts set up

---

## Useful Commands

```bash
# View logs
render logs -s localbuddy-api

# SSH into service (for debugging)
render ssh -s localbuddy-api

# Trigger manual deploy
render deploy -s localbuddy-api

# View environment variables
render env -s localbuddy-api
```

---

## Security Notes

1. **NEVER** commit `.env` files
2. Use Render's "Secret" toggle for sensitive values
3. Rotate secrets periodically
4. Use service role keys only on backend
5. Enable 2FA on all provider accounts

---

## Support

- Render Docs: https://render.com/docs
- LocalBuddy Architecture: `docs/Architecture.md`
- API Documentation: `docs/Features_And_Integrations.md`