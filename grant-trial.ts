/**
 * Grant trial access to a specific user
 * Usage: npx tsx grant-trial.ts
 */

import { drizzle } from "drizzle-orm/neon-http";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

const TARGET_EMAIL = "cosmic0602021@gmail.com";

async function grantTrial() {
  console.log(`🔍 Looking for user: ${TARGET_EMAIL}`);

  const user = await db.select().from(users).where(eq(users.email, TARGET_EMAIL)).limit(1);

  if (!user || user.length === 0) {
    console.error(`❌ User not found: ${TARGET_EMAIL}`);
    console.log('\n💡 The user needs to sign up first at: http://localhost:5000/signup');
    process.exit(1);
  }

  const targetUser = user[0];
  console.log(`✅ Found user: ${targetUser.email} (ID: ${targetUser.id})`);

  // Check current status
  console.log(`\n📊 Current Status:`);
  console.log(`   - Subscription Tier: ${targetUser.subscriptionTier}`);
  console.log(`   - Subscription Status: ${targetUser.subscriptionStatus}`);
  console.log(`   - Has Used Trial: ${targetUser.hasUsedTrial}`);
  console.log(`   - Trial Expires At: ${targetUser.trialExpiresAt || 'N/A'}`);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  // Grant 7-day trial (override hasUsedTrial check)
  await db.update(users)
    .set({
      trialActivatedAt: now,
      trialExpiresAt: expiresAt,
      hasUsedTrial: true, // Mark as used to prevent multiple trials
      subscriptionStatus: "trialing",
      subscriptionTier: "insider_pro", // Grant Pro tier during trial
    })
    .where(eq(users.id, targetUser.id));

  console.log(`\n🎉 SUCCESS! 7-day Insider Pro trial granted!`);
  console.log(`   - Trial Started: ${now.toISOString()}`);
  console.log(`   - Trial Expires: ${expiresAt.toISOString()}`);
  console.log(`   - Days Remaining: 7`);
  console.log(`\n✨ User can now access:`);
  console.log(`   ✅ Real-time insider trading data`);
  console.log(`   ✅ October 29 (latest) data`);
  console.log(`   ✅ All premium features`);
  console.log(`\n👉 User should refresh their browser to see the changes!`);
}

grantTrial().catch(console.error);
