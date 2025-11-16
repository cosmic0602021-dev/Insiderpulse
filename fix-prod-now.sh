#!/bin/bash
set -e

echo "=== Syncing Production DB via Admin API ==="

ADMIN_KEY="${SESSION_SECRET}"

curl -X POST "https://insiderpulse.pro/api/admin/sync-subscription" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_KEY}" \
  -d '{"email":"scottnim7777@gmail.com"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "=== Verifying Fix ==="
sleep 3

node /home/runner/workspace/test-production-api.js
