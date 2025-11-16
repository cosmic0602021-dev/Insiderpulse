#!/bin/bash

echo "=== Syncing scottnim7777@gmail.com in PRODUCTION ==="

curl -X POST "https://insiderpulse.pro/api/admin/sync-subscription" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: ${SESSION_SECRET}" \
  -d '{"email":"scottnim7777@gmail.com"}' \
  -w "\n\nStatus: %{http_code}\n"

echo ""
echo "=== Testing after sync ==="
sleep 2

# Test login again
curl -s -X POST "https://insiderpulse.pro/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"scottnim7777@gmail.com","password":"Ski0602021!@#$"}' \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('User status:', data.get('user', {}).get('subscriptionStatus'))
print('User endDate:', data.get('user', {}).get('subscriptionEndDate'))
"
