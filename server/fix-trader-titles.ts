import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from 'drizzle-orm';
import { insiderTrades } from '@shared/schema';

const db = drizzle(process.env.DATABASE_URL!);

async function fixTraderTitles() {
  console.log('🔧 Starting trader title cleanup...');

  try {
    // Find all trades with numeric-only trader titles using PostgreSQL regex
    const trades = await db
      .select()
      .from(insiderTrades)
      .where(sql`${insiderTrades.traderTitle} ~ '^[0-9]+$'`);

    console.log(`📊 Found ${trades.length} trades with numeric-only trader titles`);

    let updated = 0;

    for (const trade of trades) {
      console.log(`🔄 Updating trade ${trade.id}: "${trade.traderTitle}" -> "Executive"`);

      // Update numeric titles to 'Executive'
      await db
        .update(insiderTrades)
        .set({
          traderTitle: 'Executive'
        })
        .where(eq(insiderTrades.id, trade.id));

      updated++;

      if (updated % 50 === 0) {
        console.log(`✅ Updated ${updated}/${trades.length} trades`);
      }
    }

    console.log(`🎉 Successfully updated ${updated} trader titles`);

  } catch (error) {
    console.error('❌ Error fixing trader titles:', error);
  }
}

// Run the fix
fixTraderTitles().catch(console.error);