import { drizzle } from "drizzle-orm/neon-http";
import { insiderTrades } from "@shared/schema";
import { sql, isNotNull } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * Clear cached AI analyses from database
 * This forces regeneration with correct pricePerShare values
 */
async function clearAICache() {
  console.log('🧹 Clearing AI analysis cache...\n');

  try {
    // Count trades with cached analyses
    const cachedTrades = await db
      .select()
      .from(insiderTrades)
      .where(isNotNull(insiderTrades.comprehensiveAnalysis));

    console.log(`📊 Found ${cachedTrades.length} trades with cached AI analyses`);

    if (cachedTrades.length === 0) {
      console.log('✅ No cached analyses to clear');
      return;
    }

    // Clear the cache
    const result = await db
      .update(insiderTrades)
      .set({
        comprehensiveAnalysis: null,
        analysisGeneratedAt: null
      })
      .where(isNotNull(insiderTrades.comprehensiveAnalysis));

    console.log(`\n✅ Successfully cleared AI cache for all trades`);
    console.log(`📝 ${cachedTrades.length} analyses will be regenerated on next request`);

  } catch (error) {
    console.error('❌ Error clearing AI cache:', error);
    throw error;
  }
}

// Run the function
clearAICache()
  .then(() => {
    console.log('\n✨ Cache clearing complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cache clearing failed:', error);
    process.exit(1);
  });
