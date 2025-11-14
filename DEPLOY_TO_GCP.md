# Deploying to GCP Production Server (insiderpulse.pro)

## Current Situation
- ✅ Code fixes are completed and merged to `main` branch in GitHub
- ✅ Replit "Publish" deploys to `insiderpulse.replit.app` (NOT production)
- ❌ Production server at `insiderpulse.pro` (Google Cloud Platform) is NOT updated

## Deployment Steps

### Option 1: SSH into GCP Server (Manual Deployment)

1. **SSH into your GCP server:**
   ```bash
   ssh your-username@your-gcp-server-ip
   ```

2. **Navigate to the application directory:**
   ```bash
   cd /path/to/insiderpulse  # Usually /var/www/insiderpulse or /home/node/insiderpulse
   ```

3. **Pull latest code from GitHub:**
   ```bash
   git fetch origin
   git checkout main
   git pull origin main
   ```

4. **Install dependencies and build:**
   ```bash
   npm install
   npm run build
   ```

5. **Restart the application:**
   ```bash
   pm2 restart insiderpulse
   # OR
   pm2 reload ecosystem.config.js --env production
   ```

6. **Verify deployment:**
   ```bash
   pm2 logs insiderpulse
   # Check for successful startup logs
   ```

### Option 2: Automated Deployment with PM2 Deploy

If you have PM2 ecosystem deployment configured:

1. **Update `ecosystem.config.js` deployment section** (lines 75-87) with your actual GCP server details

2. **Setup deployment:**
   ```bash
   pm2 deploy production setup
   ```

3. **Deploy:**
   ```bash
   pm2 deploy production
   ```

### Option 3: Use GitHub Actions for Automated Deployment

Create `.github/workflows/deploy-production.yml` to auto-deploy when pushing to `main` branch.

## What Was Fixed

The following critical bugs were fixed in the code:

1. **`server/subscription-service.ts` (lines 56-87)**
   - Fixed Stripe API `current_period_end` access (was undefined)
   - Added Invalid Date safety checks
   - Treat "canceled" subscriptions as active if within valid period

2. **`server/routes.ts` (lines 1779-1799, 2404)**
   - Premium users now get real-time data (no 48-hour delay)
   - Free users correctly get 48-hour delayed data
   - Fixed "days old" calculation to use `createdAt` instead of `filedDate`

3. **`client/src/pages/live-trading.tsx` (line 138)**
   - Separated cache for premium/free users

## Verification After Deployment

1. **Check server logs:**
   ```bash
   pm2 logs insiderpulse
   ```
   Look for: `[Stripe Sync]` logs showing subscription status

2. **Test premium user access:**
   - Login as scottnim7777@gmail.com
   - Browser console should show: `canAccessRealtime: true`
   - Live trades should show data from < 48 hours ago
   - "X days old" message should reflect upload time, not SEC filing date

3. **Test free user access:**
   - Login as free user
   - Should only see trades older than 48 hours
