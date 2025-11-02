#!/usr/bin/env tsx
/**
 * Script to set a user as admin
 * Usage: tsx scripts/set-admin.ts <email>
 */

import { db } from '../server/db-storage';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function setAdmin(email: string) {
  try {
    console.log(`🔍 Looking for user: ${email}`);

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      console.error(`❌ User not found: ${email}`);
      console.log('\n📋 Available users:');
      const allUsers = await db.select({ email: users.email }).from(users);
      allUsers.forEach((u) => console.log(`   - ${u.email}`));
      process.exit(1);
    }

    const currentUser = user[0];
    console.log(`✅ Found user: ${currentUser.email}`);
    console.log(`   Current role: ${currentUser.role}`);

    if (currentUser.role === 'admin') {
      console.log('✓ User is already an admin!');
      process.exit(0);
    }

    // Update to admin
    await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, email));

    console.log(`✅ Successfully set ${email} as admin!`);
    console.log('\n🔑 You can now access the admin dashboard at: /admin');
    console.log('\n📝 Admin API key: Check your .env file for ADMIN_API_KEY');
    console.log('   If not set, it will use SESSION_SECRET as fallback');

  } catch (error) {
    console.error('❌ Error setting admin:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('\nUsage: tsx scripts/set-admin.ts <email>');
  console.log('Example: tsx scripts/set-admin.ts user@example.com');
  process.exit(1);
}

setAdmin(email);
