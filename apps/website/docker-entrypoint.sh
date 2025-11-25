#!/bin/sh
set -e

# Set default runtime environment variables if not provided
# These will be available to the Next.js app via process.env.NEXT_PUBLIC_*
export NEXT_PUBLIC_API_BASE_URL="${API_BASE_URL:-http://localhost:7213}"
export NEXT_PUBLIC_PATIENT_APP_URL="${PATIENT_APP_URL:-http://localhost:3001}"
export NEXT_PUBLIC_PROVIDER_APP_URL="${PROVIDER_APP_URL:-http://localhost:3002}"
export NEXT_PUBLIC_PATIENT_SIGNUP_URL="${PATIENT_SIGNUP_URL:-${NEXT_PUBLIC_PATIENT_APP_URL}/auth/sign-up}"
export NEXT_PUBLIC_PROVIDER_SIGNUP_URL="${PROVIDER_SIGNUP_URL:-${NEXT_PUBLIC_PROVIDER_APP_URL}/auth/sign-up}"

echo "[Entrypoint] Starting Next.js server with runtime config:"
echo "  API_BASE_URL: ${NEXT_PUBLIC_API_BASE_URL}"
echo "  PATIENT_APP_URL: ${NEXT_PUBLIC_PATIENT_APP_URL}"
echo "  PROVIDER_APP_URL: ${NEXT_PUBLIC_PROVIDER_APP_URL}"

# Execute the main command (bun server.js)
exec "$@"
