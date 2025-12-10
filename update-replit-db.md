# Fix Database Connection Issue

## Problem
The application is currently connected to a **development database** (121 trades) instead of the **production database** (4,195 trades).

This causes ranking inconsistencies:
- Development DB: GRNT is 5th/6th place ✅ (eligible for AI analysis)
- Production DB: GRNT is 89th place ❌ (not in top rankings)

## Current Database Connections

**Development DB (currently active - WRONG):**
- Host: `ep-dawn-tooth-ahapardu-pooler.us-east-2.aws.neon.tech`
- Trades: 121
- Rankings: EMBY, BWFG, LUCK, BFLY, MSBI, GRNT

**Production DB (should be active - CORRECT):**
- Host: `ep-ancient-cloud-a50dgue7.us-east-2.aws.neon.tech`
- Trades: 4,195
- Rankings: MGM, CRM, HYMC, CBIO, UTI, DMAC

## Solution

### Step 1: Update Replit Secrets
1. Click on "Tools" → "Secrets" in the Replit sidebar
2. Find or add the secret: `DATABASE_URL`
3. Set the value to:
```
postgresql://neondb_owner:npg_pO2GuI4kVjUy@ep-ancient-cloud-a50dgue7.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Step 2: Restart the Application
After updating the secret, the server will automatically restart and connect to the production database.

### Step 3: Verify the Fix
Check that the trade count is correct:
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM insider_trades;"
```
Should show: ~4,195 trades (not 121)

### Step 4: Verify Rankings
Check the top rankings:
```bash
curl http://localhost:5000/api/rankings?limit=6
```
Should show: MGM, CRM, HYMC, etc. (not EMBY, BWFG)

## Expected Outcome
After the fix:
- ✅ Real-time trades will show correct data (4,195+ trades)
- ✅ Top 6 insider activity will be: MGM, CRM, HYMC, CBIO, UTI, DMAC
- ✅ AI analysis will be available for the correct top 6 stocks
- ❌ GRNT will no longer be in top 6 (it's 89th in production)
