#!/bin/bash
# Generate backend/.env from root .env values
# Run this script after filling in the missing values

set -e

ROOT_ENV="/workspaces/local-buddy-flutter/.env"
BACKEND_ENV="/workspaces/local-buddy-flutter/backend/.env"

echo "🔧 Generating backend/.env from root .env..."

# Check if root .env exists
if [ ! -f "$ROOT_ENV" ]; then
    echo "❌ Root .env not found at $ROOT_ENV"
    exit 1
fi

# Extract values from root .env (handling comments and special chars)
EXPO_PUBLIC_FIREBASE_PROJECT_ID=$(grep '^EXPO_PUBLIC_FIREBASE_PROJECT_ID=' "$ROOT_ENV" | cut -d'=' -f2- | sed 's/^"//;s/"$//')
EXPO_PUBLIC_PAYU_KEY=$(grep '^EXPO_PUBLIC_PAYU_KEY=' "$ROOT_ENV" | cut -d'=' -f2- | sed 's/^"//;s/"$//')
PAYU_SALT=$(grep '^PAYU_SALT=' "$ROOT_ENV" | cut -d'=' -f2- | sed 's/^"//;s/"$//')
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=$(grep '^EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=' "$ROOT_ENV" | cut -d'=' -f2- | sed 's/^"//;s/"$//')
EXPO_PUBLIC_SUPABASE_URL=$(grep '^EXPO_PUBLIC_SUPABASE_URL=' "$ROOT_ENV" | cut -d'=' -f2- | sed 's/^"//;s/"$//')

# Create backend .env
cat > "$BACKEND_ENV" << EOF
# LocalBuddy Backend Environment Variables
# Generated from root .env on $(date)
# NEVER commit this file to version control!

# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# ============================================
# FIREBASE ADMIN SDK (REQUIRED - Fill these in!)
# Get from Firebase Console > Project Settings > Service Accounts
# ============================================
FIREBASE_PROJECT_ID=${EXPO_PUBLIC_FIREBASE_PROJECT_ID:-local-buddy-org}
FIREBASE_CLIENT_EMAIL=YOUR_FIREBASE_CLIENT_EMAIL_HERE
FIREBASE_PRIVATE_KEY="YOUR_FIREBASE_PRIVATE_KEY_HERE"
FIREBASE_DATABASE_URL=https://${EXPO_PUBLIC_FIREBASE_PROJECT_ID:-local-buddy-org}-default-rtdb.firebaseio.com

# ============================================
# JWT CONFIGURATION (REQUIRED - Generate a secure secret!)
# Generate with: openssl rand -base64 32
# ============================================
JWT_SECRET=YOUR_JWT_SECRET_HERE
JWT_EXPIRY=7d

# ============================================
# PAYU PAYMENT GATEWAY
# ============================================
PAYU_MERCHANT_KEY=${EXPO_PUBLIC_PAYU_KEY:-lpIvGs}
PAYU_MERCHANT_SALT=${PAYU_SALT:-lZE2oBKhubYiVEsxkOpWaLme2xfU7sCW}
PAYU_BASE_URL=https://secure.payu.in

# ============================================
# FAST2SMS (OTP Service) - Fill in!
# ============================================
FAST2SMS_API_KEY=YOUR_FAST2SMS_API_KEY_HERE

# ============================================
# CLOUDINARY (Image/Video Upload)
# ============================================
CLOUDINARY_CLOUD_NAME=${EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME:-dmewodusk}
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY_HERE
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET_HERE

# ============================================
# BREVO / SENDINBLUE (Email Service) - Fill in!
# ============================================
BREVO_API_KEY=YOUR_BREVO_API_KEY_HERE

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
OTP_RATE_LIMIT_MAX=3

# ============================================
# CORS & SECURITY
# ============================================
CORS_ORIGIN=https://localbuddy.app,https://app.localbuddy.app
WS_MAX_CONNECTIONS=10000

# ============================================
# APPLICATION URLs
# ============================================
APP_URL=https://api.localbuddy.app
FRONTEND_URL=https://localbuddy.app

# ============================================
# SUPABASE (Database)
# ============================================
SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL:-https://iglyauruqdgtchytypaj.supabase.co}
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE

# ============================================
# FCM SERVER KEY (Push Notifications) - Fill in!
# ============================================
FCM_SERVER_KEY=YOUR_FCM_SERVER_KEY_HERE
EOF

echo "✅ Backend .env created at $BACKEND_ENV"
echo ""
echo "⚠️  IMPORTANT: You MUST fill in these missing values:"
echo "   - FIREBASE_CLIENT_EMAIL"
echo "   - FIREBASE_PRIVATE_KEY"
echo "   - JWT_SECRET (generate with: openssl rand -base64 32)"
echo "   - FAST2SMS_API_KEY"
echo "   - CLOUDINARY_API_KEY"
echo "   - CLOUDINARY_API_SECRET"
echo "   - BREVO_API_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY (NOT the anon key!)"
echo "   - FCM_SERVER_KEY"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"